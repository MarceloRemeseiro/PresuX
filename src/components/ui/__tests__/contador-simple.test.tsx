import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContadorSimple } from '../contador-simple';
import { EstadoCliente } from '../contador';

describe('ContadorSimple', () => {
  // Datos de prueba
  const clientesData: ITestCliente[] = [
    { id: '1', nombre: 'Cliente 1', tipo: "EMPRESA" as EstadoCliente, nif: '12345678A' },
    { id: '2', nombre: 'Cliente 2', tipo: "EMPRESA" as EstadoCliente, nif: '87654321B' },
    { id: '3', nombre: 'Cliente 3', tipo: "AUTONOMO" as EstadoCliente, nif: '11111111C' },
    { id: '4', nombre: 'Cliente 4', tipo: "PARTICULAR" as EstadoCliente, nif: '22222222D' },
  ];

  // Tipo para los datos de cliente en el test
  interface ITestCliente {
    id: string;
    nombre: string;
    tipo: EstadoCliente;
    nif: string;
  }

  // Función para obtener el tipo de cliente
  const getClienteTipo = (cliente: ITestCliente): EstadoCliente => cliente.tipo;

  it('muestra el contador con totales correctos', () => {
    render(
      <ContadorSimple
        items={clientesData}
        tipo="cliente"
        getEstadoFn={getClienteTipo}
      />
    );

    // Verificar que se muestra el total correcto
    expect(screen.getByText('Total: 4')).toBeInTheDocument();
    
    // Verificar que se muestran los conteos por tipo
    expect(screen.getByText('EMPRESA: 2')).toBeInTheDocument();
    expect(screen.getByText('AUTONOMO: 1')).toBeInTheDocument();
    expect(screen.getByText('PARTICULAR: 1')).toBeInTheDocument();
  });

  it('omite tipos con conteo cero', () => {
    // Datos sin clientes particulares
    const clientesSinParticulares = clientesData.filter(cliente => cliente.tipo !== 'PARTICULAR');
    
    render(
      <ContadorSimple
        items={clientesSinParticulares}
        tipo="cliente"
        getEstadoFn={getClienteTipo}
      />
    );

    // Verificar que se muestra el total correcto
    expect(screen.getByText('Total: 3')).toBeInTheDocument();
    
    // Verificar que se muestran los conteos por tipo
    expect(screen.getByText('EMPRESA: 2')).toBeInTheDocument();
    expect(screen.getByText('AUTONOMO: 1')).toBeInTheDocument();
    
    // Verificar que PARTICULAR no se muestra
    expect(screen.queryByText('PARTICULAR: 0')).not.toBeInTheDocument();
  });

  it('aplica clases personalizadas', () => {
    render(
      <ContadorSimple
        items={clientesData}
        tipo="cliente"
        getEstadoFn={getClienteTipo}
        className="test-class"
      />
    );

    // Obtener el contenedor principal
    const container = screen.getByText('Total: 4').closest('div')?.parentElement;
    expect(container).toHaveClass('test-class');
  });
}); 