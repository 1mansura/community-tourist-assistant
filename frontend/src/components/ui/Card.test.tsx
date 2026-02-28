/** Card shell + header/body/footer; motion mocked. */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import Card, { CardHeader, CardBody, CardFooter } from './Card';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="extra-class">Content</Card>);
    expect(container.firstChild).toHaveClass('extra-class');
  });

  it('fires onClick when provided', () => {
    const handleClick = jest.fn();
    render(<Card onClick={handleClick}>Clickable</Card>);
    fireEvent.click(screen.getByText('Clickable'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('CardHeader', () => {
  it('renders children in a bordered container', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('border-b');
  });
});

describe('CardBody', () => {
  it('renders children with padding', () => {
    const { container } = render(<CardBody>Body</CardBody>);
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('px-6');
  });
});

describe('CardFooter', () => {
  it('renders children with background and border', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText('Footer')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-slate-50/80');
    expect(container.firstChild).toHaveClass('border-t');
  });
});
