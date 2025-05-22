import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ClienteSchema } from '@/lib/schemas';
import { ICliente } from '@/types';

// GET /api/clientes - Obtener todos los clientes
export async function GET() {
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
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // La API de cookies puede fallar en modo API route
            // Por eso capturamos este error para evitar que rompa
            console.error("Error al establecer cookie:", error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch (error) {
            // La API de cookies puede fallar en modo API route
            console.error("Error al eliminar cookie:", error);
          }
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }

  try {
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al obtener clientes:', error);
      return NextResponse.json({ error: 'Error al obtener clientes', details: error.message }, { status: 500 });
    }

    return NextResponse.json(clientes as ICliente[]);
  } catch (e: unknown) {
    console.error('Excepción en GET /api/clientes:', e);
    if (e instanceof Error) {
      return NextResponse.json({ error: 'Excepción en el servidor', details: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Excepción desconocida en el servidor' }, { status: 500 });
  }
}

// POST /api/clientes - Crear un nuevo cliente
export async function POST(request: Request) {
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
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // La API de cookies puede fallar en modo API route
            console.error("Error al establecer cookie:", error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch (error) {
            // La API de cookies puede fallar en modo API route
            console.error("Error al eliminar cookie:", error);
          }
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = ClienteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Datos de cliente inválidos', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const nuevoClienteData = {
      ...validation.data,
      user_id: user.id, // Asegurar que el cliente se asocia al usuario autenticado
    };

    const { data, error } = await supabase
      .from('clientes')
      .insert(nuevoClienteData)
      .select()
      .single(); // Para obtener el cliente creado

    if (error) {
      console.error('Error al crear cliente:', error);
      // Manejar errores específicos de la BD, ej. NIF duplicado si tuvieras un constraint UNIQUE
      if (error.code === '23505') { // Código de error de violación de unicidad en PostgreSQL
         return NextResponse.json({ error: 'Error al crear cliente: posible duplicado (ej. NIF)', details: error.message }, { status: 409 }); // Conflict
      }
      return NextResponse.json({ error: 'Error al crear cliente', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data as ICliente, { status: 201 });
  } catch (e: unknown) {
    console.error('Excepción en POST /api/clientes:', e);
    if (e instanceof Error) {
      return NextResponse.json({ error: 'Excepción en el servidor', details: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Excepción desconocida en el servidor' }, { status: 500 });
  }
} 