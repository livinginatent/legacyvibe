/**
 * OAuth Callback Handler
 * Handles the redirect from OAuth providers (GitHub) after authentication.
 * Exchanges the authorization code for a session and redirects to the dashboard.
 * Follows security best practices - no token logging.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/app/src/utils/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    try {
      const cookieStore = cookies();
      const supabase = createClient(cookieStore);

      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        // OAuth failed - redirect to login with error parameter
        return NextResponse.redirect(
          `${origin}/login?error=oauth_failed`
        );
      }

      // Successful authentication - redirect to dashboard
      return NextResponse.redirect(`${origin}/dashboard`);
    } catch (error) {
      // Log error internally (never log tokens)
      console.error("OAuth callback error:", "Authentication flow failed");

      // Redirect to login on unexpected error
      return NextResponse.redirect(
        `${origin}/login?error=oauth_failed`
      );
    }
  }

  // No code provided - redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
