import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { refreshSession } from "@/lib/supabase/middleware";

const handleI18n = createIntlMiddleware(routing);

const PUBLIC_PATHS = ["/login", "/register", "/join", "/profile-select"];

function isPublicPath(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");
  return PUBLIC_PATHS.some(
    (p) => withoutLocale === p || withoutLocale.startsWith(p + "/")
  );
}

export async function proxy(request: NextRequest) {
  // 1. Refrescar sesión de Supabase
  const { response: supabaseResponse, user } = await refreshSession(request);

  const { pathname } = request.nextUrl;

  // 2. Protección de rutas (activa cuando NEXT_PUBLIC_AUTH_ENABLED=true)
  if (process.env.NEXT_PUBLIC_AUTH_ENABLED === "true") {
    if (!user && !isPublicPath(pathname)) {
      const locale =
        pathname.match(/^\/([a-z]{2})(\/|$)/)?.[1] ?? routing.defaultLocale;
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("next", pathname);
      return Response.redirect(loginUrl);
    }

    if (user && isPublicPath(pathname) && !pathname.includes("/profile-select")) {
      const locale =
        pathname.match(/^\/([a-z]{2})(\/|$)/)?.[1] ?? routing.defaultLocale;
      return Response.redirect(new URL(`/${locale}/profile-select`, request.url));
    }
  }

  // 3. Middleware de i18n
  const intlResponse = handleI18n(request);

  // 4. Propagar cookies de sesión de Supabase a la respuesta de i18n
  for (const cookie of supabaseResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
