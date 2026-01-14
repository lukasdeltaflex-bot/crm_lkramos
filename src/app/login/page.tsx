
'use client';

import { AuthForm } from '@/components/auth/auth-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <AuthForm type="login" />
      </div>
    </div>
  );
}
