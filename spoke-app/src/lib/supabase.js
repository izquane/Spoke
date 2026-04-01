// supabase.js — frontend Supabase client
// Uses the public anon key (VITE_ prefix = safe for browser)
// For admin/server operations, use SUPABASE_SERVICE_ROLE_KEY in api/ routes

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
