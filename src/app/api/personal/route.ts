import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createPersonalSchema } from '@/lib/schemas/personal';
import { IPersonal } from '@/types';

// GET /api/personal - Obtener todo el personal
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
            console.error("Error al establecer cookie:", error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch (error) {
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
    const { data: personal, error } = await supabase
      .from('personal')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al obtener personal:', error);
      return NextResponse.json({ error: 'Error al obtener personal', details: error.message }, { status: 500 });
    }

    return NextResponse.json(personal as IPersonal[]);
  } catch (e: unknown) {
    console.error('Excepción en GET /api/personal:', e);
    if (e instanceof Error) {
      return NextResponse.json({ error: 'Excepción en el servidor', details: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Excepción desconocida en el servidor' }, { status: 500 });
  }
}

// POST /api/personal - Crear nuevo personal
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
            console.error("Error al establecer cookie:", error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch (error) {
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
    // Fix para request.json() que a veces devuelve string
    const rawBody = await request.json();
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    
    const validation = createPersonalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Datos de personal inválidos', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const nuevoPersonalData = {
      ...validation.data,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('personal')
      .insert(nuevoPersonalData)
      .select()
      .single();

    if (error) {
      console.error('Error al crear personal:', error);
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: 'Error al crear personal: posible duplicado', 
          details: error.message 
        }, { status: 409 });
      }
      return NextResponse.json({ error: 'Error al crear personal', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ personal: data as IPersonal }, { status: 201 });
  } catch (e: unknown) {
    console.error('Excepción en POST /api/personal:', e);
    if (e instanceof Error) {
      return NextResponse.json({ error: 'Excepción en el servidor', details: e.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Excepción desconocida en el servidor' }, { status: 500 });
  }
} 