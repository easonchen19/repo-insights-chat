import React, { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const previousUser = user;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Show welcome message for GitHub sign-in
        if (event === 'SIGNED_IN' && session?.user && !previousUser) {
          // Check if this was a GitHub sign-in and get username
          if (session.user.app_metadata?.provider === 'github') {
            setTimeout(async () => {
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('github_username')
                  .eq('id', session.user.id)
                  .single();

                const githubUsername = profile?.github_username || session.user.user_metadata?.user_name || 'GitHub User';
                
                toast({
                  title: `Welcome, ${githubUsername}! 🎉`,
                  description: "You've successfully signed in with GitHub.",
                });
              } catch (error) {
                toast({
                  title: "Welcome! 🎉",
                  description: "You've successfully signed in with GitHub.",
                });
              }
            }, 100);
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};