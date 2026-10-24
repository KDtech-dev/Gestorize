export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api/proxy${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null);
  if (response.status === 401 && path !== '/login' && path !== 'login' && path !== '/logout' && path !== 'logout' && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('gestorize:unauthorized'));
  }
  if (!response.ok) {
    const validationMessage = payload?.errors && typeof payload.errors === 'object'
      ? Object.values(payload.errors as Record<string, unknown[]>).flat().find((value) => typeof value === 'string')
      : undefined;
    const message = (typeof validationMessage === 'string' ? validationMessage : null)
      ?? payload?.message
      ?? 'Não foi possível concluir a solicitação.';
    throw new Error(message);
  }
  return payload as T;
}

export type ApiEnvelope<T> = {
  success: boolean;
  message?: string | null;
  data: T;
};

export function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  return (payload as ApiEnvelope<T>)?.data ?? (payload as T);
}
