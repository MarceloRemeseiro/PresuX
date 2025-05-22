import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen flex-col items-center justify-center">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
} 