import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import TechnicalExamsView from "../../../../components/admin/TechnicalExamsView";
import { getDojosForSelector } from "../../../../lib/actions/students";
import { getExamSyllabi } from "../../../../lib/actions/syllabi";
import { getExamCostConfig } from "../../../../lib/actions/examCosts";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Exámenes Técnicos - ISKF Admin',
  description: 'Gestión y evaluación de pruebas prácticas de Kihon, Kata y Kumite en tatami.',
};

export default async function AdminTechnicalExamsPage() {
  const session = await auth();

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
    redirect('/');
  }

  const [initialDojos, initialSyllabi, costRes] = await Promise.all([
    getDojosForSelector(),
    getExamSyllabi(),
    getExamCostConfig()
  ]);

  return (
    <div className="w-full pb-12">
      <TechnicalExamsView 
        initialDojos={initialDojos} 
        initialSyllabi={initialSyllabi} 
        currentUser={session.user} 
        initialExamCosts={costRes?.config}
      />
    </div>
  );
}

