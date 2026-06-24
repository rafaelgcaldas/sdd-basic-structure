'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { PaginationControls } from '@/shared/components/ui/pagination-controls';
import { SectionHeader } from '@/shared/components/ui/section-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { TableCard } from '@/shared/components/ui/table-card';
import { getMessage } from '@/shared/i18n';
import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import { useAuth } from '@/modules/auth';

type UserRow = {
  id: string;
  name: string;
  email: string;
};

type UserPage = {
  data: UserRow[];
  total: number;
  page: number;
  perPage: number;
};

const PER_PAGE = 10;

export default function UserListComponent() {
  const router = useRouter();
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [userPage, setUserPage] = useState<UserPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(
    async (currentPage: number) => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users?page=${currentPage}&perPage=${PER_PAGE}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) throw new Error();
        const data: UserPage = await response.json();
        setUserPage(data);
      } catch {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  async function handleDelete() {
    if (!deleteTarget || !token) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${deleteTarget.id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.status === 204) {
        toast.success('Usuário excluído com sucesso.');
        setDeleteTarget(null);
        await fetchUsers(page);
        return;
      }

      const body: ApiErrorResponse = await response.json();
      for (const code of body.errors) toast.error(getMessage(code));
    } catch {
      toast.error(getMessage('DEFAULT_API_ERROR'));
    } finally {
      setIsDeleting(false);
    }
  }

  const totalPages = userPage ? Math.ceil(userPage.total / PER_PAGE) : 1;

  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Usuários"
        subtitle="Gerencie os usuários da aplicação."
        aside={
          <Button size="sm" onClick={() => router.push('/auth/users/new')}>
            Novo usuário
          </Button>
        }
      />

      <TableCard
        footer={
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={userPage?.total}
            totalLabel="usuários"
            onPageChange={setPage}
            disabled={loading}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userPage?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Nenhum usuário cadastrado.
                </TableCell>
              </TableRow>
            ) : null}
            {userPage?.data.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${user.name}`}
                      onClick={() => router.push(`/auth/users/${user.id}`)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${user.name}`}
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(user)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>

      <DeleteConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Excluir usuário"
        description="Esta ação remove o usuário permanentemente e não pode ser desfeita."
        itemLabel="Usuário"
        itemValue={deleteTarget?.name}
        isConfirming={isDeleting}
      />
    </div>
  );
}
