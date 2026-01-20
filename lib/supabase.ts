
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmieaqmwdneeqciacrmk.supabase.co';
const supabaseKey = 'sb_publishable_9BMcyqoLlBv42D8or7HdeA_Tbc6wSWz';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Note: Ensure your Supabase table 'todos' exists with columns:
// id (uuid, pk), title (text), is_completed (bool), priority (text), created_at (timestamptz), sub_tasks (text[])
