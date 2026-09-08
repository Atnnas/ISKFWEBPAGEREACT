import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { getUsers } from "../actions";
import UsersTable from "../../../components/admin/UsersTable";
import { Users } from 'lucide-react';

export const metadata = {
  title: 'Gestión de Usuarios - ISKF Admin',
};

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const users = await getUsers();

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="border-b border-gray-200/80 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#2D2E83] text-xs font-bold uppercase tracking-widest font-mono mb-2">
          <Users className="w-3.5 h-3.5" />
          Control de Accesos
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-[#2D2E83] tracking-tight uppercase">
          Gestión de Usuarios
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-600 font-medium">
          Administra los roles, permisos y credenciales de los usuarios y administradores registrados en la plataforma.
        </p>
      </div>

      <div className="bg-white/95 backdrop-blur-md shadow-sm rounded-3xl border border-gray-200/90 overflow-hidden">
        <UsersTable initialUsers={users} />
      </div>
    </div>
  );
}
