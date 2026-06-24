'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth';
import ProductFormComponent from './product-form.component';

type ProductData = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  status: 'active' | 'inactive' | 'draft';
  availableOnline: boolean;
  featured: boolean;
  allowsPreOrder: boolean;
};

type Props = {
  productId: string;
};

export default function ProductFormEditWrapper({ productId }: Props) {
  const { token } = useAuth();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          toast.error(getMessage('product.not_found'));
          return;
        }
        const data: ProductData = await response.json();
        setProduct(data);
      })
      .catch(() => {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      })
      .finally(() => setLoading(false));
  }, [token, productId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!product) return null;

  return (
    <ProductFormComponent
      productId={product.id}
      defaultValues={{
        name: product.name,
        description: product.description,
        price: product.price,
        status: product.status,
        availableOnline: product.availableOnline,
        featured: product.featured,
        allowsPreOrder: product.allowsPreOrder,
      }}
    />
  );
}
