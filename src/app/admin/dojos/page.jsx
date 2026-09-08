import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { getDojosAdmin } from "../actions";
import DojosTable from "../../../components/admin/DojosTable";
import { MapPin } from 'lucide-react';

export const metadata = {
  title: 'Gestión de Dojos - ISKF Admin',
};

export default async function AdminDojosPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const dojos = await getDojosAdmin();

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="border-b border-gray-200/80 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200/80 text-[#BE1622] text-xs font-bold uppercase tracking-widest font-mono mb-2">
          <MapPin className="w-3.5 h-3.5" />
          Red Oficial de Dojos
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-[#2D2E83] tracking-tight uppercase">
          Gestión de Dojos
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-600 font-medium">
          Administra los dojos afiliados en Costa Rica, sus senseis acreditados y su ubicación en el mapa interactivo.
        </p>
      </div>

      <div className="bg-white/95 backdrop-blur-md shadow-sm rounded-3xl border border-gray-200/90 overflow-hidden">
        <DojosTable initialDojos={dojos} />
      </div>
    </div>
  );
}
