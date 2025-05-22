import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from '../data-table';

describe('DataTable', () => {
  // Datos de prueba
  interface ITestItem {
    id: string;
    name: string;
    category: string;
  }
  const testData: ITestItem[] = [
    { id: '1', name: 'Test 1', category: 'A' },
    { id: '2', name: 'Test 2', category: 'B' },
    { id: '3', name: 'Test 3', category: 'A' },
  ];

  // Columnas de prueba
  const testColumns = [
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      cell: (item: ITestItem) => <div>{item.name}</div>
    },
    {
      key: 'category',
      header: 'Categoría',
      sortable: true,
      cell: (item: ITestItem) => <div>{item.category}</div>
    },
    {
      key: 'actions',
      header: 'Acciones',
      cell: () => <button>Acción</button>
    }
  ];

  // Mock para onPaginationChange
  const mockPaginationChange = vi.fn();

  it('renderiza los datos correctamente', () => {
    render(
      <DataTable
        columns={testColumns}
        data={testData}
        pageIndex={0}
        pageSize={10}
        pageCount={1}
        onPaginationChange={mockPaginationChange}
      />
    );

    // Verificar encabezados de columnas
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Categoría')).toBeInTheDocument();
    expect(screen.getByText('Acciones')).toBeInTheDocument();

    // Verificar datos
    expect(screen.getByText('Test 1')).toBeInTheDocument();
    expect(screen.getByText('Test 2')).toBeInTheDocument();
    expect(screen.getByText('Test 3')).toBeInTheDocument();
    expect(screen.getAllByText('A')).toHaveLength(2);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay datos', () => {
    render(
      <DataTable
        columns={testColumns}
        data={[]}
        pageIndex={0}
        pageSize={10}
        pageCount={1}
        onPaginationChange={mockPaginationChange}
      />
    );

    expect(screen.getByText('No hay datos disponibles.')).toBeInTheDocument();
  });

  it('maneja la paginación correctamente', () => {
    render(
      <DataTable
        columns={testColumns}
        data={testData}
        pageIndex={0}
        pageSize={10}
        pageCount={3}
        onPaginationChange={mockPaginationChange}
      />
    );

    // Verificar que se muestra la paginación
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    
    // Botones de paginación
    const nextButton = screen.getByText('Siguiente');
    const prevButton = screen.getByText('Anterior');
    
    // El botón de anterior debe estar desactivado en la primera página
    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();
    
    // Hacer clic en siguiente
    fireEvent.click(nextButton);
    expect(mockPaginationChange).toHaveBeenCalledWith({ pageIndex: 1, pageSize: 10 });
  });

  it('muestra los elementos de ordenación', () => {
    render(
      <DataTable
        columns={testColumns}
        data={testData}
        pageIndex={0}
        pageSize={10}
        pageCount={1}
        onPaginationChange={mockPaginationChange}
        sortConfig={{ key: 'name', direction: 'asc' }}
      />
    );

    // Obtener botones de ordenación (son ghost buttons)
    const sortButtons = screen.getAllByRole('button');
    
    // Al menos debe haber dos botones de ordenación (uno por cada columna sortable)
    expect(sortButtons.length).toBeGreaterThanOrEqual(2);
    
    // Hacer clic en un botón de ordenación
    fireEvent.click(sortButtons[0]);
    
    // Verificar que se llamó a onPaginationChange con los parámetros correctos
    expect(mockPaginationChange).toHaveBeenCalledWith(
      { pageIndex: 0, pageSize: 10 },
      expect.objectContaining({ key: expect.any(String) })
    );
  });
}); 