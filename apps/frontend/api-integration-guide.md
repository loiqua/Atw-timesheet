# Guide d’intégration API Frontend (Next.js + fetcher)

Ce guide explique comment consommer votre API NestJS côté Frontend avec les utilitaires fournis dans `apps/frontend/src/lib/fetcher.ts`. Il illustre les bonnes pratiques (typage, authentification, erreurs, pagination, formulaires, upload) et propose des patrons prêts à copier.

## Prérequis

- URL API: `apps/frontend/src/lib/env.ts`

```ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
```

- Utilitaires réseau: `apps/frontend/src/lib/fetcher.ts`
  - `apiGet<T>(path, { auth? , init? })`
  - `apiPost<TBody, TResp>(path, body, init?, { auth? })`
  - Rafraîchissement automatique du token sur 401 si `auth: true` (via `POST /auth/refresh`).

- Store Auth: `apps/frontend/src/lib/auth-store.ts`
  - Persiste `accessToken` et `refreshToken` dans `localStorage`.
  - `clear()` pour purger lors du logout.

- Garde d’auth: `apps/frontend/src/lib/use-require-auth.ts`, `apps/frontend/src/components/auth/AuthGuard.tsx`

> Note: Le fetcher lit les tokens depuis `localStorage` et donc s’utilise côté client (pas SSR). Pour SSR, préférer des proxies côté serveur ou un autre mécanisme de session (cookies).

---

## Utilisation de base

### GET non authentifié

```ts
import { apiGet } from '@/lib/fetcher';

type Domain = { id: string; name: string; slug: string };

export async function listDomains() {
  return await apiGet<readonly Domain[]>('/domains');
}
```

### GET authentifié (avec auto-refresh)

```ts
import { apiGet } from '@/lib/fetcher';
import type { UserProfile } from '@/lib/auth-store';

export async function getMyProfile() {
  return await apiGet<UserProfile>('/auth/profile', { auth: true });
}
```

### POST JSON

```ts
import { apiPost } from '@/lib/fetcher';

type CreatePayload = { title: string; description?: string };

type Created = { id: string; title: string };

export async function createTask(payload: CreatePayload) {
  return await apiPost<CreatePayload, Created>('/tasks', payload, undefined, { auth: true });
}
```

### Gestion des erreurs

Le fetcher normalise le message d’erreur en utilisant `response.body.message` (string ou tableau). Les erreurs sont renvoyées sous forme `Error(message)`.

```ts
try {
  await createTask({ title: '' });
} catch (e) {
  const message = (e as Error).message; // À afficher dans un toast ou un <div role="alert">
}
```

---

## Pagination, filtres et querystring

```ts
function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) usp.set(k, String(v));
  }
  const q = usp.toString();
  return q ? `?${q}` : '';
}

type Assignment = {
  id: string;
  userId: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'INFO_IT';
  scope: string | null;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
};

export async function getRoleAssignments(options: { page?: number; pageSize?: number; userId?: string; role?: Assignment['role']; active?: boolean }) {
  const q = buildQuery({
    page: options.page ?? 1,
    pageSize: options.pageSize ?? 20,
    userId: options.userId,
    role: options.role,
    active: options.active,
  });
  return await apiGet<{ data: Assignment[]; total: number; page: number; pageSize: number }>(`/roles/assignments${q}`, { auth: true });
}
```

---

## Hooks React: chargement et mutation

### Hook de lecture simple

```ts
import * as React from 'react';
import { getRoleAssignments } from './api';

export function useRoleAssignments(params: { page?: number; pageSize?: number }) {
  const [data, setData] = React.useState<Awaited<ReturnType<typeof getRoleAssignments>> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true); setError(null);
    getRoleAssignments(params)
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [params.page, params.pageSize]);

  return { data, loading, error } as const;
}
```

### Hook de mutation (POST/DELETE/PATCH)

```ts
import * as React from 'react';
import { apiPost } from '@/lib/fetcher';

type CreateRoleAssignmentDto = { role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'INFO_IT'; scope?: string | null; validFrom: string; validTo?: string | null };

enum HttpStatus { CREATED = 201 }

export function useAssignRole() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const assign = async (userId: string, dto: CreateRoleAssignmentDto) => {
    setLoading(true); setError(null);
    try {
      const created = await apiPost<CreateRoleAssignmentDto, unknown>(`/roles/users/${userId}/assignments`, dto, undefined, { auth: true });
      return created; // rafraîchir ensuite la liste
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { assign, loading, error } as const;
}
```

