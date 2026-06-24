'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth';
import UserFormComponent from './user-form.component';

type UserData = {
  id: string;
  name: string;
  email: string;
};

type Props = {
  userId: string;
};

export default function UserFormEditWrapper({ userId }: Props) {
  const { token } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          toast.error(getMessage('user.not_found'));
          return;
        }
        const data: UserData = await response.json();
        setUser(data);
      })
      .catch(() => {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      })
      .finally(() => setLoading(false));
  }, [token, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!user) return null;

  return (
    <UserFormComponent
      userId={user.id}
      defaultValues={{ name: user.name, email: user.email }}
    />
  );
}
