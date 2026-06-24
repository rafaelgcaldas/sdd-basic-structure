'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { SectionHeader } from '@/shared/components/ui/section-header';
import { getMessage } from '@/shared/i18n';
import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import { useAuth } from '@/modules/auth';

type UserFormProps = {
  userId?: string;
  defaultValues?: {
    name?: string;
    email?: string;
  };
};

export default function UserFormComponent({ userId, defaultValues }: UserFormProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(userId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const name = (data.get('name') as string).trim();
    const email = (data.get('email') as string).trim();
    const password = data.get('password') as string;
    const passwordConfirmation = data.get('passwordConfirmation') as string;

    if (password && password !== passwordConfirmation) {
      toast.error(getMessage('user.password.confirmation.mismatch'));
      return;
    }

    setLoading(true);
    try {
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/users`;

      const body: Record<string, string> = { name, email };
      if (password) body.password = password;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 201 || response.status === 204) {
        toast.success(isEditing ? 'Usuário atualizado com sucesso.' : 'Usuário criado com sucesso.');
        router.push('/auth/users');
        return;
      }

      const errorBody: ApiErrorResponse = await response.json();
      for (const code of errorBody.errors) toast.error(getMessage(code));
    } catch {
      toast.error(getMessage('DEFAULT_API_ERROR'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      <SectionHeader
        title={isEditing ? 'Editar usuário' : 'Novo usuário'}
        subtitle={isEditing ? 'Atualize os dados do usuário.' : 'Preencha os dados para criar um novo usuário.'}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <FormSectionLayout
          title="Dados básicos"
          description="Nome e e-mail de acesso do usuário."
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-name">Nome completo</Label>
            <Input
              id="user-name"
              name="name"
              type="text"
              placeholder="Maria Silva"
              defaultValue={defaultValues?.name}
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-email">E-mail</Label>
            <Input
              id="user-email"
              name="email"
              type="email"
              placeholder="maria@exemplo.com"
              defaultValue={defaultValues?.email}
              disabled={loading}
              required
            />
          </div>
        </FormSectionLayout>

        <FormSectionLayout
          title="Senha"
          description={
            isEditing
              ? 'Deixe em branco para manter a senha atual.'
              : 'A senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial.'
          }
          showDivider={false}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-password">
              {isEditing ? 'Nova senha' : 'Senha'}
              {!isEditing && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <Input
              id="user-password"
              name="password"
              type="password"
              placeholder="••••••••"
              disabled={loading}
              required={!isEditing}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-password-confirmation">
              {isEditing ? 'Confirmar nova senha' : 'Confirmar senha'}
            </Label>
            <Input
              id="user-password-confirmation"
              name="passwordConfirmation"
              type="password"
              placeholder="••••••••"
              disabled={loading}
              required={!isEditing}
            />
          </div>
        </FormSectionLayout>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar usuário'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => router.push('/auth/users')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
