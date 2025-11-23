import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  FileText,
  Users,
  Calendar,
  Workflow,
  Shield,
  Database,
  Book,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";

const Documentation = () => {
  // Dummy data for documentation cards
  const docs = [
    {
      icon: FileText,
      title: "Guia de Início Rápido",
      description: "Comece a usar o sistema em minutos com este guia passo a passo.",
    },
    {
      icon: Users,
      title: "Gestão de Matrículas",
      description: "Aprenda a cadastrar alunos, importar dados e gerenciar matrículas.",
    },
    {
      icon: Calendar,
      title: "Configuração de Turmas",
      description: "Crie e gerencie turmas, defina capacidades e horários.",
    },
    {
      icon: Workflow,
      title: "Integrações",
      description: "Conecte o sistema com ClickSign, Kommo CRM e outras ferramentas.",
    },
    {
      icon: Shield,
      title: "Segurança e Permissões",
      description: "Entenda o controle de acesso baseado em função (RBAC) e RLS.",
    },
    {
      icon: Database,
      title: "API Reference",
      description: "Documentação completa da API para desenvolvedores.",
    },
  ];

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Documentação
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Guias, tutoriais e referência da API
              </p>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Content */}
      <div className="p-8 max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map((doc, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="mb-4 p-3 bg-primary/10 w-fit rounded-lg group-hover:bg-primary/20 transition-colors">
                  <doc.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  {doc.title}
                </CardTitle>
                <CardDescription>
                  {doc.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between group-hover:translate-x-1 transition-transform" asChild>
                  <a href={`#${doc.title.toLowerCase().replace(/ /g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}>
                    Acessar Guia
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Sections */}
        <div className="space-y-12">
          <section id="gestao-de-matriculas" className="scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Gestão de Matrículas
            </h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <p>
                  A gestão de matrículas permite acompanhar todo o ciclo de vida do aluno, desde o interesse inicial até a assinatura do contrato.
                </p>
                <div id="importacao-csv" className="scroll-mt-24 pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-2">Importação de CSV</h3>
                  <p className="mb-4">
                    Para importar alunos em massa, utilize o modelo CSV padrão. O sistema aceita arquivos .csv com codificação UTF-8.
                  </p>
                  <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <h4 className="font-medium mb-2">Campos Obrigatórios:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li><strong>student_name</strong>: Nome completo do aluno</li>
                      <li><strong>email</strong>: Email válido</li>
                      <li><strong>cpf</strong>: CPF válido (apenas números)</li>
                      <li><strong>cohort_name</strong>: Nome exato da turma (deve existir no sistema)</li>
                      <li><strong>sales_rep</strong>: Nome do vendedor</li>
                      <li><strong>source</strong>: Origem do lead (ex: Instagram, Google)</li>
                      <li><strong>status</strong>: Status inicial (pending, paid, confirmed)</li>
                    </ul>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" asChild>
                      <a href="/template_importacao.csv" download>
                        <FileText className="mr-2 h-4 w-4" />
                        Baixar Modelo CSV
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section id="configuracao-de-turmas" className="scroll-mt-24">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Configuração de Turmas
            </h2>
            <Card>
              <CardContent className="p-6">
                <p>
                  Crie turmas definindo data de início, fim, capacidade máxima e localização.
                  O sistema alertará automaticamente sobre turmas lotadas ou com baixa ocupação.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              Precisa de ajuda adicional?
            </CardTitle>
            <CardDescription>
              Nossa equipe de suporte está disponível para ajudar com dúvidas técnicas e integrações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button>
                Falar com Suporte
              </Button>
              <Button variant="outline">
                Ver Status do Sistema
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Documentation;
