import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { z } from 'zod';
import { productoIdSchema, updateProductoSchema } from '@/lib/schemas/producto';

// Helper para obtener el ID validado de los params
async function getValidatedProductId(params: unknown): Promise<string | null> {
  const paramsValidation = z.object({ id: productoIdSchema }).safeParse(params);
  if (!paramsValidation.success) {
    return null;
  }
  return paramsValidation.data.id;
}

// GET: Obtener un producto específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    const productoId = await getValidatedProductId(params);
    if (!productoId) {
      return NextResponse.json({ error: 'ID de producto inválido' }, { status: 400 });
    }

    const { data: producto, error } = await supabase
      .from('productos')
      .select(`
        *,
        marcas (id, nombre),
        categorias_producto (id, nombre)
      `)
      .eq('id', productoId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
      }
      console.error('Error fetching producto:', error);
      return NextResponse.json({ error: 'Error al obtener el producto: ' + error.message }, { status: 500 });
    }
    
    const formattedProducto = {
        ...producto,
        marca_nombre: producto.marcas?.nombre || null,
        categoria_nombre: producto.categorias_producto?.nombre || null,
        // Si se quieren los IDs de marca/categoría directamente en el objeto producto
        // además de los objetos anidados, se pueden extraer aquí.
        // marca_id: producto.marcas?.id || null, 
        // categoria_id: producto.categorias_producto?.id || null,
    };

    return NextResponse.json(formattedProducto);

  } catch (e) {
    console.error('Error inesperado en GET /api/productos/[id]:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Actualizar un producto específico
export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const productoId = await getValidatedProductId(params);
    if (!productoId) {
      return NextResponse.json({ error: 'ID de producto inválido' }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateProductoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Datos de entrada inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { nombre, categoria_id, marca_id, ...restOfData } = validation.data;
    const updateData: Record<string, any> = { ...restOfData };

    if (nombre) {
      updateData.nombre = nombre;
      // Verificar unicidad del nuevo nombre si se está cambiando
      const { data: existingProducto, error: selectError } = await supabase
        .from('productos')
        .select('id')
        .eq('user_id', user.id)
        .eq('nombre', nombre)
        .neq('id', productoId)
        .maybeSingle();
      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error verificando unicidad de nombre de producto al actualizar:', selectError);
        return NextResponse.json({ error: 'Error al verificar nombre: ' + selectError.message }, { status: 500 });
      }
      if (existingProducto) {
        return NextResponse.json({ error: 'Ya existe otro producto con este nombre.' }, { status: 409 });
      }
    }

    if (categoria_id) {
      const { data: categoria, error: categoriaError } = await supabase
        .from('categorias_producto')
        .select('id')
        .eq('id', categoria_id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (categoriaError || !categoria) {
        return NextResponse.json({ error: 'La categoría seleccionada no es válida o no existe.' }, { status: 400 });
      }
      updateData.categoria_id = categoria_id;
    }

    if (marca_id !== undefined) { // Permitir establecer marca_id a null
        if (marca_id === null) {
            updateData.marca_id = null;
        } else {
            const { data: marca, error: marcaError } = await supabase
                .from('marcas')
                .select('id')
                .eq('id', marca_id)
                .eq('user_id', user.id)
                .maybeSingle();
            if (marcaError || !marca) {
                return NextResponse.json({ error: 'La marca seleccionada no es válida o no existe.' }, { status: 400 });
            }
            updateData.marca_id = marca_id;
        }
    }
    
    if (Object.keys(updateData).length === 0 && nombre === undefined && categoria_id === undefined && marca_id === undefined) {
        return NextResponse.json({ message: "No hay campos para actualizar." }, { status: 200 });
    }

    const { data: updatedProducto, error: updateError } = await supabase
      .from('productos')
      .update(updateData)
      .eq('id', productoId)
      .eq('user_id', user.id)
      .select(`
        *,
        marcas (id, nombre),
        categorias_producto (id, nombre)
      `)
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Producto no encontrado o no se pudo actualizar' }, { status: 404 });
      }
      if (updateError.code === '23505') { 
        return NextResponse.json({ error: 'Ya existe un producto con este nombre.' }, { status: 409 });
      }
      console.error('Error updating producto:', updateError);
      return NextResponse.json({ error: 'Error al actualizar el producto: ' + updateError.message }, { status: 500 });
    }

    const formattedUpdatedProducto = {
        ...updatedProducto,
        marca_nombre: updatedProducto.marcas?.nombre || null,
        categoria_nombre: updatedProducto.categorias_producto?.nombre || null,
    };

    return NextResponse.json(formattedUpdatedProducto);

  } catch (e) {
    console.error('Error inesperado en PUT /api/productos/[id]:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Eliminar un producto específico
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    const productoId = await getValidatedProductId(params);
    if (!productoId) {
      return NextResponse.json({ error: 'ID de producto inválido' }, { status: 400 });
    }

    // Opcional: Verificar si hay EquipoItems asociados antes de eliminar (si la FK no es ON DELETE CASCADE)
    // Por ahora, asumimos que si se elimina un producto, sus items también deberían (o manejarse con FK)

    const { error: deleteError, count } = await supabase
      .from('productos')
      .delete({ count: 'exact' })
      .eq('id', productoId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting producto:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar el producto: ' + deleteError.message }, { status: 500 });
    }
    
    if (count === 0) {
      return NextResponse.json({ error: 'Producto no encontrado o no pertenece al usuario.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Producto eliminado correctamente' }, { status: 200 });

  } catch (e) {
    console.error('Error inesperado en DELETE /api/productos/[id]:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 