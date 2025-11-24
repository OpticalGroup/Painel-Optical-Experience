import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import { useToast } from '@/hooks/use-toast';

export interface IntegrationSettings {
  id: string;
  system_name: string;
  enabled: boolean;
  api_key: string | null;
  webhook_secret: string | null;
  config: Record<string, any>;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationLog {
  id: string;
  created_at: string;
  source_system: string;
  event_type: string;
  status: string;
  enrollment_id: string | null;
  external_id: string | null;
  payload: Record<string, any> | null;
  error_message: string | null;
  retry_count: number;
  processed_at: string | null;
}

export const useIntegrationSettings = () => {
  return useQuery({
    queryKey: ['integration-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .order('system_name');

      if (error) throw error;
      return data as IntegrationSettings[];
    },
  });
};

export const useUpdateIntegrationSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<IntegrationSettings> & { id: string }) => {
      const { data, error } = await supabase
        .from('integration_settings')
        .update(settings)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-settings'] });
      toast({
        title: 'Configuração atualizada',
        description: 'As configurações de integração foram salvas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useIntegrationLogs = (limit: number = 50) => {
  return useQuery({
    queryKey: ['integration-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as IntegrationLog[];
    },
  });
};

export const useTestWebhook = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ system, testPayload }: { system: string; testPayload: any }) => {
      let functionName = '';

      switch (system) {
        case 'kommo':
          functionName = 'kommo-webhook';
          break;
        case 'clicksign':
          functionName = 'clicksign-webhook';
          break;
        case 'typeform':
          functionName = 'typeform-webhook';
          break;
        case 'n8n':
          functionName = 'notify-n8n';
          break;
        default:
          throw new Error('Sistema inválido');
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: testPayload,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Teste bem-sucedido',
        description: 'O webhook foi testado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no teste',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
