import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const missing = [];

if (!supabaseUrl) missing.push("SUPABASE_URL");
if (!supabaseAnonKey) missing.push("SUPABASE_ANON_KEY");
if (!supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

if (missing.length) {
  throw new Error(`Missing Supabase environment variables: ${missing.join(", ")}`);
}

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});