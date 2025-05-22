import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { marcaIdSchema, createMarcaSchema } from '@/lib/schemas/marca'; // Asumiendo que exportas individualmente los esquemas

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

    const { data: marcas, error } = await supabase
      .from('marcas')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error fetching marcas:', error);
      return NextResponse.json({ error: 'Error al obtener las marcas: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(marcas);

  } catch (e) {
    console.error('Error inesperado en GET /api/marcas:', e);
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
    const validation = createMarcaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Datos de entrada inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { nombre } = validation.data;

    // Verificar si ya existe una marca con el mismo nombre para este usuario
    const { data: existingMarca, error: selectError } = await supabase
      .from('marcas')
      .select('id')
      .eq('user_id', user.id)
      .eq('nombre', nombre)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116: 'Searched item was not found'
        console.error('Error al verificar marca existente:', selectError);
        return NextResponse.json({ error: 'Error al verificar marca: ' + selectError.message }, { status: 500 });
    }

    if (existingMarca) {
        return NextResponse.json({ error: 'Ya existe una marca con este nombre.' }, { status: 409 }); // Conflict
    }

    const { data: nuevaMarca, error: insertError } = await supabase
      .from('marcas')
      .insert({ nombre, user_id: user.id })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating marca:', insertError);
      // Manejar error de unicidad (user_id, nombre) que la base de datos podría devolver (código 23505 en PostgreSQL)
      if (insertError.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Ya existe una marca con este nombre.' }, { status: 409 }); // Conflict
      }
      return NextResponse.json({ error: 'Error al crear la marca: ' + insertError.message }, { status: 500 });
    }

    return NextResponse.json(nuevaMarca, { status: 201 });

  } catch (e) {
    console.error('Error inesperado en POST /api/marcas:', e);
    const errorMessage = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 