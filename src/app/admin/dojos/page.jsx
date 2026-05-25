import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { getDojosAdmin } from "../actions";
import DojosTable from "../../../components/admin/DojosTable";

export const metadata = {
  title: 'Gestión de Dojos - ISKF Admin',
};

export default async function AdminDojosPage() {
  const session = await auth();

  // Protegido por el layout, pero doble check por seguridad
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const dojos = await getDojosAdmin();

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Dojos</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Administra los dojos afiliados, sus senseis y su ubicación en el mapa.
        </p>
      </div>

      <div className="bg-neutral-800 shadow-xl rounded-xl border border-neutral-700 overflow-hidden">
        <DojosTable initialDojos={dojos} />
      </div>
    </div>
  );
}
