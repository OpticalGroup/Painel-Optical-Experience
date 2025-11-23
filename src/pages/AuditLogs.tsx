import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search, FileDown, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  user_email: string | null;
  user_id: string | null;
  before_data: any;
  after_data: any;
  created_at: string;
}

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const { data: auditLogs, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', searchTerm, actionFilter, entityFilter, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`user_email.ilike.%${searchTerm}%,entity_id.ilike.%${searchTerm}%`);
      }

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data as AuditLog[];
    },
  });

  const handleExport = () => {
    if (!auditLogs || auditLogs.length === 0) return;

    const csv = [
      ['Data/Hora', 'Usuário', 'Tipo', 'Ação', 'Detalhes'].join(','),
      ...auditLogs.map(log => [
        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
        log.user_email || 'N/A',
        log.entity_type,
        log.action,
        JSON.stringify(log.after_data || {}).replace(/,/g, ';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      created: "default",
      updated: "secondary",
      deleted: "destructive",
      viewed: "outline",
    };
    return <Badge variant={variants[action] || "outline"}>{action}</Badge>;
  };

  const getEntityTypeName = (type: string) => {
    const names: Record<string, string> = {
      enrollment: "Matrícula",
      enrollment_access: "Acesso a Dados",
      cohort: "Turma",
      user: "Usuário",
    };
    return names[type] || type;
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6">
        <SidebarTrigger />
        <h1 className="text-xl font-semibold">Logs de Auditoria</h1>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros de Auditoria</CardTitle>
            <CardDescription>
              Pesquise e filtre os logs de auditoria por usuário, data, tipo de entidade e ação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Email ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Entity Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="entity">Tipo de Entidade</Label>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger id="entity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="enrollment">Matrícula</SelectItem>
                    <SelectItem value="enrollment_access">Acesso a Dados</SelectItem>
                    <SelectItem value="cohort">Turma</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Filter */}
              <div className="space-y-2">
                <Label htmlFor="action">Ação</Label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger id="action">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="created">Criado</SelectItem>
                    <SelectItem value="updated">Atualizado</SelectItem>
                    <SelectItem value="deleted">Deletado</SelectItem>
                    <SelectItem value="viewed">Visualizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Período</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yy") : "Início"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yy") : "Fim"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm" disabled={!auditLogs || auditLogs.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registros de Auditoria</CardTitle>
            <CardDescription>
              {isLoading ? "Carregando..." : `${auditLogs?.length || 0} registros encontrados`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Carregando logs...
                      </TableCell>
                    </TableRow>
                  ) : auditLogs && auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{log.user_email || 'Sistema'}</span>
                            {log.after_data?.user_name && (
                              <span className="text-xs text-muted-foreground">{log.after_data.user_name}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getEntityTypeName(log.entity_type)}</TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell className="max-w-md">
                          {log.entity_type === 'enrollment_access' && log.after_data ? (
                            <div className="text-sm">
                              <p className="text-muted-foreground">
                                Acessou {log.after_data.enrollment_count} matrículas
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Turma: {log.after_data.cohort_id}
                              </p>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {log.entity_id}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum log encontrado com os filtros aplicados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
};

export default AuditLogs;
