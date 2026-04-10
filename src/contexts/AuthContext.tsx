import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            // Only fetch profile when we have a user
            if (currentSession?.user) {
              setTimeout(() => {
                fetchProfile(currentSession.user.id);
              }, 0);
            } else {
              setProfile(null);
            }
          }
        );

        // Check for existing session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        // Fetch profile if we have a user
        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id);
        }
        
        setIsLoading(false);

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error setting up auth:", error);
        setIsLoading(false);
      }
    };

    setupAuth();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      setProfile(data as Profile);
    } catch (error: any) {
      console.error("Error fetching profile:", error.message);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      console.log("Attempting to sign in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        console.error("Sign in error details:", error);
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      console.log("Login successful, received session:", data.session);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      navigate("/login"); // Changed from "/" to "/login" (Market Lines)
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { full_name: fullName },
        }
      });

      if (error) {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      console.log("Signup response:", data);
      toast({
        title: "Signup successful",
        description: "Please check your email to verify your account.",
      });
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      // Always clear local state, even if server-side signout fails
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/login");
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        isAdmin,
      }}
    >
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
