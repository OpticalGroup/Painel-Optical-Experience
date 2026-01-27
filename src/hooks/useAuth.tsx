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
  isApproved: boolean;
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
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    let isFetchingRole = false;

    const fetchUserRole = async (userId: string): Promise<boolean> => {
      if (isFetchingRole) return false;
      isFetchingRole = true;

      try {
        console.log('[Auth] Fetching role - START for:', userId);
        const startTime = Date.now();

        // Use a race to avoid hanging forever if the network request stalls
        const rolePromise = supabase
          .from('user_roles')
          .select('role, is_approved')
          .eq('user_id', userId)
          .maybeSingle();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request Timeout')), 4000)
        );

        const { data, error } = await Promise.race([rolePromise, timeoutPromise]) as any;

        console.log(`[Auth] Fetching role - END (${Date.now() - startTime}ms)`);

        if (error) {
          console.error('[Auth] Supabase error fetching role:', error);
          throw error;
        }

        if (mounted) {
          const roleData = data?.role || null;
          const approvedData = data?.is_approved ?? false;
          console.log('[Auth] Role resolved to:', roleData, 'Approved:', approvedData);
          setUserRole(roleData as UserRole);
          setIsApproved(approvedData);
        }
        return true; // Success
      } catch (error: any) {
        console.error('[Auth] Error in fetchUserRole:', error.message || error);
        // On timeout, return false so we can retry; don't change userRole
        if (error.message === 'Request Timeout') {
          return false;
        }
        // On real error, set null
        if (mounted) {
          setUserRole(null);
        }
        return true; // Still "resolved" (just to null)
      } finally {
        isFetchingRole = false;
      }
    };

    // Use onAuthStateChange as the primary source of truth.
    // It will fire INITIAL_SESSION automatically on mount.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('[Auth] Auth state changed event:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);

        let roleResolved = false;
        if (session?.user) {
          roleResolved = await fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
          roleResolved = true;
        }

        // Only finalize loading if role was definitively resolved
        if (mounted && roleResolved) {
          console.log('[Auth] Role resolved, setting loading=false');
          setLoading(false);
        }
      }
    );

    // Backup timeout in case onAuthStateChange takes too long to fire INITIAL_SESSION
    const backupTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[Auth] Backup timeout reached, finalizing loading');
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(backupTimeout);
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
      isApproved,
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
