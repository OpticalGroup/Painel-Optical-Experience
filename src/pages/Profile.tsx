import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, User as UserIcon, Mail, Phone, Camera, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const profileSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
  phone: z.string().optional().refine((val) => !val || /^\+?[\d\s\-()]+$/.test(val), {
    message: "Telefone inválido",
  }),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Senha atual obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não correspondem",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      phone: "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      form.reset({
        full_name: data.full_name || "",
        phone: data.phone || "",
      });

      if (data.avatar_url) {
        setAvatarPreview(data.avatar_url);
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB");
      return;
    }

    try {
      setIsUploadingAvatar(true);

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split("/").pop();
        if (oldPath) {
          await supabase.storage
            .from("avatars")
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setAvatarPreview(urlData.publicUrl);
      toast.success("Avatar atualizado com sucesso!");
      loadProfile();
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao fazer upload do avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      loadProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!user) return;

    try {
      setIsChangingPassword(true);

      // First verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: data.currentPassword,
      });

      if (signInError) {
        toast.error("Senha atual incorreta");
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) throw updateError;

      toast.success("Senha alterada com sucesso!");
      passwordForm.reset();
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error("Erro ao alterar senha");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || "??";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <main className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex items-center justify-between px-8 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Gerencie suas informações pessoais
                  </p>
                </div>
              </div>
              <UserMenu />
            </div>
          </header>

          {/* Content */}
          <div className="px-8 py-6 max-w-4xl">
            <div className="grid gap-6">
              {/* Avatar Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Foto de Perfil</CardTitle>
                  <CardDescription>
                    Atualize sua foto de perfil. Tamanho máximo: 2MB
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        {avatarPreview ? (
                          <AvatarImage src={avatarPreview} alt="Avatar" />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={isUploadingAvatar}
                      />
                      <Label htmlFor="avatar-upload">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isUploadingAvatar}
                          onClick={() => document.getElementById("avatar-upload")?.click()}
                          asChild
                        >
                          <span className="cursor-pointer">
                            {isUploadingAvatar ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Camera className="mr-2 h-4 w-4" />
                                Alterar Foto
                              </>
                            )}
                          </span>
                        </Button>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-2">
                        JPG, PNG ou GIF. Máximo 2MB.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize suas informações de contato
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      {/* Email (read-only) */}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={profile?.email || user?.email || ""}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          O email não pode ser alterado
                        </p>
                      </div>

                      {/* Full Name */}
                      <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Seu nome completo"
                                  {...field}
                                  disabled={isSaving}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Phone */}
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="(11) 99999-9999"
                                  {...field}
                                  disabled={isSaving}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSaving}>
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            "Salvar Alterações"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Security Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <CardTitle>Segurança</CardTitle>
                  </div>
                  <CardDescription>
                    Altere sua senha para manter sua conta segura
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      {/* Current Password */}
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha Atual</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="password"
                                  placeholder="••••••"
                                  {...field}
                                  disabled={isChangingPassword}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* New Password */}
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nova Senha</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="password"
                                  placeholder="••••••"
                                  {...field}
                                  disabled={isChangingPassword}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Confirm Password */}
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Nova Senha</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="password"
                                  placeholder="••••••"
                                  {...field}
                                  disabled={isChangingPassword}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isChangingPassword}>
                          {isChangingPassword ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Alterando Senha...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Alterar Senha
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
