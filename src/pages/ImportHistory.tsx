import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useImportHistoryQuery } from "@/integrations/supabase/hooks/useImportHistory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ImportHistory = () => {
  const { data: history, isLoading } = useImportHistoryQuery();

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
                    Histórico de Importações
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Acompanhe todas as importações CSV realizadas no sistema
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <section className="px-8 py-8">
            {isLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : !history || history.length === 0 ? (
              <Card className="p-8 border border-border bg-card">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhuma importação realizada ainda.
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-foreground">Data</TableHead>
                      <TableHead className="font-semibold text-foreground">Usuário</TableHead>
                      <TableHead className="font-semibold text-foreground">Arquivo</TableHead>
                      <TableHead className="font-semibold text-foreground">Tipo</TableHead>
                      <TableHead className="font-semibold text-foreground">Turmas</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Total</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Sucesso</TableHead>
                      <TableHead className="font-semibold text-foreground text-center">Falhas</TableHead>
                      <TableHead className="font-semibold text-foreground">Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/50">
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {format(new Date(record.imported_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.user_email || "Desconhecido"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.file_name || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {record.import_type === "multi-cohort" ? "Multi-turma" : "Turma única"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex flex-wrap gap-1">
                            {record.cohorts_affected.map((cohort, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {cohort}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {record.total_students}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 text-primary">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-semibold">{record.successful_imports}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {record.failed_imports > 0 ? (
                            <div className="flex items-center justify-center gap-1 text-destructive">
                              <XCircle className="h-4 w-4" />
                              <span className="font-semibold">{record.failed_imports}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {record.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </section>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ImportHistory;
