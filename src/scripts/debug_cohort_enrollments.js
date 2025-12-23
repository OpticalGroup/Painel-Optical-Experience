import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Simplificação radical para evitar problemas com paths com acentos no Windows
console.log("--- Iniciando diagnóstico simplificado ---");

const envPath = ".env"; // Assume que rodamos da raiz do projeto

try {
    if (!fs.existsSync(envPath)) {
        console.error("ERRO: Arquivo .env não encontrado na raiz (CWD).");
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, "utf-8");
    const envVars = {};

    envContent.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
            envVars[key.trim()] = value.trim();
        }
    });

    const supabaseUrl = envVars["VITE_SUPABASE_URL"];
    const supabaseKey = envVars["VITE_SUPABASE_ANON_KEY"];

    if (!supabaseUrl || !supabaseKey) {
        console.error("VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY faltando.");
        process.exit(1);
    }

    console.log("Conectando ao Supabase...");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Executar diagnóstico
    runDiagnostics(supabase);

} catch (err) {
    console.error("Erro fatal no script:", err);
}

async function runDiagnostics(supabase) {
    console.log("Buscando contagem...");
    const { count, error } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true });

    if (error) {
        console.error("Erro ao conectar/contar:", error);
        return;
    }
    console.log(`TOTAL DE MATRÍCULAS: ${count}`);

    if (count === 0) return;

    console.log("Buscando últimas matrículas...");
    const { data: recent, error: fetchError } = await supabase
        .from("enrollments")
        .select(`
      id, student_name, cohort_id,
      cohorts ( id, name )
    `)
        .order("created_at", { ascending: false })
        .limit(5);

    if (fetchError) {
        console.error("Erro fetch:", fetchError);
        return;
    }

    let testCohortId = null;

    recent.forEach(r => {
        console.log(`Aluno: ${r.student_name} | TurmaID: ${r.cohort_id || 'NULL'} | TurmaNome: ${r.cohorts?.name || 'N/A'}`);
        if (r.cohort_id) testCohortId = r.cohort_id;
    });

    const { count: nullC } = await supabase.from("enrollments").select("*", { count: "exact", head: true }).is("cohort_id", null);
    console.log(`Enrollments sem Turma: ${nullC}`);

    if (testCohortId) {
        console.log(`Testando RPC para ID: ${testCohortId}`);
        const { data: stats, error: rpcError } = await supabase.rpc('get_cohort_stats', { p_cohort_id: testCohortId });
        if (rpcError) console.error("RPC Erro:", rpcError);
        else console.log("RPC Resultado:", JSON.stringify(stats));
    }
}
