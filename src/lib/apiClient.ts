/**
 * Cliente API para hacer peticiones internas a la API de la aplicación
 * @module apiClient
 */

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
};

/**
 * Función para hacer peticiones a la API interna de la aplicación
 * @param url - URL relativa a la API (/api/...)
 * @param options - Opciones de fetch
 * @returns Promise con los datos de la respuesta parseados como JSON
 * @throws Error si la respuesta no es OK con el mensaje de error del servidor
 */
export async function apiClient<T = any>(
  url: string, 
  options: FetchOptions = {}
): Promise<T> {
  // Asegurarse que la URL comienza con /api/
  if (!url.startsWith('/api/') && !url.startsWith('api/')) {
    url = `/api/${url}`;
  }

  // Preparar las opciones de fetch
  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  // Si hay un body y no es GET, lo serializamos a JSON
  if (options.body && fetchOptions.method !== 'GET') {
    fetchOptions.body = JSON.stringify(options.body);
  }

  // Hacer la petición
  const response = await fetch(url, fetchOptions);

  // Parsear la respuesta como JSON
  const data = await response.json();

  // Si la respuesta no es OK, lanzar un error
  if (!response.ok) {
    const errorMessage = data.error || 'Error desconocido';
    const error = new Error(errorMessage);
    throw error;
  }

  // Devolver los datos
  return data as T;
} 