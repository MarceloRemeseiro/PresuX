import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createProveedorSchema } from '@/lib/schemas/proveedor';
import { IProveedor, TipoProveedor } from '@/types';

// GET: Listar todos los proveedores del usuario actual
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
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: proveedores, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al obtener proveedores:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(proveedores);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido en el servidor';
    console.error('Excepción al obtener proveedores:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST: Crear un nuevo proveedor
export async function POST(request: NextRequest) {
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
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createProveedorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Datos de entrada inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const nuevoProveedorData: Omit<IProveedor, 'id' | 'created_at' | 'updated_at'> = {
      ...validation.data,
      user_id: user.id,
      tipo: validation.data.tipo as TipoProveedor, 
    };

    const { data: proveedorCreado, error } = await supabase
      .from('proveedores')
      .insert(nuevoProveedorData)
      .select()
      .single();

    if (error) {
      console.error('Error al crear proveedor:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(proveedorCreado, { status: 201 });

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido en el servidor';
    console.error('Excepción al crear proveedor:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 