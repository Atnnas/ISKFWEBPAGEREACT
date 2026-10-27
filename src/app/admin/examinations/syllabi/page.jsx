import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import ExamSyllabiView from "../../../../components/admin/ExamSyllabiView";
import { getExamSyllabi } from "../../../../lib/actions/syllabi";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Temarios de Examen - ISKF Admin',
  description: 'Catálogo oficial de temarios de examen por cinturón: Kihon, Kumite y Kata.',
};

export default async function AdminExamSyllabiPage() {
  const session = await auth();

  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
    redirect('/');
  }

  const initialSyllabi = await getExamSyllabi();

  return (
    <div className="w-full pb-12">
      <ExamSyllabiView initialSyllabi={initialSyllabi} currentUser={session.user} />
    </div>
  );
}
