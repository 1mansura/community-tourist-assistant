/**
 * Normalise JWT login API errors for display.
 *
 * Wrong email and wrong password must look the same (no account enumeration).
 * Suspended/banned copy stays specific when the API returns it.
 */
export function normalizeLoginErrorMessage(raw: string): string {
  const t = (raw || '').trim();
  const lower = t.toLowerCase();
  if (lower.includes('suspended') || lower.includes('banned')) {
    return t;
  }
  // Backend canonical + legacy SimpleJWT / generic credential strings
  if (
    lower.includes('invalid email or password') ||
    lower.includes('no active account') ||
    lower.includes('given credentials') ||
    lower.includes('unable to authenticate') ||
    lower.includes('authentication failed')
  ) {
    return 'Invalid email or password.';
  }
  return t;
}
