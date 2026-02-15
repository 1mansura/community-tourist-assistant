import axios, { AxiosError, AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function transformKeys(
  data: unknown,
  transformer: (key: string) => string
): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => transformKeys(item, transformer));
  }
  if (data !== null && typeof data === 'object' && !(data instanceof File)) {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([key, value]) => [
        transformer(key),
        transformKeys(value, transformer),
      ])
    );
  }
  return data;
}

export function toCamelCase(data: unknown): unknown {
  return transformKeys(data, snakeToCamel);
}

export function toSnakeCase(data: unknown): unknown {
  return transformKeys(data, camelToSnake);
}

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') {
      if ('detail' in data) return String(data.detail);
      if ('non_field_errors' in data) {
        const errors = data.non_field_errors;
        return Array.isArray(errors) ? errors.join(', ') : String(errors);
      }
      const messages: string[] = [];
      for (const [field, value] of Object.entries(data)) {
        const msg = Array.isArray(value) ? value.join(', ') : String(value);
        messages.push(`${field}: ${msg}`);
      }
      if (messages.length > 0) return messages.join('; ');
    }
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  
  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      if (config.data instanceof FormData) {
        // Let the browser set multipart boundaries automatically.
        if (config.headers) {
          const headers = config.headers as unknown as {
            delete?: (name: string) => void;
            [key: string]: unknown;
          };
          if (typeof headers.delete === 'function') {
            headers.delete('Content-Type');
          } else {
            delete headers['Content-Type'];
            delete headers['content-type'];
          }
        }
      } else if (config.data) {
        config.data = toSnakeCase(config.data);
      }
      return config;
    });
    
    this.client.interceptors.response.use(
      (response) => {
        response.data = toCamelCase(response.data);
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.accessToken = null;
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_tokens');
          }
        }
        return Promise.reject(error);
      }
    );
  }
  
  setAccessToken(token: string | null) {
    this.accessToken = token;
  }
  
  async get<T>(url: string, params?: Record<string, unknown>) {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }
  
  async post<T>(url: string, data?: unknown) {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }
  
  async put<T>(url: string, data: unknown) {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }
  
  async patch<T>(url: string, data: unknown) {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }
  
  async delete(url: string) {
    await this.client.delete(url);
  }
}

export const api = new ApiClient();
