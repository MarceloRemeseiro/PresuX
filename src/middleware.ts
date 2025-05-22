import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// La función createSupabaseServerClient (líneas 5-31) ha sido eliminada porque no se utilizaba.

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name:string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH_FOR_DEV === 'true') {
    console.log('Auth middleware desactivado para desarrollo vía DISABLE_AUTH_FOR_DEV');
    return response;
  }

  const { pathname } = request.nextUrl;
  const protectedPaths = ['/dashboard', '/clientes', '/api/clientes'];

  if (user && (pathname === '/login' || pathname === '/signup')) {
    console.log(`Middleware: Usuario autenticado (${user.id}) en ${pathname}. Redirigiendo a /dashboard.`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!user && protectedPaths.some(path => pathname.startsWith(path))) {
    console.log(`Middleware: Usuario NO autenticado en ruta protegida ${pathname}. Redirigiendo a /login.`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  if (!user && pathname.startsWith('/api/') && protectedPaths.some(path => pathname.startsWith(path))) {
    console.log(`Middleware: Usuario NO autenticado en API protegida ${pathname}. Devolviendo 401.`);
      return new NextResponse(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
  }
  
  return response;
}

// Configuración del Matcher: Especifica qué rutas deben pasar por este middleware.
// Evita ejecutar el middleware en rutas de assets, etc.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Y cualquier otra ruta pública que no necesite lógica de sesión.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*\\.js|icon-.*\\.png|.*\\.svg).*)',
  ],
}; 