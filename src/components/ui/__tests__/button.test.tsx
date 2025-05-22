import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Test Button</Button>);
    const button = screen.getByRole('button', { name: /test button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
  });

  it('applies the correct variant class', () => {
    render(<Button variant="destructive">Destructive Button</Button>);
    const button = screen.getByRole('button', { name: /destructive button/i });
    expect(button).toHaveClass('bg-destructive');
  });

  it('applies the correct size class', () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole('button', { name: /large button/i });
    expect(button).toHaveClass('h-10');
  });

  it('applies custom className', () => {
    render(<Button className="test-class">Custom Class Button</Button>);
    const button = screen.getByRole('button', { name: /custom class button/i });
    expect(button).toHaveClass('test-class');
  });

  it('handles onClick events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders as a child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="#">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#');
    expect(link).toHaveClass('bg-primary');
  });

  it('renders PresuX specific variants correctly', () => {
    const { rerender } = render(<Button variant="factura">Factura Button</Button>);
    let button = screen.getByRole('button', { name: /factura button/i });
    expect(button).toHaveClass('bg-factura');
    
    rerender(<Button variant="presupuesto">Presupuesto Button</Button>);
    button = screen.getByRole('button', { name: /presupuesto button/i });
    expect(button).toHaveClass('bg-presupuesto');
  });
}); 