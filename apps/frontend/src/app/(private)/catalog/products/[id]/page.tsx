import ProductFormEditWrapper from '@/modules/catalog/components/product-form-edit-wrapper.component';

type EditProductRoutePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductRoutePage({ params }: EditProductRoutePageProps) {
  const { id } = await params;
  return <ProductFormEditWrapper productId={id} />;
}
