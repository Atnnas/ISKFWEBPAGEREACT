import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { getUsers } from "../actions";
import UsersTable from "../../../components/admin/UsersTable";

export const metadata = {
  title: 'Gestión de Usuarios - ISKF Admin',
};

export default async function AdminUsersPage() {
  const session = await auth();

  // Protegido por el layout, pero doble check por seguridad
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const users = await getUsers();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Usuarios</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Administra el acceso y los roles de todos los usuarios registrados en la plataforma.
        </p>
      </div>

      <div className="bg-neutral-800 shadow-xl rounded-xl border border-neutral-700 overflow-hidden">
        <UsersTable initialUsers={users} />
      </div>
    </div>
  );
}
