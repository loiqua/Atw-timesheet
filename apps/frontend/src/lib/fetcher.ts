import { API_URL } from '@/lib/env';
import { useAuthStore } from '@/lib/auth-store';

async function requestWithRefresh(
  doRequest: () => Promise<Response>,
  opts: { readonly auth?: boolean },
): Promise<Response> {
  const res = await doRequest();
  if (res.status !== 401 || !opts.auth) return res;
  // try refresh once
  const { refreshToken } = useAuthStore.getState();
  const userId = useAuthStore.getState().user?.id;
  if (!refreshToken || !userId) return res; // nothing to do
  try {
    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, refreshToken }),
    });
    if (!refreshRes.ok) return res;
    const tokens = (await refreshRes.json()) as { accessToken: string; refreshToken: string };
    useAuthStore.getState().setTokens(tokens);
  } catch {
    return res;
  }
  // retry original once after refresh
  return doRequest();
}

export async function apiPost<TBody extends object, TResp = unknown>(
  path: string,
  body: TBody,
  init?: RequestInit,
  opts?: { readonly auth?: boolean },
): Promise<TResp> {
  const doRequest = () => fetch(`${API_URL}${path}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}), ...(opts?.auth && useAuthStore.getState().accessToken ? { Authorization: `Bearer ${useAuthStore.getState().accessToken}` } : {}) },
      body: JSON.stringify(body),
      ...init,
    },
  );
  const res = await requestWithRefresh(doRequest, { auth: !!opts?.auth });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // keep raw text
    data = text;
  }
  const getMessage = (d: unknown): string | undefined => {
    if (typeof d === 'string') return d;
    if (d && typeof d === 'object' && 'message' in d) {
      const m = (d as { message?: unknown }).message;
      if (typeof m === 'string') return m;
      if (Array.isArray(m)) return m.map(String).join(', ');
    }
    return undefined;
  };
  if (!res.ok) {
    const message = getMessage(data) ?? res.statusText ?? 'Request failed';
    throw new Error(message);
  }
  return data as TResp;
}

function readAccessToken(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  } catch {
    return null;
  }
}

export async function apiGet<TResp = unknown>(
  path: string,
  opts?: { readonly auth?: boolean; readonly init?: RequestInit },
): Promise<TResp> {
  const doRequest = () => {
    const headers: Record<string, string> = { ...(opts?.init?.headers as Record<string, string> | undefined) };
    if (opts?.auth) {
      const token = useAuthStore.getState().accessToken ?? readAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return fetch(`${API_URL}${path}`, { method: 'GET', headers, ...(opts?.init ?? {}) });
  };
  const res = await requestWithRefresh(doRequest, { auth: !!opts?.auth });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    let message = res.statusText || 'Request failed';
    if (data && typeof data === 'object' && 'message' in data) {
      const m = (data as { message?: unknown }).message;
      if (typeof m === 'string') message = m;
      else if (Array.isArray(m)) message = m.map(String).join(', ');
      else if (m) message = JSON.stringify(m);
    }
    throw new Error(message);
  }
  return data as TResp;
}
