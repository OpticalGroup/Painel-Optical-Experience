import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Shield, Users as UsersIcon, Loader2, Trash2, UserPlus } from "lucide-react";
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Create user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("viewer");
  const [newUserName, setNewUserName] = useState("");

  // Fetch users with their profiles and roles
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

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

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async ({ email, password, role, fullName }: { email: string; password: string; role: UserRole; fullName: string }) => {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar usuário");

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: authData.user.id,
          email: email,
          full_name: fullName || null,
        });

      if (profileError) throw profileError;

      // Assign role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: role,
        });

      if (roleError) throw roleError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário criado com sucesso!");
      setIsCreateDialogOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("viewer");
      setNewUserName("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar usuário");
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete from profiles (will cascade if properly configured)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuário removido com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover usuário");
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .in("user_id", userIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`${selectedUsers.length} usuários removidos com sucesso!`);
      setSelectedUsers([]);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover usuários");
    },
  });

  // Bulk role update mutation
  const bulkUpdateRoleMutation = useMutation({
    mutationFn: async ({ userIds, newRole }: { userIds: string[]; newRole: UserRole }) => {
      for (const userId of userIds) {
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingRole) {
          await supabase.from("user_roles").update({ role: newRole }).eq("user_id", userId);
        } else {
          await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`Permissões atualizadas para ${selectedUsers.length} usuários!`);
      setSelectedUsers([]);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar permissões em massa");
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

  const handleSelectAll = (checked: boolean) => {
    if (checked && users) {
      setSelectedUsers(users.map((u) => u.user_id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean, event: React.MouseEvent) => {
    if (event.shiftKey && lastSelectedId && users) {
      const lastIndex = users.findIndex((u) => u.user_id === lastSelectedId);
      const currentIndex = users.findIndex((u) => u.user_id === userId);

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = users.slice(start, end + 1).map((u) => u.user_id);

        const newSelected = new Set(selectedUsers);
        rangeIds.forEach(id => newSelected.add(id));
        setSelectedUsers(Array.from(newSelected));
      }
    } else {
      if (checked) {
        setSelectedUsers((prev) => [...prev, userId]);
        setLastSelectedId(userId);
      } else {
        setSelectedUsers((prev) => prev.filter((id) => id !== userId));
      }
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Tem certeza que deseja remover ${selectedUsers.length} usuários?`)) {
      bulkDeleteMutation.mutate(selectedUsers);
    }
  };

  const handleBulkRoleUpdate = (newRole: string) => {
    if (confirm(`Deseja alterar a permissão de ${selectedUsers.length} usuários para ${getRoleLabel(newRole as UserRole)}?`)) {
      bulkUpdateRoleMutation.mutate({ userIds: selectedUsers, newRole: newRole as UserRole });
    }
  };

  const handleCreateUser = () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error("Preencha email e senha");
      return;
    }

    createUserMutation.mutate({
      email: newUserEmail,
      password: newUserPassword,
      role: newUserRole,
      fullName: newUserName,
    });
  };

  const handleDeleteUser = (userId: string, email: string) => {
    if (confirm(`Tem certeza que deseja remover o usuário ${email}?`)) {
      deleteUserMutation.mutate(userId);
    }
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
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Gerenciamento de Usuários
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Crie e gerencie usuários e permissões
              </p>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      <div className="px-8 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-primary" />
                <CardTitle>Usuários do Sistema</CardTitle>
              </div>
              <div className="flex items-center gap-4">
                {selectedUsers.length > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                    <span className="text-sm text-muted-foreground mr-2">
                      {selectedUsers.length} selecionados
                    </span>
                    <Select onValueChange={handleBulkRoleUpdate}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Alterar Permissão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="operator">Operador</SelectItem>
                        <SelectItem value="sales">Vendas</SelectItem>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="destructive" size="icon" onClick={handleBulkDelete}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Badge variant="secondary">
                  {users?.length || 0} usuários
                </Badge>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Novo Usuário</DialogTitle>
                      <DialogDescription>
                        Preencha os dados do novo usuário. Ele receberá um email para confirmar a conta.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo (Opcional)</Label>
                        <Input
                          id="name"
                          placeholder="João Silva"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="usuario@email.com"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha Temporária *</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          O usuário deverá trocar a senha no primeiro acesso
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Nível de Permissão *</Label>
                        <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">👑 Administrador - Acesso total</SelectItem>
                            <SelectItem value="operator">⚙️ Operador - Gerenciar turmas e matrículas</SelectItem>
                            <SelectItem value="sales">💰 Vendas - Criar matrículas</SelectItem>
                            <SelectItem value="viewer">👁️ Visualizador - Apenas leitura</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreateUser}
                        disabled={createUserMutation.isPending}
                      >
                        {createUserMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          'Criar Usuário'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
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
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedUsers.length === users.length}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      />
                    </TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className={selectedUsers.includes(user.user_id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.user_id)}
                          onClick={(e) => {
                            const checked = !selectedUsers.includes(user.user_id);
                            handleSelectUser(user.user_id, checked, e);
                          }}
                        />
                      </TableCell>
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
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={user.role || ""}
                            onValueChange={(value) =>
                              handleRoleChange(user.user_id, value)
                            }
                            disabled={updatingUserId === user.user_id}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Selecionar permissão" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="operator">Operador</SelectItem>
                              <SelectItem value="sales">Vendas</SelectItem>
                              <SelectItem value="viewer">Visualizador</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.user_id, user.email)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Nenhum usuário encontrado
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Criar Primeiro Usuário
                </Button>
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
    </>
  );
}
