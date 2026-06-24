'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { SectionHeader } from '@/shared/components/ui/section-header';
import { getMessage } from '@/shared/i18n';
import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import { useAuth } from '@/modules/auth';

type ProductStatus = 'active' | 'inactive' | 'draft';

type ProductFormProps = {
  productId?: string;
  defaultValues?: {
    name?: string;
    description?: string | null;
    price?: number;
    status?: ProductStatus;
    availableOnline?: boolean;
    featured?: boolean;
    allowsPreOrder?: boolean;
  };
};

export default function ProductFormComponent({ productId, defaultValues }: ProductFormProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(productId);

  const [availableOnline, setAvailableOnline] = useState(defaultValues?.availableOnline ?? false);
  const [featured, setFeatured] = useState(defaultValues?.featured ?? false);
  const [allowsPreOrder, setAllowsPreOrder] = useState(defaultValues?.allowsPreOrder ?? false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const name = (data.get('name') as string).trim();
    const description = (data.get('description') as string).trim() || null;
    const priceStr = data.get('price') as string;
    const price = parseFloat(priceStr);
    const status = data.get('status') as ProductStatus;

    setLoading(true);
    try {
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/products`;

      const body = { name, description, price, status, availableOnline, featured, allowsPreOrder };

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 201 || response.status === 204) {
        toast.success(isEditing ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.');
        router.push('/catalog/products');
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
        title={isEditing ? 'Editar produto' : 'Novo produto'}
        subtitle={isEditing ? 'Atualize os dados do produto.' : 'Preencha os dados para criar um novo produto.'}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <FormSectionLayout
          title="Dados básicos"
          description="Nome e descrição do produto."
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-name">Nome <span className="text-destructive">*</span></Label>
            <Input
              id="product-name"
              name="name"
              type="text"
              placeholder="Ex: Camiseta Básica"
              defaultValue={defaultValues?.name}
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-description">Descrição</Label>
            <textarea
              id="product-description"
              name="description"
              placeholder="Descrição opcional do produto..."
              defaultValue={defaultValues?.description ?? ''}
              disabled={loading}
              maxLength={500}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>
        </FormSectionLayout>

        <FormSectionLayout
          title="Preço e status"
          description="Valor de venda e situação do produto no catálogo."
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-price">Preço <span className="text-destructive">*</span></Label>
            <Input
              id="product-price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              defaultValue={defaultValues?.price !== undefined ? String(defaultValues.price) : ''}
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-status">Status <span className="text-destructive">*</span></Label>
            <select
              id="product-status"
              name="status"
              defaultValue={defaultValues?.status ?? 'draft'}
              disabled={loading}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="draft">Rascunho</option>
            </select>
          </div>
        </FormSectionLayout>

        <FormSectionLayout
          title="Disponibilidade"
          description="Configure as opções de disponibilidade do produto."
          showDivider={false}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="product-available-online"
                checked={availableOnline}
                onCheckedChange={(checked) => setAvailableOnline(checked === true)}
                disabled={loading}
              />
              <Label htmlFor="product-available-online" className="cursor-pointer">
                Disponível online
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="product-featured"
                checked={featured}
                onCheckedChange={(checked) => setFeatured(checked === true)}
                disabled={loading}
              />
              <Label htmlFor="product-featured" className="cursor-pointer">
                Destaque
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="product-allows-pre-order"
                checked={allowsPreOrder}
                onCheckedChange={(checked) => setAllowsPreOrder(checked === true)}
                disabled={loading}
              />
              <Label htmlFor="product-allows-pre-order" className="cursor-pointer">
                Permite pré-venda
              </Label>
            </div>
          </div>
        </FormSectionLayout>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar produto'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => router.push('/catalog/products')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
