import React from "react";
import { Card } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const Documentation = () => {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                Manual de Instruções
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">
                Guia completo de uso da aplicação
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Visão Geral */}
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Visão Geral</h1>
          <p>
            Este manual descreve como usar a aplicação <strong>Optical Cohort Sparkle</strong>. Ele cobre todo o fluxo, desde a configuração inicial até a
            utilização das funcionalidades de matrícula, importação CSV, dashboard e a nova padronização financeira.
          </p>
        </Card>

        {/* Configuração Inicial */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-3">1. Configuração Inicial</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Clonar o repositório</strong>
              <pre className="bg-gray-100 p-2 rounded"><code>git clone https://github.com/your-org/optical-cohort-sparkle.git</code></pre>
            </li>
            <li>
              <strong>Instalar dependências</strong>
              <pre className="bg-gray-100 p-2 rounded"><code>npm install</code></pre>
            </li>
            <li>
              <strong>Configurar Supabase</strong>
              <p>Crie um arquivo <code>.env.local</code> na raiz do projeto com as variáveis necessárias (URL e chave pública do Supabase).</p>
            </li>
            <li>
              <strong>Executar a aplicação</strong>
              <pre className="bg-gray-100 p-2 rounded"><code>npm run dev</code></pre>
              <p>Acesse <code>http://localhost:3000</code> no navegador.</p>
            </li>
          </ol>
        </Card>

        {/* Matrícula Manual */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-3">2. Matrícula Manual</h2>
          <p>Para cadastrar um novo aluno:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Clique no botão <strong>Nova Matrícula</strong> no dashboard.</li>
            <li>Preencha os campos do formulário. O campo <em>Valor (R$)</em> utiliza o componente <code>MoneyInput</code>, que formata o valor automaticamente (ex.: <code>7.500,00</code>).</li>
            <li>Salve a matrícula. O registro será armazenado no Supabase e aparecerá na lista de matrículas.</li>
          </ul>
        </Card>

        {/* Importação de CSV */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-3">3. Importação de CSV</h2>
          <p>Use o modelo de CSV disponibilizado em <code>public/template_matriculas.csv</code>. Os requisitos são:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Colunas obrigatórias: <code>name</code>, <code>email</code>, <code>payment_amount</code>, etc.</li>
            <li>Valores monetários devem estar no formato <code>R$ 7.500,00</code>.</li>
            <li>Inclua as 6 colunas UTM (ex.: <code>utm_source</code>, <code>utm_medium</code>).</li>
          </ul>
          <p>No painel, clique em <strong>Importar CSV</strong>, faça o upload do arquivo e confirme o mapeamento automático das colunas.</p>
        </Card>

        {/* Dashboard */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-3">4. Dashboard</h2>
          <p>Na página inicial (<code>/</code>) você encontrará:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Cards de resumo</strong>: total de alunos, turmas ativas, matrículas pagas e receita total (todos os valores em <code>R$ 1.000,00</code>).</li>
            <li><strong>Gráficos UTM</strong>: visualização dos canais de aquisição.</li>
            <li><strong>Ranking de Vendedores</strong>: ordenado por valor total arrecadado, formatado em BRL.</li>
            <li><strong>Filtros</strong>: por turma e intervalo de datas.</li>
          </ul>
        </Card>

        {/* Padronização Financeira */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-3">5. Padronização Financeira</h2>
          <p>Todos os valores monetários são exibidos e processados no padrão brasileiro:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Utilização da função <code>formatBRL</code> para exibição.</li>
            <li>Componente <code>MoneyInput</code> para entrada de valores, com formatação automática.</li>
            <li>Correção de cálculos que dividiam valores por 100 indevidamente.</li>
          </ul>
        </Card>

        {/* Configurações e UTM */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-3">6. Configurações e UTM</h2>
          <p>Na página de <strong>Configurações</strong> você pode ativar/desativar os parâmetros UTM. Cada toggle salva automaticamente no Supabase.</p>
        </Card>

        {/* Perguntas Frequentes */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-3">7. Perguntas Frequentes</h2>
          <details className="mb-2">
            <summary className="cursor-pointer font-medium">Como corrigir valores negativos?</summary>
            <p className="mt-1">A aplicação já trata valores negativos usando <code>Math.max(0, valor)</code>. Caso ainda encontre, verifique se o CSV contém o sinal “-”.</p>
          </details>
          <details className="mb-2">
            <summary className="cursor-pointer font-medium">Onde encontrar o template CSV?</summary>
            <p className="mt-1">O arquivo <code>public/template_matriculas.csv</code> está incluído no repositório.</p>
          </details>
          <details className="mb-2">
            <summary className="cursor-pointer font-medium">Como usar o filtro de data?</summary>
            <p className="mt-1">Clique no campo de data no dashboard e selecione o intervalo desejado. O filtro será aplicado automaticamente.</p>
          </details>
        </Card>

        {/* Contato */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-3">8. Suporte</h2>
          <p>Em caso de dúvidas ou problemas, abra uma issue no repositório ou entre em contato com a equipe de desenvolvimento.</p>
        </Card>
      </div>
    </>
  );
};

export default Documentation;
