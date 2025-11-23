import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Shield, Users as UsersIcon, Loader2, Trash2, Edit2 } from "lucide-react";
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

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      // Note: This only deletes from profiles. Deleting from auth.users requires admin API.
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
      // This is a simplified approach. Ideally, we should use a stored procedure or multiple requests.
      // For now, we'll iterate.
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

  // Selection Logic
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
                          onCheckedChange={(checked) => {
                            // We need to pass the event to handle shift click, but onCheckedChange doesn't give it directly.
                            // We'll use onClick on the wrapper or just handle it differently.
                            // Actually, Radix Checkbox doesn't pass the event in onCheckedChange easily.
                            // Let's use onClick on the checkbox container div or similar.
                          }}
                          onClick={(e) => {
                            // e.stopPropagation();
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
    </>
  );
}
