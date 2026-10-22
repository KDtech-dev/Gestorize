import { NextRequest, NextResponse } from 'next/server';

const TOKEN_COOKIE = 'gestorize_session';
const COOKIE_TTL_SECONDS = 3 * 60 * 60;

type RouteContext = { params: Promise<{ path: string[] }> };

const apiUrl = () => {
  const base = process.env.BACKEND_API_URL ?? 'http://127.0.0.1:8000/api';
  return base.replace(/\/$/, '');
};

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const endpoint = path.map(encodeURIComponent).join('/');
  const target = new URL(`${apiUrl()}/${endpoint}`);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.append(key, value));
  const isLogin = path.join('/') === 'login' && request.method === 'POST';
  const isRefresh = path.join('/') === 'refresh' && request.method === 'POST';
  const isLogout = path.join('/') === 'logout' && request.method === 'POST';

  const headers = new Headers({ Accept: 'application/json' });
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
    });
  } catch {
    const response = NextResponse.json(
      { success: false, message: 'Não foi possível conectar à API. Confira BACKEND_API_URL e o servidor Laravel.' },
      { status: 502 },
    );
    if (isLogout) response.cookies.set(TOKEN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
    return response;
  }

  const responseHeaders = new Headers();
  responseHeaders.set('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
  const raw = await upstream.text();
  let payload: unknown = raw;

  if ((responseHeaders.get('Content-Type') ?? '').includes('application/json')) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { success: false, message: 'A API retornou uma resposta inválida.' };
    }
  }

  const data = payload as { data?: { token?: string; expires_at?: string }; [key: string]: unknown };
  const sessionToken = data?.data?.token;
  let responsePayload = payload;

  if ((isLogin || isRefresh) && upstream.ok && sessionToken) {
    const innerData = { ...data.data };
    delete innerData.token;
    responsePayload = { ...data, data: innerData };
  }

  const response = typeof responsePayload === 'string'
    ? new NextResponse(responsePayload, { status: upstream.status, headers: responseHeaders })
    : NextResponse.json(responsePayload, { status: upstream.status, headers: responseHeaders });

  if ((isLogin || isRefresh) && upstream.ok && sessionToken) {
    const expiresAt = data.data?.expires_at ? Date.parse(data.data.expires_at) : NaN;
    const maxAge = Number.isFinite(expiresAt)
      ? Math.max(0, Math.min(COOKIE_TTL_SECONDS, Math.floor((expiresAt - Date.now()) / 1000)))
      : COOKIE_TTL_SECONDS;
    response.cookies.set(TOKEN_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });
  }

  if (isLogout || upstream.status === 401) {
    response.cookies.set(TOKEN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  }

  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
