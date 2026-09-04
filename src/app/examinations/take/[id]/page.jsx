import { getPublicExaminationSession } from '../../../../lib/actions/examinations';
import StudentExamTaker from '../../../../components/examinations/StudentExamTaker';
import Link from 'next/link';
import { AlertCircle, Clock } from 'lucide-react';

export const metadata = {
  title: 'Resolución de Examen - ISKF',
  description: 'Plataforma oficial de evaluación teórica ISKF.',
};

export const dynamic = 'force-dynamic';

export default async function TakeExamPage({ params }) {
  const resolvedParams = typeof params?.then === 'function' ? await params : params;
  const id = resolvedParams?.id || '';

  const res = await getPublicExaminationSession(id);

  if (!res.success) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            {res.isClosed ? <Clock className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-widest font-mono">
              {res.isClosed ? 'Convocatoria Finalizada' : 'Enlace No Disponible'}
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {res.title || 'Examinación no disponible'}
            </h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              {res.error || 'No se pudo encontrar la convocatoria solicitada. Por favor verifica el enlace con tu Sensei.'}
            </p>
          </div>

          {id && (
            <div className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-xl text-xs text-neutral-500 font-mono select-all">
              Código recibido: <span className="text-neutral-300">{id}</span>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Ir a la Página Principal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StudentExamTaker session={res.session} exam={res.exam} />
  );
}
