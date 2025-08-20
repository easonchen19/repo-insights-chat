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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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
      throw new Error('Invalid token');
    }

    const { action, accessToken, repo_owner, repo_name, githubUserData } = await req.json();

    if (action === 'saveGitHubConnection') {
      // Save GitHub connection data to user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          github_access_token: accessToken,
          github_username: githubUserData.login,
          github_user_id: githubUserData.id.toString(),
          github_connected_at: new Date().toISOString()
        });

      if (updateError) {
        throw new Error(`Failed to save GitHub connection: ${updateError.message}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'fetchRepos') {
      // Get GitHub access token from user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('github_access_token, github_username')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.github_access_token) {
        throw new Error('GitHub account not connected. Please connect your GitHub account first.');
      }

      // Use stored access token instead of passed one for security
      const storedAccessToken = profile.github_access_token;
      // Fetch user's repositories using stored token
      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          'Authorization': `Bearer ${storedAccessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'SupabaseEdgeFunction'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repos: GitHubRepo[] = await response.json();
      
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

      return new Response(JSON.stringify({ repositories: transformedRepos }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'disconnectGitHub') {
      // Remove GitHub connection data from user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          github_access_token: null,
          github_username: null,
          github_user_id: null,
          github_connected_at: null
        })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(`Failed to disconnect GitHub: ${updateError.message}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'fetchRepoContents') {
      // Get GitHub access token from user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('github_access_token')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.github_access_token) {
        throw new Error('GitHub account not connected. Please connect your GitHub account first.');
      }

      const storedAccessToken = profile.github_access_token;

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

      return new Response(JSON.stringify({ files: validFiles }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in github-repos function:', error);
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