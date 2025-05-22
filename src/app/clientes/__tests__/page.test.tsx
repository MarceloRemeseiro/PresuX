import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientesPage from '../page';
import { apiClient } from '@/lib/apiClient';
import { ICliente, TipoCliente } from '@/types';

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
  const clientesMock: ICliente[] = [
    { 
      id: '1', 
      user_id: 'user1',
      nombre: 'Cliente Test 1', 
      tipo: TipoCliente.EMPRESA,
      nif: '123456789A',
      email: 'cliente1@test.com',
      telefono: '123456789',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: '2', 
      user_id: 'user1',
      nombre: 'Cliente Test 2', 
      tipo: TipoCliente.AUTONOMO,
      nif: '987654321B',
      email: 'cliente2@test.com',
      telefono: '987654321',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { 
      id: '3', 
      user_id: 'user1',
      nombre: 'Cliente Test 3', 
      tipo: TipoCliente.PARTICULAR,
      nif: '111222333C',
      email: 'cliente3@test.com',
      telefono: '111222333',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient as Mock).mockResolvedValue(clientesMock);
    
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
    (apiClient as Mock).mockRejectedValue(new Error('Error de prueba'));
    
    render(<ClientesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error de prueba')).toBeInTheDocument();
    });
    
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