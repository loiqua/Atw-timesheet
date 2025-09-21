"use client";
import Image from 'next/image';
import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { registerSchema, type RegisterValues } from '@/features/auth/schemas';
import { apiGet, apiPost } from '@/lib/fetcher';
import { useRouter } from 'next/navigation';
import { PasswordInput } from './PasswordInput';
import { PasswordHints } from './PasswordHints';
import type { Resolver, FieldErrors, FieldError } from 'react-hook-form';

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [domains, setDomains] = React.useState<readonly { id: string; name: string; slug: string }[]>([]);
  const [loadingDomains, setLoadingDomains] = React.useState(true);

  const registerResolver: Resolver<RegisterValues> = async (values) => {
    const result = registerSchema.safeParse(values);
    const errs: FieldErrors<RegisterValues> = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof RegisterValues | undefined;
        if (key) {
          (errs as Record<string, FieldError>)[key as string] = {
            type: 'zod',
            message: issue.message,
          } as FieldError;
        }
      }
      return { values: {} as RegisterValues, errors: errs };
    }
    // Extra rule: if selected domain slug is 'direction', adminKey required
    const sel = domains.find((d) => d.id === values.domainId);
    if (sel?.slug === 'direction' && !values.adminKey) {
      (errs as Record<string, FieldError>)['adminKey'] = {
        type: 'custom',
        message: "La clé admin est requise pour le domaine 'Direction'",
      } as FieldError;
      return { values: {} as RegisterValues, errors: errs };
    }
    return { values: result.data, errors: {} as FieldErrors<RegisterValues> };
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: registerResolver, mode: 'onChange' });

  const selectedDomainId = watch('domainId');
  const selectedDomain = React.useMemo(
    () => domains.find((d) => d.id === selectedDomainId),
    [domains, selectedDomainId],
  );
  const showAdminKey = selectedDomain?.slug === 'direction';
  const passwordValue = useWatch({ control, name: 'password' }) ?? '';

  React.useEffect(() => {
    (async () => {
      try {
        const list = await apiGet<readonly { id: string; name: string; slug: string }[]>('/domains');
        setDomains(list);
      } finally {
        setLoadingDomains(false);
      }
    })().catch(() => setLoadingDomains(false));
  }, []);

  const onSubmit = async (values: RegisterValues) => {
    setError(null);
    setLoading(true);
    try {
      const basePayload = {
        email: values.email,
        fullName: values.fullName,
        username: values.username,
        password: values.password,
      };
      const payload = {
        ...basePayload,
        ...(values.domainId ? { domainId: values.domainId } : {}),
        ...(values.adminKey ? { adminKey: values.adminKey } : {}),
      };
      await apiPost('/auth/register', payload as typeof basePayload & { domainId?: string; adminKey?: string });
      router.push('/auth/login');
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
          <h1 className="text-2xl font-semibold">Inscription</h1>
          <p className="text-sm text-gray-500">Créer votre compte ATW</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" aria-labelledby="register-title">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium">Nom complet</label>
            <input id="fullName" {...register('fullName')} className="mt-1 w-full rounded-md border px-3 py-2 bg-white/90 dark:bg-black/30 outline-none focus:border-blue-500" placeholder="Nom et prénom" />
            {errors.fullName && <p role="alert" className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input id="email" type="email" {...register('email')} className="mt-1 w-full rounded-md border px-3 py-2 bg-white/90 dark:bg-black/30 outline-none focus:border-blue-500" placeholder="exemple@atw.com" />
            {errors.email && <p role="alert" className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium">Nom d&apos;utilisateur</label>
            <input id="username" {...register('username')} className="mt-1 w-full rounded-md border px-3 py-2 bg-white/90 dark:bg-black/30 outline-none focus:border-blue-500" placeholder="username" />
            <p className="mt-1 text-xs text-gray-500">Commence par une lettre, peut contenir lettres, chiffres, ., -, _</p>
            {errors.username && <p role="alert" className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">Mot de passe</label>
            <PasswordInput id="password" aria-label="Mot de passe" {...register('password')} />
            <PasswordHints password={passwordValue} />
            {errors.password && <p role="alert" className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            <p className="mt-1 text-xs text-gray-500">Règles ci-dessus — mises à jour en temps réel.</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium">Confirmer le mot de passe</label>
            <input id="confirmPassword" type="password" {...register('confirmPassword')} className="mt-1 w-full rounded-md border px-3 py-2 bg-white/90 dark:bg-black/30 outline-none focus:border-blue-500" placeholder="Confirmer" />
            {errors.confirmPassword && <p role="alert" className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
          </div>

          <div>
            <label htmlFor="domainId" className="block text-sm font-medium">Domaine</label>
            <select id="domainId" {...register('domainId')} className="mt-1 w-full rounded-md border px-3 py-2 bg-white/90 dark:bg-black/30 outline-none focus:border-blue-500" disabled={loadingDomains} required>
              <option value="">Sélectionner un domaine</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {errors.domainId && <p role="alert" className="mt-1 text-sm text-red-600">{errors.domainId.message}</p>}
          </div>

          {showAdminKey && (
            <div>
              <label htmlFor="adminKey" className="block text-sm font-medium">Clé Admin</label>
              <input id="adminKey" {...register('adminKey')} className="mt-1 w-full rounded-md border px-3 py-2 bg-white/90 dark:bg-black/30 outline-none focus:border-blue-500" placeholder="Clé d'administrateur" />
              {errors.adminKey && <p role="alert" className="mt-1 text-sm text-red-600">{errors.adminKey.message}</p>}
            </div>
          )}

          {error && <div className="text-sm text-red-600" role="alert">{error}</div>}

          <button type="submit" disabled={loading} className="w-full rounded-md bg-blue-600 text-white py-2.5 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60">
            {loading ? 'Création…' : 'S\u2019inscrire'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          Déjà un compte ?{' '}<a href="/auth/login" className="text-blue-700 hover:underline">Se connecter</a>
        </div>
      </div>
    </div>
  );
}
