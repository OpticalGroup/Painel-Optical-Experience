# 🔗 Webhook N8N - Documentação

Este documento explica como usar o webhook para cadastrar alunos via N8N.

## 📍 URL do Webhook

O webhook está hospedado na **Vercel** (Serverless Function):

```
https://optical-cohort-sparkle-main.vercel.app/api/webhook/enrollment
```

**Importante**: Esta é a URL de produção. Use esta URL para configurar seus workflows no N8N.

A URL também é exibida na página de Integrações do sistema (pode ser copiada clicando no botão de copiar).

## 🔐 Autenticação

O webhook requer um `webhook_secret` no payload para autenticação. Você pode:

1. **Gerar um Secret**: Acesse a página de Integrações → N8N → "Gerar Novo Secret"
2. **Usar o Secret gerado**: Inclua no payload como `webhook_secret`

## 📝 Formato do Payload

### Estrutura Geral

```json
{
  "event": "test_webhook",
  "sent_at": "2025-11-24T00:00:00-03:00",
  "webhook_secret": "0b56300b-5fd8-4bd7-a54b-bde24dbad38f",
  "records": [
    {
      "cohort_identifier": "Turma Janeiro 2025",
      "student_name": "João Silva",
      "email": "joao@email.com",
      "cpf": "123.456.789-00",
      "phone": "11999999999",
      "sales_rep": "Ana Paula",
      "source": "Instagram Bio",
      "lead_date": "01/11/2024",
      "purchase_date": "06/11/2024",
      "financial_status": "paid",
      "contract_status": "signed",
      "payment_details": "À vista - Pix realizado 10/11/2024",
      "payment_amount": "R$ 7.500,00",
      "payment_proof_url": "https://exemplo.com/comprovante.pdf",
      "address": "Rua Exemplo, 123, Bairro",
      "city": "Salvador",
      "state": "BA",
      "zipcode": "41820700",
      "product_name": "Optical Experience",
      "observations": "Cliente indicado pelo Daniel",
      "utm_source": "instagram",
      "utm_medium": "social",
      "utm_campaign": "black_friday",
      "utm_term": "",
      "utm_content": ""
    }
  ]
}
```

### Campos Obrigatórios

- `webhook_secret` - Secret de autenticação (obrigatório)
- `records` - Array com pelo menos um registro (obrigatório)
- `cohort_identifier` - Nome da turma (ex: "Turma Janeiro 2025")
- `student_name` - Nome do aluno
- `email` - Email do aluno

### Campos Opcionais

Todos os outros campos são opcionais. Se não informados, valores padrão serão aplicados.

## 📋 Mapeamento de Campos

| Campo do Webhook | Campo no Banco | Tipo | Normalização |
|-----------------|----------------|------|--------------|
| `cohort_identifier` | `cohort_id` | string | Busca por nome da turma |
| `student_name` | `student_name` | string | - |
| `email` | `email` | string | Lowercase |
| `cpf` | `cpf` | string | Remove caracteres especiais |
| `phone` | `phone` | string | Remove caracteres especiais |
| `sales_rep` | `sales_rep` | string | - |
| `source` | `source` | string | - |
| `lead_date` | `lead_date` | date | DD/MM/YYYY → YYYY-MM-DD |
| `purchase_date` | `purchase_date` | date | DD/MM/YYYY → YYYY-MM-DD |
| `financial_status` | `financial_status` | enum | "paid" → "paid", outros → "pending" |
| `contract_status` | `contract_status` | enum | "signed" → "signed", outros → "pending" |
| `payment_amount` | `payment_amount` | number | Remove R$ e converte para número |
| `payment_details` | `payment_details` | string | - |
| `payment_proof_url` | `payment_proof_url` | string | - |
| `address` | `address` | string | - |
| `city` | `city` | string | - |
| `state` | `state` | string | - |
| `zipcode` | `zipcode` | string | Remove caracteres especiais |
| `product_name` | `external_metadata.product_name` | string | - |
| `observations` | `observations` | string | - |
| `utm_*` | `external_metadata.utm_*` | string | - |

## 🔍 Busca e Criação Automática de Turma

O sistema busca a turma pelo campo `cohort_identifier` usando:

1. **Busca exata** primeiro (case-insensitive)
2. **Busca parcial** se não encontrar (procura pelo nome sem "Turma")
3. **Criação automática** se não encontrar (✨ novo comportamento)

### Criação Automática de Entidades

O sistema cria automaticamente todas as entidades necessárias quando não encontradas:

#### 1. Turma (Cohort)

- **Nome**: Valor normalizado do `cohort_identifier`
- **Curso**: "Optical Experience" (ou primeiro curso disponível)
- **Ano**: Extraído do nome da turma (ex: "2025" de "Turma Janeiro 2025")
- **Data de Início**: Primeiro dia do mês correspondente
- **Data de Fim**: 3 dias após a data de início (curso de 4 dias)
- **Localização**: Cidade + Estado do aluno, ou "São Paulo, BR" como padrão
- **Capacidade**: 30 vagas
- **Status**: "open"

