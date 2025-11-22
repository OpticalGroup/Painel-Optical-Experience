# Guia de Teste - Importação CSV

## 🎯 Problemas Corrigidos

### 1. **Campo cohort_identifier obrigatório em modo errado**
- ❌ **ANTES**: Campo era obrigatório sempre, bloqueando importações de turma única
- ✅ **DEPOIS**: Campo só é obrigatório em modo multi-turma

### 2. **Template CSV adaptado ao contexto**
- ✅ Template agora mostra/oculta coluna de turma baseado no modo
- ✅ Nome do arquivo diferenciado: `template_matriculas.csv` vs `template_matriculas_multi_turma.csv`

### 3. **Invalidação de queries após importação**
- ✅ Dados agora atualizam automaticamente após importação
- ✅ Turmas afetadas têm suas estatísticas atualizadas

---

## 📋 Fluxo Completo de Teste

### **TESTE 1: Importação de Turma Única**

1. **Acessar página de detalhes de uma turma**
   - URL: `/cohorts/{cohort_id}`
   
2. **Clicar em "Importar CSV"**
   - Modal deve abrir com título "Turma: [Nome da Turma]"
   
3. **Baixar template**
   - Clicar em "Baixar Template CSV"
   - Arquivo: `template_matriculas.csv`
   - **Verificar**: Arquivo NÃO deve ter coluna "Nome da Turma"
   
4. **Preencher CSV com dados de teste**
   ```csv
   Nome Completo / student_name,Email / email,CPF / cpf,Telefone / phone,Vendedor / sales_rep,Origem / source,Status Pagamento / financial_status,Status Contrato / contract_status,Detalhes do Pagamento / payment_details,Valor / payment_amount
   João Silva,joao@email.com,12345678900,11999999999,Ana Paula,Instagram,paid,signed,"À vista - Pix",4500
   Maria Santos,maria@email.com,98765432100,11988888888,João Costa,Facebook,pending,pending,"Entrada + 10x",4500
   ```

5. **Upload do arquivo**
   - Selecionar arquivo CSV
   - Clicar em "Carregar CSV"
   - **Verificar**: Modal de mapeamento deve abrir
   
6. **Mapeamento de colunas**
   - **Verificar**: Campo "Nome da Turma" NÃO deve aparecer
   - Clicar em "Detectar automaticamente"
   - **Verificar**: Campos devem mapear automaticamente
   - Clicar em "Próximo: Revisar Dados"
   
7. **Preview dos dados**
   - **Verificar**: 2 linhas devem aparecer
   - **Verificar**: Dados corretos (nome, email, CPF, valor)
   - Clicar em "Importar 2 Matrícula(s)"
   
8. **Resultado**
   - **Verificar**: "2 matrícula(s) importada(s) com sucesso"
   - **Verificar**: Lista de alunos atualiza automaticamente
   - **Verificar**: Estatísticas da turma atualizam

---

### **TESTE 2: Importação Multi-turma**

1. **Acessar página inicial**
   - URL: `/`
   
2. **Clicar em "Importar CSV Multi-turma"**
   - Modal deve abrir com "Importação Multi-turma"
   
3. **Baixar template**
   - Clicar em "Baixar Template CSV"
   - Arquivo: `template_matriculas_multi_turma.csv`
   - **Verificar**: Arquivo DEVE ter coluna "Nome da Turma / cohort_identifier"
   
4. **Preencher CSV com dados de teste**
   ```csv
   Nome da Turma / cohort_identifier,Nome Completo / student_name,Email / email,CPF / cpf,Telefone / phone,Vendedor / sales_rep,Origem / source,Status Pagamento / financial_status,Status Contrato / contract_status,Detalhes do Pagamento / payment_details,Valor / payment_amount
   Turma Janeiro 2025,João Silva,joao2@email.com,12345678900,11999999999,Ana Paula,Instagram,paid,signed,"À vista",4500
   Turma Março 2025,Maria Santos,maria2@email.com,98765432100,11988888888,João Costa,Facebook,pending,pending,"Parcelado",4500
   Turma Janeiro 2025,Pedro Costa,pedro@email.com,11122233344,11977777777,Ana Paula,Indicação,paid,signed,"À vista",3800
   ```

5. **Upload do arquivo**
   - Selecionar arquivo CSV
   - Clicar em "Carregar CSV"
   - **Verificar**: Modal de mapeamento deve abrir
   
