# ATW Timesheet Frontend – Auth Documentation

Une documentation technique complète de la couche d’authentification côté Frontend (Next.js/React). Elle s’aligne sur le style de `apps/api/auth.md` et référence précisément le code et les flux.

## Features

- Formulaires d’authentification complets
  - Login, Register, Forgot Password, Reset Password
- Stockage et rafraîchissement des tokens (access/refresh)
- Récupération du profil et garde d’authentification côté client
- Protection par rôle côté UI
- Accessibilité et UX renforcées

## Tech Stack

- Framework: Next.js (App Router)
- Langage: TypeScript + React
- Form: react-hook-form + Zod (validation)
- State: Zustand (auth store)
- UI: Tailwind CSS + composants personnalisés

## Environnement

Configurer l’URL de l’API via la variable d’environnement:

```ts
// apps/frontend/src/lib/env.ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
```

Assurez-vous que `NEXT_PUBLIC_API_URL` pointe vers l’API NestJS (`apps/api`).

## Structure

- Pages
  - `apps/frontend/src/app/auth/login/page.tsx`
  - `apps/frontend/src/app/auth/register/page.tsx`
  - `apps/frontend/src/app/auth/forgot-password/page.tsx`
  - `apps/frontend/src/app/auth/reset-password/page.tsx`
- Composants & logique Auth
  - `apps/frontend/src/features/auth/components/LoginForm.tsx`
  - `apps/frontend/src/features/auth/components/RegisterForm.tsx`
  - `apps/frontend/src/features/auth/components/ForgotPasswordForm.tsx`
  - `apps/frontend/src/features/auth/components/ResetPasswordForm.tsx`
  - `apps/frontend/src/features/auth/schemas.ts` (Zod)
  - `apps/frontend/src/lib/fetcher.ts` (requêtes + auto-refresh)
  - `apps/frontend/src/lib/auth-store.ts` (Zustand)
  - `apps/frontend/src/lib/use-require-auth.ts` (hook de garde)
  - `apps/frontend/src/components/auth/AuthGuard.tsx`
  - `apps/frontend/src/components/auth/RoleGuard.tsx`
  - `apps/frontend/src/components/layout/JwtLogoutButton.tsx`

## Schémas & Validation (Zod)

- `loginSchema` et `registerSchema`: `apps/frontend/src/features/auth/schemas.ts`

```ts
export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email({ message: 'Invalid email' }),
    username: z.string().min(3).regex(/^[A-Za-z][A-Za-z0-9._-]{2,}$/u),
    password: passwordSchema,
    confirmPassword: z.string(),
    domainId: z.string().uuid({ message: 'Le domaine est requis' }),
    adminKey: z.string().optional(),
  })
  .refine((val) => val.password === val.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
```

- Règle UI additionnelle (en cohérence avec le backend): lorsque le domain sélectionné est `slug === 'direction'`, la `adminKey` devient obligatoire.
  - Implémenté dans `RegisterForm.tsx`.

## Flux API & Tokens

- Requêtes et rafraîchissement automatique: `apps/frontend/src/lib/fetcher.ts`
  - Sur 401 avec `opts.auth === true`, le client tente une seule fois un `POST /auth/refresh` avec `{ userId, refreshToken }` puis rejoue la requête initiale.

```ts
// Simplifié: apps/frontend/src/lib/fetcher.ts
const res = await requestWithRefresh(doRequest, { auth: !!opts?.auth });
if (!res.ok) throw new Error(messageFromBodyOrStatus(res));

// refresh fl ow
const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, refreshToken }),
});
if (refreshRes.ok) useAuthStore.getState().setTokens(await refreshRes.json());
```

- Store Auth (Zustand): `apps/frontend/src/lib/auth-store.ts`
  - `setTokens` persiste `accessToken` et `refreshToken` dans `localStorage`.
  - `setUser` stocke le profil en mémoire.
  - `clear` purge les tokens et l’utilisateur (utilisé lors du logout).

```ts
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null, refreshToken: null, user: null,
  setTokens: ({ accessToken, refreshToken }) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },
  setUser: (user) => set({ user }),
  clear: () => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); set({ accessToken: null, refreshToken: null, user: null }); },
  loadFromStorage: () => { set({ accessToken: localStorage.getItem('accessToken'), refreshToken: localStorage.getItem('refreshToken') }); },
}));
```

- Récupération de profil authentifié: `apps/frontend/src/lib/use-require-auth.ts`
  - Redirige vers `/auth/login` si pas de token.
  - Charge le profil via `GET /auth/profile` avec header `Authorization: Bearer <accessToken>`.

## Pages & Formulaires

- Login: `apps/frontend/src/features/auth/components/LoginForm.tsx`
  - `POST /auth/login` → `{ user, tokens }`. Les tokens sont persistés, puis `GET /auth/profile` et redirection vers `/dashboard`.
- Register: `apps/frontend/src/features/auth/components/RegisterForm.tsx`
  - `GET /domains` pour lister les domaines.
  - `POST /auth/register` avec `domainId` optionnel et `adminKey` optionnel.
  - Règle: si le domaine a `slug === 'direction'`, `adminKey` requis côté UI (et validé côté backend).
- Forgot Password: `apps/frontend/src/features/auth/components/ForgotPasswordForm.tsx`
  - `POST /auth/forgot-password` avec `{ email }`.
- Reset Password: `apps/frontend/src/features/auth/components/ResetPasswordForm.tsx`
  - `POST /auth/reset-password` avec `{ token, newPassword }`.

## Garde d’accès & Rôles côté UI

- AuthGuard: `apps/frontend/src/components/auth/AuthGuard.tsx`
  - Affiche un skeleton pendant le chargement, rend les enfants si `user` présent.
- RoleGuard: `apps/frontend/src/components/auth/RoleGuard.tsx`
  - Rend les enfants uniquement si `user.role` ∈ `allowed`.

Exemple d’utilisation:

```tsx
<AuthGuard>
  <RoleGuard allowed={["ADMIN", "MANAGER"]}>
    <AdminOrManagerPanel />
  </RoleGuard>
</AuthGuard>
```

## Logout

- Bouton: `apps/frontend/src/components/layout/JwtLogoutButton.tsx`
  - `POST /auth/logout` avec `userId` si disponible, puis `clear()` et redirection `location.href = '/auth/login'`.

```ts
await apiPost('/auth/logout', { userId });
useAuthStore.getState().clear();
window.location.href = '/auth/login';
```

## Accessibilité & UX

- Labels explicites et `aria-*` sur les champs et messages d’erreurs.
- Indications de complexité de mot de passe (hints) et validations en temps réel.
- Contrastes renforcés et support du dark mode.
- Feedback utilisateur (loading states, erreurs lisibles).

## Mapping Back/Front (principaux)

- `POST /auth/register` ← `RegisterForm.tsx`
- `POST /auth/login` ← `LoginForm.tsx`
- `GET /auth/profile` ← `use-require-auth.ts`
- `POST /auth/forgot-password` ← `ForgotPasswordForm.tsx`
- `POST /auth/reset-password` ← `ResetPasswordForm.tsx`
- `POST /auth/refresh` ← `fetcher.ts` (auto-refresh)
- `POST /auth/logout` ← `JwtLogoutButton.tsx`

## Notes de sécurité

- Les tokens d’accès sont portés en header `Authorization: Bearer`.
- Le refresh est tenté une seule fois à réception d’un 401 sur des routes protégées.
- Le store purge les tokens localement au logout et après erreurs critiques.

---

Pour des détails côté backend (rôles, guard JWT, `ScopeGuard`, endpoints Swagger), voir `apps/api/auth.md`.
