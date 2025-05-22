import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_e: unknown) {
            // Ignorar error en Server Components, no debería ocurrir en API Routes si se maneja bien el response.
            // En Route Handlers, cookieStore.set() es síncrono una vez que cookieStore está resuelto.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_e: unknown) {
            // Ignorar error
          }
        },
      },
    }
  );
} 