---

## Intégration avec react-hook-form + Zod

Exemple d’envoi d’un formulaire typé et validé côté client avant l’appel réseau. Voir aussi `apps/frontend/src/features/auth/components/LoginForm.tsx` et `RegisterForm.tsx` pour des implémentations complètes.

```tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Resolver, FieldErrors, FieldError } from 'react-hook-form';
import { apiPost } from '@/lib/fetcher';

const schema = z.object({ title: z.string().min(2), description: z.string().optional() });
type Values = z.infer<typeof schema>;

export function CreateTaskForm() {
  const resolver: Resolver<Values> = async (values) => {
    const r = schema.safeParse(values);
    if (r.success) return { values: r.data, errors: {} as FieldErrors<Values> };
    const errs: FieldErrors<Values> = {};
    for (const issue of r.error.issues) {
      const key = issue.path[0] as keyof Values | undefined;
      if (key) (errs as Record<string, FieldError>)[key as string] = { type: 'zod', message: issue.message } as FieldError;
    }
    return { values: {} as Values, errors: errs };
  };

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver, mode: 'onChange' });

  const onSubmit = async (values: Values) => {
    await apiPost('/tasks', values, undefined, { auth: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <p role="alert">{errors.title.message}</p>}
      <textarea {...register('description')} />
      <button type="submit">Créer</button>
    </form>
  );
}
```

---

## Appels nécessitant le rôle ADMIN

Les routes du module rôles (`/roles/*`) exigent un token d’un utilisateur `ADMIN`. Utilisez simplement `auth: true` et gérez l’erreur `403 Forbidden`.

```ts
import { apiGet, apiPost } from '@/lib/fetcher';

export async function adminListAssignments() {
  return await apiGet('/roles/assignments', { auth: true });
}

export async function adminAssignRole(userId: string, dto: { role: string; scope?: string | null; validFrom: string; validTo?: string | null }) {
  return await apiPost(`/roles/users/${userId}/assignments`, dto, undefined, { auth: true });
}
```

---

## Upload de fichiers (FormData)

Le fetcher met `Content-Type: application/json`. Pour un upload, utilisez `fetch` natif afin de laisser le navigateur définir le `boundary` et envoyez l’`Authorization` si besoin.

```ts
import { API_URL } from '@/lib/env';
import { useAuthStore } from '@/lib/auth-store';

export async function uploadAvatar(file: File) {
  const { accessToken } = useAuthStore.getState();
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_URL}/me/avatar`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: fd,
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}
```

---

## Patterns de structure par feature

Pour garder un code propre, isolez les appels API d’une feature dans un module `api.ts` et exposez des hooks ciblés:

```
src/features/projects/
├─ api.ts            // appels REST (apiGet/apiPost…)
├─ use-projects.ts   // hooks React (lecture/mutation)
├─ components/
│  ├─ ProjectsTable.tsx
│  └─ CreateProjectDialog.tsx
```

Exemple minimal d’`api.ts`:

```ts
// src/features/projects/api.ts
import { apiGet, apiPost } from '@/lib/fetcher';

export type Project = { id: string; name: string };

export async function listProjects() {
  return await apiGet<Project[]>('/projects', { auth: true });
}

export async function createProject(input: { name: string }) {
  return await apiPost<typeof input, Project>('/projects', input, undefined, { auth: true });
}
```

---

## Accessibilité & UX

- Utiliser des labels explicites et `aria-invalid`/`role="alert"` pour les erreurs.
- Afficher des états de chargement (`aria-busy`) et désactiver les boutons lors des mutations.
- Fournir des messages d’erreur compréhensibles (issus du fetcher) et des feedbacks (toasts, banners).
- Respecter le dark mode et les contrastes (voir composants d’auth existants).

---

## Débogage

- Vérifier `NEXT_PUBLIC_API_URL`.
- Utiliser l’onglet Réseau du navigateur pour voir les 401/403/400.
- Les erreurs côté fetcher renvoient une `Error(message)` construite depuis la réponse Nest (ex: DTO invalid). Logguez `e.message`.

---

## Références

- Fetcher: `apps/frontend/src/lib/fetcher.ts`
- Store: `apps/frontend/src/lib/auth-store.ts`
- Garde d’auth: `apps/frontend/src/lib/use-require-auth.ts`
- Auth UI: `apps/frontend/src/features/auth/components/*`
- Backend API (Swagger): `http://localhost:8000/api`
