import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function DebugPermissions() {
    const { user, userRole } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dbRole, setDbRole] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkCurrentStatus();
    }, [user]);

    const checkCurrentStatus = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;
            setDbRole(data?.role || "Nenhum (NULL)");
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        }
    };

    const fixPermissions = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // 1. Check if exists
            const { data: existing } = await supabase
                .from('user_roles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (existing) {
                // Update
                const { error } = await supabase
                    .from('user_roles')
                    .update({ role: 'admin' })
                    .eq('user_id', user.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from('user_roles')
                    .insert({
                        user_id: user.id,
                        role: 'admin'
                    });
                if (error) throw error;
            }

            toast.success("Permissões corrigidas com sucesso!");
            await checkCurrentStatus();
            // Force reload to update auth context
            setTimeout(() => window.location.reload(), 1500);

        } catch (err: any) {
            toast.error("Erro ao corrigir: " + err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Diagnóstico de Permissões</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="font-semibold">User ID:</span>
                            <span className="font-mono text-sm">{user?.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Email:</span>
                            <span className="font-mono text-sm">{user?.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Role em Memória (App):</span>
                            <span className="font-mono text-sm">{userRole || "null"}</span>
                        </div>
                        <div className="flex justify-between items-center bg-background p-2 rounded border">
                            <span className="font-semibold text-primary">Role no Banco de Dados:</span>
                            <span className="font-mono font-bold text-sm">
                                {dbRole === null ? <Loader2 className="h-4 w-4 animate-spin" /> : dbRole}
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-destructive/15 text-destructive rounded-lg flex items-center gap-2">
                            <XCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <div className="pt-4 border-t">
                        <h3 className="font-medium mb-3">Ações de Reparo</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Se o papel no banco de dados estiver "Nenhum" ou incorreto, clique abaixo para forçar a criação do registro de Admin.
                        </p>
                        <Button
                            onClick={fixPermissions}
                            disabled={loading || !user}
                            className="w-full"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Corrigir Minhas Permissões (Tornar Admin)
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
