import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import {
  Plug,
  CheckCircle2,
  XCircle,
  Activity,
  Copy,
  TestTube,
  Settings,
  FileText,
  ExternalLink
} from "lucide-react";
import {
  useIntegrationSettings,
  useUpdateIntegrationSettings,
  useIntegrationLogs,
  useTestWebhook,
} from "@/integrations/supabase/hooks/useIntegrations";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function Integrations() {
  const { data: settings, isLoading } = useIntegrationSettings();
  const { data: logs } = useIntegrationLogs(100);
  const updateSettings = useUpdateIntegrationSettings();
  const testWebhook = useTestWebhook();
  const { toast } = useToast();

  const [editingSystem, setEditingSystem] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const getWebhookUrl = (system: string) => {
    // Para n8n, SEMPRE usar a URL de produção da Vercel (Serverless Function)
    const systemNormalized = system?.trim().toLowerCase();
    if (systemNormalized === 'n8n') {
      return 'https://optical-cohort-sparkle-main.vercel.app/api/webhook/enrollment';
    }
    
    // Para outros sistemas, usar Supabase Edge Functions
    const projectId = 'nheacgdfprqhuovubeed';
    return `https://${projectId}.supabase.co/functions/v1/${system}-webhook`;
  };

  const copyWebhookUrl = (system: string) => {
    navigator.clipboard.writeText(getWebhookUrl(system));
    toast({
      title: "URL copiada",
      description: "A URL do webhook foi copiada para a área de transferência.",
    });
  };

  const handleSave = async (systemId: string) => {
    await updateSettings.mutateAsync({
      id: systemId,
      ...formData,
    });
    setEditingSystem(null);
    setFormData({});
  };

  const handleTest = async (system: string) => {
    const testPayloads: Record<string, any> = {
      kommo: {
        leads: [{
          id: 12345,
          name: "Teste Silva",
          custom_fields: [
            { field_code: "EMAIL", values: [{ value: "teste@example.com" }] },
            { field_code: "PHONE", values: [{ value: "+5511999999999" }] },
          ]
        }]
      },
      clicksign: {
        event: { name: "sign" },
        document: {
          key: "test-doc-123",
        },
        signer: {
          email: "teste@example.com"
        }
      },
      typeform: {
        form_response: {
          token: "test-response-123",
          answers: [
            { field: { ref: "name" }, text: "Teste Silva" },
            { field: { ref: "email" }, email: "teste@example.com" },
          ]
        }
      },
      n8n: {
        event: 'test_connection',
        testPayload: {
          timestamp: new Date().toISOString(),
          message: 'Hello from Optical Cohort Sparkle!',
          test: true
        }
      }
    };

    await testWebhook.mutateAsync({
      system,
      testPayload: testPayloads[system],
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const kommoSettings = settings?.find(s => s.system_name === 'kommo');
  const clicksignSettings = settings?.find(s => s.system_name === 'clicksign');
  const typeformSettings = settings?.find(s => s.system_name === 'typeform');
  const n8nSettings = settings?.find(s => s.system_name === 'n8n');

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Configure conexões com CRMs, ferramentas de assinatura e formulários
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {settings?.filter(s => s.enabled).length || 0} de {settings?.length || 0} ativas
            </Badge>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto p-6 space-y-6">

        <Tabs defaultValue="systems" className="space-y-6">
          <TabsList>
            <TabsTrigger value="systems">
              <Settings className="h-4 w-4 mr-2" />
              Sistemas
            </TabsTrigger>
            <TabsTrigger value="logs">
              <FileText className="h-4 w-4 mr-2" />
              Logs e Monitoramento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="systems" className="space-y-6">
            {/* Kommo CRM */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Plug className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Kommo CRM</CardTitle>
                      <CardDescription>
                        Sincronize leads e atualizações de status
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={kommoSettings?.enabled || false}
                    onCheckedChange={(enabled) => {
                      if (kommoSettings) {
                        updateSettings.mutate({ id: kommoSettings.id, enabled });
                      }
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getWebhookUrl('kommo')}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyWebhookUrl('kommo')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure esta URL no Kommo para receber eventos de leads
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>API Token (Access Token)</Label>
                  <Input
                    type="password"
                    placeholder="Seu Access Token do Kommo"
                    value={editingSystem === 'kommo' ? formData.api_key || '' : '••••••••••••'}
                    onChange={(e) => {
                      setEditingSystem('kommo');
                      setFormData({ ...formData, api_key: e.target.value });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Domínio da API Kommo</Label>
                  <Input
                    placeholder="https://seudomain.kommo.com"
                    value={editingSystem === 'kommo' ? formData.config?.api_url || '' : kommoSettings?.config?.api_url || ''}
                    onChange={(e) => {
                      setEditingSystem('kommo');
                      setFormData({
                        ...formData,
                        config: { ...formData.config, api_url: e.target.value }
                      });
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  {editingSystem === 'kommo' && (
                    <Button
                      onClick={() => kommoSettings && handleSave(kommoSettings.id)}
                      disabled={updateSettings.isPending}
                    >
                      Salvar Configurações
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleTest('kommo')}
                    disabled={testWebhook.isPending}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Testar Webhook
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href="https://www.kommo.com/developers/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Documentação
                    </a>
                  </Button>
                </div>

                {kommoSettings?.last_sync_at && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Última sincronização: {new Date(kommoSettings.last_sync_at).toLocaleString('pt-BR')}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* ClickSign */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>ClickSign</CardTitle>
                      <CardDescription>
                        Assinatura digital de contratos
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={clicksignSettings?.enabled || false}
                    onCheckedChange={(enabled) => {
                      if (clicksignSettings) {
                        updateSettings.mutate({ id: clicksignSettings.id, enabled });
                      }
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getWebhookUrl('clicksign')}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyWebhookUrl('clicksign')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure esta URL no ClickSign para receber notificações de assinatura
                  </p>
                </div>

                <Separator />

                {/* Status de configuração */}
                {clicksignSettings?.api_key && clicksignSettings?.config?.template_key ? (
                  <Alert className="bg-primary/5 border-primary/20">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm">
                      <strong className="text-primary">Credenciais configuradas com sucesso</strong>
                      <div className="mt-2 space-y-1 text-muted-foreground">
                        <div>✓ API Token configurado</div>
                        <div>✓ Template Key: <code className="text-xs bg-muted px-1 py-0.5 rounded">{clicksignSettings.config.template_key}</code></div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-muted/50">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Configure as credenciais abaixo para habilitar o envio de documentos para assinatura
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4 border rounded-lg p-4 bg-card">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="clicksign-api-token" className="text-sm font-semibold">
                        API Token
                      </Label>
                      {clicksignSettings?.api_key && !editingSystem && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Configurado
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="clicksign-api-token"
                      type="password"
                      placeholder="Insira o API Token do ClickSign"
                      value={editingSystem === 'clicksign' ? formData.api_key || '' : clicksignSettings?.api_key ? '••••••••••••••••' : ''}
                      onChange={(e) => {
                        setEditingSystem('clicksign');
                        setFormData({ ...formData, api_key: e.target.value });
                      }}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Encontre seu API Token em: <strong>ClickSign → Configurações → API → Access Token</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="clicksign-template-key" className="text-sm font-semibold">
                        Template Key (Chave do Modelo)
                      </Label>
                      {clicksignSettings?.config?.template_key && !editingSystem && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Configurado
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="clicksign-template-key"
                      placeholder="Ex: modelo-contrato-matricula"
                      value={editingSystem === 'clicksign' ? formData.config?.template_key || '' : clicksignSettings?.config?.template_key || ''}
                      onChange={(e) => {
                        setEditingSystem('clicksign');
                        setFormData({
                          ...formData,
                          config: { ...formData.config, template_key: e.target.value }
                        });
                      }}
                      className="font-mono"
                    />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Encontre a chave do template em: <strong>ClickSign → Modelos → Selecionar modelo → Chave</strong></p>
                      <p className="mt-2">Configure variáveis no template: <code className="bg-muted px-1 py-0.5 rounded">{'{{student_name}}'}</code>, <code className="bg-muted px-1 py-0.5 rounded">{'{{cpf}}'}</code>, <code className="bg-muted px-1 py-0.5 rounded">{'{{email}}'}</code>, <code className="bg-muted px-1 py-0.5 rounded">{'{{cohort_name}}'}</code></p>
                    </div>
                  </div>

                  {editingSystem === 'clicksign' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => clicksignSettings && handleSave(clicksignSettings.id)}
                        disabled={updateSettings.isPending}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Salvar Credenciais
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingSystem(null);
                          setFormData({});
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!editingSystem && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingSystem('clicksign');
                        setFormData({
                          api_key: clicksignSettings?.api_key || '',
                          config: clicksignSettings?.config || {}
                        });
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {clicksignSettings?.api_key ? 'Editar' : 'Configurar'} Credenciais
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleTest('clicksign')}
                    disabled={testWebhook.isPending || !clicksignSettings?.enabled}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Testar Webhook
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href="https://developers.clicksign.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Documentação
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Typeform */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Typeform</CardTitle>
                      <CardDescription>
                        Capture leads automaticamente de formulários
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={typeformSettings?.enabled || false}
                    onCheckedChange={(enabled) => {
                      if (typeformSettings) {
                        updateSettings.mutate({ id: typeformSettings.id, enabled });
                      }
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getWebhookUrl('typeform')}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyWebhookUrl('typeform')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure esta URL como webhook no seu formulário Typeform
                  </p>
                </div>

                <Separator />

                <Alert>
                  <AlertDescription>
                    <strong>Campos necessários no formulário:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      <li>Nome completo (referência: "name" ou "nome")</li>
                      <li>Email (tipo: email)</li>
                      <li>Telefone (opcional, referência: "phone" ou "telefone")</li>
                      <li>CPF (opcional, referência: "cpf")</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Turma Padrão para Novos Leads</Label>
                  <Input
                    placeholder="ID da turma padrão"
                    value={editingSystem === 'typeform' ? formData.config?.default_cohort_id || '' : typeformSettings?.config?.default_cohort_id || ''}
                    onChange={(e) => {
                      setEditingSystem('typeform');
                      setFormData({
                        ...formData,
                        config: { ...formData.config, default_cohort_id: e.target.value }
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leads do Typeform serão automaticamente vinculados a esta turma
                  </p>
                </div>

                <div className="flex gap-2">
                  {editingSystem === 'typeform' && (
                    <Button
                      onClick={() => typeformSettings && handleSave(typeformSettings.id)}
                      disabled={updateSettings.isPending}
                    >
                      Salvar Configurações
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleTest('typeform')}
                    disabled={testWebhook.isPending}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Testar Webhook
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href="https://www.typeform.com/developers/webhooks/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Documentação
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* N8N */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Activity className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>N8N (Workflow Automation)</CardTitle>
                      <CardDescription>
                        Automatize fluxos de trabalho com webhooks
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={n8nSettings?.enabled || false}
                    onCheckedChange={(enabled) => {
                      if (n8nSettings) {
                        updateSettings.mutate({ id: n8nSettings.id, enabled });
                      }
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook URL (Output)</Label>
                  <Input
                    placeholder="https://your-n8n-instance.com/webhook/..."
                    value={editingSystem === 'n8n' ? formData.config?.webhook_url || '' : n8nSettings?.config?.webhook_url || ''}
                    onChange={(e) => {
                      setEditingSystem('n8n');
                      setFormData({
                        ...formData,
                        config: { ...formData.config, webhook_url: e.target.value }
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    O sistema enviará um POST para esta URL sempre que uma matrícula for criada ou atualizada.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Webhook de Entrada (Input)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={'https://optical-cohort-sparkle-main.vercel.app/api/webhook/enrollment'}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText('https://optical-cohort-sparkle-main.vercel.app/api/webhook/enrollment');
                        toast({
                          title: "URL copiada",
                          description: "A URL do webhook foi copiada para a área de transferência.",
                        });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use este endpoint para criar ou atualizar matrículas a partir do N8N.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Segurança (Webhook Secret)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={n8nSettings?.webhook_secret || 'Não configurado'}
                      readOnly
                      type="password"
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (n8nSettings?.webhook_secret) {
                          navigator.clipboard.writeText(n8nSettings.webhook_secret);
                          toast({ title: "Secret copiado", description: "Use o header 'x-webhook-secret' no N8N." });
                        }
                      }}
                      disabled={!n8nSettings?.webhook_secret}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const newSecret = crypto.randomUUID();
                        if (n8nSettings) {
                          await updateSettings.mutateAsync({ id: n8nSettings.id, webhook_secret: newSecret });
                          toast({ title: "Novo Secret Gerado", description: "Atualize seus workflows no N8N!" });
                        }
                      }}
                      disabled={!n8nSettings}
                    >
                      Gerar Novo
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Adicione o header <code>x-webhook-secret</code> nas suas requisições do N8N para autenticação.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  {editingSystem === 'n8n' && (
                    <Button
                      onClick={() => n8nSettings && handleSave(n8nSettings.id)}
                      disabled={updateSettings.isPending}
                    >
                      Salvar Configurações
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleTest('n8n')}
                    disabled={testWebhook.isPending || !n8nSettings?.enabled || !n8nSettings?.config?.webhook_url}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Testar Conexão
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href="https://docs.n8n.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Documentação
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Integração</CardTitle>
                <CardDescription>
                  Últimos 100 eventos de integração
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Sistema</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs font-mono">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.source_system}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.event_type}</TableCell>
                        <TableCell>
                          {log.status === 'success' ? (
                            <Badge className="bg-green-500/10 text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Sucesso
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Erro
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {log.enrollment_id?.slice(0, 8) || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-xs">
                          {log.error_message || 'OK'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
