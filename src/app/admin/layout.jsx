import { auth } from "../../auth";
import { redirect } from "next/navigation";
import AdminLayoutShell from "../../components/admin/AdminLayoutShell";

export default async function AdminLayout({ children }) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <AdminLayoutShell user={session.user}>
      {children}
    </AdminLayoutShell>
  );
}
