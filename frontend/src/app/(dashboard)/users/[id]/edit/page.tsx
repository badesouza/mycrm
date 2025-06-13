import EditUserForm from './EditUserForm';

export default function EditUserPage({ params }: { params: { id: string } }) {
  return <EditUserForm userId={params.id} />;
} 