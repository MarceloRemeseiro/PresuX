import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { updateEquipoItemSchema } from '@/lib/schemas/equipoItem';
import { IProducto } from '@/types/producto';
import { IProveedor } from '@/types/proveedor';

interface RouteParams {
  id: string;
  itemId: string;
}

async function parseRequestBody(request: NextRequest) {
  try {
    return await request.json();
  } catch (error) {
    return null;
  }
}

// GET /api/productos/[id]/items/[itemId]
export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<RouteParams> }) {
  const params = await paramsPromise;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (e) {} },
        remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch (e) {} },
      },
    }
  );

  const { id: productoId, itemId } = params;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    // 1. Verificar que el producto padre existe y pertenece al usuario
    const { data: producto, error: productoError } = await supabase
      .from('productos')
      .select('id')
      .eq('id', productoId)
      .eq('user_id', user.id)
      .single();

    if (productoError || !producto) {
      return NextResponse.json({ error: 'Producto padre no encontrado o no pertenece al usuario.' }, { status: 404 });
    }

    // 2. Obtener el ítem específico
    const { data: item, error: itemError } = await supabase
      .from('equipo_items')
      .select(`
        id,
        numero_serie,
        notas_internas,
        estado,
        fecha_compra,
        precio_compra,
        created_at,
        updated_at,
        producto_id,
        proveedor_id,
        productos ( nombre ),
        proveedores ( nombre )
      `)
      .eq('id', itemId)
      .eq('producto_id', productoId)
      .eq('user_id', user.id)
      .single();

    if (itemError) {
      if (itemError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Ítem no encontrado, no pertenece al producto especificado o al usuario.' }, { status: 404 });
      }
      console.error('Error GET /api/productos/[id]/items/[itemId]:', itemError);
      return NextResponse.json({ error: itemError.message, details: itemError }, { status: 500 });
    }

    if (!item) {
        return NextResponse.json({ error: 'Ítem no encontrado.' }, { status: 404 });
    }

    const { productos, proveedores, ...restOfItem } = item as any;
    const formattedItem = {
      ...restOfItem,
      producto_nombre: productos?.nombre,
      proveedor_nombre: proveedores?.nombre,
    };

    return NextResponse.json(formattedItem);

  } catch (error: any) {
    console.error('Error inesperado en GET /api/productos/[id]/items/[itemId]:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}

// PUT /api/productos/[id]/items/[itemId]
export async function PUT(request: NextRequest, { params: paramsPromise }: { params: Promise<RouteParams> }) {
  const params = await paramsPromise;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (e) {} },
        remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch (e) {} },
      },
    }
  );

  const { id: productoId, itemId } = params;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    // 1. Verificar que el ítem a actualizar existe y pertenece al usuario y al producto_id
    const { data: existingItemData, error: fetchError } = await supabase
      .from('equipo_items')
      .select('id, user_id, producto_id, numero_serie')
      .eq('id', itemId)
      .eq('producto_id', productoId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingItemData) {
      return NextResponse.json({ error: 'Ítem no encontrado para actualizar, no pertenece al producto o usuario.' }, { status: 404 });
    }

    const rawBody = await parseRequestBody(request);
    if (rawBody === null) {
        return NextResponse.json({ error: "Cuerpo de la solicitud inválido o vacío." }, { status: 400 });
    }

    const validation = updateEquipoItemSchema.safeParse(rawBody);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const errorMessages = Object.entries(fieldErrors)
        .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
        .join('; ');
      return NextResponse.json({ error: `Datos inválidos: ${errorMessages}`, details: validation.error.format() }, { status: 400 });
    }

    const updateData = validation.data;

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No se proporcionaron datos para actualizar.' }, { status: 400 });
    }

    // 2. Verificar proveedor_id si se actualiza
    if (updateData.proveedor_id) {
      const { data: proveedor, error: proveedorError } = await supabase
        .from('proveedores')
        .select('id')
        .eq('id', updateData.proveedor_id)
        .eq('user_id', user.id)
        .single() as { data: Pick<IProveedor, 'id'> | null; error: any };

      if (proveedorError || !proveedor) {
        return NextResponse.json({ error: 'Proveedor especificado no encontrado o no pertenece al usuario.' }, { status: 404 });
      }
    }

    // 3. Verificar unicidad de numero_serie si cambia y no es nulo
    if (updateData.numero_serie && updateData.numero_serie !== existingItemData.numero_serie) {
      const { data: conflictingItem, error: conflictError } = await supabase
        .from('equipo_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('producto_id', productoId)
        .eq('numero_serie', updateData.numero_serie)
        .neq('id', itemId)
        .maybeSingle();

      if (conflictError && conflictError.code !== 'PGRST116') {
        console.error('Error verificando unicidad de numero_serie en PUT /api/productos/[id]/items/[itemId]:', conflictError);
        return NextResponse.json({ error: 'Error al verificar número de serie.', details: conflictError }, { status: 500 });
      }
      if (conflictingItem) {
        return NextResponse.json({ error: `El número de serie '${updateData.numero_serie}' ya existe para este producto.` }, { status: 409 });
      }
    }

    // 4. Actualizar el ítem
    const { data: updatedItem, error: updateError } = await supabase
      .from('equipo_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('user_id', user.id)
      .eq('producto_id', productoId)
      .select(`
        id,
        numero_serie,
        notas_internas,
        estado,
        fecha_compra,
        precio_compra,
        created_at,
        updated_at,
        producto_id,
        proveedor_id,
        productos ( nombre ),
        proveedores ( nombre )
      `)
      .single();

    if (updateError) {
      console.error('Error PUT /api/productos/[id]/items/[itemId]:', updateError);
      if (updateError.code === '23505') {
        return NextResponse.json({ error: `Conflicto al actualizar: el número de serie '${updateData.numero_serie}' probablemente ya existe.`, details: updateError.message }, { status: 409 });
      }
      return NextResponse.json({ error: updateError.message, details: updateError }, { status: 500 });
    }

    if (!updatedItem) {
        return NextResponse.json({ error: 'No se pudo actualizar el ítem o no se encontró después de actualizar.' }, { status: 500 });
    }

    const { productos, proveedores, ...restOfUpdatedItem } = updatedItem as any;
    const formattedUpdatedItem = {
      ...restOfUpdatedItem,
      producto_nombre: productos?.nombre,
      proveedor_nombre: proveedores?.nombre,
    };

    return NextResponse.json(formattedUpdatedItem);

  } catch (error: any) {
    console.error('Error inesperado en PUT /api/productos/[id]/items/[itemId]:', error);
     if (error instanceof NextResponse) { return error; }
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}

// DELETE /api/productos/[id]/items/[itemId]
export async function DELETE(request: NextRequest, { params: paramsPromise }: { params: Promise<RouteParams> }) {
  const params = await paramsPromise;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (e) {} },
        remove(name: string, options: CookieOptions) { try { cookieStore.set({ name, value: '', ...options }); } catch (e) {} },
      },
    }
  );

  const { id: productoId, itemId } = params;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from('equipo_items')
      .delete()
      .eq('id', itemId)
      .eq('producto_id', productoId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error DELETE /api/productos/[id]/items/[itemId]:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar el ítem.', details: deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Ítem eliminado correctamente' }, { status: 200 });

  } catch (error: any) {
    console.error('Error inesperado en DELETE /api/productos/[id]/items/[itemId]:', error);
    if (error instanceof NextResponse) { return error; }
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}

// export const runtime = 'edge'; 