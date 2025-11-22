# 🔒 Guia de Segurança - Optical Cohort Management System

## FASE 4: Segurança & Escala - Implementado

Este documento descreve todas as medidas de segurança implementadas no sistema e como manter a aplicação segura.

## 📋 Índice

1. [Controle de Acesso (RLS)](#controle-de-acesso-rls)
2. [Proteção de Dados Sensíveis](#proteção-de-dados-sensíveis)
3. [Validação de Input](#validação-de-input)
4. [Rate Limiting](#rate-limiting)
5. [Audit Logs](#audit-logs)
6. [Backup e Recovery](#backup-e-recovery)
7. [Ações Requeridas](#ações-requeridas)

---

## 🛡️ Controle de Acesso (RLS)

### Políticas Implementadas

#### Enrollments (Dados dos Alunos)
- **Admins e Operators**: Acesso total a todos os dados
- **Sales**: Acesso **APENAS** às suas próprias vendas
- **Viewers**: Sem acesso (read-only em outras áreas)

#### Sales Representatives
- **Admins e Operators**: Podem ver todos os representantes
- **Sales**: Veem apenas seu próprio perfil

#### Organization Settings (Whitelabel)
- **Leitura**: Todos os usuários autenticados
- **Escrita**: Apenas admins

### Como Funciona
```sql
-- Exemplo: Sales só veem suas vendas
CREATE POLICY "Sales reps can view only their own enrollments"
  ON public.enrollments
  FOR SELECT
  USING (
    has_role(auth.uid(), 'sales'::app_role) AND 
    sales_rep IN (SELECT name FROM sales_representatives WHERE ...)
  );
```

---

## 🔐 Proteção de Dados Sensíveis

### Dados Automaticamente Mascarados nos Audit Logs

Os seguintes campos são **REMOVIDOS** dos logs de auditoria:
- CPF
- Endereço residencial
- CEP
- Telefone
- Valor de pagamento
- Detalhes de pagamento
- URL de comprovante

### Função de Sanitização
```typescript
// Implementada automaticamente via trigger
public.sanitize_audit_data(data jsonb) -> jsonb
```

**Por que isso é importante?**
- Previne vazamento de dados sensíveis em logs
- Compliance com LGPD
- Reduz superfície de ataque

---

## ✅ Validação de Input

### Cliente (Frontend)
Todos os inputs são validados usando **Zod** antes de enviar ao servidor:

```typescript
// Exemplo: Validação de CPF
cpf: z.string()
  .trim()
  .regex(/^\d{11}$/, "CPF deve conter exatamente 11 dígitos")
```

### Servidor (Database)
Constraints adicionais no PostgreSQL:

- `payment_amount >= 0` (não pode ser negativo)
- `capacity > 0 AND capacity <= 1000` (limites realistas)
- Índices para performance em queries frequentes

---

## ⏱️ Rate Limiting

### Limites Implementados

| Operação | Limite | Janela |
|----------|--------|--------|
| Autenticação | 5 tentativas | 15 minutos |
| Mutações gerais | 30 requisições | 1 minuto |
| CSV Import | 3 imports | 1 hora |
| Queries | 100 requisições | 1 minuto |
| Export | 10 exports | 1 hora |

### Como Usar
```typescript
import { rateLimiter, RateLimits } from "@/lib/rate-limiter";

if (!rateLimiter.isAllowed(userId, RateLimits.AUTH)) {
  throw new Error("Limite excedido. Tente novamente em X segundos.");
}
```

---

## 📝 Audit Logs

### O Que é Registrado

- **Quem**: ID e email do usuário
- **O quê**: Ação realizada (create, update, delete)
- **Quando**: Timestamp preciso
- **Detalhes**: Estado antes/depois (COM sanitização)

### Retenção de Dados

**Import History**: Auto-delete após **90 dias**
```sql
-- Função executada periodicamente
public.cleanup_old_import_history()
```

### Como Visualizar

1. Acesse: `/audit-logs` (apenas admins)
2. Filtre por:
   - Usuário
   - Tipo de entidade
   - Data
   - Ação

---

## 💾 Backup e Recovery

### Sistema Automático

**Edge Function**: `backup-database`

**O que é salvo:**
- cohorts
- enrollments
- courses
- sales_representatives
- custom_enrollment_sources
- organization_settings
- user_roles

### Como Configurar

1. **Cron Job no Supabase** (recomendado):
   ```sql
   -- Executar backup diário às 3h da manhã
   SELECT cron.schedule(
     'daily-backup',
     '0 3 * * *',
     $$
     SELECT net.http_post(
       url:='https://YOUR_PROJECT.supabase.co/functions/v1/backup-database',
       headers:='{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb
     );
     $$
   );
   ```

2. **GitHub Actions** (alternativa):
   - Crie workflow para chamar edge function
   - Armazene backups no GitHub ou S3

### Recovery (Restauração)

Em caso de perda de dados:

1. Localize o backup mais recente
2. Use o Supabase SQL Editor
3. Execute INSERT a partir do JSON de backup

---

## ⚠️ Ações Requeridas

### 1. ⚡ CRÍTICO: Proteção contra Senhas Vazadas

**Status**: ⚠️ PENDENTE

**O que fazer:**
1. Acesse: [Supabase Dashboard → Authentication → Providers](https://supabase.com/dashboard/project/nheacgdfprqhuovubeed/auth/providers)
2. Habilite "Password Protection" em Email Auth
3. Marque "Enable leaked password protection"

**Por que é importante?**
Previne que usuários usem senhas comprometidas em vazamentos públicos.

**Documentação**: https://docs.lovable.dev/features/security#leaked-password-protection-disabled

---

### 2. 📊 Configurar Monitoramento

**Recomendações:**

- Configure alertas no Supabase para:
  - Tentativas de login falhadas (>10 por hora)
  - Queries lentas (>2s)
  - Erros de RLS

- Use o painel de Analytics para acompanhar:
  - Uso de API
  - Performance de queries
  - Atividade por usuário

---

### 3. 🔄 Testar Backups

**Checklist:**

- [ ] Executar backup manual via edge function
- [ ] Verificar tamanho e integridade do arquivo
- [ ] Testar restauração em ambiente de dev
- [ ] Configurar cron job para backups automáticos
- [ ] Armazenar backups em local externo (S3, GitHub)

---

## 📚 Recursos Adicionais

- [Documentação Lovable - Segurança](https://docs.lovable.dev/features/security)
- [Supabase - RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## 🚨 Reportar Vulnerabilidades

Se você descobrir uma vulnerabilidade de segurança:

1. **NÃO** crie uma issue pública
2. Entre em contato diretamente com a equipe
3. Forneça detalhes sobre:
   - Como reproduzir
   - Impacto potencial
   - Sugestão de correção (se tiver)

---

**Última atualização**: 2025-11-21 | **Versão**: 1.0
