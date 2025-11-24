import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Users, Tag, AlertTriangle, Link, HelpCircle, Calendar } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CancellationReasonsSettings } from "@/components/settings/CancellationReasonsSettings";
import { UTMSettings } from "@/components/settings/UTMSettings";
import CohortsAdmin from "./CohortsAdmin";
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
import { useCustomSourcesQuery, useCreateCustomSource, useUpdateCustomSource, useDeleteCustomSource } from "@/integrations/supabase/hooks/useCustomSources";
import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";

type SalesRep = Tables<'sales_representatives'>;
type CustomSource = Tables<'custom_enrollment_sources'>;

// Validation schemas
const salesRepSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255, "Email muito longo").optional().or(z.literal("")),
  phone: z.string().trim().max(20, "Telefone muito longo").optional().or(z.literal("")),
  active: z.boolean(),
});

const customSourceSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(50, "Nome muito longo")
    .refine(
      (name) => !Constants.public.Enums.enrollment_source.includes(name as any),
      "Este nome já existe nas origens padrão do sistema. Escolha outro nome."
    ),
  description: z.string().trim().max(200, "Descrição muito longa").optional().or(z.literal("")),
  active: z.boolean(),
});

const Settings = () => {
  // Sales Reps state
  const [salesRepModalOpen, setSalesRepModalOpen] = useState(false);
  const [selectedSalesRep, setSelectedSalesRep] = useState<SalesRep | null>(null);
  const [salesRepDeleteDialogOpen, setSalesRepDeleteDialogOpen] = useState(false);
  const [salesRepToDelete, setSalesRepToDelete] = useState<string | null>(null);
  const [salesRepFormData, setSalesRepFormData] = useState({ name: "", email: "", phone: "", active: true });
  const [salesRepFormErrors, setSalesRepFormErrors] = useState<Record<string, string>>({});

  // Custom Sources state
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<CustomSource | null>(null);
  const [sourceDeleteDialogOpen, setSourceDeleteDialogOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);
  const [sourceFormData, setSourceFormData] = useState({ name: "", description: "", active: true });
  const [sourceFormErrors, setSourceFormErrors] = useState<Record<string, string>>({});

  // Queries and mutations
  const { data: salesReps, isLoading: salesRepsLoading } = useSalesRepsQuery();
  const { data: customSources, isLoading: sourcesLoading } = useCustomSourcesQuery();
  const createSalesRep = useCreateSalesRep();
  const updateSalesRep = useUpdateSalesRep();
  const deleteSalesRep = useDeleteSalesRep();
  const createSource = useCreateCustomSource();
  const updateSource = useUpdateCustomSource();
  const deleteSource = useDeleteCustomSource();

  // Sales Rep handlers
  const handleSalesRepEdit = (salesRep: SalesRep) => {
    setSelectedSalesRep(salesRep);
    setSalesRepFormData({
      name: salesRep.name,
      email: salesRep.email || "",
      phone: salesRep.phone || "",
      active: salesRep.active,
    });
    setSalesRepModalOpen(true);
  };

  const handleSalesRepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalesRepFormErrors({});

    try {
      const validatedData = salesRepSchema.parse(salesRepFormData);

      if (selectedSalesRep) {
        await updateSalesRep.mutateAsync({
          id: selectedSalesRep.id,
          name: validatedData.name,
          active: validatedData.active,
          email: validatedData.email || null,
          phone: validatedData.phone || null,
        });
      } else {
        await createSalesRep.mutateAsync({
          name: validatedData.name,
          active: validatedData.active,
          email: validatedData.email || null,
          phone: validatedData.phone || null,
        });
      }

      setSalesRepModalOpen(false);
      setSelectedSalesRep(null);
      setSalesRepFormData({ name: "", email: "", phone: "", active: true });
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

  // Custom Source handlers
  const handleSourceEdit = (source: CustomSource) => {
    setSelectedSource(source);
    setSourceFormData({
      name: source.name,
      description: source.description || "",
      active: source.active,
    });
    setSourceModalOpen(true);
  };

  const handleSourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSourceFormErrors({});

    try {
      const validatedData = customSourceSchema.parse(sourceFormData);

      if (selectedSource) {
        await updateSource.mutateAsync({
          id: selectedSource.id,
          name: validatedData.name,
          active: validatedData.active,
          description: validatedData.description || null,
        });
      } else {
        await createSource.mutateAsync({
          name: validatedData.name,
          active: validatedData.active,
          description: validatedData.description || null,
        });
      }

      setSourceModalOpen(false);
      setSelectedSource(null);
      setSourceFormData({ name: "", description: "", active: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setSourceFormErrors(errors);
      }
    }
  };

  const handleSourceDelete = async () => {
    if (sourceToDelete) {
      await deleteSource.mutateAsync(sourceToDelete);
      setSourceDeleteDialogOpen(false);
      setSourceToDelete(null);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Gerencie vendedores e origens de matrícula
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary"
            onClick={() => window.open('/documentation#configuracao-de-turmas', '_blank')}
            title="Ver Documentação"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <section className="px-8 py-8">
        <Tabs defaultValue="cohorts" className="w-full">
          <TabsList className="bg-secondary/50 grid w-full max-w-4xl grid-cols-5">
            <TabsTrigger value="cohorts" className="gap-2">
              <Calendar className="h-4 w-4" />
              Turmas
            </TabsTrigger>
            <TabsTrigger value="sales-reps" className="gap-2">
              <Users className="h-4 w-4" />
              Vendedores
            </TabsTrigger>
            <TabsTrigger value="sources" className="gap-2">
              <Tag className="h-4 w-4" />
              Origens
            </TabsTrigger>
            <TabsTrigger value="cancellation" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Cancelamento
            </TabsTrigger>
            <TabsTrigger value="utm" className="gap-2">
              <Link className="h-4 w-4" />
              Rastreamento
            </TabsTrigger>
          </TabsList>

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
                setSalesRepFormData({ name: "", email: "", phone: "", active: true });
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
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesRepsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : salesReps?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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

          {/* Custom Sources Tab */}
          <TabsContent value="sources" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold">Origens de Matrícula</h2>
                <p className="text-sm text-muted-foreground">
                  Gerencie as origens de leads (ex: Instagram, Google, Indicação)
                </p>
              </div>
              <Button onClick={() => {
                setSelectedSource(null);
                setSourceFormData({ name: "", description: "", active: true });
                setSourceModalOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Origem
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sourcesLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : customSources?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Nenhuma origem cadastrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    customSources?.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell className="font-medium">{source.name}</TableCell>
                        <TableCell>{source.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={source.active ? "default" : "secondary"}>
                            {source.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSourceEdit(source)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setSourceToDelete(source.id);
                                setSourceDeleteDialogOpen(true);
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

      {/* Custom Source Modal */}
      < Dialog open={sourceModalOpen} onOpenChange={setSourceModalOpen} >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-primary">
              {selectedSource ? "Editar Origem" : "Nova Origem"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações da origem
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSourceSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sourceName">Nome *</Label>
              <Input
                id="sourceName"
                value={sourceFormData.name}
                onChange={(e) => setSourceFormData({ ...sourceFormData, name: e.target.value })}
                className="focus:border-[#D6CDC8]"
                maxLength={50}
              />
              {sourceFormErrors.name && (
                <p className="text-sm text-destructive">{sourceFormErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={sourceFormData.description}
                onChange={(e) => setSourceFormData({ ...sourceFormData, description: e.target.value })}
                className="focus:border-[#D6CDC8]"
                maxLength={200}
              />
              {sourceFormErrors.description && (
                <p className="text-sm text-destructive">{sourceFormErrors.description}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sourceActive"
                checked={sourceFormData.active}
                onCheckedChange={(checked) => setSourceFormData({ ...sourceFormData, active: checked })}
              />
              <Label htmlFor="sourceActive" className="cursor-pointer">Ativo</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setSourceModalOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={createSource.isPending || updateSource.isPending}
              >
                {selectedSource ? "Atualizar" : "Criar"}
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

      {/* Source Delete Dialog */}
      < AlertDialog open={sourceDeleteDialogOpen} onOpenChange={setSourceDeleteDialogOpen} >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá remover permanentemente a origem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSourceDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >
    </>
  );
};

export default Settings;
