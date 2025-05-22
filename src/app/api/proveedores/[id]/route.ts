import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { updateProveedorSchema, proveedorIdSchema } from '@/lib/schemas/proveedor';
import { IProveedor, TipoProveedor } from '@/types';

// Definir RouteParams para Next.js 15 (params es una Promise)
interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Obtener un proveedor por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const response = NextResponse.next(); // Response para que Supabase pueda setear cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          return request.cookies.get(name)?.value;
        },
        set: (name: string, value: string, options: CookieOptions) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: CookieOptions) => {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const errRes = NextResponse.json({ error: 'No autenticado' }, { status: 401 });
      response.cookies.getAll().forEach(cookie => errRes.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
      return errRes;
    }

    const resolvedParams = await params;
    const validationParam = proveedorIdSchema.safeParse(resolvedParams.id);
    if (!validationParam.success) {
      const errRes = NextResponse.json({ error: 'ID de proveedor inválido' }, { status: 400 });
      response.cookies.getAll().forEach(cookie => errRes.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
      return errRes;
    }
    const proveedorId = validationParam.data;

    const { data: proveedor, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('id', proveedorId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const errRes = NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
        response.cookies.getAll().forEach(cookie => errRes.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
        return errRes;
      }
      console.error('Error al obtener proveedor:', error);
      const errRes = NextResponse.json({ error: error.message }, { status: 500 });
      response.cookies.getAll().forEach(cookie => errRes.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
      return errRes;
    }

    if (!proveedor) {
      const errRes = NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
      response.cookies.getAll().forEach(cookie => errRes.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
      return errRes;
    }
    
    const finalResponse = NextResponse.json(proveedor);
    response.cookies.getAll().forEach(cookie => finalResponse.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
    return finalResponse;

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido en el servidor';
    console.error('Excepción al obtener proveedor:', errorMessage);
    const errorResponse = NextResponse.json({ error: errorMessage }, { status: 500 });
    response.cookies.getAll().forEach(cookie => errorResponse.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
    return errorResponse;
  }
}

// PUT: Actualizar un proveedor por ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          return request.cookies.get(name)?.value;
        },
        set: (name: string, value: string, options: CookieOptions) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: CookieOptions) => {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const errRes = NextResponse.json({ error: 'No autenticado' }, { status: 401 });
      response.cookies.getAll().forEach(cookie => errRes.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
      return errRes;
    }

    const resolvedParams = await params;
    const validationParam = proveedorIdSchema.safeParse(resolvedParams.id);
    if (!validationParam.success) {
      const errRes = NextResponse.json({ error: 'ID de proveedor inválido' }, { status: 400 });
      response.cookies.getAll().forEach(cookie => errRes.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
      return errRes;
    }
    const proveedorId = validationParam.data;

    const body = await request.json();
    const validation = updateProveedorSchema.safeParse(body);

    if (!validation.success) {
      const errRes = NextResponse.json({ error: 'Datos de entrada inválidos', details: validation.error.flatten() }, { status: 400 });
      response.cookies.getAll().forEach(cookie => errRes.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
      return errRes;
    }

    const datosActualizados: Partial<IProveedor> = {
        ...validation.data,
        ...(validation.data.tipo && { tipo: validation.data.tipo as TipoProveedor }),
        updated_at: new Date().toISOString(),
    };

    const { data: proveedorActualizado, error } = await supabase
      .from('proveedores')
      .update(datosActualizados)
      .eq('id', proveedorId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const errRes = NextResponse.json({ error: 'Proveedor no encontrado o no autorizado para actualizar' }, { status: 404 });
        response.cookies.getAll().forEach(cookie => errRes.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
        return errRes;
      }
      console.error('Error al actualizar proveedor:', error);
      const errRes = NextResponse.json({ error: error.message }, { status: 500 });
      response.cookies.getAll().forEach(cookie => errRes.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
      return errRes;
    }

    if (!proveedorActualizado) {
      const errRes = NextResponse.json({ error: 'Proveedor no encontrado o no autorizado para actualizar' }, { status: 404 });
      response.cookies.getAll().forEach(cookie => errRes.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
      return errRes;
    }

    const finalResponse = NextResponse.json(proveedorActualizado);
    response.cookies.getAll().forEach(cookie => finalResponse.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
    return finalResponse;

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido en el servidor';
    console.error('Excepción al actualizar proveedor:', errorMessage);
    const errorResponse = NextResponse.json({ error: errorMessage }, { status: 500 });
    response.cookies.getAll().forEach(cookie => errorResponse.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
    return errorResponse;
  }
}

// DELETE: Eliminar un proveedor por ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          return request.cookies.get(name)?.value;
        },
        set: (name: string, value: string, options: CookieOptions) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: CookieOptions) => {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const errRes = NextResponse.json({ error: 'No autenticado' }, { status: 401 });
      response.cookies.getAll().forEach(cookie => errRes.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
      return errRes;
    }

    const resolvedParams = await params;
    const validationParam = proveedorIdSchema.safeParse(resolvedParams.id);
    if (!validationParam.success) {
      const errRes = NextResponse.json({ error: 'ID de proveedor inválido' }, { status: 400 });
      response.cookies.getAll().forEach(cookie => errRes.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
      return errRes;
    }
    const proveedorId = validationParam.data;

    const { error, count } = await supabase // count puede ser null
      .from('proveedores')
      .delete({ count: 'exact' }) // Pedir count para saber si se borró algo
      .eq('id', proveedorId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error al eliminar proveedor:', error);
      const errRes = NextResponse.json({ error: error.message }, { status: 500 });
      response.cookies.getAll().forEach(cookie => errRes.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
      return errRes;
    }
    
    if (count === 0) {
        const errRes = NextResponse.json({ error: 'Proveedor no encontrado o no autorizado para eliminar' }, { status: 404 });
        response.cookies.getAll().forEach(cookie => errRes.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
        return errRes;
    }

    const finalResponse = NextResponse.json({ message: 'Proveedor eliminado correctamente' }); // status 200 por defecto
    response.cookies.getAll().forEach(cookie => finalResponse.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
    return finalResponse;

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Error desconocido en el servidor';
    console.error('Excepción al eliminar proveedor:', errorMessage);
    const errorResponse = NextResponse.json({ error: errorMessage }, { status: 500 });
    response.cookies.getAll().forEach(cookie => errorResponse.cookies.set(cookie.name, cookie.value, cookie as CookieOptions));
    return errorResponse;
  }
} 