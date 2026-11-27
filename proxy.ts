import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const refreshHeaders = new Headers();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          const nextResponse = NextResponse.next({ request });
          for (const cookie of response.cookies.getAll()) nextResponse.cookies.set(cookie);
          for (const { name, value, options } of cookiesToSet) {
            nextResponse.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) refreshHeaders.set(key, value);
          response = nextResponse;
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const protectedPath = /^\/(dashboard|profile|qr|card)(\/|$)/.test(request.nextUrl.pathname);
  if (protectedPath && (error || !data?.claims.sub)) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    response = redirect;
  }

  refreshHeaders.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/qr/:path*",
    "/card/:path*",
    "/((?!(?:api|e|_next)(?:/|$)|.*\\.[^/]+$).*)",
  ],
};
