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

type ProductRow = {
  id: string;
  name: string;
  price: number;
  status: string;
};

type ProductPage = {
  data: ProductRow[];
  total: number;
  page: number;
  perPage: number;
};

const PER_PAGE = 10;

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    draft: 'Rascunho',
  };
  return labels[status] ?? status;
}

export default function ProductListComponent() {
  const router = useRouter();
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [productPage, setProductPage] = useState<ProductPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(
    async (currentPage: number) => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products?page=${currentPage}&perPage=${PER_PAGE}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) throw new Error();
        const data: ProductPage = await response.json();
        setProductPage(data);
      } catch {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchProducts(page);
  }, [fetchProducts, page]);

  async function handleDelete() {
    if (!deleteTarget || !token) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${deleteTarget.id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.status === 204) {
        toast.success('Produto excluído com sucesso.');
        setDeleteTarget(null);
        await fetchProducts(page);
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

  const totalPages = productPage ? Math.ceil(productPage.total / PER_PAGE) : 1;

  return (
    <div className="flex flex-col gap-6 p-6">
      <SectionHeader
        title="Produtos"
        subtitle="Gerencie o catálogo de produtos."
        aside={
          <Button size="sm" onClick={() => router.push('/catalog/products/new')}>
            Novo produto
          </Button>
        }
      />

      <TableCard
        footer={
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={productPage?.total}
            totalLabel="produtos"
            onPageChange={setPage}
            disabled={loading}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productPage?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Nenhum produto cadastrado.
                </TableCell>
              </TableRow>
            ) : null}
            {productPage?.data.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">{formatPrice(product.price)}</TableCell>
                <TableCell className="text-muted-foreground">{formatStatus(product.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${product.name}`}
                      onClick={() => router.push(`/catalog/products/${product.id}`)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${product.name}`}
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(product)}
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
        title="Excluir produto"
        description="Esta ação remove o produto permanentemente e não pode ser desfeita."
        itemLabel="Produto"
        itemValue={deleteTarget?.name}
        isConfirming={isDeleting}
      />
    </div>
  );
}
