import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, XCircle, RefreshCw } from "lucide-react";
import { User } from "@supabase/supabase-js";

export default function DebugPermissions() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [dbRole, setDbRole] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Use onAuthStateChange which is proven to work
        console.log('[DebugPermissions] Setting up auth listener...');

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[DebugPermissions] Auth event:', event, !!session);

                if (session?.user) {
                    setUser(session.user);
                    setInitializing(false);
                    await checkCurrentStatus(session.user.id);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setInitializing(false);
                }
            }
        );

        // Safety timeout
        const timeout = setTimeout(() => {
            if (initializing) {
                console.log('[DebugPermissions] Safety timeout reached');
                setInitializing(false);
            }
        }, 5000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const checkCurrentStatus = async (userId: string) => {
        try {
            console.log('[DebugPermissions] Checking role for:', userId);
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', userId)
                .maybeSingle();

            console.log('[DebugPermissions] Role query result:', data, error);
            if (error) throw error;
            setDbRole(data?.role || "Nenhum (NULL)");
            setError(null);
        } catch (err: any) {
            console.error('[DebugPermissions] Role check error:', err);
            setDbRole("Erro: " + err.message);
            setError(err.message);
        }
    };

    const fixPermissions = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            console.log('[DebugPermissions] Fixing permissions for:', user.id);

            // 1. Check if exists
            const { data: existing, error: selectError } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            console.log('[DebugPermissions] Existing role:', existing, selectError);

            if (existing) {
                // Update
                const { error } = await supabase
                    .from('user_roles')
                    .update({ role: 'admin' })
                    .eq('user_id', user.id);
                if (error) throw error;
                console.log('[DebugPermissions] Updated existing role to admin');
            } else {
                // Insert
                const { error } = await supabase
                    .from('user_roles')
                    .insert({
                        user_id: user.id,
                        role: 'admin'
                    });
                if (error) throw error;
                console.log('[DebugPermissions] Inserted new admin role');
            }

            toast.success("Permissões corrigidas com sucesso! Recarregando...");
            await checkCurrentStatus(user.id);
            // Force reload to update auth context
            setTimeout(() => window.location.href = '/', 2000);

        } catch (err: any) {
            console.error('[DebugPermissions] Fix error:', err);
            toast.error("Erro ao corrigir: " + err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Conectando ao Supabase...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 max-w-2xl px-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Diagnóstico de Permissões
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => user && checkCurrentStatus(user.id)}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!user ? (
                        <div className="p-4 bg-destructive/15 text-destructive rounded-lg">
                            <p className="font-semibold">Usuário não encontrado!</p>
                            <p className="text-sm mt-1">Você precisa estar logado para usar esta ferramenta.</p>
                            <Button
                                className="mt-4"
                                onClick={() => window.location.href = '/auth'}
                            >
                                Ir para Login
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 bg-muted rounded-lg space-y-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                    <span className="font-semibold">User ID:</span>
                                    <span className="font-mono text-xs break-all">{user.id}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                    <span className="font-semibold">Email:</span>
                                    <span className="font-mono text-sm">{user.email}</span>
                                </div>
                                <div className="flex justify-between items-center bg-background p-3 rounded border">
                                    <span className="font-semibold text-primary">Role no Banco:</span>
                                    <span className="font-mono font-bold text-sm">
                                        {dbRole === null ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            dbRole
                                        )}
                                    </span>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-destructive/15 text-destructive rounded-lg flex items-start gap-2">
                                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            <div className="pt-4 border-t">
                                <h3 className="font-medium mb-3">Ações de Reparo</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Se o papel no banco de dados estiver "Nenhum" ou incorreto, clique abaixo para forçar a criação do registro de Admin.
                                </p>
                                <Button
                                    onClick={fixPermissions}
                                    disabled={loading}
                                    className="w-full"
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Corrigir Minhas Permissões (Tornar Admin)
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
