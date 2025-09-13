import React, { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionStatus } from "@/lib/subscription";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionStatus | null;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const { toast } = useToast();

  const checkSubscription = async () => {
    if (!session) {
      setSubscription({ subscribed: false, tier: 'free', product_id: null, subscription_end: null });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription({ subscribed: false, tier: 'free', product_id: null, subscription_end: null });
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const previousUser = user;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Check subscription when auth state changes
        if (session?.user) {
          setTimeout(() => {
            checkSubscription();
          }, 0);
        } else {
          setSubscription(null);
        }

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
                  .maybeSingle();

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
      
      if (session?.user) {
        setTimeout(() => {
          checkSubscription();
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscription(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, subscription, signOut, checkSubscription }}>
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