"use client";
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { useSearchParams } from 'next/navigation';

function ResetPasswordContent() {
  const sp = useSearchParams();
  const token = sp.get('token');
  return <ResetPasswordForm tokenFromUrl={token} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
