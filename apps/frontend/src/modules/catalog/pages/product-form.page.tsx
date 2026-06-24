import ProductFormComponent from '../components/product-form.component';

type ProductFormPageProps = {
  productId?: string;
  defaultValues?: {
    name?: string;
    description?: string | null;
    price?: number;
    status?: 'active' | 'inactive' | 'draft';
    availableOnline?: boolean;
    featured?: boolean;
    allowsPreOrder?: boolean;
  };
};

export default function ProductFormPage({ productId, defaultValues }: ProductFormPageProps) {
  return <ProductFormComponent productId={productId} defaultValues={defaultValues} />;
}
