import type { NextRequest } from "next/server";
import { updateSession } from "@/app/src/utils/supabase/middleware";

export function middleware(request: NextRequest) {
  return updateSession(request);
}

// Next.js requires config to be defined in this file, not re-exported.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