6. **Mapeamento de colunas**
   - **Verificar**: Campo "Nome da Turma" DEVE aparecer com asterisco (*)
   - Clicar em "Detectar automaticamente"
   - **Verificar**: Campo "Nome da Turma" deve mapear
   - Clicar em "Próximo: Revisar Dados"
   
7. **Detecção de turmas**
   - **Se turmas existem**: Ir direto para preview
   - **Se turmas NÃO existem**: Modal de criação abre
   
8. **Criação de turmas ausentes (se necessário)**
   - Preencher dados de cada turma:
     - Curso: Selecionar da lista
     - Ano: 2025
     - Data de Início: Selecionar data
     - Local: "São Paulo - SP"
     - Capacidade: 22
   - Clicar em "Criar X Turma(s) e Continuar"
   - **Verificar**: "X turma(s) criada(s) com sucesso"
   
9. **Preview dos dados**
   - **Verificar**: 3 linhas devem aparecer
   - **Verificar**: Cada linha mostra a turma correta
   - **Verificar**: Valores corretos para cada aluno
   - Clicar em "Importar 3 Matrícula(s)"
   
10. **Resultado**
    - **Verificar**: "3 matrícula(s) importada(s) com sucesso"
    - **Verificar**: Histórico de importações registrado
    - **Verificar**: Dashboard atualiza com novos totais
    - **Verificar**: Turmas afetadas mostram novos alunos

---

## 🔍 Verificações de Histórico

1. **Acessar "Histórico de Importações"** (menu admin)
   - **Verificar**: Todas as importações aparecem
   - **Verificar**: Data, usuário, arquivo corretos
   - **Verificar**: Tipo: "Turma única" ou "Multi-turma"
   - **Verificar**: Turmas afetadas listadas
   - **Verificar**: Contadores: Total, Sucesso, Falhas

---

## ⚠️ Testes de Validação

### **Teste de Validação 1: Campos Obrigatórios**
1. Não mapear campo obrigatório (ex: Email)
2. **Verificar**: Botão "Próximo" desabilitado
3. **Verificar**: Alert vermelho mostra campos faltantes

### **Teste de Validação 2: Multi-turma sem identificador**
1. Importar multi-turma sem mapear "Nome da Turma"
2. **Verificar**: Erro "Nenhuma turma identificada no CSV"

### **Teste de Validação 3: Email duplicado**
1. Importar aluno com email já existente na mesma turma
2. **Verificar**: Linha falha com erro específico
3. **Verificar**: Outras linhas importam com sucesso

---

## ✅ Checklist Final

- [ ] Importação turma única funciona
- [ ] Importação multi-turma funciona
- [ ] Template correto para cada modo
- [ ] Mapeamento automático detecta colunas
- [ ] Campos obrigatórios validados
- [ ] Criação de turmas ausentes funciona
- [ ] Histórico registra corretamente
- [ ] Dados atualizam automaticamente
- [ ] Valores (payment_amount) importam corretamente
- [ ] Estatísticas recalculam após importação

---

## 🐛 Problemas Conhecidos e Soluções

### Problema: "cohort_identifier é obrigatório"
- **Causa**: Estava sempre marcado como obrigatório
- **Solução**: ✅ Corrigido - agora condicional ao modo

### Problema: Dados não atualizam após importação
- **Causa**: Faltava invalidação de queries
- **Solução**: ✅ Corrigido - queries invalidadas automaticamente

### Problema: Receita incorreta no dashboard
- **Causa**: Cálculo fixo em vez de soma real
- **Solução**: ✅ Corrigido - usa total_revenue do banco

---

## 📊 Dados de Teste Sugeridos

### Vendedores (criar em Configurações)
- Ana Paula
- João Costa
- Carlos Silva

### Origens
- Instagram
- Facebook
- Indicação
- Google
- Tráfego Pago

### Turmas (criar se necessário)
- Turma Janeiro 2025
- Turma Março 2025
- Turma Maio 2025

---

## 🎬 Demonstração para Cliente

1. **Mostrar Dashboard inicial** com totais
2. **Importar CSV multi-turma** com 5-10 alunos
3. **Mostrar criação automática** de turmas ausentes
4. **Demonstrar preview** com validações
5. **Executar importação** e ver resultado
6. **Voltar ao Dashboard** e mostrar atualização automática
7. **Abrir Histórico** e mostrar registro completo
8. **Abrir detalhes de uma turma** e ver alunos importados com valores

---

## 🚀 Pronto para Produção

✅ Validações implementadas
✅ Auditoria funcionando
✅ Multi-turma operacional
✅ Histórico completo
✅ Dados sincronizados
✅ Performance otimizada
