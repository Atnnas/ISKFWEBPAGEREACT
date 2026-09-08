import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { getEntities } from "../../../lib/actions/entities";
import EntitiesTable from "../../../components/admin/EntitiesTable";
import { Globe } from 'lucide-react';

export const metadata = {
  title: 'Gestión de Entidades - ISKF Admin',
};

export default async function AdminEntitiesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const entities = await getEntities();

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="border-b border-gray-200/80 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-bold uppercase tracking-widest font-mono mb-2">
          <Globe className="w-3.5 h-3.5" />
          Federaciones y Organizaciones
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-[#2D2E83] tracking-tight uppercase">
          Gestión de Organizaciones
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-600 font-medium">
          Administra las entidades que organizan eventos internacionales o nacionales (FECOKA, WKF, etc.) para su visualización en el calendario oficial.
        </p>
      </div>

      <div className="bg-white/95 backdrop-blur-md shadow-sm rounded-3xl border border-gray-200/90 overflow-hidden">
        <EntitiesTable initialEntities={entities} />
      </div>
    </div>
  );
}
