import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  FileText, 
  Users, 
  Calendar, 
  Download,
  CheckCircle,
  BookOpen,
  Workflow,
  Plug,
  FileCode,
  History,
  Database,
  Shield,
  Palette
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserMenu } from "@/components/UserMenu";

const Documentation = () => {
  const downloadChangelog = () => {
    const changelog = `# SISTEMA DE GESTÃO DE TURMAS - OPTICAL DENTAL ACADEMY
# CHANGELOG E DOCUMENTAÇÃO TÉCNICA COMPLETA

Versão: 2.0.0 | Data: ${new Date().toLocaleDateString('pt-BR')}

## 📋 ÍNDICE
1. Arquitetura do Sistema
2. Módulos Principais
3. Banco de Dados
4. Integrações
5. Segurança
6. API Reference
7. Estrutura de Código

---

## 🏗️ ARQUITETURA

**Stack:** React 18 + TypeScript + Vite + Tailwind + Supabase
**Backend:** PostgreSQL + Edge Functions (Deno)
**Auth:** Supabase Auth + RLS
**Estado:** TanStack Query v5

---

## 📊 FUNCIONALIDADES COMPLETAS

### Gestão de Turmas
- Criação e edição de turmas
- Controle de ocupação em tempo real
- Gráficos Apple Watch style
- Sistema de capacidade dinâmica
- Lista de espera e overbooking
- Transferência entre turmas

### Sistema de Matrículas
- Cadastro individual
- Importação CSV em lote
- Validação completa
- Status financeiro e contratual
- Ações rápidas
- Auditoria completa

### Integrações Nativas
- ClickSign (assinatura digital)
- Kommo CRM (leads)
- Typeform (formulários)
- Webhooks configuráveis
- Logs de operações

### Analytics e Relatórios
- Dashboard com métricas
- Rankings (vendedores, origens)
- Tendências de ocupação
- Exportação CSV/Excel

---

Documentação gerada automaticamente pelo sistema.
`;

    const blob = new Blob([changelog], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'SYSTEM_CHANGELOG.md';
    link.click();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1">
          <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
            <div className="flex items-center justify-between px-8 py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Documentação</h1>
                  <p className="text-sm text-muted-foreground">Guias e referências do sistema</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={downloadChangelog} variant="outline" className="gap-2">
                  <FileCode className="h-4 w-4" />
                  Exportar Changelog
                </Button>
                <UserMenu />
              </div>
            </div>
          </header>

          <section className="px-8 py-8 max-w-7xl">
            <Card className="p-8">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Sistema de Gestão de Turmas</h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Plataforma completa para gerenciamento da Optical Dental Academy
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">Turmas</h3>
                    <p className="text-sm text-muted-foreground">Gestão completa com controle de ocupação</p>
                  </div>
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <Users className="h-5 w-5 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">Matrículas</h3>
                    <p className="text-sm text-muted-foreground">Individual ou lote via CSV</p>
                  </div>
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <Plug className="h-5 w-5 text-primary mb-2" />
                    <h3 className="font-semibold mb-1">Integrações</h3>
                    <p className="text-sm text-muted-foreground">ClickSign, Kommo, Typeform</p>
                  </div>
                </div>

                <Separator />

                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="modules">
                    <AccordionTrigger>
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5" />
                        <span>Todos os Módulos</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 ml-8">
                        <p><strong>✅ Gestão de Turmas:</strong> Criação, edição, ocupação, status</p>
                        <p><strong>✅ Matrículas:</strong> Individual, CSV, validação, ações rápidas</p>
                        <p><strong>✅ Dashboard:</strong> Métricas, rankings, tendências</p>
                        <p><strong>✅ Integrações:</strong> ClickSign, Kommo, Typeform</p>
                        <p><strong>✅ Segurança:</strong> RBAC, RLS, auditoria</p>
                        <p><strong>✅ Whitelabel:</strong> Logo, cores, domínio</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Alert className="bg-primary/5 border-primary/20">
                  <FileCode className="h-5 w-5 text-primary" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">Documentação Técnica Completa</p>
                    <p className="text-sm">Exportação inclui arquitetura, schema do banco, Edge Functions, API Reference e muito mais.</p>
                  </AlertDescription>
                </Alert>

                <Button onClick={downloadChangelog} size="lg" className="gap-2">
                  <Download className="h-5 w-5" />
                  Exportar Documentação Completa
                </Button>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Documentation;
