import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * OAuth / magic-link / password-reset callback handler.
 * Supabase redirects here after email confirmation or password reset.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type'); // 'recovery' for password reset

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Password reset flow → redirect to update-password page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/update-password`);
      }
      // Normal signup confirmation → go to dashboard
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Something went wrong
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
