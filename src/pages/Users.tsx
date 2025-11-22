import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UserMenu } from "@/components/UserMenu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Users as UsersIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type UserRole = "admin" | "operator" | "sales" | "viewer";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  role: UserRole | null;
}

export default function Users() {
  const { userRole } = useAuth();
  const queryClient = useQueryClient();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Fetch users with their profiles and roles
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // Get all profiles with email
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Merge data
      const usersData: UserProfile[] = profiles.map((profile) => {
        const role = roles.find((r) => r.user_id === profile.user_id);
        
        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          email: profile.email || "",
          phone: profile.phone,
          created_at: profile.created_at,
          role: role?.role || null,
        };
      });

      return usersData;
    },
    enabled: userRole === "admin",
  });

  // Mutation to update user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Permissão atualizada com sucesso!");
      setUpdatingUserId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar permissão");
      setUpdatingUserId(null);
    },
  });

  const getRoleBadgeVariant = (role: UserRole | null) => {
    if (!role) return "secondary";
    const variants = {
      admin: "default",
      operator: "default",
      sales: "secondary",
      viewer: "outline",
    };
    return variants[role] as any;
  };

  const getRoleLabel = (role: UserRole | null) => {
    if (!role) return "Sem permissão";
    const labels = {
      admin: "Administrador",
      operator: "Operador",
      sales: "Vendas",
      viewer: "Visualizador",
    };
    return labels[role];
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    updateRoleMutation.mutate({ userId, newRole: newRole as UserRole });
  };

  if (userRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Acesso Restrito</h2>
          <p className="text-muted-foreground">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
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
                  <h1 className="text-2xl font-bold text-foreground">
                    Gerenciamento de Usuários
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Visualize e gerencie permissões de usuários
                  </p>
                </div>
              </div>
              <UserMenu />
            </div>
          </header>

          {/* Content */}
          <div className="px-8 py-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-primary" />
                    <CardTitle>Usuários do Sistema</CardTitle>
                  </div>
                  <Badge variant="secondary">
                    {users?.length || 0} usuários
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : users && users.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Permissão</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(user.full_name, user.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-foreground">
                                  {user.full_name || "Sem nome"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Cadastrado em{" "}
                                  {new Date(user.created_at).toLocaleDateString("pt-BR")}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.phone || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={user.role || ""}
                              onValueChange={(value) =>
                                handleRoleChange(user.user_id, value)
                              }
                              disabled={updatingUserId === user.user_id}
                            >
                              <SelectTrigger className="w-[180px] ml-auto">
                                <SelectValue placeholder="Selecionar permissão" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="operator">Operador</SelectItem>
                                <SelectItem value="sales">Vendas</SelectItem>
                                <SelectItem value="viewer">Visualizador</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum usuário encontrado
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <h3 className="font-semibold text-sm">Administrador</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Acesso total ao sistema, incluindo gerenciamento de usuários
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <h3 className="font-semibold text-sm">Operador</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pode criar/editar turmas e gerenciar matrículas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-secondary"></div>
                    <h3 className="font-semibold text-sm">Vendas</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pode criar novas matrículas e visualizar turmas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-muted"></div>
                    <h3 className="font-semibold text-sm">Visualizador</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Apenas visualização, sem permissão de edição
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
