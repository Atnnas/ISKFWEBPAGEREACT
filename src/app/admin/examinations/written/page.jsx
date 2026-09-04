import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { getWrittenExams } from "../../../../lib/actions/examinations";
import WrittenExamsView from "../../../../components/admin/WrittenExamsView";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Exámenes Escritos - ISKF Admin',
  description: 'Confección y administración de evaluaciones teóricas de karate.',
};

export default async function AdminWrittenExamsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/');
  }

  const initialExams = await getWrittenExams();

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <WrittenExamsView initialExams={initialExams} />
    </div>
  );
}
