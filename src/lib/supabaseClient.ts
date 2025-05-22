import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL is not defined. Please set NEXT_PUBLIC_SUPABASE_URL in your .env.local file.");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key is not defined. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.");
}

// Crear y exportar el cliente de Supabase para el lado del cliente (navegador)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// console.log('Supabase client (browser) initialized with:', { supabaseUrl, supabaseAnonKey: supabaseAnonKey ? '*** (loaded)' : 'NOT LOADED' }); // Opcional: para verificar carga

// Nota: Para operaciones del lado del servidor que requieran privilegios elevados,
// se podría crear otro cliente aquí o en el lugar de uso, utilizando SUPABASE_SERVICE_ROLE_KEY.
// Por ahora, nos enfocaremos en el cliente para el frontend. 