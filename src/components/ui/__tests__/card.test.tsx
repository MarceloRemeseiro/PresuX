import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '../card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders correctly with default props', () => {
      render(<Card data-testid="card">Card Content</Card>);
      const card = screen.getByTestId('card');
      
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('rounded-xl border bg-card text-card-foreground shadow');
      expect(card).toHaveTextContent('Card Content');
    });

    it('applies custom className', () => {
      render(<Card data-testid="card" className="custom-class">Card Content</Card>);
      const card = screen.getByTestId('card');
      
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('rounded-xl border bg-card text-card-foreground shadow');
    });
  });

  describe('CardHeader', () => {
    it('renders correctly with default props', () => {
      render(<CardHeader data-testid="card-header">Header Content</CardHeader>);
      const header = screen.getByTestId('card-header');
      
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex flex-col space-y-1.5 p-6');
      expect(header).toHaveTextContent('Header Content');
    });

    it('applies custom className', () => {
      render(<CardHeader data-testid="card-header" className="custom-class">Header Content</CardHeader>);
      const header = screen.getByTestId('card-header');
      
      expect(header).toHaveClass('custom-class');
      expect(header).toHaveClass('flex flex-col space-y-1.5 p-6');
    });
  });

  describe('CardTitle', () => {
    it('renders correctly with default props', () => {
      render(<CardTitle data-testid="card-title">Title Content</CardTitle>);
      const title = screen.getByTestId('card-title');
      
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('font-semibold leading-none tracking-tight');
      expect(title).toHaveTextContent('Title Content');
    });

    it('applies custom className', () => {
      render(<CardTitle data-testid="card-title" className="custom-class">Title Content</CardTitle>);
      const title = screen.getByTestId('card-title');
      
      expect(title).toHaveClass('custom-class');
      expect(title).toHaveClass('font-semibold leading-none tracking-tight');
    });
  });

  describe('CardDescription', () => {
    it('renders correctly with default props', () => {
      render(<CardDescription data-testid="card-desc">Description Content</CardDescription>);
      const desc = screen.getByTestId('card-desc');
      
      expect(desc).toBeInTheDocument();
      expect(desc).toHaveClass('text-sm text-muted-foreground');
      expect(desc).toHaveTextContent('Description Content');
    });

    it('applies custom className', () => {
      render(<CardDescription data-testid="card-desc" className="custom-class">Description Content</CardDescription>);
      const desc = screen.getByTestId('card-desc');
      
      expect(desc).toHaveClass('custom-class');
      expect(desc).toHaveClass('text-sm text-muted-foreground');
    });
  });

  describe('CardContent', () => {
    it('renders correctly with default props', () => {
      render(<CardContent data-testid="card-content">Content</CardContent>);
      const content = screen.getByTestId('card-content');
      
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('p-6 pt-0');
      expect(content).toHaveTextContent('Content');
    });

    it('applies custom className', () => {
      render(<CardContent data-testid="card-content" className="custom-class">Content</CardContent>);
      const content = screen.getByTestId('card-content');
      
      expect(content).toHaveClass('custom-class');
      expect(content).toHaveClass('p-6 pt-0');
    });
  });

  describe('CardFooter', () => {
    it('renders correctly with default props', () => {
      render(<CardFooter data-testid="card-footer">Footer Content</CardFooter>);
      const footer = screen.getByTestId('card-footer');
      
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex items-center p-6 pt-0');
      expect(footer).toHaveTextContent('Footer Content');
    });

    it('applies custom className', () => {
      render(<CardFooter data-testid="card-footer" className="custom-class">Footer Content</CardFooter>);
      const footer = screen.getByTestId('card-footer');
      
      expect(footer).toHaveClass('custom-class');
      expect(footer).toHaveClass('flex items-center p-6 pt-0');
    });
  });

  describe('Composed Card', () => {
    it('renders a complete card with all components', () => {
      render(
        <Card data-testid="full-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            Card Content
          </CardContent>
          <CardFooter>
            Card Footer
          </CardFooter>
        </Card>
      );
      
      const card = screen.getByTestId('full-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Card Title');
      expect(card).toHaveTextContent('Card Description');
      expect(card).toHaveTextContent('Card Content');
      expect(card).toHaveTextContent('Card Footer');
    });
  });
}); 