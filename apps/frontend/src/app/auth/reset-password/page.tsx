"use client";
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const sp = useSearchParams();
  const token = sp.get('token');
  return <ResetPasswordForm tokenFromUrl={token} />;
}
