'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { getMessage } from '@/shared/i18n';
import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import { useAuth } from '@/modules/auth';

type Mode = 'register' | 'login';

export default function JoinPage() {
  const [mode, setMode] = useState<Mode>('register');
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/example/dashboard');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-white">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
            <Layers className="size-7 text-amber-400" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight">Aplicação</h1>
            <p className="mt-1 text-sm text-white/50">
              {mode === 'register' ? 'Crie sua conta para começar' : 'Entre na sua conta para continuar'}
            </p>
          </div>
        </div>

        {mode === 'register' ? (
          <RegisterForm />
        ) : (
          <LoginForm />
        )}

        <button
          type="button"
          onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
          className="text-xs text-white/40 transition-colors hover:text-white/70"
        >
          {mode === 'register'
            ? 'Já tem uma conta? Entrar'
            : 'Não tem uma conta? Cadastrar'}
        </button>
      </div>
    </div>
  );
}

function RegisterForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const name = data.get('name') as string;
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        },
      );

      if (response.status === 201) {
        toast.success('Cadastro realizado com sucesso!');
        form.reset();
        return;
      }

      const body: ApiErrorResponse = await response.json();
      for (const code of body.errors) {
        toast.error(getMessage(code));
      }
    } catch {
      toast.error(getMessage('DEFAULT_API_ERROR'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="register-name" className="text-sm font-medium text-white/70">
          Nome completo
        </label>
        <Input
          id="register-name"
          name="name"
          type="text"
          placeholder="Maria Silva"
          required
          disabled={loading}
          className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-amber-400"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="register-email" className="text-sm font-medium text-white/70">
          E-mail
        </label>
        <Input
          id="register-email"
          name="email"
          type="email"
          placeholder="maria@exemplo.com"
          required
          disabled={loading}
          className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-amber-400"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="register-password" className="text-sm font-medium text-white/70">
          Senha
        </label>
        <Input
          id="register-password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          disabled={loading}
          className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-amber-400"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="mt-2 w-full bg-amber-400 font-bold text-black hover:bg-amber-300 disabled:opacity-60"
      >
        {loading ? 'Cadastrando...' : 'Criar conta'}
      </Button>
    </form>
  );
}

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const email = data.get('email') as string;
    const password = data.get('password') as string;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        },
      );

      if (response.ok) {
        const body = await response.json() as { token: string };
        login(body.token);
        router.push('/example/dashboard');
        return;
      }

      const body: ApiErrorResponse = await response.json();
      for (const code of body.errors) {
        toast.error(getMessage(code));
      }
    } catch {
      toast.error(getMessage('DEFAULT_API_ERROR'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="login-email" className="text-sm font-medium text-white/70">
          E-mail
        </label>
        <Input
          id="login-email"
          name="email"
          type="email"
          placeholder="maria@exemplo.com"
          required
          disabled={loading}
          className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-amber-400"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="login-password" className="text-sm font-medium text-white/70">
          Senha
        </label>
        <Input
          id="login-password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          disabled={loading}
          className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-amber-400"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="mt-2 w-full bg-amber-400 font-bold text-black hover:bg-amber-300 disabled:opacity-60"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
