import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://nrrtiiwekxejvzdfocgy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycnRpaXdla3hlanZ6ZGZvY2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTA2NzgsImV4cCI6MjA4NDA2NjY3OH0.QztwXRJqjrHQ-kIlAq0Tgll1JzZ3lwX1F7xdqhhP0uY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Read migration SQL
const migrationSQL = readFileSync(
    join(__dirname, 'supabase', 'migrations', '20251125000000_fix_get_cohort_stats_left_join.sql'),
    'utf-8'
);

console.log('🚀 Executing migration...\n');
console.log('SQL:', migrationSQL.substring(0, 100) + '...\n');

// Execute migration using Supabase RPC
async function runMigration() {
    try {
        // We need to use the SQL endpoint directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ query: migrationSQL })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Migration executed successfully!');
        console.log('Result:', result);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
