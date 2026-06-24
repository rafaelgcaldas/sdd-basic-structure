import UserFormEditWrapper from '@/modules/auth/components/user-form-edit-wrapper.component';

type EditUserRoutePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserRoutePage({ params }: EditUserRoutePageProps) {
  const { id } = await params;
  return <UserFormEditWrapper userId={id} />;
}
