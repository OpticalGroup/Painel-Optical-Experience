import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export default function Auth() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    await signIn(values.email, values.password);
    setIsLoading(false);
  };

  const handleResetPassword = async (values: z.infer<typeof resetPasswordSchema>) => {
    setIsResettingPassword(true);

    try {
      const redirectUrl = `${window.location.origin}/auth`;

      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setIsResetModalOpen(false);
      resetPasswordForm.reset();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar email de recuperação');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img src="/optical-experience-logo.png" alt="Optical Experience" className="h-16 w-auto" />
          </div>
          <div className="text-center space-y-1">
            <CardTitle className="text-2xl font-bold text-primary">
              Optical Experience
            </CardTitle>
            <CardDescription>
              Sistema de Gestão de Matrículas
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
              <DialogTrigger asChild>
                <Button variant="link" className="text-sm text-muted-foreground hover:text-primary">
                  Esqueceu sua senha?
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Recuperar Senha</DialogTitle>
                  <DialogDescription>
                    Digite seu email e enviaremos um link para redefinir sua senha.
                  </DialogDescription>
                </DialogHeader>
                <Form {...resetPasswordForm}>
                  <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                    <FormField
                      control={resetPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="seu@email.com"
                              {...field}
                              disabled={isResettingPassword}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isResettingPassword}>
                      {isResettingPassword ? 'Enviando...' : 'Enviar Link de Recuperação'}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
            <p className="text-sm text-center text-muted-foreground">
              <strong>Acesso Restrito:</strong> Não possui uma conta? Entre em contato com o administrador do sistema para solicitar acesso.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
