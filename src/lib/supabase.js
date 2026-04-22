import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// True only when real credentials are present
export const isConfigured = !!(url && key && !url.includes('your-project'))

// Use placeholder values that satisfy createClient's validation so the app
// renders even before .env is set up. Real auth/data calls will fail
// gracefully with an error message instead of a blank page.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-anon-key-not-real',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
)
