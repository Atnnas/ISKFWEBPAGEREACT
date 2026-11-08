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

  const isSensei = session.user.role === 'sensei';
  const allDojos = await getDojosForSelector();

  // Buscar si el usuario está asociado a un dojo por email o dojoId
  const matchedDojo = allDojos.find(d => 
    (session.user.dojoId && (d.id === session.user.dojoId || d._id === session.user.dojoId)) ||
    (d.email && session.user.email && d.email.trim().toLowerCase() === session.user.email.trim().toLowerCase())
  );

  let visibleDojos = [];
  let defaultDojoId = null;
  let initialStudents = [];

  if (isSensei) {
    // REGLA ESTRICTA DE SEGURIDAD PARA SENSEI (ADMIN DE DOJO):
    // Únicamente puede ver su propio dojo y sus propios estudiantes.
    // Jamás se le envían dojos ajenos en los props ni se cae en un dojo por defecto.
    if (matchedDojo) {
      defaultDojoId = matchedDojo.id || matchedDojo._id;
      visibleDojos = [matchedDojo];
      initialStudents = await getStudentsByDojo(defaultDojoId);
    } else {
      // Sensei sin dojo asignado: lista vacía por seguridad absoluta
      defaultDojoId = null;
      visibleDojos = [];
      initialStudents = [];
    }
  } else {
    // Administrador General o Editor: acceso a todos los dojos
    visibleDojos = allDojos;
    defaultDojoId = matchedDojo 
      ? (matchedDojo.id || matchedDojo._id) 
      : (allDojos.length > 0 ? (allDojos[0].id || allDojos[0]._id) : null);
    initialStudents = defaultDojoId ? await getStudentsByDojo(defaultDojoId) : [];
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <StudentsRosterView 
        initialDojos={visibleDojos}
        initialStudents={initialStudents}
        user={session.user}
        defaultDojoId={defaultDojoId}
      />
    </div>
  );
}
