"use client";
import * as React from 'react';

export function PasswordHints({ password }: { readonly password: string }) {
  const rules: readonly { readonly label: string; readonly test: RegExp }[] = [
    { label: 'Au moins 8 caractères', test: /.{8,}/ },
    { label: 'Une majuscule', test: /[A-Z]/ },
    { label: 'Une minuscule', test: /[a-z]/ },
    { label: 'Un chiffre', test: /\d/ },
    { label: 'Un caractère spécial', test: /[^A-Za-z0-9]/ },
  ];
  return (
    <ul className="mt-2 space-y-1 text-xs" aria-live="polite">
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
