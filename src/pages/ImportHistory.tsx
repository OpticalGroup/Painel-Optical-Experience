import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useImportHistoryQuery } from "@/integrations/supabase/hooks/useImportHistory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/UserMenu";

const ImportHistory = () => {
  const { data: history, isLoading } = useImportHistoryQuery();

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                Histórico de Importações
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">
                Visualize o status e detalhes das importações de alunos
              </p>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Registros de Importação</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Sucesso</TableHead>
                  <TableHead>Erros</TableHead>
                  <TableHead>Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando histórico...
                    </TableCell>
                  </TableRow>
                ) : history?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma importação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  history?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.imported_at ? format(new Date(item.imported_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        }) : "-"}
                      </TableCell>
                      <TableCell>{item.file_name || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.failed_imports > 0
                              ? "destructive"
                              : "default"
                          }
                          className={
                            item.failed_imports === 0 ? "bg-green-500 hover:bg-green-600" : ""
                          }
                        >
                          {item.failed_imports > 0
                            ? "Com Erros"
                            : "Concluído"}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.total_students || "-"}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {item.successful_imports || "-"}
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {item.failed_imports || "-"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.notes || ""}>
                        {item.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ImportHistory;
