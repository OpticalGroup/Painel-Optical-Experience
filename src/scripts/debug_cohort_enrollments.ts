import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Polyfill para __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// O script vai rodar em src/scripts/
const rootDir = path.resolve(__dirname, "../../");
const envPath = path.join(rootDir, ".env");

console.log(`Lendo arquivo .env em: ${envPath}`);

async function main() {
    if (!fs.existsSync(envPath)) {
        console.error("Arquivo .env não encontrado!");
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, "utf-8");
    const envVars: Record<string, string> = {};

    envContent.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
            envVars[key.trim()] = value.trim();
        }
    });

    const supabaseUrl = envVars["VITE_SUPABASE_URL"];
    const supabaseKey = envVars["VITE_SUPABASE_ANON_KEY"];

    if (!supabaseUrl || !supabaseKey) {
        console.error("VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas no .env");
        process.exit(1);
    }

    console.log("Conectando ao Supabase...");
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("\n--- Debugging Enrollments & Cohorts ---");

    // 1. Check total enrollments
    const { count, error: countError } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true });

    if (countError) {
        console.error("Erro ao contar matrículas:", countError);
        return;
    }
    console.log(`Total de Matrículas no Banco: ${count}`);

    if (count === 0) {
        console.log("Nenhuma matrícula encontrada. Nada mais a verificar.");
        return;
    }

    // 2. Fetch recent enrollments and check cohort_id
    const { data: recentEnrollments, error: fetchError } = await supabase
        .from("enrollments")
        .select(`
      id,
      student_name,
      created_at,
      cohort_id,
      cohorts (
        id,
        name
      )
    `)
        .order("created_at", { ascending: false })
        .limit(5);

    if (fetchError) {
        console.error("Erro ao buscar matrículas recentes:", fetchError);
        return;
    }

    console.log("\nÚltimas 5 Matrículas Importadas:");

    let validCohortId: string | null = null;
    let validCohortName: string | null = null;

    recentEnrollments.forEach((e: any) => {
        const cohortName = e.cohorts ? e.cohorts.name : "N/A (Join Failed)";
        const hasCohortId = !!e.cohort_id;

        console.log(`- [${e.created_at}] ${e.student_name}`);
        console.log(`  Cohort ID: ${e.cohort_id || "NULL"} ${hasCohortId ? "✅" : "❌"}`);
        console.log(`  Cohort Name (via Join): ${cohortName} ${e.cohorts ? "✅" : "⚠️"}`);

        if (e.cohort_id && !e.cohorts) {
            console.log(`  ALERTA CRÍTICO: Cohort ID existe no enrollment mas não achou na tabela cohorts! ID órfão?`);
        }

        if (e.cohort_id && e.cohorts && !validCohortId) {
            validCohortId = e.cohort_id;
            validCohortName = e.cohorts.name;
        }
    });

    // 3. Check for enrollments with NULL cohort_id
    const { count: nullCohortCount } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .is("cohort_id", null);

    console.log(`\nMatrículas com Cohort ID NULL: ${nullCohortCount}`);

    // 4. Test get_cohort_stats RPC for a valid cohort found above
    if (validCohortId) {
        console.log(`\nTestando RPC get_cohort_stats para turma: ${validCohortName} (${validCohortId})`);

        // Call RPC
        const { data: stats, error: rpcError } = await supabase
            .rpc('get_cohort_stats', { p_cohort_id: validCohortId });

        if (rpcError) {
            console.error("Erro no RPC:", rpcError);
        } else {
            console.log("Resultado do RPC (Cru):", JSON.stringify(stats, null, 2));
            if (Array.isArray(stats) && stats.length > 0) {
                console.log(`Enrolled Count retornada: ${stats[0].enrolled_count}`);
            } else {
                console.log("ALERTA CRÍTICO: RPC retornou array vazio! Isso explica os cards zerados.");
                console.log("Possível causa: A função get_cohort_stats usa INNER JOIN ou GROUP BY que invalida resultados vazios ou parciais.");
            }
        }
    } else {
        console.log("\nNão foi possível testar RPC pois nenhuma matrícula com turma válida foi encontrada nas últimas 5.");
    }
}

main().catch(console.error);
