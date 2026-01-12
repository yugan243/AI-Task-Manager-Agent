const { SupabaseClient, createClient } = require("@supabase/supabase-js");
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey || !supabaseUrl) {
    throw new Error("Missing supabase key or supabase url in .env file");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;