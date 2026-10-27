import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { getDojosForSelector, getStudentsByDojo } from "../../../lib/actions/students";
import StudentsRosterView from "../../../components/admin/StudentsRosterView";

export const metadata = {
  title: 'Lista de Estudiantes - ISKF Admin',
  description: 'Mantenimiento y padrón oficial de estudiantes por dojo.',
};

export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage() {
  const session = await auth();

  if (!session?.user || !['admin', 'editor', 'sensei'].includes(session.user.role)) {
    redirect('/');
  }

  const dojos = await getDojosForSelector();

  // Buscar si el usuario está asociado a un dojo por email o dojoId
  const matchedDojo = dojos.find(d => 
    (session.user.dojoId && (d.id === session.user.dojoId || d._id === session.user.dojoId)) ||
    (d.email && session.user.email && d.email.trim().toLowerCase() === session.user.email.trim().toLowerCase())
  );

  let defaultDojoId = null;
  if (matchedDojo) {
    defaultDojoId = matchedDojo.id || matchedDojo._id;
  } else if (dojos.length > 0) {
    defaultDojoId = dojos[0].id || dojos[0]._id;
  }

  const initialStudents = defaultDojoId ? await getStudentsByDojo(defaultDojoId) : [];

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <StudentsRosterView 
        initialDojos={dojos}
        initialStudents={initialStudents}
        user={session.user}
        defaultDojoId={defaultDojoId}
      />
    </div>
  );
}
