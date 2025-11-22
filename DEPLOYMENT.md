# 🚀 Guia de Deploy - Optical Cohort Management System

## Checklist Pré-Lançamento

### ✅ Segurança

- [x] RLS policies configuradas
- [x] Dados sensíveis mascarados nos logs
- [x] Rate limiting implementado
- [x] Validação de input (client + server)
- [x] Audit logs funcionando
- [ ] **PENDENTE**: Habilitar "Leaked Password Protection" no Supabase Dashboard

### ✅ Performance

- [x] Cache system implementado
- [x] Database indexes criados
- [x] Lazy loading configurado
- [x] Queries otimizadas

### ✅ Backup & Recovery

- [x] Edge function de backup criada
- [ ] **PENDENTE**: Configurar cron job no Supabase
- [ ] **PENDENTE**: Testar restore de backup

### ✅ Monitoring

- [ ] **PENDENTE**: Configurar alertas no Supabase
- [ ] **PENDENTE**: Configurar monitoramento de performance
- [ ] **PENDENTE**: Configurar logs centralizados

---

## 🔧 Configuração Inicial

### 1. Habilitar Proteção contra Senhas Vazadas

**CRÍTICO**: Deve ser feito antes do lançamento!

1. Acesse: https://supabase.com/dashboard/project/nheacgdfprqhuovubeed/auth/providers
2. Clique em "Email"
3. Em "Password Protection", habilite:
   - ✅ Enable leaked password protection
4. Salvar

### 2. Configurar Backup Automático

**Opção A: Supabase Cron (Recomendado)**

```sql
-- Execute no SQL Editor do Supabase
SELECT cron.schedule(
  'daily-database-backup',
  '0 3 * * *', -- 3h UTC (0h BRT)
  $$
  SELECT net.http_post(
    url:='https://nheacgdfprqhuovubeed.supabase.co/functions/v1/backup-database',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

**Opção B: GitHub Actions**

1. Adicione secrets no GitHub:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. O workflow `.github/workflows/backup.yml` já está configurado

### 3. Configurar Monitoramento

**Supabase Alerts:**

1. Acesse: Database → Database Health
2. Configure alertas para:
   - CPU usage > 80%
   - Memory usage > 80%
   - Slow queries > 2s
   - Error rate > 5%

**Email notifications:**
Configure em: Settings → General → Notifications

---

## 🌐 Deploy para Produção

### Passo 1: Preparação

```bash
# 1. Verificar que todas as migrações foram aplicadas
# Acesse: Supabase Dashboard → Database → Migrations

# 2. Verificar que não há erros no console
npm run build

# 3. Testar em staging (se disponível)
```

### Passo 2: Configurar Domínio Customizado (Opcional)

Siga o guia: https://docs.lovable.dev/features/custom-domain

**Resumo:**
1. Project Settings → Domains → Connect Domain
2. Adicionar registros DNS no seu provedor
3. Aguardar propagação (até 72h)

### Passo 3: Publicar

No Lovable:
1. Clique em "Publish" (canto superior direito)
2. Clique em "Update" para publicar mudanças
3. Aguardar deploy (1-2 minutos)

### Passo 4: Verificação Pós-Deploy

- [ ] Site acessível
- [ ] Login funcionando
- [ ] Dashboard carregando dados
- [ ] Criar matrícula teste
- [ ] Exportar relatório teste
- [ ] Verificar logs de erro

---

## 🔐 Configuração de Usuários Iniciais

### Criar Primeiro Admin

1. Acesse: Supabase → Authentication → Users
2. Clique em "Add user"
3. Preencha:
   - Email: admin@seudominio.com
   - Password: (senha forte)
   - Auto-confirm user: ✅
4. Clique em "Create user"

5. **Adicionar role de admin:**
```sql
-- Execute no SQL Editor
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@seudominio.com';
```

### Criar Outros Usuários

Use a interface em: `/users` (após fazer login como admin)

**Roles disponíveis:**
- `admin`: Acesso total
- `operator`: Gestão operacional
- `sales`: Apenas suas vendas
- `viewer`: Somente leitura

---

## 📊 Monitoramento em Produção

### Métricas para Acompanhar

**Diariamente:**
- Número de matrículas criadas
- Erros de autenticação
- Tempo de resposta médio

**Semanalmente:**
- Taxa de ocupação das turmas
- Performance de queries
- Uso de storage

**Mensalmente:**
- Crescimento de usuários
- Receita total
- Análise de conversão

### Dashboards Recomendados

1. **Supabase Dashboard**
   - Database Health
   - API Usage
   - Storage Usage

2. **Google Analytics** (opcional)
   - Adicionar tracking no `index.html`
   - Monitorar navegação de usuários

---

## 🚨 Plano de Contingência

### Rollback de Deploy

Se algo der errado após deploy:

1. **Frontend (Lovable)**:
   - Não é possível rollback automático
   - Re-deploy da versão anterior

2. **Database**:
   ```sql
   -- Reverter última migração
   -- (backup automático é mantido)
   ```

### Restore de Backup

Se precisar restaurar dados:

1. Localizar backup (GitHub Actions artifacts ou storage)
2. Download do arquivo JSON
3. Executar restore via SQL Editor:
```sql
-- Exemplo de restore de enrollments
INSERT INTO public.enrollments 
SELECT * FROM json_populate_recordset(null::enrollments, '[...]');
```

### Contatos de Emergência

- **Supabase Support**: https://supabase.com/support
- **Lovable Support**: Chat in-app
- **DBA/Admin**: [ADICIONAR CONTATO]

---

## 🔄 Manutenção Regular

### Semanal
- [ ] Revisar logs de erro
- [ ] Verificar queries lentas
- [ ] Monitorar uso de recursos

### Mensal
- [ ] Analisar métricas de performance
- [ ] Revisar políticas de segurança
- [ ] Atualizar dependências críticas

### Trimestral
- [ ] Audit de segurança completo
- [ ] Review de políticas RLS
- [ ] Teste de restore de backup
- [ ] Análise de escalabilidade

---

## 📈 Escalabilidade

### Quando Escalar?

**Sinais:**
- Queries > 2s consistentemente
- CPU usage > 70% por hora
- Memory usage > 75%
- Mais de 50k enrollments

### Como Escalar?

1. **Horizontal (Database)**
   - Upgrade do plano Supabase
   - Settings → Advanced → Instance Size

2. **Cache Distribuído**
   - Implementar Redis
   - Separar cache por região

3. **CDN**
   - Usar Cloudflare ou similar
   - Cache de assets estáticos

---

## 📚 Recursos Adicionais

- [Documentação Lovable](https://docs.lovable.dev/)
- [Supabase Best Practices](https://supabase.com/docs/guides/best-practices)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)
- [SECURITY.md](./SECURITY.md) - Guia de Segurança
- [PERFORMANCE.md](./PERFORMANCE.md) - Guia de Performance

---

**Suporte**: Para questões técnicas, consulte a documentação ou entre em contato com a equipe de desenvolvimento.

**Última atualização**: 2025-11-21 | **Versão**: 1.0
