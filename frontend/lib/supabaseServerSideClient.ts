import { APIError } from "@/app/api/forms/errorHandler";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is not set in environment variables.');
  throw new APIError('Server configuration error.', 500);
}
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase