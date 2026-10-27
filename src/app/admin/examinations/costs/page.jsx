import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import ExamCostsConfigView from "../../../../components/admin/ExamCostsConfigView";
import { getExamCostConfig } from "../../../../lib/actions/examCosts";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Configuración de Costos de Examen - ISKF Admin',
  description: 'Gestión y parametrización de aranceles de examen técnico: Sensei Dojo, Director General e ISKF CR.',
};

export default async function AdminExamCostsPage() {
  const session = await auth();

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
    redirect('/');
  }

  const initialData = await getExamCostConfig();

  return (
    <div className="w-full pb-12">
      <ExamCostsConfigView initialConfig={initialData.config} currentUser={session.user} />
    </div>
  );
}
