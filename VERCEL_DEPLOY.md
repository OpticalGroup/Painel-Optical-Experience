# 🚀 Guia de Deploy na Vercel

Este documento contém instruções específicas para fazer deploy deste projeto na Vercel.

## 📋 Pré-requisitos

- Conta na Vercel (gratuita): https://vercel.com/signup
- Projeto no Supabase configurado
- Acesso ao repositório do projeto (GitHub/GitLab/Bitbucket)

## 🔧 Configuração

### 1. Conectar o Repositório na Vercel

1. Acesse https://vercel.com/new
2. Conecte seu repositório Git
3. Selecione o repositório `optical-cohort-sparkle-main`
4. A Vercel detectará automaticamente as configurações do Vite

### 2. Configurar Variáveis de Ambiente

**IMPORTANTE**: Configure as seguintes variáveis de ambiente no painel da Vercel:

1. Vá em **Settings** → **Environment Variables**
2. Adicione as seguintes variáveis:

```
VITE_SUPABASE_URL=https://nheacgdfprqhuovubeed.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZWFjZ2RmcHJxaHVvdnViZWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNDM2ODAsImV4cCI6MjA3ODgxOTY4MH0.F0gyQyk6Yu1Pf0IzZ7zPCtlw7fOPl5XC9KbML_fOmms
```

**Nota**: As credenciais acima são valores padrão. Para produção, você pode:
- Manter esses valores (funcionam como fallback)
- Ou configurar novos valores do seu projeto Supabase

### 3. Configurações de Build

A Vercel detectará automaticamente:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

Todas essas configurações estão no arquivo `vercel.json`.

### 4. Deploy

1. Após configurar as variáveis de ambiente, clique em **Deploy**
2. Aguarde o build completar (1-3 minutos)
3. O deploy será concluído automaticamente

## ✅ Verificações Pós-Deploy

Após o deploy, verifique:

- [ ] Site acessível na URL fornecida pela Vercel
- [ ] Login funcionando corretamente
- [ ] Conexão com Supabase estabelecida
- [ ] Dashboard carregando dados
- [ ] Rotas da SPA funcionando (React Router)
- [ ] Assets estáticos carregando corretamente

## 🔄 Atualizações Futuras

Para atualizar a aplicação:

1. Faça push das mudanças para o repositório
2. A Vercel fará deploy automático através do Git
3. Cada push gera um novo preview deployment
4. O deploy em produção acontece na branch `main` (ou a branch padrão)

## 🌐 Configurar Domínio Customizado (Opcional)

1. Vá em **Settings** → **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `app.seudominio.com`)
4. Siga as instruções para configurar DNS

## 📊 Monitoramento

A Vercel fornece:
- **Analytics**: Métricas de performance
- **Logs**: Logs em tempo real do build e runtime
- **Speed Insights**: Análise de performance
- **Web Vitals**: Core Web Vitals

Acesse essas ferramentas no painel do projeto na Vercel.

## 🚨 Troubleshooting

### Build falha

- Verifique os logs de build na Vercel
- Confirme que todas as variáveis de ambiente estão configuradas
- Teste o build localmente: `npm run build`

### Erro 404 em rotas

- Verifique se o `vercel.json` tem a configuração de rewrites para SPA
- Certifique-se de que todas as rotas redirecionam para `/index.html`

### Erro de conexão com Supabase

- Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretas
- Confirme que o Supabase permite conexões do domínio da Vercel
- Verifique as políticas de CORS no Supabase

### Assets não carregam

- Verifique se o caminho dos assets está correto
- Confirme que o `outputDirectory` no `vercel.json` está como `dist`
- Limpe o cache da Vercel e faça um novo deploy

## 📝 Notas Importantes

1. **Credenciais**: As credenciais do Supabase estão como fallback no código. Para maior segurança em produção, use apenas variáveis de ambiente.

2. **Edge Functions**: As Edge Functions do Supabase devem ser deployadas separadamente no Supabase Dashboard, não na Vercel.

3. **Banco de Dados**: O banco de dados está hospedado no Supabase. A Vercel apenas hospeda o frontend.

4. **Build Time**: O build pode demorar 1-3 minutos dependendo do tamanho do projeto.

## 🔗 Links Úteis

- [Documentação Vercel](https://vercel.com/docs)
- [Vercel + Vite](https://vercel.com/docs/frameworks/vite)
- [Supabase + Vercel](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

---

**Última atualização**: 2025-01-23

