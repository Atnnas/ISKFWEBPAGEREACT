import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import ExaminationsManagement from "../../../components/admin/ExaminationsManagement";
import { 
  getExaminationSessions, 
  getWrittenExams, 
  getDojosForExaminations 
} from "../../../lib/actions/examinations";

export const metadata = {
  title: 'Gestión de Examinaciones - ISKF Admin',
  description: 'Panel de administración oficial para convocatorias y actas de pase de grado ISKF.',
};

export const dynamic = 'force-dynamic';

export default async function AdminExaminationsPage() {
  const session = await auth();

  // Protegido por el layout, doble check por seguridad
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const [sessions, writtenExams, dojos] = await Promise.all([
    getExaminationSessions(),
    getWrittenExams(),
    getDojosForExaminations()
  ]);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <ExaminationsManagement 
        initialSessions={sessions || []}
        initialWrittenExams={writtenExams || []}
        initialDojos={dojos || []}
      />
    </div>
  );
}
