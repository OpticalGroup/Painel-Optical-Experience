import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
    Search,
    Rocket,
    Calendar,
    UserPlus,
    FileSpreadsheet,
    Edit,
    BarChart3,
    Settings,
    Lightbulb,
    HelpCircle,
    CheckCircle2,
    ArrowRight
} from "lucide-react";

const sections = [
    { id: "welcome", title: "Bem-vindo", icon: Rocket },
    { id: "first-steps", title: "Primeiros Passos", icon: CheckCircle2 },
    { id: "create-enrollment", title: "Primeira Matrícula", icon: UserPlus },
    { id: "csv-import", title: "Importação em Massa", icon: FileSpreadsheet },
    { id: "daily-management", title: "Gestão Diária", icon: Edit },
    { id: "dashboard", title: "Métricas e Análises", icon: BarChart3 },
    { id: "advanced", title: "Recursos Avançados", icon: Settings },
    { id: "tips", title: "Dicas e Boas Práticas", icon: Lightbulb },
    { id: "faq", title: "Dúvidas Frequentes", icon: HelpCircle },
];

export const Tutorials = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeSection, setActiveSection] = useState("welcome");

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <>
            <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                <div className="flex items-center justify-between px-8 py-4">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Guia Completo
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Aprenda a usar o sistema passo-a-passo
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Navegação lateral fixa */}
                <aside className="hidden lg:block w-64 border-r border-border sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
                    <div className="p-6 space-y-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                            Navegação
                        </h3>
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${activeSection === section.id
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                    }`}
                            >
                                <section.icon className="h-4 w-4 flex-shrink-0" />
                                <span>{section.title}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Conteúdo principal */}
                <main className="flex-1 px-8 py-6 max-w-4xl mx-auto">
                    {/* Busca */}
                    <div className="mb-8">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Buscar no guia..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-12">
                        {/* 1. Bem-vindo */}
                        <section id="welcome">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Rocket className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Bem-vindo ao Optical Cohort Sparkle</h2>
                                    <p className="text-sm text-muted-foreground">Comece sua jornada aqui</p>
                                </div>
                            </div>

                            <Card className="p-6 space-y-4">
                                <p className="text-lg">
                                    Este sistema foi criado para <strong>simplificar a gestão de turmas presenciais</strong>.
                                    Você pode gerenciar matrículas, acompanhar ocupação e analisar métricas - tudo em um só lugar.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                    <div className="p-4 border rounded-lg">
                                        <Calendar className="h-8 w-8 text-primary mb-3" />
                                        <h3 className="font-semibold mb-1">Gerencie Turmas</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Crie turmas, defina capacidade e acompanhe ocupação em tempo real
                                        </p>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <UserPlus className="h-8 w-8 text-primary mb-3" />
                                        <h3 className="font-semibold mb-1">Matricule Alunos</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Cadastre manualmente ou importe centenas de matrículas via CSV
                                        </p>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <BarChart3 className="h-8 w-8 text-primary mb-3" />
                                        <h3 className="font-semibold mb-1">Analise Resultados</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Veja métricas de ocupação, receita e origem dos alunos
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </section>

                        {/* 2. Primeiros Passos */}
                        <section id="first-steps">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <CheckCircle2 className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Primeiros Passos</h2>
                                    <p className="text-sm text-muted-foreground">Configure seu ambiente em 5 minutos</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Card className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                                            1
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg mb-2">Crie sua primeira turma</h3>
                                            <p className="text-muted-foreground mb-3">
                                                Antes de matricular alunos, você precisa de pelo menos uma turma ativa.
                                            </p>
                                            <ol className="list-decimal list-inside space-y-2 ml-4 text-sm">
                                                <li>No menu lateral, clique em <strong>"Turmas"</strong></li>
                                                <li>Clique no botão <strong>"Nova Turma"</strong> (topo da página)</li>
                                                <li>Preencha:
                                                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                                        <li><strong>Nome:</strong> Ex: "Turma Janeiro 2025"</li>
                                                        <li><strong>Capacidade:</strong> Número máximo de alunos (ex: 30)</li>
                                                        <li><strong>Datas:</strong> Início e fim do curso</li>
                                                        <li><strong>Local:</strong> Endereço ou "Online"</li>
                                                    </ul>
                                                </li>
                                                <li>Clique em <strong>"Salvar"</strong></li>
                                            </ol>
                                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                                    ✨ <strong>Dica:</strong> Crie turmas com antecedência para começar a receber matrículas antes do início do curso.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                                            2
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg mb-2">Explore o Dashboard</h3>
                                            <p className="text-muted-foreground mb-3">
                                                O Dashboard é sua central de comando. Entenda o que cada card significa:
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="p-3 border rounded">
                                                    <p className="font-medium">Total de Alunos</p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Soma de todos os matriculados (exceto cancelados)
                                                    </p>
                                                </div>
                                                <div className="p-3 border rounded">
                                                    <p className="font-medium">Turmas Ativas</p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Turmas em andamento ou programadas
                                                    </p>
                                                </div>
                                                <div className="p-3 border rounded">
                                                    <p className="font-medium">Matrículas Pagas</p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Alunos com pagamento confirmado
                                                    </p>
                                                </div>
                                                <div className="p-3 border rounded">
                                                    <p className="font-medium">Receita Total</p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Soma apenas dos valores pagos (R$)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                                            3
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg mb-2">Entenda os Status Financeiros</h3>
                                            <p className="text-muted-foreground mb-3">
                                                Cada matrícula tem um status que indica a situação do pagamento:
                                            </p>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 p-2 rounded border">
                                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                    <div>
                                                        <p className="font-medium">Pago</p>
                                                        <p className="text-sm text-muted-foreground">Pagamento confirmado - conta para receita</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-2 rounded border">
                                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                                    <div>
                                                        <p className="font-medium">Pendente</p>
                                                        <p className="text-sm text-muted-foreground">Aguardando pagamento - não conta para receita</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-2 rounded border">
                                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                    <div>
                                                        <p className="font-medium">Cancelado</p>
                                                        <p className="text-sm text-muted-foreground">Matrícula cancelada - fica oculto por padrão</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </section>

                        {/* 3. Primeira Matrícula */}
                        <section id="create-enrollment">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <UserPlus className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Criando sua Primeira Matrícula</h2>
                                    <p className="text-sm text-muted-foreground">Passo-a-passo detalhado</p>
                                </div>
                            </div>

                            <Card className="p-6 space-y-6">
                                <div>
                                    <h3 className="font-semibold text-lg mb-3">Como cadastrar um novo aluno</h3>
                                    <ol className="space-y-4">
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                            <div>
                                                <p className="font-medium">Clique em "Nova Matrícula"</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Você encontra esse botão no Dashboard (página inicial) ou na página de Matrículas
                                                </p>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                            <div>
                                                <p className="font-medium">Preencha os dados básicos</p>
                                                <div className="mt-2 space-y-2">
                                                    <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                                        <p className="text-sm"><strong>Nome:</strong> Nome completo do aluno</p>
                                                    </div>
                                                    <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                                        <p className="text-sm"><strong>Email:</strong> Email válido (único por aluno)</p>
                                                    </div>
                                                    <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                                        <p className="text-sm"><strong>Turma:</strong> Selecione a turma que você criou</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                            <div>
                                                <p className="font-medium">Defina o valor da matrícula</p>
                                                <p className="text-sm text-muted-foreground mt-1 mb-2">
                                                    No campo "Valor (R$)", digite apenas os números:
                                                </p>
                                                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200">
                                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Digite: <code>7500</code></p>
                                                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">O sistema formata automaticamente para: <strong>R$ 7.500,00</strong></p>
                                                </div>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">4</span>
                                            <div>
                                                <p className="font-medium">Escolha o status financeiro</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Selecione "Pago" se já recebeu, ou "Pendente" se ainda está aguardando
                                                </p>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">5</span>
                                            <div>
                                                <p className="font-medium">Adicione informações extras (opcional)</p>
                                                <ul className="text-sm text-muted-foreground mt-1 ml-4 space-y-1 list-disc">
                                                    <li>Telefone, CPF, RG</li>
                                                    <li>Vendedor responsável</li>
                                                    <li>Origem do lead (Google, Instagram, etc.)</li>
                                                    <li>Datas de lead e compra</li>
                                                </ul>
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">6</span>
                                            <div>
                                                <p className="font-medium">Clique em "Salvar"</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Pronto! O aluno já aparece na lista e as métricas são atualizadas automaticamente
                                                </p>
                                            </div>
                                        </li>
                                    </ol>
                                </div>
                            </Card>
                        </section>

                        {/* 4. Importação CSV */}
                        <section id="csv-import">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Importação em Massa (CSV)</h2>
                                    <p className="text-sm text-muted-foreground">Para quem tem muitos alunos para cadastrar</p>
                                </div>
                            </div>

                            <Card className="p-6 space-y-6">
                                <p>
                                    Se você já tem uma lista de alunos em Excel ou planilha, pode importar todos de uma vez:
                                </p>

                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                        <div className="flex-1">
                                            <p className="font-medium mb-2">Baixe o template CSV</p>
                                            <a
                                                href="/template_matriculas.csv"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                                                download
                                            >
                                                <FileSpreadsheet className="h-4 w-4" />
                                                Download Template
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                        <div className="flex-1">
                                            <p className="font-medium mb-2">Preencha no Excel/Google Sheets</p>
                                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded border text-sm">
                                                <p className="font-medium mb-2">Colunas principais:</p>
                                                <ul className="space-y-1 ml-4 list-disc">
                                                    <li><code>name</code> - Nome completo</li>
                                                    <li><code>email</code> - Email único</li>
                                                    <li><code>cohort_id</code> - ID da turma (veja em Turmas)</li>
                                                    <li><code>payment_amount</code> - Valor: <strong>R$ 7.500,00</strong></li>
                                                    <li><code>financial_status</code> - paid ou pending</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                        <div className="flex-1">
                                            <p className="font-medium mb-2">Importe no sistema</p>
                                            <ol className="text-sm space-y-1 ml-4 list-decimal">
                                                <li>Clique em "Importar CSV" no Dashboard</li>
                                                <li>Selecione o arquivo CSV</li>
                                                <li>Confira o mapeamento automático de colunas</li>
                                                <li>Clique em "Importar"</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                                    <p className="text-sm text-green-900 dark:text-green-100">
                                        <strong>✅ Formato de valores:</strong> O sistema aceita <code>7500</code>, <code>7.500,00</code> ou <code>R$ 7.500,00</code>
                                    </p>
                                </div>
                            </Card>
                        </section>

                        {/* 5. Gestão Diária */}
                        <section id="daily-management">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Edit className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Gestão do Dia-a-Dia</h2>
                                    <p className="text-sm text-muted-foreground">Tarefas comuns e como executá-las</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Card className="p-6">
                                    <h3 className="font-semibold text-lg mb-4">Editar uma matrícula</h3>
                                    <ol className="space-y-2 text-sm ml-4 list-decimal">
                                        <li>Vá em <strong>Matrículas</strong> no menu</li>
                                        <li>Use a busca para encontrar o aluno</li>
                                        <li>Clique no ícone de lápis (✏️)</li>
                                        <li>Modifique os campos necessários</li>
                                        <li>Clique em "Salvar Alterações"</li>
                                    </ol>
                                </Card>

                                <Card className="p-6">
                                    <h3 className="font-semibold text-lg mb-4">Cancelar uma matrícula</h3>
                                    <ol className="space-y-2 text-sm ml-4 list-decimal">
                                        <li>Na lista de matrículas, localize o aluno</li>
                                        <li>Clique no botão de ações (⋮)</li>
                                        <li>Selecione "Cancelar Matrícula"</li>
                                        <li>Escolha o motivo do cancelamento</li>
                                        <li>Confirme</li>
                                    </ol>
                                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200">
                                        <p className="text-sm text-yellow-900 dark:text-yellow-100">
                                            ℹ️ Matrículas canceladas ficam ocultas. Para vê-las, ative "Mostrar Cancelados"
                                        </p>
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <h3 className="font-semibold text-lg mb-4">Filtrar e buscar alunos</h3>
                                    <ul className="space-y-2 text-sm ml-4 list-disc">
                                        <li>Use a <strong>barra de busca</strong> para procurar por nome ou email</li>
                                        <li>Filtre por <strong>turma</strong> usando o dropdown</li>
                                        <li>Filtre por <strong>status financeiro</strong> (Pago, Pendente)</li>
                                        <li>Use <strong>filtro de data</strong> para ver matrículas de um período específico</li>
                                    </ul>
                                </Card>
                            </div>
                        </section>

                        {/* 6. Dashboard e Métricas */}
                        <section id="dashboard">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <BarChart3 className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Métricas e Análises</h2>
                                    <p className="text-sm text-muted-foreground">Entenda seus números</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Card className="p-6">
                                    <h3 className="font-semibold text-lg mb-4">Usando os Filtros do Dashboard</h3>
                                    <div className="space-y-3">
                                        <div className="p-3 border rounded">
                                            <p className="font-medium mb-1">Filtro de Período</p>
                                            <p className="text-sm text-muted-foreground">
                                                Clique no calendário e escolha "Último mês", "Últimos 3 meses" ou um intervalo personalizado
                                            </p>
                                        </div>
                                        <div className="p-3 border rounded">
                                            <p className="font-medium mb-1">Filtro de Turma</p>
                                            <p className="text-sm text-muted-foreground">
                                                Selecione uma turma específica para ver apenas seus dados
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <h3 className="font-semibold text-lg mb-4">Analisando o Ranking de Vendedores</h3>
                                    <p className="text-muted-foreground mb-3">
                                        O ranking mostra seus vendedores ordenados por desempenho:
                                    </p>
                                    <ul className="space-y-2 text-sm ml-4 list-disc">
                                        <li><strong>Número grande:</strong> Quantidade de vendas</li>
                                        <li><strong>Valor em R$:</strong> Receita total gerada (apenas pagos)</li>
                                    </ul>
                                </Card>

                                <Card className="p-6">
                                    <h3 className="font-semibold text-lg mb-4">Rastreamento UTM (Marketing)</h3>
                                    <p className="text-muted-foreground mb-3">
                                        Se você usa anúncios online, os gráficos UTM mostram de onde vieram seus alunos:
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-start gap-2">
                                            <span className="text-primary">•</span>
                                            <div>
                                                <strong>utm_source:</strong> Google, Facebook, Instagram
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-primary">•</span>
                                            <div>
                                                <strong>utm_medium:</strong> CPC, Social, Email
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="text-primary">•</span>
                                            <div>
                                                <strong>utm_campaign:</strong> Nome da campanha
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </section>

                        {/* 7. Recursos Avançados */}
                        <section id="advanced">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Settings className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Recursos Avançados</h2>
                                    <p className="text-sm text-muted-foreground">Personalize o sistema</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Card className="p-6">
                                    <h3 className="font-semibold text-lg mb-3">Configurações UTM</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Em <strong>Configurações → UTM Settings</strong>, você pode:
                                    </p>
                                    <ul className="space-y-1 text-sm ml-4 list-disc">
                                        <li>Ativar/desativar cada parâmetro UTM</li>
                                        <li>Parâmetros desativados não aparecem nos formulários</li>
                                        <li>Útil se você não usa marketing digital</li>
                                    </ul>
                                </Card>

                                <Card className="p-6">
                                    <h3 className="font-semibold text-lg mb-3">Motivos de Cancelamento</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Personalize os motivos disponíveis ao cancelar matrículas:
                                    </p>
                                    <ol className="space-y-1 text-sm ml-4 list-decimal">
                                        <li>Vá em Configurações</li>
                                        <li>Adicione ou remova motivos</li>
                                        <li>Útil para análise de churn (por que alunos desistem)</li>
                                    </ol>
                                </Card>

                                <Card className="p-6">
                                    <h3 className="font-semibold text-lg mb-3">Exportação de Dados</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Você pode exportar dados em formato CSV:
                                    </p>
                                    <ul className="space-y-1 text-sm ml-4 list-disc">
                                        <li><strong>Dashboard:</strong> Botão "Exportar Dashboard"</li>
                                        <li><strong>Matrículas:</strong> Botão "Exportar Lista"</li>
                                        <li><strong>Rankings:</strong> Botão no card de ranking</li>
                                    </ul>
                                    <p className="text-sm text-muted-foreground mt-3">
                                        Os arquivos são compatíveis com Excel e Google Sheets
                                    </p>
                                </Card>
                            </div>
                        </section>

                        {/* 8. Dicas e Boas Práticas */}
                        <section id="tips">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Lightbulb className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Dicas e Boas Práticas</h2>
                                    <p className="text-sm text-muted-foreground">Maximize seu resultado</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="p-4">
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                                        <div>
                                            <h3 className="font-semibold mb-1">Crie turmas com antecedência</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Abra as inscrições 2-3 meses antes do início para atingir a capacidade máxima
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4">
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                                        <div>
                                            <h3 className="font-semibold mb-1">Atualize status financeiro</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Mude de "Pendente" para "Pago" assim que receber para métricas precisas
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4">
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                                        <div>
                                            <h3 className="font-semibold mb-1">Use vendedores consistentes</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Padronize os nomes (ex: sempre "João Silva", não "João" ou "J. Silva")
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4">
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                                        <div>
                                            <h3 className="font-semibold mb-1">Configure UTM desde o início</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Mesmo que não use agora, ative UTM para coletar dados desde o primeiro aluno
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4">
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                                        <div>
                                            <h3 className="font-semibold mb-1">Exporte backups mensais</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Baixe CSV dos dados todo mês como backup de segurança
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4">
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                                        <div>
                                            <h3 className="font-semibold mb-1">Use filtros de data</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Compare desempenho mensal para identificar padrões e tendências
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </section>

                        {/* 9. FAQ */}
                        <section id="faq">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <HelpCircle className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Dúvidas Frequentes</h2>
                                    <p className="text-sm text-muted-foreground">Respostas rápidas</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Card>
                                    <details className="group">
                                        <summary className="cursor-pointer p-4 font-medium hover:bg-secondary/30 rounded-lg transition-colors flex items-center gap-2">
                                            <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                                            Por que alguns alunos não aparecem na lista?
                                        </summary>
                                        <div className="p-4 pt-0 text-sm text-muted-foreground">
                                            <p>Matrículas canceladas ficam ocultas por padrão.</p>
                                            <p className="mt-2"><strong>Solução:</strong> Ative o filtro "Mostrar Cancelados" na página de Matrículas.</p>
                                        </div>
                                    </details>
                                </Card>

                                <Card>
                                    <details className="group">
                                        <summary className="cursor-pointer p-4 font-medium hover:bg-secondary/30 rounded-lg transition-colors flex items-center gap-2">
                                            <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                                            A receita total está diferente do esperado
                                        </summary>
                                        <div className="p-4 pt-0 text-sm text-muted-foreground">
                                            <p>A receita total conta <strong>apenas matrículas com status "Pago"</strong>.</p>
                                            <p className="mt-2">Matrículas "Pendentes" não entram no cálculo. Verifique se você atualizou o status após receber o pagamento.</p>
                                        </div>
                                    </details>
                                </Card>

                                <Card>
                                    <details className="group">
                                        <summary className="cursor-pointer p-4 font-medium hover:bg-secondary/30 rounded-lg transition-colors flex items-center gap-2">
                                            <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                                            Como usar valores com centavos? (ex: R$ 7.550,50)
                                        </summary>
                                        <div className="p-4 pt-0 text-sm text-muted-foreground">
                                            <p>Digite normalmente no campo de valor: <code>7550.50</code></p>
                                            <p className="mt-2">O sistema formata automaticamente para <strong>R$ 7.550,50</strong></p>
                                        </div>
                                    </details>
                                </Card>

                                <Card>
                                    <details className="group">
                                        <summary className="cursor-pointer p-4 font-medium hover:bg-secondary/30 rounded-lg transition-colors flex items-center gap-2">
                                            <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                                            posso editar uma turma depois de criada?
                                        </summary>
                                        <div className="p-4 pt-0 text-sm text-muted-foreground">
                                            <p>Sim! Vá em <strong>Turmas → Administrar Turmas</strong>, clique no ícone de lápis e edite.</p>
                                            <p className="mt-2">As matrículas já criadas não são afetadas ao editar a turma.</p>
                                        </div>
                                    </details>
                                </Card>

                                <Card>
                                    <details className="group">
                                        <summary className="cursor-pointer p-4 font-medium hover:bg-secondary/30 rounded-lg transition-colors flex items-center gap-2">
                                            <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                                            O que fazer se a importação CSV falhar?
                                        </summary>
                                        <div className="p-4 pt-0 text-sm text-muted-foreground">
                                            <p>Verifique:</p>
                                            <ul className="list-disc ml-4 mt-2 space-y-1">
                                                <li>Se usou o template correto</li>
                                                <li>Se os valores estão no formato <code>R$ 7.500,00</code></li>
                                                <li>Se o <code>cohort_id</code> existe (copie da página Turmas)</li>
                                                <li>Se não há linhas vazias no meio da planilha</li>
                                            </ul>
                                        </div>
                                    </details>
                                </Card>

                                <Card>
                                    <details className="group">
                                        <summary className="cursor-pointer p-4 font-medium hover:bg-secondary/30 rounded-lg transition-colors flex items-center gap-2">
                                            <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                                            Posso ter mais de uma turma ao mesmo tempo?
                                        </summary>
                                        <div className="p-4 pt-0 text-sm text-muted-foreground">
                                            <p>Sim! Você pode criar quantas turmas quiser.</p>
                                            <p className="mt-2">Use o filtro de turma no Dashboard para analisar cada uma separadamente.</p>
                                        </div>
                                    </details>
                                </Card>
                            </div>
                        </section>
                    </div>

                    {/* Botão de ajuda adicional */}
                    <Card className="p-6 mt-12 bg-primary/5 border-primary/20">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold mb-2">Ainda tem dúvidas?</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Use o botão "?" no canto superior direito de qualquer página para ajuda contextual
                            </p>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                            >
                                Começar a usar o sistema
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </Card>
                </main>
            </div>
        </>
    );
};

export default Tutorials;
