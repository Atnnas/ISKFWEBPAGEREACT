import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import { getWrittenExams } from "../../../../../lib/actions/examinations";
import WrittenExamsView from "../../../../../components/admin/WrittenExamsView";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Temario Exámenes Escritos - ISKF Admin',
  description: 'Confección, banco de preguntas y administración de temarios para evaluaciones teóricas de karate.',
};

export default async function AdminWrittenExamsSyllabiPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const initialExams = await getWrittenExams();

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <WrittenExamsView initialExams={initialExams || []} />
    </div>
  );
}
