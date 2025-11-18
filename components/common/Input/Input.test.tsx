/**
 * Input Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './index';

describe('Input', () => {
  describe('Rendering', () => {
    it('renders input field', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input id="name" label="Player Name" />);
      expect(screen.getByLabelText('Player Name')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter name" />);
      expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    });

    it('renders with helper text', () => {
      render(<Input id="name" helperText="Enter your display name" />);
      expect(screen.getByText('Enter your display name')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(<Input id="name" label="Player Name" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });
  });

  describe('Error State', () => {
    it('renders with error message', () => {
      render(<Input id="name" label="Name" error="Name is required" />);
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('applies error variant when error present', () => {
      render(<Input id="name" error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
    });

    it('sets aria-invalid when error present', () => {
      render(<Input id="name" error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('links error message with aria-describedby', () => {
      render(<Input id="name" error="Error message" />);
      const input = screen.getByRole('textbox');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      expect(screen.getByText('Error message')).toHaveAttribute('id', errorId!);
    });

    it('shows error instead of helper text', () => {
      render(
        <Input id="name" helperText="Helper text" error="Error message" />
      );
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('error has role="alert"', () => {
      render(<Input id="name" error="Error message" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Error message');
    });
  });

  describe('Input Types', () => {
    it('supports text type', () => {
      render(<Input type="text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('supports email type', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('supports password type', () => {
      render(<Input type="password" />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it('supports number type', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('calls onChange when value changes', async () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Test');

      expect(handleChange).toHaveBeenCalled();
    });

    it('updates value on input', async () => {
      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, 'Test value');

      expect(input.value).toBe('Test value');
    });

    it('calls onBlur when input loses focus', async () => {
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      input.focus();
      input.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('calls onFocus when input gains focus', async () => {
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);

      const input = screen.getByRole('textbox');
      input.focus();

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('renders disabled input', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('does not accept input when disabled', async () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, 'Test');

      expect(input.value).toBe('');
    });

    it('has reduced opacity when disabled', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('opacity-50');
    });
  });

  describe('Accessibility', () => {
    it('generates unique ID when not provided', () => {
      const { container } = render(<Input />);
      const input = container.querySelector('input');
      expect(input?.id).toBeTruthy();
    });

    it('uses provided ID', () => {
      render(<Input id="custom-id" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'custom-id');
    });

    it('associates label with input', () => {
      render(<Input id="name" label="Player Name" />);
      const label = screen.getByText('Player Name');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', 'name');
      expect(input).toHaveAttribute('id', 'name');
    });

    it('links helper text with aria-describedby', () => {
      render(<Input id="name" helperText="Helper text" />);
      const input = screen.getByRole('textbox');
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(screen.getByText('Helper text')).toHaveAttribute(
        'id',
        describedBy!
      );
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
    });

    it('allows focusing via ref', () => {
      const ref = { current: null as HTMLInputElement | null };
      render(<Input ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });
  });
});
