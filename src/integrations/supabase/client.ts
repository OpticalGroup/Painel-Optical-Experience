import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables with fallback to hardcoded values for backwards compatibility
// In production, set these as environment variables in Vercel
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://nheacgdfprqhuovubeed.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZWFjZ2RmcHJxaHVvdnViZWVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNDM2ODAsImV4cCI6MjA3ODgxOTY4MH0.F0gyQyk6Yu1Pf0IzZ7zPCtlw7fOPl5XC9KbML_fOmms";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});