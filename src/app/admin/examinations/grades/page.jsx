import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import BeltGradeConfigView from "../../../../components/admin/BeltGradeConfigView";
import { getExamGradeConfig } from "../../../../lib/actions/gradeConfig";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Notas Mínimas por Cinturón - ISKF Admin',
  description: 'Configuración oficial de las notas mínimas de aprobación técnica por grado Kyu y Dan.',
};

export default async function AdminExamGradesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  // Si el usuario es Sensei, redirigir a su panel de dojo
  if (session.user.role === 'sensei') {
    redirect('/admin/dojo/sensei');
  }

  // Exclusivo para administradores
  if (session.user.role !== 'admin') {
    redirect('/admin/examinations/technical');
  }

  const initialData = await getExamGradeConfig();

  return (
    <div className="w-full pb-12">
      <BeltGradeConfigView 
        initialConfig={initialData?.config} 
        currentUser={session.user} 
      />
    </div>
  );
}
