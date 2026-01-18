import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient'; 

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Successfully logged in! Send them to the main page
      return NextResponse.redirect(`${origin}`);
    }
  }

  // If something fails, send them to a login error page
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}