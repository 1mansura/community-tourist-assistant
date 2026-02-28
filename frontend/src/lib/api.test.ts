/**
 * Unit tests for API helpers: DRF-style error parsing and request/response key casing.
 */
import { extractErrorMessage, toCamelCase, toSnakeCase } from './api';
import { AxiosError, AxiosHeaders } from 'axios';

function makeAxiosError(data: unknown, status = 400): AxiosError {
  const error = new AxiosError('Request failed');
  error.response = {
    data,
    status,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

describe('extractErrorMessage', () => {
  it('extracts detail field from Axios error response', () => {
    const err = makeAxiosError({ detail: 'Invalid credentials' }, 401);
    expect(extractErrorMessage(err)).toBe('Invalid credentials');
  });

  it('extracts non_field_errors array from Axios error response', () => {
    const err = makeAxiosError({
      non_field_errors: ['Passwords do not match', 'Email taken'],
    });
    expect(extractErrorMessage(err)).toBe('Passwords do not match, Email taken');
  });

  it('extracts field-level validation errors', () => {
    const err = makeAxiosError({
      email: ['This field is required.'],
      password: ['Too short.'],
    });
    const msg = extractErrorMessage(err);
    expect(msg).toContain('email');
    expect(msg).toContain('This field is required.');
    expect(msg).toContain('password');
    expect(msg).toContain('Too short.');
  });

  it('handles plain string response body', () => {
    const err = makeAxiosError('Server error occurred');
    expect(extractErrorMessage(err)).toBe('Server error occurred');
  });

  it('returns message from generic Error', () => {
    const err = new Error('Network timeout');
    expect(extractErrorMessage(err)).toBe('Network timeout');
  });

  it('returns fallback for unknown error types', () => {
    expect(extractErrorMessage(null)).toBe('An unexpected error occurred');
    expect(extractErrorMessage(42)).toBe('An unexpected error occurred');
    expect(extractErrorMessage(undefined)).toBe('An unexpected error occurred');
  });
});

describe('toCamelCase / toSnakeCase', () => {
  it('converts nested API payloads', () => {
    const raw = {
      primary_image: { image_url: '/x', is_primary: true },
      average_rating: '4.5',
    };
    expect(toCamelCase(raw)).toEqual({
      primaryImage: { imageUrl: '/x', isPrimary: true },
      averageRating: '4.5',
    });
  });

  it('maps arrays and leaves File instances untouched', () => {
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });
    const out = toSnakeCase([{ firstName: 'A' }, file]) as unknown[];
    expect(out[0]).toEqual({ first_name: 'A' });
    expect(out[1]).toBe(file);
  });

  it('round-trips primitives', () => {
    expect(toCamelCase(null)).toBe(null);
    expect(toSnakeCase(42)).toBe(42);
  });
});
