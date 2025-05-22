import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createEquipoItemSchema } from '@/lib/schemas/equipoItem';
import { IProducto } from '@/types/producto';
import { IProveedor } from '@/types/proveedor';

interface Params {
  id: string;
}

// Función auxiliar para parsear el cuerpo de la solicitud
async function parseRequestBody(request: NextRequest) {
  try {
    return await request.json();
  } catch (error) {
    return null; // O manejar el error de parseo como se prefiera
  }
}

// GET /api/productos/[id]/items
export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<Params> }) {
  const params = await paramsPromise;
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
          } catch (e) {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (e) {}
        },
      },
    }
  );

  const { id: productoId } = params;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    // 1. Verificar que el producto padre (productoId) existe y pertenece al usuario
    const { data: producto, error: productoError } = await supabase
      .from('productos')
      .select('id, user_id')
      .eq('id', productoId)
      .eq('user_id', user.id)
      .single();

    if (productoError || !producto) {
      return NextResponse.json({ error: 'Producto no encontrado o no pertenece al usuario.' }, { status: 404 });
    }

    // 2. Obtener los items del producto
    const { data: items, error: itemsError } = await supabase
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
      .eq('producto_id', productoId)
      .eq('user_id', user.id) 
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('Error GET /api/productos/[id]/items:', itemsError);
      return NextResponse.json({ error: itemsError.message, details: itemsError }, { status: 500 });
    }

    const formattedItems = items?.map(item => {
      const { productos, proveedores, ...restOfItem } = item as any; // Tipar item explícitamente o usar `as any` con cuidado
      return {
        ...restOfItem,
        producto_nombre: productos?.nombre,
        proveedor_nombre: proveedores?.nombre,
      };
    });

    return NextResponse.json(formattedItems || []);

  } catch (error: any) {
    console.error('Error inesperado en GET /api/productos/[id]/items:', error);
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}


// POST /api/productos/[id]/items
export async function POST(request: NextRequest, { params: paramsPromise }: { params: Promise<Params> }) {
  const params = await paramsPromise;
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
          } catch (e) {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (e) {}
        },
      },
    }
  );

  const { id: productoId } = params;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    // 1. Verificar que el producto padre (productoId) existe y pertenece al usuario
    const { data: productoPadre, error: productoError } = await supabase
      .from('productos')
      .select('id, user_id')
      .eq('id', productoId)
      .eq('user_id', user.id)
      .single() as { data: Pick<IProducto, 'id' | 'user_id'> | null; error: any };

    if (productoError || !productoPadre) {
      return NextResponse.json({ error: 'Producto no encontrado o no pertenece al usuario para asociar el ítem.' }, { status: 404 });
    }

    const rawBody = await parseRequestBody(request);
    if (rawBody === null) {
        return NextResponse.json({ error: "Cuerpo de la solicitud inválido o vacío." }, { status: 400 });
    }
    
    const validation = createEquipoItemSchema.safeParse(rawBody);

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const errorMessages = Object.entries(fieldErrors)
        .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
        .join('; ');
      return NextResponse.json({ error: `Datos inválidos: ${errorMessages}`, details: validation.error.format() }, { status: 400 });
    }

    const newItemData = validation.data;

    // 2. Verificar que el proveedor_id (si se proporciona) existe y pertenece al usuario
    if (newItemData.proveedor_id) {
      const { data: proveedor, error: proveedorError } = await supabase
        .from('proveedores')
        .select('id')
        .eq('id', newItemData.proveedor_id)
        .eq('user_id', user.id)
        .single() as { data: Pick<IProveedor, 'id'> | null; error: any };

      if (proveedorError || !proveedor) {
        return NextResponse.json({ error: 'Proveedor no encontrado o no pertenece al usuario.'}, { status: 404 });
      }
    }

    // 3. Verificar unicidad de numero_serie para este producto y usuario (si se proporciona numero_serie)
    if (newItemData.numero_serie) {
        const { data: existingItem, error: existingItemError } = await supabase
            .from('equipo_items')
            .select('id')
            .eq('user_id', user.id)
            .eq('producto_id', productoId)
            .eq('numero_serie', newItemData.numero_serie)
            .maybeSingle();

        if (existingItemError && existingItemError.code !== 'PGRST116') { 
            console.error('Error verificando unicidad de numero_serie:', existingItemError);
            return NextResponse.json({ error: 'Error al verificar número de serie.', details: existingItemError }, { status: 500 });
        }
        if (existingItem) {
            return NextResponse.json({ error: `El número de serie '${newItemData.numero_serie}' ya existe para este producto.` }, { status: 409 });
        }
    }

    // 4. Crear el nuevo ítem de equipo
    const itemToInsert = {
        ...newItemData,
        producto_id: productoId, 
        user_id: user.id, 
      };

    const { data: createdItem, error: createError } = await supabase
      .from('equipo_items')
      .insert(itemToInsert)
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

    if (createError) {
      console.error('Error POST /api/productos/[id]/items:', createError);
      if (createError.code === '23505') {
        if (createError.message.includes('uq_equipo_item_user_producto_nserie')) {
          return NextResponse.json({ error: `Error de unicidad: El número de serie '${newItemData.numero_serie}' ya existe para este producto.` }, { status: 409 });
        }
        return NextResponse.json({ error: 'Error de unicidad al crear el ítem.', details: createError.message }, { status: 409 });
      }
      return NextResponse.json({ error: createError.message, details: createError }, { status: 500 });
    }
    
    if (!createdItem) {
        return NextResponse.json({ error: 'No se pudo crear el ítem, la operación no devolvió datos.' }, { status: 500 });
    }
    
    const { productos, proveedores, ...restOfCreatedItem } = createdItem as any;
    const formattedItem = {
      ...restOfCreatedItem,
      producto_nombre: productos?.nombre,
      proveedor_nombre: proveedores?.nombre,
    };

    return NextResponse.json(formattedItem, { status: 201 });

  } catch (error: any) {
    console.error('Error inesperado en POST /api/productos/[id]/items:', error);
    if (error instanceof NextResponse) { // Si ya es una respuesta de error, relanzarla.
        return error;
    }
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
}

// export const runtime = 'edge'; 