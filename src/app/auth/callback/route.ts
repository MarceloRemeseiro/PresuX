import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    // Para Route Handlers, cookies() de next/headers es la forma de acceder.
    // createServerClient necesita un objeto cookies con get, set, y remove.
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // La API de Route Handler se encarga de aplicar las cookies a la respuesta saliente.
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set(name, '', options);
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Supabase Error exchanging code for session:', error.message);
      // Es útil pasar el error específico si es posible, o al menos un indicador.
      const errorQueryParam = encodeURIComponent(error.message);
      return NextResponse.redirect(`${origin}/login?error=session_exchange_failed&message=${errorQueryParam}`);
    }
  }

  // Si no hay código, redirigir a login con un error.
  console.error('/auth/callback: No code found in query params.');
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed&message=Code_not_found`);
} 