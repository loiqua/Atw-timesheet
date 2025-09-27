"use client";
import Image from 'next/image';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Resolver, FieldErrors, FieldError } from 'react-hook-form';
import { apiPost } from '@/lib/fetcher';

const forgotSchema = z.object({ email: z.string().email('Email invalide') });
export type ForgotValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const [info, setInfo] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const resolver: Resolver<ForgotValues> = async (values) => {
    const r = forgotSchema.safeParse(values);
    if (r.success) return { values: r.data, errors: {} as FieldErrors<ForgotValues> };
    const errs: FieldErrors<ForgotValues> = {};
    for (const issue of r.error.issues) {
      const key = issue.path[0];
      if (key === 'email') (errs as Record<string, FieldError>)[key] = { type: 'zod', message: issue.message } as FieldError;
    }
    return { values: {} as ForgotValues, errors: errs };
  };

  const { register, handleSubmit, formState: { errors }, } = useForm<ForgotValues>({ resolver, mode: 'onChange' });

  const onSubmit = async (values: ForgotValues) => {
    setError(null); setInfo(null); setLoading(true);
    try {
      await apiPost('/auth/forgot-password', { email: values.email });
      setInfo('Si un compte existe, un email de réinitialisation a été envoyé.');
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
          <h1 className="text-2xl font-semibold">Mot de passe oublié</h1>
          <p className="text-sm text-gray-500">Entrez votre email pour recevoir un lien</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input id="email" type="email" {...register('email')} className="mt-1 w-full rounded-md border px-3 py-2 bg-white/90 dark:bg-black/30 outline-none focus:border-blue-500" placeholder="exemple@atw.com" />
            {errors.email && <p role="alert" className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          {info && <output aria-live="polite" className="text-sm text-green-700">{info}</output>}
          {error && <div className="text-sm text-red-600" role="alert">{error}</div>}
          <button type="submit" disabled={loading} className="w-full rounded-md bg-blue-600 text-white py-2.5 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60">
            {loading ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          <a href="/auth/login" className="text-blue-700 hover:underline">Retour à la connexion</a>
        </div>
      </div>
    </div>
  );
}