#### 2. Vendedor (Sales Representative)

Quando o `sales_rep` não existe na tabela `sales_representatives`, o sistema cria automaticamente:
- **Nome**: Valor do campo `sales_rep` do webhook
- **Email**: null (pode ser atualizado depois)
- **Phone**: null (pode ser atualizado depois)
- **Active**: true

Se `sales_rep` não for informado, usa "Não Informado" como padrão.

#### 3. Origem (Source)

O sistema **sempre** verifica se a origem existe em `custom_enrollment_sources`. Se não existir, cria automaticamente (mesmo que seja um valor válido do enum):
- **Nome**: Valor normalizado do campo `source` do webhook
- **Description**: "Criado automaticamente via webhook"
- **Active**: true

**Exemplos de normalização:**
- `"instagram bio"` → normaliza para `"Instagram Bio"` e cria se não existir
- `"Instagram Bio"` → cria em `custom_enrollment_sources` se não existir
- `"Nova Origem"` → cria automaticamente como origem customizada

**Exemplos de turma:**
- `"Turma Janeiro 2025"` → busca exata, cria se não encontrar
- `"Janeiro 2025"` → normaliza para "Turma Janeiro 2025" e busca, ou cria se não encontrar
- `"Janeiro"` → normaliza para "Turma Janeiro 2025" e busca, ou cria se não encontrar
- `"Turma Março 2026"` → cria automaticamente se não existir

## ✨ Comportamento

### Criar ou Atualizar

- Se encontrar matrícula com **mesmo email + mesma turma**: **ATUALIZA**
- Se não encontrar: **CRIA** nova matrícula

### Múltiplos Registros

O webhook suporta múltiplos registros no array `records`. Todos serão processados e o resultado indica sucesso/falha de cada um.

## 📤 Resposta

### Sucesso

```json
{
  "success": true,
  "processed": 1,
  "results": [
    {
      "success": true,
      "action": "created",
      "enrollment_id": "uuid-do-enrollment",
      "student_name": "João Silva"
    }
  ]
}
```

### Erro

```json
{
  "success": false,
  "error": "Mensagem de erro",
  "processed": 0,
  "results": [
    {
      "success": false,
      "error": "Cohort not found: Turma Inexistente",
      "record": "João Silva"
    }
  ]
}
```

## 🧪 Exemplo de Payload de Teste

```json
{
  "event": "test_webhook",
  "sent_at": "2025-11-24T00:00:00-03:00",
  "webhook_secret": "SEU_SECRET_AQUI",
  "records": [
    {
      "cohort_identifier": "Turma Janeiro 2025",
      "student_name": "João Silva",
      "email": "joao@email.com",
      "cpf": "123.456.789-00",
      "phone": "11999999999",
      "sales_rep": "Ana Paula",
      "source": "Instagram Bio",
      "lead_date": "01/11/2024",
      "purchase_date": "06/11/2024",
      "financial_status": "paid",
      "contract_status": "signed",
      "payment_details": "À vista - Pix realizado 10/11/2024",
      "payment_amount": "R$ 7.500,00",
      "payment_proof_url": "https://exemplo.com/comprovante.pdf",
      "address": "Rua Exemplo, 123, Bairro",
      "city": "Salvador",
      "state": "BA",
      "zipcode": "41820700",
      "product_name": "Optical Experience",
      "observations": "Cliente indicado pelo Daniel",
      "utm_source": "instagram",
      "utm_medium": "social",
      "utm_campaign": "black_friday",
      "utm_term": "",
      "utm_content": ""
    }
  ]
}
```

## 🚨 Tratamento de Erros

### Erros Comuns

1. **Cohort não encontrada**
   - ⚠️ **Não é mais um erro!** O sistema agora cria automaticamente a turma se ela não existir
   - Verifique se o nome da turma está no formato correto (ex: "Turma Janeiro 2025")

2. **Webhook Secret inválido**
   - Verifique se o secret está correto no payload
   - Gere um novo secret na página de Integrações → N8N → "Gerar Novo Secret"
   - O secret deve estar no campo `webhook_secret` do payload

3. **Campos obrigatórios faltando**
   - `webhook_secret`, `records` (array), `cohort_identifier`, `student_name`, `email` são obrigatórios
   - `sales_rep` e `source` são opcionais, mas serão criados automaticamente se informados

### ✅ Criação Automática

O sistema agora cria automaticamente:
- ✅ **Turma** - se não encontrar pelo nome
- ✅ **Vendedor** - se não encontrar na tabela de vendedores
- ✅ **Origem** - sempre verifica e cria em `custom_enrollment_sources` se não existir

Você não precisa mais criar essas entidades manualmente antes de enviar o webhook!

## 📊 Logs

Todos os webhooks recebidos são registrados em:
- Página de Integrações → Aba "Logs e Monitoramento"

Os logs incluem:
- Status (success, error, partial)
- Payload recebido
- Timestamp
- ID da matrícula (se criada/atualizada)

---

**Última atualização**: 2025-11-24

