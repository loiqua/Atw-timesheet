"use client";
import Image from 'next/image';
import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import type { Resolver, FieldErrors, FieldError } from 'react-hook-form';
import { apiPost } from '@/lib/fetcher';
import { passwordSchema } from '@/features/auth/schemas';

const resetSchema = z.object({
  token: z.string().min(8, { message: 'Token invalide' }),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((v) => v.newPassword === v.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type ResetValues = z.infer<typeof resetSchema>;

function PasswordHints({ password }: { readonly password: string }) {
  const rules: readonly { readonly label: string; readonly test: RegExp }[] = [
    { label: 'Au moins 8 caractères', test: /.{8,}/ },
    { label: 'Une majuscule', test: /[A-Z]/ },
    { label: 'Une minuscule', test: /[a-z]/ },
    { label: 'Un chiffre', test: /\d/ },
    { label: 'Un caractère spécial', test: /[^A-Za-z0-9]/ },
  ];
  return (
    <ul className="mt-2 space-y-1 text-xs">
      {rules.map((r) => {
        const ok = r.test.test(password);
        return (
          <li key={r.label} className={ok ? 'text-green-600' : 'text-gray-500'}>
            {ok ? '✓' : '•'} {r.label}
          </li>
        );
      })}
    </ul>
  );
}

export function ResetPasswordForm({ tokenFromUrl }: { readonly tokenFromUrl?: string | null }) {
  const [info, setInfo] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const resolver: Resolver<ResetValues> = async (values) => {
    const r = resetSchema.safeParse(values);
    if (r.success) return { values: r.data, errors: {} };
    const errs: FieldErrors<ResetValues> = {};
    for (const issue of r.error.issues) {
      const key = issue.path[0] as keyof ResetValues | undefined;
      if (key) (errs as Record<string, FieldError>)[key as string] = { type: 'zod', message: issue.message } as FieldError;
    }
    return { values: {}, errors: errs };
  };

  const { register, handleSubmit, control, formState: { errors } } = useForm<ResetValues>({ resolver, mode: 'onChange', defaultValues: { token: tokenFromUrl ?? '' } });
  const pwd = useWatch({ control, name: 'newPassword' }) ?? '';

  const onSubmit = async (values: ResetValues) => {
    setError(null); setInfo(null); setLoading(true);
    try {
      await apiPost('/auth/reset-password', { token: values.token, newPassword: values.newPassword });
      setInfo('Mot de passe réinitialisé. Vous pouvez vous connecter.');
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
          <h1 className="text-2xl font-semibold">Réinitialiser le mot de passe</h1>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium">Token</label>
            <input id="token" {...register('token')} className="mt-1 w-full rounded-md border px-3 py-2 bg-white/90 dark:bg-black/30 outline-none focus:border-blue-500" placeholder="Coller le token" />
            {errors.token && <p role="alert" className="mt-1 text-sm text-red-600">{errors.token.message}</p>}
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium">Nouveau mot de passe</label>
            <input id="newPassword" type="password" {...register('newPassword')} className="mt-1 w-full rounded-md border px-3 py-2 bg-white/90 dark:bg-black/30 outline-none focus:border-blue-500" placeholder="Mot de passe" />
            <PasswordHints password={pwd} />
            {errors.newPassword && <p role="alert" className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium">Confirmer le mot de passe</label>
            <input id="confirmPassword" type="password" {...register('confirmPassword')} className="mt-1 w-full rounded-md border px-3 py-2 bg-white/90 dark:bg-black/30 outline-none focus:border-blue-500" placeholder="Confirmer" />
            {errors.confirmPassword && <p role="alert" className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
          </div>
          {info && <output aria-live="polite" className="text-sm text-green-700">{info}</output>}
          {error && <div className="text-sm text-red-600" role="alert">{error}</div>}
          <button type="submit" disabled={loading} className="w-full rounded-md bg-blue-600 text-white py-2.5 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60">
            {loading ? 'Mise à jour…' : 'Changer le mot de passe'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          <a href="/auth/login" className="text-blue-700 hover:underline">Retour à la connexion</a>
        </div>
      </div>
    </div>
  );
}
