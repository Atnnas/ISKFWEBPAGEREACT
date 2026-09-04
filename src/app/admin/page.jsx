import { auth } from "../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Dojo from "../../models/Dojo";
import User from "../../models/User";
import dbConnect from "../../lib/mongodb";

export const metadata = {
  title: 'ISKF Admin - Dashboard',
};

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  await dbConnect();
  
  // Get quick stats
  const totalUsers = await User.countDocuments();
  const totalDojos = await Dojo.countDocuments();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Panel de Administración</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Bienvenido al panel central de ISKF Costa Rica.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dojos Card */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 shadow-lg flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-600/20 text-red-500 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Dojos Afiliados</h3>
              <p className="text-sm text-neutral-400">Total registrados</p>
            </div>
          </div>
          <div className="text-4xl font-black text-white mb-6">
            {totalDojos}
          </div>
          <Link href="/admin/dojos" className="mt-auto block w-full text-center py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors font-medium">
            Gestionar Dojos
          </Link>
        </div>

        {/* Users Card */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 shadow-lg flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-600/20 text-blue-500 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Usuarios</h3>
              <p className="text-sm text-neutral-400">Total en plataforma</p>
            </div>
          </div>
          <div className="text-4xl font-black text-white mb-6">
            {totalUsers}
          </div>
          <Link href="/admin/users" className="mt-auto block w-full text-center py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors font-medium">
            Gestionar Usuarios
          </Link>
        </div>

        {/* Examinations Card */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 shadow-lg flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-500/20 text-amber-500 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Examinaciones</h3>
              <p className="text-sm text-neutral-400">Convocatorias y pases de grado</p>
            </div>
          </div>
          <div className="text-4xl font-black text-white mb-6 flex items-baseline gap-2">
            <span>4</span>
            <span className="text-xs text-neutral-400 font-normal">convocatorias</span>
          </div>
          <Link href="/admin/examinations" className="mt-auto block w-full text-center py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors font-medium">
            Gestionar Examinaciones
          </Link>
        </div>
      </div>
    </div>
  );
}
