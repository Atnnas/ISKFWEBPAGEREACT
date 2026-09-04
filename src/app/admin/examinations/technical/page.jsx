import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import TechnicalExamsView from "../../../../components/admin/TechnicalExamsView";

export const metadata = {
  title: 'Exámenes Técnicos - ISKF Admin',
  description: 'Gestión y evaluación de pruebas prácticas de Kihon, Kata y Kumite en tatami.',
};

export default async function AdminTechnicalExamsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <TechnicalExamsView />
    </div>
  );
}
