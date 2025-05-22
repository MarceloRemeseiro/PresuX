import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientesPage from '../page';
import { apiClient } from '@/lib/apiClient';

// Mock del useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  })
}));

// Mock de los componentes internos
vi.mock('@/components/ui/data-table-with-filters', () => ({
  DataTableWithFilters: vi.fn(({ data, searchTerm, onSearchChange }) => (
    <div data-testid="mock-data-table">
      <input 
        data-testid="mock-search" 
        value={searchTerm} 
        onChange={onSearchChange} 
      />
      <div>Datos: {data.length}</div>
    </div>
  )),
  EstadoCliente: { PARTICULAR: 'PARTICULAR', EMPRESA: 'EMPRESA', AUTONOMO: 'AUTONOMO' }
}));

vi.mock('@/components/ui/contador-simple', () => ({
  ContadorSimple: vi.fn(() => <div data-testid="mock-contador">Contador mockeado</div>)
}));

// Mock de apiClient
vi.mock('@/lib/apiClient', () => ({
  apiClient: vi.fn()
}));

// Mock de sonner toast
vi.mock('sonner', () => ({
  toast: { 
    error: vi.fn(), 
    success: vi.fn() 
  },
  Toaster: () => <div data-testid="mock-toaster"></div>
}));

describe('ClientesPage', () => {
  // Datos de prueba
  const clientesMock = [
    { 
      id: '1', 
      nombre: 'Cliente Test 1', 
      tipo: 'EMPRESA', 
      nif: '123456789A',
      email: 'cliente1@test.com',
      telefono: '123456789'
    },
    { 
      id: '2', 
      nombre: 'Cliente Test 2', 
      tipo: 'AUTONOMO', 
      nif: '987654321B',
      email: 'cliente2@test.com',
      telefono: '987654321'
    },
    { 
      id: '3', 
      nombre: 'Cliente Test 3', 
      tipo: 'PARTICULAR', 
      nif: '111222333C',
      email: 'cliente3@test.com',
      telefono: '111222333'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Configuración del mock de apiClient para devolver datos
    (apiClient as any).mockResolvedValue(clientesMock);
    
    // Mockear sessionStorage
    const mockSessionStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage
    });
  });

  it('carga y muestra la página de clientes', async () => {
    render(<ClientesPage />);
    
    // Inicialmente debería mostrar estado de carga
    expect(screen.getByText('Cargando clientes...')).toBeInTheDocument();
    
    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/api/clientes');
    });
    
    // Verificar que se muestra el título de la página
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    
    // Verificar que se muestra el contador
    expect(screen.getByTestId('mock-contador')).toBeInTheDocument();
    
    // Verificar que se muestra la tabla
    expect(screen.getByTestId('mock-data-table')).toBeInTheDocument();
  });

  it('maneja errores de carga', async () => {
    // Configurar apiClient para lanzar un error
    (apiClient as any).mockRejectedValue(new Error('Error de prueba'));
    
    render(<ClientesPage />);
    
    // Esperar a que se maneje el error
    await waitFor(() => {
      expect(screen.getByText('Error de prueba')).toBeInTheDocument();
    });
    
    // Verificar que se muestra un botón para reintentar
    expect(screen.getByText('Intentar de nuevo')).toBeInTheDocument();
  });

  it('filtra clientes por término de búsqueda', async () => {
    render(<ClientesPage />);
    
    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/api/clientes');
    });
    
    // Obtener el campo de búsqueda
    const searchInput = screen.getByTestId('mock-search');
    
    // Simular búsqueda
    fireEvent.change(searchInput, { target: { value: 'Cliente Test 1' } });
    
    // Verificar que el estado de búsqueda se actualizó
    expect(searchInput).toHaveValue('Cliente Test 1');
  });

  it('muestra botones de acción', async () => {
    render(<ClientesPage />);
    
    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/api/clientes');
    });
    
    // Verificar que se muestra el botón de nuevo cliente
    expect(screen.getByText('Nuevo Cliente')).toBeInTheDocument();
    
    // Verificar que se muestra el botón de importar/exportar
    expect(screen.getByText('Importar / Exportar')).toBeInTheDocument();
  });
}); 