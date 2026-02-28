/** Form Input: label, errors, id generation, user typing. */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from './Input';

describe('Input', () => {
  it('renders with a label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders without a label', () => {
    const { container } = render(<Input placeholder="Type here" />);
    expect(container.querySelector('label')).toBeNull();
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
  });

  it('shows error message when provided', () => {
    render(<Input label="Email" error="Email is required" />);
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('applies error border styling', () => {
    render(<Input label="Email" error="Required" />);
    const input = screen.getByLabelText('Email');
    expect(input.className).toContain('border-red-500');
  });

  it('does not show error styling when no error', () => {
    render(<Input label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input.className).toContain('border-slate-300');
    expect(input.className).not.toContain('border-red-500');
  });

  it('accepts user input', () => {
    const handleChange = jest.fn();
    render(<Input label="Name" onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('generates id from label text', () => {
    render(<Input label="First Name" />);
    const input = screen.getByLabelText('First Name');
    expect(input.id).toBe('first-name');
  });

  it('uses provided id over generated one', () => {
    render(<Input label="Email" id="custom-id" />);
    const input = screen.getByLabelText('Email');
    expect(input.id).toBe('custom-id');
  });
});
