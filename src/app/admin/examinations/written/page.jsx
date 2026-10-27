import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import ExaminationsManagement from "../../../../components/admin/ExaminationsManagement";
import { 
  getExaminationSessions, 
  getWrittenExams, 
  getDojosForExaminations 
} from "../../../../lib/actions/examinations";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Exámenes Escritos: Sesiones y Respuestas - ISKF Admin',
  description: 'Panel de sesiones, convocatorias y revisión de respuestas teóricas de los karatecas.',
};

export default async function AdminWrittenExamsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const [sessions, writtenExams, dojos] = await Promise.all([
    getExaminationSessions(),
    getWrittenExams(),
    getDojosForExaminations()
  ]);

  return (
    <div className="w-full pb-12">
      <ExaminationsManagement 
        initialSessions={sessions || []}
        initialWrittenExams={writtenExams || []}
        initialDojos={dojos || []}
      />
    </div>
  );
}
