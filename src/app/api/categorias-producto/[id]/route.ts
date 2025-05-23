import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { z } from 'zod';
import { categoriaProductoIdSchema, updateCategoriaProductoSchema } from '@/lib/schemas/categoriaProducto';

// Helper para obtener el ID validado de los params
async function getValidatedId(params: Promise<{ id: string }>): Promise<string | null> {
  try {
    const resolvedParams = await params;
    console.log('DEBUG - Params recibidos:', resolvedParams);
    
    const paramsValidation = categoriaProductoIdSchema.safeParse(resolvedParams.id);
    if (!paramsValidation.success) {
      console.log('DEBUG - Error validación ID:', paramsValidation.error);
      return null;
    }
    return paramsValidation.data;
  } catch (error) {
    console.log('DEBUG - Error obteniendo params:', error);
    return null;
  }
}

// GET: Obtener una categoría específica
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const categoriaId = await getValidatedId(params);
    if (!categoriaId) {
      return NextResponse.json({ error: 'ID de categoría inválido' }, { status: 400 });
    }

    const { data: categoria, error } = await supabase
      .from('categorias_producto')
      .select('*')
      .eq('id', categoriaId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
      }
      console.error('Error fetching categoria_producto:', error);
      return NextResponse.json({ error: 'Error al obtener la categoría: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(categoria);

  } catch (e) {
    console.error('Error inesperado en GET /api/categorias-producto/[id]:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Actualizar una categoría específica
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const categoriaId = await getValidatedId(params);
    if (!categoriaId) {
      return NextResponse.json({ error: 'ID de categoría inválido' }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateCategoriaProductoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Datos de entrada inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { nombre } = validation.data;

    if (nombre) {
      const { data: existingCategoria, error: selectError } = await supabase
        .from('categorias_producto')
        .select('id')
        .eq('user_id', user.id)
        .eq('nombre', nombre)
        .neq('id', categoriaId)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error verificando unicidad de nombre de categoría al actualizar:', selectError);
        return NextResponse.json({ error: 'Error al verificar nombre: ' + selectError.message }, { status: 500 });
      }

      if (existingCategoria) {
        return NextResponse.json({ error: 'Ya existe otra categoría de producto con este nombre.' }, { status: 409 });
      }
    }

    const { data: updatedCategoria, error: updateError } = await supabase
      .from('categorias_producto')
      .update(validation.data)
      .eq('id', categoriaId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Categoría no encontrada o no se pudo actualizar' }, { status: 404 });
      }
      if (updateError.code === '23505') {
        return NextResponse.json({ error: 'Ya existe una categoría de producto con este nombre.' }, { status: 409 });
      }
      console.error('Error updating categoria_producto:', updateError);
      return NextResponse.json({ error: 'Error al actualizar la categoría: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedCategoria);

  } catch (e) {
    console.error('Error inesperado en PUT /api/categorias-producto/[id]:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Eliminar una categoría específica
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const categoriaId = await getValidatedId(params);
    if (!categoriaId) {
      return NextResponse.json({ error: 'ID de categoría inválido' }, { status: 400 });
    }

    // Verificar si la categoría existe y pertenece al usuario
    const { data: categoria, error: categoriaError } = await supabase
      .from('categorias_producto')
      .select('id, nombre')
      .eq('id', categoriaId)
      .eq('user_id', user.id)
      .single();

    if (categoriaError || !categoria) {
      return NextResponse.json({ error: 'Categoría no encontrada o no pertenece al usuario.' }, { status: 404 });
    }

    // Verificar si hay productos que usan esta categoría
    const { data: productosUsandoCategoria, error: productosError } = await supabase
      .from('productos')
      .select('id, nombre')
      .eq('categoria_id', categoriaId)
      .eq('user_id', user.id)
      .limit(5); // Limitamos a 5 para mostrar ejemplos

    if (productosError) {
      console.error('Error verificando productos que usan la categoría:', productosError);
      return NextResponse.json({ error: 'Error al verificar productos asociados: ' + productosError.message }, { status: 500 });
    }

    if (productosUsandoCategoria && productosUsandoCategoria.length > 0) {
      const ejemplosProductos = productosUsandoCategoria.map(p => p.nombre).join(', ');
      const mensaje = productosUsandoCategoria.length === 1 
        ? `No se puede eliminar la categoría "${categoria.nombre}" porque está siendo usada por el producto: ${ejemplosProductos}.`
        : `No se puede eliminar la categoría "${categoria.nombre}" porque está siendo usada por ${productosUsandoCategoria.length} productos${productosUsandoCategoria.length === 5 ? ' o más' : ''}: ${ejemplosProductos}${productosUsandoCategoria.length === 5 ? '...' : ''}.`;
      
      return NextResponse.json({ 
        error: mensaje,
        code: 'CATEGORY_IN_USE',
        productCount: productosUsandoCategoria.length 
      }, { status: 409 });
    }

    // Si no hay productos usando la categoría, proceder con la eliminación
    const { error: deleteError, count } = await supabase
      .from('categorias_producto')
      .delete({ count: 'exact' })
      .eq('id', categoriaId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting categoria_producto:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar la categoría: ' + deleteError.message }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json({ error: 'Categoría no encontrada o no pertenece al usuario.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Categoría eliminada correctamente' }, { status: 200 });

  } catch (e) {
    console.error('Error inesperado en DELETE /api/categorias-producto/[id]:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 