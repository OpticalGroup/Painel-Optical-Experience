import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../client';
import { useToast } from '@/hooks/use-toast';

export const useSendToClickSign = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { data, error } = await supabase.functions.invoke('send-to-clicksign', {
        body: { enrollmentId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, enrollmentId) => {
      // Invalidar todas as queries relevantes para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['cohort'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-analytics'] });
      
      toast({
        title: "Documento enviado!",
        description: `Contrato enviado para assinatura no ClickSign. ID: ${data.documentKey}`,
      });
    },
    onError: (error: Error) => {
      console.error('Failed to send to ClickSign:', error);
      toast({
        title: "Erro ao enviar documento",
        description: error.message || "Não foi possível enviar o contrato para assinatura. Verifique a configuração do ClickSign.",
        variant: "destructive",
      });
    },
  });
};
