import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthScreen } from './AuthScreen';

describe('AuthScreen', () => {
  it('switches to account creation and submits entered details', async () => {
    const onAuthenticate = vi.fn().mockResolvedValue(undefined);
    render(<AuthScreen onAuthenticate={onAuthenticate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Alex Morgan' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'strong-password' } });
    const createButtons = screen.getAllByRole('button', { name: /Create account/ });
    fireEvent.click(createButtons[createButtons.length - 1]);

    await waitFor(() => expect(onAuthenticate).toHaveBeenCalledWith('register', {
      name: 'Alex Morgan', email: 'alex@example.com', password: 'strong-password'
    }));
  });

  it('surfaces an authentication error', async () => {
    const onAuthenticate = vi.fn().mockRejectedValue(new Error('Email or password is incorrect.'));
    render(<AuthScreen onAuthenticate={onAuthenticate} />);
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } });
    const signInButtons = screen.getAllByRole('button', { name: /Sign in/ });
    fireEvent.click(signInButtons[signInButtons.length - 1]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
  });
});

