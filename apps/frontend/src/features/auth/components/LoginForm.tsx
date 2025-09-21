"use client";
import Image from 'next/image';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { loginSchema, type LoginValues } from '@/features/auth/schemas';
import { apiGet, apiPost } from '@/lib/fetcher';
import { useRouter } from 'next/navigation';
import { PasswordInput } from './PasswordInput';
import type { Resolver, FieldErrors, FieldError } from 'react-hook-form';
import { useAuthStore } from '@/lib/auth-store';
import type { UserProfile } from '@/lib/auth-store';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loginResolver: Resolver<LoginValues> = async (values) => {
    const result = loginSchema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} as FieldErrors<LoginValues> };
    }
    const errs: FieldErrors<LoginValues> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof LoginValues;
      if (key === 'emailOrUsername' || key === 'password') {
        (errs as Record<string, FieldError>)[key as string] = {
          type: 'zod',
          message: issue.message,
        } as FieldError;
      }
    }
    return { values: {} as LoginValues, errors: errs };
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: loginResolver, mode: 'onChange' });

  const onSubmit = async (values: LoginValues) => {
    setError(null);
    setLoading(true);
    try {
      // Login → { user, tokens }
      const resp = await apiPost<typeof values, { tokens?: { accessToken: string; refreshToken: string } }>(
        '/auth/login',
        values,
      );
      if (resp?.tokens) {
        useAuthStore.getState().setTokens(resp.tokens);
        try {
          const profile = await apiGet<UserProfile>('/auth/profile', { auth: true });
          useAuthStore.getState().setUser(profile);
        } catch {
          // ignore profile load errors here
        }
      }
      router.push('/dashboard');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/90 dark:bg-neutral-900/80 backdrop-blur-xl shadow-xl p-6 sm:p-8">
        <div className="flex flex-col items-center gap-2">
          <Image src="/Logo ATW Humanitae.png" alt="ATW Humanitae" width={64} height={64} className="rounded-full" />
          <h1 className="text-2xl font-semibold">Connexion</h1>
          <p className="text-sm text-gray-500">ATW TimeSheet</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" aria-labelledby="login-title">
          <div>
            <label htmlFor="emailOrUsername" className="block text-sm font-medium">Nom d&apos;utilisateur ou Email</label>
            <input
              id="emailOrUsername"
              {...register('emailOrUsername')}
              className="mt-1 w-full rounded-md border px-3 py-2 bg-white/90 dark:bg-black/30 outline-none focus:border-blue-500"
              placeholder="Entrez votre identifiant"
              aria-invalid={!!errors.emailOrUsername}
            />
            {errors.emailOrUsername && (
              <p role="alert" className="mt-1 text-sm text-red-600">{errors.emailOrUsername.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">Mot de passe</label>
            <PasswordInput id="password" aria-label="Mot de passe" {...register('password')} />
            {errors.password && (
              <p role="alert" className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {error && <div className="text-sm text-red-600" role="alert">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 text-white py-2.5 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="/auth/forgot-password" className="text-blue-700 hover:underline">Mot de passe oublié ?</a>
            <span aria-hidden>•</span>
            <span>
              Pas de compte ?{' '}
              <a href="/auth/register" className="text-blue-700 hover:underline">S&apos;inscrire</a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
