import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Users, Tag, AlertTriangle, Link, HelpCircle, Calendar } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { CancellationReasonsSettings } from "@/components/settings/CancellationReasonsSettings";
import { UTMSettings } from "@/components/settings/UTMSettings";
import { ProductsTab } from "@/components/settings/ProductsTab";
import CohortsAdmin from "./CohortsAdmin";
import { OriginHierarchyManager } from "@/components/OriginHierarchyManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useSalesRepsQuery, useCreateSalesRep, useUpdateSalesRep, useDeleteSalesRep } from "@/integrations/supabase/hooks/useSalesReps";

import { useNucleosQuery } from "@/integrations/supabase/hooks/useNucleos";
import { NucleosTab } from "@/components/settings/NucleosTab";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";

type SalesRep = Tables<'sellers'>;


// Validation schemas
const salesRepSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo").optional().or(z.literal("")),
  phone: z.string().trim().max(20, "Telefone muito longo").optional().or(z.literal("")),
  active: z.boolean(),
  nucleo_id: z.string().optional().or(z.literal("")),
});



const Settings = () => {
  // Sales Reps state
  const [salesRepModalOpen, setSalesRepModalOpen] = useState(false);
  const [selectedSalesRep, setSelectedSalesRep] = useState<SalesRep | null>(null);
  const [salesRepDeleteDialogOpen, setSalesRepDeleteDialogOpen] = useState(false);
  const [salesRepToDelete, setSalesRepToDelete] = useState<string | null>(null);
  const [salesRepFormData, setSalesRepFormData] = useState({ name: "", email: "", phone: "", active: true, nucleo_id: "" });
  const [salesRepFormErrors, setSalesRepFormErrors] = useState<Record<string, string>>({});



  // Queries and mutations
  const { data: salesReps, isLoading: salesRepsLoading } = useSalesRepsQuery();

  const { data: nucleos } = useNucleosQuery();
  const createSalesRep = useCreateSalesRep();
  const updateSalesRep = useUpdateSalesRep();
  const deleteSalesRep = useDeleteSalesRep();


  // Sales Rep handlers
  const handleSalesRepEdit = (salesRep: SalesRep) => {
    setSelectedSalesRep(salesRep);
    setSalesRepFormData({
      name: salesRep.name,
      email: salesRep.email || "",
      phone: salesRep.phone || "",
      active: salesRep.active,
      nucleo_id: salesRep.nucleo_id || "",
    });
    setSalesRepModalOpen(true);
  };

  const handleSalesRepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalesRepFormErrors({});

    try {
      const validatedData = salesRepSchema.parse(salesRepFormData);

      const payload = {
        name: validatedData.name,
        active: validatedData.active,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        nucleo_id: validatedData.nucleo_id || null,
      };

      if (selectedSalesRep) {
        await updateSalesRep.mutateAsync({
          id: selectedSalesRep.id,
          ...payload
        });
      } else {
        await createSalesRep.mutateAsync(payload);
      }

      setSalesRepModalOpen(false);
      setSelectedSalesRep(null);
      setSalesRepFormData({ name: "", email: "", phone: "", active: true, nucleo_id: "" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setSalesRepFormErrors(errors);
      }
    }
  };

  const handleSalesRepDelete = async () => {
    if (salesRepToDelete) {
      await deleteSalesRep.mutateAsync(salesRepToDelete);
      setSalesRepDeleteDialogOpen(false);
      setSalesRepToDelete(null);
    }
  };



  return (
    <>
      {/* Responsive Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 lg:py-4 gap-3">
          {/* Left: Title */}
          <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                Configurações
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden md:block">
                Gerencie vendedores e origens de matrícula
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary hidden sm:inline-flex"
              onClick={() => window.open('/documentation#configuracao-de-turmas', '_blank')}
              title="Ver Documentação"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <Tabs defaultValue="cohorts" className="w-full">
          {/* Responsive Tab List */}
          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-2">
            <TabsList className="bg-secondary/50 inline-flex min-w-max">
              <TabsTrigger value="cohorts" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Turmas</span>
                <span className="inline sm:hidden">Turmas</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Produtos</span>
              </TabsTrigger>
              <TabsTrigger value="nucleos" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Núcleos</span>
              </TabsTrigger>
              <TabsTrigger value="sources" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Origens</span>
              </TabsTrigger>
              <TabsTrigger value="sales-reps" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Vendedores</span>
                <span className="inline sm:hidden">Vend.</span>
              </TabsTrigger>
              <TabsTrigger value="cancellation" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Cancelamento</span>
                <span className="inline sm:hidden">Canc.</span>
              </TabsTrigger>
              <TabsTrigger value="utm" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Link className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Rastreamento</span>
                <span className="inline sm:hidden">UTM</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Cohorts Tab */}
          <TabsContent value="cohorts" className="mt-6">
            <CohortsAdmin />
          </TabsContent>

          {/* Sales Reps Tab */}
          <TabsContent value="sales-reps" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold">Vendedores</h2>
                <p className="text-sm text-muted-foreground">
                  Gerencie a equipe de vendas
                </p>
              </div>
              <Button onClick={() => {
                setSelectedSalesRep(null);
                setSalesRepFormData({ name: "", email: "", phone: "", active: true, nucleo_id: "" });
                setSalesRepModalOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Vendedor
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Núcleo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesRepsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : salesReps?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhum vendedor cadastrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesReps?.map((rep) => (
                      <TableRow key={rep.id}>
                        <TableCell className="font-medium">{rep.name}</TableCell>
                        <TableCell>{rep.email || "-"}</TableCell>
                        <TableCell>{rep.phone || "-"}</TableCell>
                        <TableCell>
                          {nucleos?.find(n => n.id === rep.nucleo_id)?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={rep.active ? "default" : "secondary"}>
                            {rep.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSalesRepEdit(rep)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setSalesRepToDelete(rep.id);
                                setSalesRepDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-6">
            <ProductsTab />
          </TabsContent>

          {/* Nucleos Tab */}
          <TabsContent value="nucleos" className="mt-6">
            <NucleosTab />
          </TabsContent>

          {/* Custom Sources Tab - Now using Hierarchy Manager */}
          <TabsContent value="sources" className="mt-6">
            <OriginHierarchyManager />
          </TabsContent>

          {/* Cancellation Reasons Tab */}
          <TabsContent value="cancellation">
            <CancellationReasonsSettings />
          </TabsContent>

          <TabsContent value="utm">
            <UTMSettings />
          </TabsContent>
        </Tabs>
      </section>


      {/* Sales Rep Modal */}
      < Dialog open={salesRepModalOpen} onOpenChange={setSalesRepModalOpen} >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-primary">
              {selectedSalesRep ? "Editar Vendedor" : "Novo Vendedor"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do vendedor
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalesRepSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={salesRepFormData.name}
                onChange={(e) => setSalesRepFormData({ ...salesRepFormData, name: e.target.value })}
                className="focus:border-[#D6CDC8]"
                maxLength={100}
              />
              {salesRepFormErrors.name && (
                <p className="text-sm text-destructive">{salesRepFormErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={salesRepFormData.email}
                onChange={(e) => setSalesRepFormData({ ...salesRepFormData, email: e.target.value })}
                className="focus:border-[#D6CDC8]"
                maxLength={255}
              />
              {salesRepFormErrors.email && (
                <p className="text-sm text-destructive">{salesRepFormErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={salesRepFormData.phone}
                onChange={(e) => setSalesRepFormData({ ...salesRepFormData, phone: e.target.value })}
                className="focus:border-[#D6CDC8]"
                maxLength={20}
              />
              {salesRepFormErrors.phone && (
                <p className="text-sm text-destructive">{salesRepFormErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nucleo">Núcleo</Label>
              <Select
                value={salesRepFormData.nucleo_id}
                onValueChange={(value) => setSalesRepFormData({ ...salesRepFormData, nucleo_id: value })}
              >
                <SelectTrigger id="nucleo">
                  <SelectValue placeholder="Selecione um núcleo" />
                </SelectTrigger>
                <SelectContent>
                  {nucleos?.map((nucleo) => (
                    <SelectItem key={nucleo.id} value={nucleo.id}>
                      {nucleo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={salesRepFormData.active}
                onCheckedChange={(checked) => setSalesRepFormData({ ...salesRepFormData, active: checked })}
              />
              <Label htmlFor="active" className="cursor-pointer">Ativo</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setSalesRepModalOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={createSalesRep.isPending || updateSalesRep.isPending}
              >
                {selectedSalesRep ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog >



      {/* Sales Rep Delete Dialog */}
      < AlertDialog open={salesRepDeleteDialogOpen} onOpenChange={setSalesRepDeleteDialogOpen} >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá remover permanentemente o vendedor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSalesRepDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >


    </>
  );
};

export default Settings;
