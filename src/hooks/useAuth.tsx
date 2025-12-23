import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type UserRole = 'admin' | 'operator' | 'sales' | 'viewer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

    useEffect(() => {
    let mounted = true;

    const fetchUserRole = async (userId: string) => {
      try {
        console.log('[Auth] Fetching role for user:', userId);
        
        // Add a local timeout for the role fetch itself
        const rolePromise = supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);
          
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
        );

        const { data, error } = await Promise.race([rolePromise, timeoutPromise]) as any;

        if (error) {
          console.error('[Auth] Supabase error fetching role:', error);
          throw error;
        }

        if (mounted) {
          const roleData = data && data.length > 0 ? data[0].role : null;
          console.log('[Auth] Fetched role data:', roleData);
          setUserRole(roleData as UserRole);
        }
      } catch (error: any) {
        console.warn('[Auth] Error or timeout in fetchUserRole:', error.message || error);
        if (mounted) {
          setUserRole(null);
        }
      }
    };

    const initializeAuth = async () => {
      try {
        console.log('[Auth] Initializing with timeout...');
        setLoading(true);
        
        // Race getSession against a timeout to prevent hanging the whole app
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getSession timeout')), 3000)
        );

        const sessionResult = await Promise.race([sessionPromise, timeoutPromise]) as any;
        const session = sessionResult.data?.session;

        if (mounted) {
          console.log('[Auth] Session found via getSession:', !!session);
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchUserRole(session.user.id);
          } else {
            setUserRole(null);
          }
        }
      } catch (error: any) {
        console.warn('[Auth] Initialization stall handled:', error.message || error);
        // If getSession stalls, we still wait for onAuthStateChange to provide the session
      } finally {
        // We only set loading to false if we didn't hang or if we finished
        // But onAuthStateChange will also handle setting loading to false
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('[Auth] Auth state changed event:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // INITIAL_SESSION, SIGNED_IN, etc.
          await fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
        
        if (mounted) {
          console.log('[Auth] Finalizing loading state');
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Moved outside of useEffect to keep logic clean, but used inside
  // Alternatively keep it inside as I did above.

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Login realizado com sucesso!');
      navigate('/');
      return { error: null };
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      toast.success('Conta criada com sucesso! Verifique seu email.');
      return { error: null };
    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(error.message || 'Erro ao criar conta');
      }
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setUserRole(null);
      toast.success('Logout realizado com sucesso!');
      navigate('/auth');
    } catch (error: any) {
      toast.error('Erro ao fazer logout');
    }
  };

  const hasRole = (role: UserRole) => {
    return userRole === role;
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRole,
      loading,
      signIn,
      signUp,
      signOut,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
