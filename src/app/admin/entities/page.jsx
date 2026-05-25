import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { getEntities } from "../../../lib/actions/entities";
import EntitiesTable from "../../../components/admin/EntitiesTable";

export const metadata = {
  title: 'Gestión de Entidades - ISKF Admin',
};

export default async function AdminEntitiesPage() {
  const session = await auth();

  // Protegido por el layout, pero doble check por seguridad
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const entities = await getEntities();

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Entidades Organizadoras</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Administra las entidades que organizan eventos (por ejemplo, WKF, FECOKA) para que aparezcan disponibles en el calendario. Los Dojos registrados se incluyen automáticamente.
        </p>
      </div>

      <div className="bg-neutral-800 shadow-xl rounded-xl border border-neutral-700 overflow-hidden">
        <EntitiesTable initialEntities={entities} />
      </div>
    </div>
  );
}
