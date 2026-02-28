/**
 * Login error copy: generic for bad credentials; preserve suspended/banned.
 */
import { normalizeLoginErrorMessage } from './loginError';

describe('normalizeLoginErrorMessage', () => {
  it('maps legacy JWT message to generic copy', () => {
    expect(
      normalizeLoginErrorMessage('No active account found with the given credentials'),
    ).toBe('Invalid email or password.');
  });

  it('keeps canonical backend message', () => {
    expect(normalizeLoginErrorMessage('Invalid email or password.')).toBe(
      'Invalid email or password.',
    );
  });

  it('preserves suspended and banned messages', () => {
    expect(normalizeLoginErrorMessage('Your account is suspended. Please contact a moderator.')).toContain(
      'suspended',
    );
    expect(normalizeLoginErrorMessage('Your account is banned. Please contact an administrator.')).toContain(
      'banned',
    );
  });
});
