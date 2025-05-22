import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { createCategoriaProductoSchema } from '@/lib/schemas/categoriaProducto';

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

    const { data: categorias, error } = await supabase
      .from('categorias_producto')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error fetching categorias_producto:', error);
      return NextResponse.json({ error: 'Error al obtener las categorías: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(categorias);

  } catch (e) {
    console.error('Error inesperado en GET /api/categorias-producto:', e);
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
    const validation = createCategoriaProductoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Datos de entrada inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { nombre } = validation.data;

    const { data: existingCategoria, error: selectError } = await supabase
      .from('categorias_producto')
      .select('id')
      .eq('user_id', user.id)
      .eq('nombre', nombre)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error al verificar categoría existente:', selectError);
        return NextResponse.json({ error: 'Error al verificar categoría: ' + selectError.message }, { status: 500 });
    }

    if (existingCategoria) {
        return NextResponse.json({ error: 'Ya existe una categoría de producto con este nombre.' }, { status: 409 });
    }

    const { data: nuevaCategoria, error: insertError } = await supabase
      .from('categorias_producto')
      .insert({ nombre, user_id: user.id })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating categoria_producto:', insertError);
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Ya existe una categoría de producto con este nombre.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Error al crear la categoría: ' + insertError.message }, { status: 500 });
    }

    return NextResponse.json(nuevaCategoria, { status: 201 });

  } catch (e) {
    console.error('Error inesperado en POST /api/categorias-producto:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 