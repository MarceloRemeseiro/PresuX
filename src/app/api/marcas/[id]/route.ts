import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { z } from 'zod';
import { marcaIdSchema, updateMarcaSchema } from '@/lib/schemas/marca';

// Helper para obtener el ID validado de los params
async function getValidatedId(params: Promise<{ id: string }>): Promise<string | null> {
  try {
    const resolvedParams = await params;
    console.log('DEBUG - Params recibidos (marcas):', resolvedParams);
    
    const paramsValidation = marcaIdSchema.safeParse(resolvedParams.id);
    if (!paramsValidation.success) {
      console.log('DEBUG - Error validación ID (marcas):', paramsValidation.error);
      return null;
    }
    return paramsValidation.data;
  } catch (error) {
    console.log('DEBUG - Error obteniendo params (marcas):', error);
    return null;
  }
}

// GET: Obtener una marca específica
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

    const marcaId = await getValidatedId(params);
    if (!marcaId) {
      return NextResponse.json({ error: 'ID de marca inválido' }, { status: 400 });
    }

    const { data: marca, error } = await supabase
      .from('marcas')
      .select('*')
      .eq('id', marcaId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Marca no encontrada' }, { status: 404 });
      }
      console.error('Error fetching marca:', error);
      return NextResponse.json({ error: 'Error al obtener la marca: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(marca);

  } catch (e) {
    console.error('Error inesperado en GET /api/marcas/[id]:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Actualizar una marca específica
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

    const marcaId = await getValidatedId(params);
    if (!marcaId) {
      return NextResponse.json({ error: 'ID de marca inválido' }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateMarcaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Datos de entrada inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { nombre } = validation.data;

    // Si se está actualizando el nombre, verificar que no exista otra marca del mismo usuario con ese nuevo nombre
    if (nombre) {
      const { data: existingMarca, error: selectError } = await supabase
        .from('marcas')
        .select('id')
        .eq('user_id', user.id)
        .eq('nombre', nombre)
        .neq('id', marcaId) // Excluir la marca actual de la búsqueda
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error verificando unicidad de nombre de marca al actualizar:', selectError);
        return NextResponse.json({ error: 'Error al verificar nombre: ' + selectError.message }, { status: 500 });
      }

      if (existingMarca) {
        return NextResponse.json({ error: 'Ya existe otra marca con este nombre.' }, { status: 409 });
      }
    }

    const { data: updatedMarca, error: updateError } = await supabase
      .from('marcas')
      .update(validation.data) // Solo se envían los campos validados
      .eq('id', marcaId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') { // Not found or no rows updated (RLS might prevent update)
        return NextResponse.json({ error: 'Marca no encontrada o no se pudo actualizar' }, { status: 404 });
      }
      if (updateError.code === '23505') { // Unique violation (aunque ya lo chequeamos arriba, por si acaso)
        return NextResponse.json({ error: 'Ya existe una marca con este nombre.' }, { status: 409 });
      }
      console.error('Error updating marca:', updateError);
      return NextResponse.json({ error: 'Error al actualizar la marca: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedMarca);

  } catch (e) {
    console.error('Error inesperado en PUT /api/marcas/[id]:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Eliminar una marca específica
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

    const marcaId = await getValidatedId(params);
    if (!marcaId) {
      return NextResponse.json({ error: 'ID de marca inválido' }, { status: 400 });
    }

    // Verificar si la marca existe y pertenece al usuario
    const { data: marca, error: marcaError } = await supabase
      .from('marcas')
      .select('id, nombre')
      .eq('id', marcaId)
      .eq('user_id', user.id)
      .single();

    if (marcaError || !marca) {
      return NextResponse.json({ error: 'Marca no encontrada o no pertenece al usuario.' }, { status: 404 });
    }

    // Verificar si hay productos que usan esta marca
    const { data: productosUsandoMarca, error: productosError } = await supabase
      .from('productos')
      .select('id, nombre')
      .eq('marca_id', marcaId)
      .eq('user_id', user.id)
      .limit(5); // Limitamos a 5 para mostrar ejemplos

    if (productosError) {
      console.error('Error verificando productos que usan la marca:', productosError);
      return NextResponse.json({ error: 'Error al verificar productos asociados: ' + productosError.message }, { status: 500 });
    }

    if (productosUsandoMarca && productosUsandoMarca.length > 0) {
      const ejemplosProductos = productosUsandoMarca.map(p => p.nombre).join(', ');
      const mensaje = productosUsandoMarca.length === 1 
        ? `No se puede eliminar la marca "${marca.nombre}" porque está siendo usada por el producto: ${ejemplosProductos}.`
        : `No se puede eliminar la marca "${marca.nombre}" porque está siendo usada por ${productosUsandoMarca.length} productos${productosUsandoMarca.length === 5 ? ' o más' : ''}: ${ejemplosProductos}${productosUsandoMarca.length === 5 ? '...' : ''}.`;
      
      return NextResponse.json({ 
        error: mensaje,
        code: 'BRAND_IN_USE',
        productCount: productosUsandoMarca.length 
      }, { status: 409 });
    }

    // Si no hay productos usando la marca, proceder con la eliminación
    const { error: deleteError, count } = await supabase
      .from('marcas')
      .delete({ count: 'exact' })
      .eq('id', marcaId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting marca:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar la marca: ' + deleteError.message }, { status: 500 });
    }
    
    if (count === 0) {
      return NextResponse.json({ error: 'Marca no encontrada o no pertenece al usuario.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Marca eliminada correctamente' }, { status: 200 }); // o 204 No Content

  } catch (e) {
    console.error('Error inesperado en DELETE /api/marcas/[id]:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 