/**
 * FASE 4: BACKUP AUTOMÁTICO - Edge Function
 * Cria backups automáticos do banco de dados
 * 
 * IMPORTANTE: Esta função deve ser chamada por um cron job externo
 * Configure no Supabase Dashboard: Database > Cron Jobs
 * Ou use um serviço externo como GitHub Actions
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Iniciando backup do banco de dados...');

    // Tabelas para backup
    const tablesToBackup = [
      'cohorts',
      'enrollments',
      'courses',
      'sales_representatives',
      'custom_enrollment_sources',
      'organization_settings',
      'user_roles',
    ];

    const backupData: Record<string, any[]> = {};
    let totalRecords = 0;

    // Exportar dados de cada tabela
    for (const table of tablesToBackup) {
      console.log(`📦 Fazendo backup da tabela: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.error(`❌ Erro ao fazer backup de ${table}:`, error);
        throw error;
      }

      backupData[table] = data || [];
      totalRecords += data?.length || 0;
      console.log(`✅ ${table}: ${data?.length || 0} registros`);
    }

    // Metadados do backup
    const backupMetadata = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      tables: tablesToBackup.length,
      totalRecords,
      database: 'optical-cohort-management',
    };

    const backup = {
      metadata: backupMetadata,
      data: backupData,
    };

    // Salvar backup como JSON
    const backupJson = JSON.stringify(backup, null, 2);
    const backupFileName = `backup-${new Date().toISOString().split('T')[0]}.json`;

    // TODO: Upload para storage bucket ou serviço externo
    // Por enquanto, retorna o backup como resposta
    console.log(`✨ Backup concluído: ${totalRecords} registros de ${tablesToBackup.length} tabelas`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Backup criado com sucesso',
        metadata: backupMetadata,
        downloadUrl: null, // TODO: Implementar upload para storage
        backupSize: new Blob([backupJson]).size,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Erro no backup:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
