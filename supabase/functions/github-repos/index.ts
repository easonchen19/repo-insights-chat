
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  stargazers_count: number;
  updated_at: string;
  private: boolean;
  html_url: string;
  default_branch: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 GitHub function called with method:', req.method);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header found');
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Invalid token:', authError?.message);
      throw new Error('Invalid token');
    }

    console.log('✅ User authenticated:', user.id);

    // Create a user-scoped Supabase client so auth.uid() works in RPCs/RLS
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userSupabase = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      },
    });

    const { action, accessToken, repo_owner, repo_name, githubUserData } = await req.json();
    console.log('🎯 Action requested:', action);

    if (action === 'saveGitHubConnection') {
      console.log('💾 Saving GitHub connection for user:', user.id);
      console.log('🔑 Access token provided:', !!accessToken);
      console.log('👤 GitHub user data:', githubUserData);

      // Save GitHub connection data to user profile using secure function
      const { error: updateError } = await userSupabase
        .rpc('update_github_token', {
          user_id: user.id,
          new_token: accessToken,
          github_user_data: githubUserData
        });

      if (updateError) {
        console.error('❌ Failed to save GitHub connection:', updateError);
        throw new Error(`Failed to save GitHub connection: ${updateError.message}`);
      }

      console.log('✅ GitHub connection saved successfully');

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'fetchRepos') {
      console.log('📂 Fetching repositories for user:', user.id);
      
      // Get GitHub access token from user profile using secure function
      const { data: profile, error: profileError } = await userSupabase
        .rpc('get_user_github_token');

      console.log('👤 Profile query result:', { 
        hasProfile: !!profile?.[0], 
        hasToken: !!profile?.[0]?.github_access_token,
        username: profile?.[0]?.github_username,
        error: profileError?.message 
      });

      if (profileError || !profile?.[0]?.github_access_token) {
        console.error('❌ No GitHub connection found:', profileError?.message);
        throw new Error('GitHub account not connected. Please connect your GitHub account first.');
      }

      // Use stored access token instead of passed one for security
      const storedAccessToken = profile[0].github_access_token;
      console.log('🔑 Using stored access token (length):', storedAccessToken.length);
      
      // Fetch user's repositories using stored token
      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          'Authorization': `Bearer ${storedAccessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'SupabaseEdgeFunction'
        }
      });

      console.log('🐙 GitHub API response status:', response.status);

      if (!response.ok) {
        console.error('❌ GitHub API error:', response.status, await response.text());
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repos: GitHubRepo[] = await response.json();
      console.log('📊 Fetched repositories count:', repos.length);
      
      // Transform the data to match our interface
      const transformedRepos = repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description || '',
        language: repo.language || 'Unknown',
        stars: repo.stargazers_count,
        updatedAt: new Date(repo.updated_at).toLocaleDateString(),
        private: repo.private,
        html_url: repo.html_url,
        default_branch: repo.default_branch
      }));

      // Also fetch current user info to verify token and get latest username
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${storedAccessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'SupabaseEdgeFunction'
        }
      });

      let githubUsername = profile[0].github_username;
      if (userResponse.ok) {
        const githubUser = await userResponse.json();
        githubUsername = githubUser.login;
        console.log('🔍 GitHub user verified:', githubUsername);
        
        // Update username if it has changed
        if (githubUsername !== profile[0].github_username) {
          console.log('🔄 Updating GitHub username:', githubUsername);
          await userSupabase
            .from('profiles')
            .update({ github_username: githubUsername })
            .eq('id', user.id);
        }
      } else {
        console.warn('⚠️ Could not verify GitHub user, using stored username');
      }

      console.log('✅ Returning transformed repositories and username');

      return new Response(JSON.stringify({ 
        repositories: transformedRepos,
        username: githubUsername
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'disconnectGitHub') {
      console.log('🔌 Disconnecting GitHub for user:', user.id);
      
      // Remove GitHub connection data from user profile
      const { error: updateError } = await userSupabase
        .from('profiles')
        .update({
          github_access_token: null,
          github_username: null,
          github_user_id: null,
          github_connected_at: null
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Failed to disconnect GitHub:', updateError);
        throw new Error(`Failed to disconnect GitHub: ${updateError.message}`);
      }

      console.log('✅ GitHub disconnected successfully');

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'fetchRepoContents') {
      console.log('📁 Fetching repository contents for:', repo_owner, repo_name);
      
      // Get GitHub access token from user profile using secure function
      const { data: profile, error: profileError } = await userSupabase
        .rpc('get_user_github_token');

      if (profileError || !profile?.[0]?.github_access_token) {
        console.error('❌ No GitHub connection for repo contents:', profileError?.message);
        throw new Error('GitHub account not connected. Please connect your GitHub account first.');
      }

      const storedAccessToken = profile[0].github_access_token;

      // Fetch repository file structure for analysis
      const response = await fetch(
        `https://api.github.com/repos/${repo_owner}/${repo_name}/git/trees/${await getDefaultBranch(storedAccessToken, repo_owner, repo_name)}?recursive=1`,
        {
          headers: {
            'Authorization': `Bearer ${storedAccessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'SupabaseEdgeFunction'
          }
        }
      );

      if (!response.ok) {
        console.error('❌ GitHub API error for repo contents:', response.status);
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const tree = await response.json();
      
      // Filter for code files only
      const codeFiles = tree.tree.filter((item: any) => 
        item.type === 'blob' && 
        isCodeFile(item.path) &&
        item.size < 100000 // Limit file size to 100KB
      );

      // Fetch content for each file (limited to first 50 files)
      const filesToFetch = codeFiles.slice(0, 50);
      const fileContents = await Promise.all(
        filesToFetch.map(async (file: any) => {
          try {
            const contentResponse = await fetch(
              `https://api.github.com/repos/${repo_owner}/${repo_name}/contents/${file.path}`,
              {
                headers: {
                  'Authorization': `Bearer ${storedAccessToken}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'SupabaseEdgeFunction'
                }
              }
            );

            if (contentResponse.ok) {
              const contentData = await contentResponse.json();
              if (contentData.content && contentData.encoding === 'base64') {
                const decodedContent = atob(contentData.content);
                return {
                  name: file.path,
                  content: decodedContent,
                  type: getFileType(file.path)
                };
              }
            }
            return null;
          } catch (error) {
            console.error(`Error fetching file ${file.path}:`, error);
            return null;
          }
        })
      );

      const validFiles = fileContents.filter(file => file !== null);

      console.log('✅ Fetched repository contents, files count:', validFiles.length);

      return new Response(JSON.stringify({ files: validFiles }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.error('❌ Invalid action requested:', action);
    throw new Error('Invalid action');

  } catch (error) {
    console.error('💥 Error in github-repos function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getDefaultBranch(accessToken: string, owner: string, repo: string): Promise<string> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SupabaseEdgeFunction'
      }
    });
    
    if (response.ok) {
      const repoData = await response.json();
      return repoData.default_branch || 'main';
    }
  } catch (error) {
    console.error('Error getting default branch:', error);
  }
  return 'main';
}

function isCodeFile(path: string): boolean {
  const codeExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php',
    '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.sh', '.sql', '.html',
    '.css', '.scss', '.sass', '.less', '.vue', '.svelte', '.json', '.yaml', '.yml',
    '.xml', '.md', '.txt', '.env', '.gitignore', '.dockerfile', 'Dockerfile'
  ];
  
  return codeExtensions.some(ext => path.toLowerCase().endsWith(ext)) ||
         path.toLowerCase().includes('dockerfile') ||
         path.toLowerCase().includes('makefile') ||
         path.toLowerCase().includes('package.json') ||
         path.toLowerCase().includes('requirements.txt') ||
         path.toLowerCase().includes('cargo.toml');
}

function getFileType(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'cpp':
    case 'c':
      return 'c++';
    case 'cs':
      return 'csharp';
    case 'php':
      return 'php';
    case 'rb':
      return 'ruby';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'swift':
      return 'swift';
    case 'kt':
      return 'kotlin';
    case 'html':
      return 'html';
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return 'css';
    default:
      return 'text';
  }
}
