import { apiGet, apiPost, apiPatch, apiDelete } from './fetcher';

/**
 * Client API centralisé pour toutes les requêtes
 * Utilise les fonctions du fetcher avec authentification automatique
 */
export const apiClient = {
  /**
   * Effectue une requête GET
   */
  async get<T = unknown>(path: string): Promise<{ data: T }> {
    const data = await apiGet<T>(path, { auth: true });
    return { data };
  },

  /**
   * Effectue une requête POST
   */
  async post<TBody extends object, TResp = unknown>(
    path: string, 
    body: TBody
  ): Promise<{ data: TResp }> {
    const data = await apiPost<TBody, TResp>(path, body, undefined, { auth: true });
    return { data };
  },

  /**
   * Effectue une requête PATCH
   */
  async patch<TBody extends object, TResp = unknown>(
    path: string, 
    body: TBody
  ): Promise<{ data: TResp }> {
    const data = await apiPatch<TBody, TResp>(path, body, undefined, { auth: true });
    return { data };
  },

  /**
   * Effectue une requête DELETE
   */
  async delete<T = unknown>(path: string): Promise<{ data: T }> {
    const data = await apiDelete<T>(path, undefined, { auth: true });
    return { data };
  }
};
