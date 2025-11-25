import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, LogOut, Mail } from 'lucide-react';

export default function AccessPending() {
    const { user, userRole, signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // If user has a role, redirect to home
        if (userRole) {
            navigate('/');
        }

        // If no user at all, redirect to auth
        if (!user) {
            navigate('/auth');
        }
    }, [user, userRole, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-4">
                    <div className="flex justify-center">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                            <AlertCircle className="h-12 w-12 text-orange-600 dark:text-orange-500" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <CardTitle className="text-2xl font-bold">
                            Acesso Pendente
                        </CardTitle>
                        <CardDescription className="text-base">
                            Sua conta está aguardando aprovação
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <p className="text-sm text-foreground">
                            <strong>Olá!</strong> Sua conta foi criada com sucesso, mas ainda precisa ser aprovada por um administrador do sistema.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Você receberá um email assim que seu acesso for liberado.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            <strong>Email da conta:</strong> {user?.email}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => window.location.href = 'mailto:admin@opticalexperience.com?subject=Solicitação de Acesso - Painel'}
                        >
                            <Mail className="mr-2 h-4 w-4" />
                            Contatar Administrador
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={signOut}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                        </Button>
                    </div>

                    <div className="text-center pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                            Não tem certeza do que fazer? Entre em contato com o suporte técnico.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
