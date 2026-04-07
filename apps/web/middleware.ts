import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { refreshSession } from "@/lib/supabase/middleware";

const handleI18n = createIntlMiddleware(routing);

// Rutas que no requieren sesión activa
const PUBLIC_PATHS = ["/login", "/register", "/join", "/profile-select"];

function isPublicPath(pathname: string): boolean {
  // Quita el prefijo de locale: /es/login → /login
  const withoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");
  return PUBLIC_PATHS.some(
    (p) => withoutLocale === p || withoutLocale.startsWith(p + "/")
  );
}

export async function middleware(request: NextRequest) {
  // 1. Refrescar sesión de Supabase (actualiza cookies de forma correcta)
  const { response: supabaseResponse, user } = await refreshSession(request);

  const { pathname } = request.nextUrl;

  // 2. Protección de rutas (solo activa cuando AUTH_ENABLED=true en .env)
  if (process.env.NEXT_PUBLIC_AUTH_ENABLED === "true") {
    if (!user && !isPublicPath(pathname)) {
      const locale =
        pathname.match(/^\/([a-z]{2})(\/|$)/)?.[1] ??
        routing.defaultLocale;
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("next", pathname);
      return Response.redirect(loginUrl);
    }

    if (user && isPublicPath(pathname)) {
      const locale =
        pathname.match(/^\/([a-z]{2})(\/|$)/)?.[1] ??
        routing.defaultLocale;
      return Response.redirect(new URL(`/${locale}/dashboard`, request.url));
    }
  }

  // 3. Middleware de i18n (gestión de locale)
  const intlResponse = handleI18n(request);

  // 4. Copiar cookies de sesión de Supabase a la respuesta de i18n
  for (const cookie of supabaseResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  }

  return intlResponse;
}

export const config = {
  matcher: [
    // Excluir archivos estáticos y rutas internas de Next.js
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
