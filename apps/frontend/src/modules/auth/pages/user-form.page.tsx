import UserFormComponent from '../components/user-form.component';

type UserFormPageProps = {
  userId?: string;
  defaultValues?: {
    name?: string;
    email?: string;
  };
};

export default function UserFormPage({ userId, defaultValues }: UserFormPageProps) {
  return <UserFormComponent userId={userId} defaultValues={defaultValues} />;
}
