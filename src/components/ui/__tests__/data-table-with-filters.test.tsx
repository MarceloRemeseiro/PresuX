import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTableWithFilters } from '../data-table-with-filters';
import { EstadoCliente } from '../contador';

// Mock de los componentes internos
vi.mock('../data-table', () => ({
  DataTable: vi.fn(() => <div data-testid="mock-data-table">Tabla mockeada</div>)
}));

vi.mock('../contador', () => ({
  Contador: vi.fn(() => <div data-testid="mock-contador">Contador mockeado</div>),
  EstadoCliente: { PARTICULAR: 'PARTICULAR', EMPRESA: 'EMPRESA', AUTONOMO: 'AUTONOMO' }
}));

describe('DataTableWithFilters', () => {
  // Datos de prueba
  const testData = [
    { id: '1', nombre: 'Test 1', tipo: 'EMPRESA' },
    { id: '2', nombre: 'Test 2', tipo: 'AUTONOMO' },
    { id: '3', nombre: 'Test 3', tipo: 'EMPRESA' },
  ];

  // Columnas de prueba
  const testColumns = [
    {
      key: 'nombre',
      header: 'Nombre',
      sortable: true,
      cell: (item: any) => <div>{item.nombre}</div>
    },
    {
      key: 'tipo',
      header: 'Tipo',
      sortable: true,
      cell: (item: any) => <div>{item.tipo}</div>
    }
  ];

  // Mocks para las funciones de callback
  const mockOnSearchChange = vi.fn();
  const mockSetFiltroEstado = vi.fn();
  const mockOnPaginationChange = vi.fn();

  // Función para obtener el tipo
  const getClienteTipo = (cliente: any): EstadoCliente => cliente.tipo as EstadoCliente;

  it('renderiza con datos y componentes internos', () => {
    render(
      <DataTableWithFilters
        columns={testColumns}
        data={testData}
        allFilteredData={testData}
        filteredItemsCount={testData.length}
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        tipo="cliente"
        filtroEstado={null}
        setFiltroEstado={mockSetFiltroEstado}
        getEstadoFn={getClienteTipo}
        pageIndex={0}
        pageSize={10}
        pageCount={1}
        onPaginationChange={mockOnPaginationChange}
      />
    );

    // Verificar que se renderiza el campo de búsqueda
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();

    // Verificar que se renderiza el contador
    expect(screen.getByTestId('mock-contador')).toBeInTheDocument();

    // Verificar que se renderiza la tabla
    expect(screen.getByTestId('mock-data-table')).toBeInTheDocument();
  });

  it('maneja cambios en la búsqueda', () => {
    render(
      <DataTableWithFilters
        columns={testColumns}
        data={testData}
        allFilteredData={testData}
        filteredItemsCount={testData.length}
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        tipo="cliente"
        filtroEstado={null}
        setFiltroEstado={mockSetFiltroEstado}
        getEstadoFn={getClienteTipo}
        pageIndex={0}
        pageSize={10}
        pageCount={1}
        onPaginationChange={mockOnPaginationChange}
      />
    );

    // Obtener el campo de búsqueda
    const searchInput = screen.getByPlaceholderText('Buscar...');
    
    // Simular cambio en el campo de búsqueda
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Verificar que se llamó a onSearchChange
    expect(mockOnSearchChange).toHaveBeenCalled();
  });

  it('muestra mensaje de no hay datos cuando filteredItemsCount es 0', () => {
    render(
      <DataTableWithFilters
        columns={testColumns}
        data={[]}
        allFilteredData={[]}
        filteredItemsCount={0}
        searchTerm="búsqueda sin resultados"
        onSearchChange={mockOnSearchChange}
        tipo="cliente"
        filtroEstado={null}
        setFiltroEstado={mockSetFiltroEstado}
        getEstadoFn={getClienteTipo}
        pageIndex={0}
        pageSize={10}
        pageCount={1}
        onPaginationChange={mockOnPaginationChange}
      />
    );

    // Verificar que se muestra el mensaje de no hay resultados
    expect(screen.getByText('No se encontraron resultados')).toBeInTheDocument();
  });

  it('muestra estado de carga', () => {
    render(
      <DataTableWithFilters
        columns={testColumns}
        data={[]}
        allFilteredData={[]}
        filteredItemsCount={0}
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        tipo="cliente"
        filtroEstado={null}
        setFiltroEstado={mockSetFiltroEstado}
        getEstadoFn={getClienteTipo}
        pageIndex={0}
        pageSize={10}
        pageCount={1}
        onPaginationChange={mockOnPaginationChange}
        isLoading={true}
      />
    );

    // Verificar que se muestra el estado de carga
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('muestra mensaje de error', () => {
    render(
      <DataTableWithFilters
        columns={testColumns}
        data={[]}
        allFilteredData={[]}
        filteredItemsCount={0}
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        tipo="cliente"
        filtroEstado={null}
        setFiltroEstado={mockSetFiltroEstado}
        getEstadoFn={getClienteTipo}
        pageIndex={0}
        pageSize={10}
        pageCount={1}
        onPaginationChange={mockOnPaginationChange}
        error="Error de prueba"
      />
    );

    // Verificar que se muestra el mensaje de error
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Error al cargar los datos')).toBeInTheDocument();
  });

  it('no muestra el contador cuando showContador es false', () => {
    render(
      <DataTableWithFilters
        columns={testColumns}
        data={testData}
        allFilteredData={testData}
        filteredItemsCount={testData.length}
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        tipo="cliente"
        filtroEstado={null}
        setFiltroEstado={mockSetFiltroEstado}
        getEstadoFn={getClienteTipo}
        pageIndex={0}
        pageSize={10}
        pageCount={1}
        onPaginationChange={mockOnPaginationChange}
        showContador={false}
      />
    );

    // Verificar que no se renderiza el contador
    expect(screen.queryByTestId('mock-contador')).not.toBeInTheDocument();
  });
}); 