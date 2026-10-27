const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: options.method ?? 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, extractMessage(data));
  }
  return data as T;
}

// NestJS responde { message: string } o { message: string[] } (errores de validación)
function extractMessage(data: unknown): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const { message } = data as { message: unknown };

    if (Array.isArray(message)) return message.join('. ');

    if (typeof message === 'string') return message;
  }
  
  return 'Algo salió mal, intenta de nuevo';
}