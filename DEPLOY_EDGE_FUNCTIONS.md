# 🚀 Guia de Deploy das Edge Functions do Supabase

As Edge Functions do Supabase precisam ser deployadas separadamente do frontend. Este guia explica como fazer isso.

## 📋 Pré-requisitos

1. **Supabase CLI instalado**:
   ```bash
   npm install -g supabase
   ```

2. **Login no Supabase CLI**:
   ```bash
   supabase login
   ```

3. **Linkar o projeto local ao projeto no Supabase**:
   ```bash
   supabase link --project-ref nheacgdfprqhuovubeed
   ```

## 🔧 Deploy das Edge Functions

### Método 1: Deploy Individual

Para fazer deploy de uma função específica:

```bash
supabase functions deploy notify-n8n
supabase functions deploy n8n-webhook
supabase functions deploy notify-integrations
supabase functions deploy kommo-webhook
supabase functions deploy clicksign-webhook
supabase functions deploy typeform-webhook
supabase functions deploy sync-to-kommo
supabase functions deploy send-to-clicksign
supabase functions deploy generate-report
supabase functions deploy log-enrollment-access
supabase functions deploy backup-database
```

### Método 2: Deploy de Todas as Funções

```bash
# Deploy de todas as funções de uma vez
supabase functions deploy
```

## 📝 Funções Disponíveis

| Função | Descrição | Quando usar |
|--------|-----------|-------------|
| `notify-n8n` | Envia notificações para N8N | Quando matrícula é criada/atualizada |
| `n8n-webhook` | Recebe webhooks do N8N | Para criar/atualizar matrículas via N8N |
| `notify-integrations` | Orquestra todas as integrações | Chamado automaticamente ao criar/atualizar matrícula |
| `kommo-webhook` | Recebe webhooks do Kommo CRM | Para sincronizar leads do Kommo |
| `sync-to-kommo` | Envia dados para Kommo | Quando matrícula é criada/atualizada |
| `clicksign-webhook` | Recebe webhooks do ClickSign | Para processar assinaturas |
| `send-to-clicksign` | Envia documentos para assinatura | Quando solicitar assinatura |
| `typeform-webhook` | Recebe webhooks do Typeform | Para criar matrículas via formulário |
| `generate-report` | Gera relatórios em CSV/JSON | Quando exportar dados |
| `log-enrollment-access` | Registra acesso a dados sensíveis | Para auditoria |
| `backup-database` | Faz backup do banco de dados | Para backup automático |

## 🔐 Variáveis de Ambiente Necessárias

As Edge Functions precisam das seguintes variáveis de ambiente configuradas no Supabase:

1. Acesse: https://supabase.com/dashboard/project/nheacgdfprqhuovubeed/settings/functions

2. Configure estas variáveis (já devem estar configuradas automaticamente):
   - `SUPABASE_URL` - URL do projeto
   - `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (não compartilhar!)

**As variáveis são configuradas automaticamente pelo Supabase**, mas você pode verificar em:
- Dashboard → Project Settings → Edge Functions → Secrets

## ✅ Verificação Pós-Deploy

### 1. Verificar se as funções estão deployadas

```bash
supabase functions list
```

Ou acesse: https://supabase.com/dashboard/project/nheacgdfprqhuovubeed/functions

### 2. Testar uma função

```bash
# Testar notify-n8n
curl -X POST \
  'https://nheacgdfprqhuovubeed.supabase.co/functions/v1/notify-n8n' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "test_connection",
    "testPayload": {
      "message": "teste"
    }
  }'
```

### 3. Verificar logs

```bash
# Ver logs de uma função específica
supabase functions logs notify-n8n

# Ou acesse no dashboard:
# https://supabase.com/dashboard/project/nheacgdfprqhuovubeed/functions/notify-n8n/logs
```

## 🔄 Atualizar uma Função Existente

Quando você modificar uma função, faça o deploy novamente:

```bash
supabase functions deploy notify-n8n
```

## 🚨 Troubleshooting

### Erro: "Function not found"

- Verifique se a função foi deployada: `supabase functions list`
- Verifique se o nome da função está correto
- Aguarde alguns minutos após o deploy

### Erro: "Unauthorized"

- Verifique se está usando o token correto (Anon Key para frontend, Service Role Key para funções internas)
- Verifique as políticas RLS no banco de dados

### Erro: CORS

- As funções já têm headers CORS configurados
- Se ainda houver problema, verifique se a origem está permitida no Supabase

### Erro: "Function timeout"

- Edge Functions têm timeout de 60 segundos (default)
- Se necessário, ajuste no `config.toml`:
  ```toml
  [functions.notify-n8n]
  timeout_ms = 120000
  ```

## 📚 Recursos Adicionais

- [Documentação Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)

---

**Nota**: As Edge Functions são deployadas no Supabase, não na Vercel. A Vercel apenas hospeda o frontend React.

