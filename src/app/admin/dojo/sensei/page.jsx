import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import SenseiDojoCostsView from "../../../../components/admin/SenseiDojoCostsView";
import { getExamCostConfig } from "../../../../lib/actions/examCosts";
import { getDojosForSelector } from "../../../../lib/actions/students";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Sensei Dojo - Aranceles y Costo del Examen | ISKF Admin',
  description: 'Gestión y parametrización de la ganancia del Sensei Dojo y aranceles federativos ISKF de examen.',
};

export default async function AdminDojoSenseiPage() {
  const session = await auth();

  if (!session?.user || !['admin', 'sensei', 'editor'].includes(session.user.role)) {
    redirect('/');
  }

  const allDojos = await getDojosForSelector();

  // Buscar dojo asociado al usuario por dojoId o por email
  const matchedDojo = allDojos.find(d => 
    (session.user.dojoId && (d.id === session.user.dojoId || d._id === session.user.dojoId)) ||
    (d.email && session.user.email && d.email.trim().toLowerCase() === session.user.email.trim().toLowerCase())
  ) || null;

  const targetDojoId = matchedDojo?.id || matchedDojo?._id || null;
  const initialData = await getExamCostConfig(targetDojoId);

  return (
    <div className="w-full pb-12">
      <SenseiDojoCostsView 
        initialConfig={initialData.config} 
        dojo={matchedDojo} 
        currentUser={session.user}
        allDojos={session.user.role === 'admin' ? allDojos : []}
      />
    </div>
  );
}

