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

    const fetchUserRole = async (userId: string, userEmail?: string) => {
      try {
        console.log('Fetching role for user:', userId);

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Supabase error fetching role:', error);
          throw error;
        }

        if (mounted) {
          let role = data?.role ?? null;

          // Fallback: If it's the known admin email and no role found, grant admin
          if (!role && userEmail === 'gabrielftude@gmail.com') {
            console.log('Fallback: Granting admin role to known admin');
            role = 'admin';
          }

          console.log('Fetched role:', role);
          setUserRole(role);
        }
      } catch (error: any) {
        console.warn('Auth initialization error:', error.message || error);
        // Fallback: Check here too in case of DB error
        if (mounted && userEmail === 'gabrielftude@gmail.com') {
          console.log('Fallback: Granting admin role to known admin (error recovery)');
          setUserRole('admin');
        } else if (mounted) {
          setUserRole(null);
        }
      }
    };

    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchUserRole(session.user.id, session.user.email);
          } else {
            setUserRole(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Add a safety timeout to prevent getting stuck in loading state
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization timed out, forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 seconds safety margin

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Only fetch if session changed or was not checked yet
          // To avoid flickering, we only set loading if we don't have a role yet
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            setLoading(true);
            await fetchUserRole(session.user.id, session.user.email);
            setLoading(false);
          }
        } else {
          setUserRole(null);
          if (event === 'SIGNED_OUT') {
            setLoading(false);
          }
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
