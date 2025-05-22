import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { createProductoSchema } from '@/lib/schemas/producto';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Por defecto, se ordenan por nombre. Se podrían añadir query params para más opciones.
    // Incluimos los nombres de marca y categoría directamente.
    const { data: productos, error } = await supabase
      .from('productos')
      .select(`
        *,
        marcas (nombre),
        categorias_producto (nombre)
      `)
      .eq('user_id', user.id)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error fetching productos:', error);
      return NextResponse.json({ error: 'Error al obtener los productos: ' + error.message }, { status: 500 });
    }

    // Ajustar la estructura de los datos para que marca y categoría sean más accesibles
    const formattedProductos = productos.map(p => ({
      ...p,
      marca_nombre: p.marcas?.nombre || null,
      categoria_nombre: p.categorias_producto?.nombre || null,
      // Eliminar los objetos anidados si no se quieren en la respuesta final
      // marcas: undefined,
      // categorias_producto: undefined,
    }));

    return NextResponse.json(formattedProductos);

  } catch (e) {
    console.error('Error inesperado en GET /api/productos:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createProductoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Datos de entrada inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { nombre, categoria_id, marca_id, ...restOfData } = validation.data;

    // 1. Verificar que la categoría existe y pertenece al usuario
    const { data: categoria, error: categoriaError } = await supabase
      .from('categorias_producto')
      .select('id')
      .eq('id', categoria_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (categoriaError) {
      console.error('Error verificando categoría:', categoriaError);
      return NextResponse.json({ error: 'Error al verificar la categoría: ' + categoriaError.message }, { status: 500 });
    }
    if (!categoria) {
      return NextResponse.json({ error: 'La categoría seleccionada no es válida o no existe.' }, { status: 400 });
    }

    // 2. Si se proporciona marca_id, verificar que existe y pertenece al usuario
    if (marca_id) {
      const { data: marca, error: marcaError } = await supabase
        .from('marcas')
        .select('id')
        .eq('id', marca_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (marcaError) {
        console.error('Error verificando marca:', marcaError);
        return NextResponse.json({ error: 'Error al verificar la marca: ' + marcaError.message }, { status: 500 });
      }
      if (!marca) {
        return NextResponse.json({ error: 'La marca seleccionada no es válida o no existe.' }, { status: 400 });
      }
    }
    
    // 3. Verificar unicidad del nombre del producto para el usuario (la BD también lo hará)
    const { data: existingProducto, error: selectError } = await supabase
      .from('productos')
      .select('id')
      .eq('user_id', user.id)
      .eq('nombre', nombre)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error al verificar producto existente:', selectError);
        return NextResponse.json({ error: 'Error al verificar producto: ' + selectError.message }, { status: 500 });
    }
    if (existingProducto) {
        return NextResponse.json({ error: 'Ya existe un producto con este nombre.' }, { status: 409 });
    }

    // 4. Insertar el producto
    const productoData = {
      ...restOfData,
      nombre,
      categoria_id,
      marca_id: marca_id || null, // Asegurar que sea null si no se provee
      user_id: user.id,
    };

    const { data: nuevoProducto, error: insertError } = await supabase
      .from('productos')
      .insert(productoData)
      .select(`
        *,
        marcas (nombre),
        categorias_producto (nombre)
      `)
      .single();

    if (insertError) {
      console.error('Error creating producto:', insertError);
      if (insertError.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Ya existe un producto con este nombre.' }, { status: 409 });
      }
      // Podrían haber otros errores de FK si las verificaciones anteriores fallan por alguna razón de concurrencia
      return NextResponse.json({ error: 'Error al crear el producto: ' + insertError.message }, { status: 500 });
    }
    
    const formattedNuevoProducto = {
        ...nuevoProducto,
        marca_nombre: nuevoProducto.marcas?.nombre || null,
        categoria_nombre: nuevoProducto.categorias_producto?.nombre || null,
        // marcas: undefined,
        // categorias_producto: undefined,
    };

    return NextResponse.json(formattedNuevoProducto, { status: 201 });

  } catch (e) {
    console.error('Error inesperado en POST /api/productos:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 