import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ChevronLeft, Clock4 } from 'lucide-react';
import { getTechnicalExamCallByToken } from '../../../lib/actions/technicalExams';
import PublicTandasLiveView from '../../../components/examinations/PublicTandasLiveView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const token = resolvedParams?.token;
  if (!token) {
    return { title: 'Tandas y Horarios de Examen — ISKF Costa Rica' };
  }

  try {
    const res = await getTechnicalExamCallByToken(token);
    if (res.success && res.call) {
      return {
        title: `Tandas y Horarios de Examen — ${res.call.dojoName || 'Dojo'} — ISKF Costa Rica`,
        description: `Horarios de atención, distribución en tandas y control de aspirantes para el examen técnico en ${res.call.dojoName}.`,
      };
    }
  } catch {
    // fallback
  }

  return { title: 'Tandas y Horarios de Examen — ISKF Costa Rica' };
}

export default async function PublicTandasPage({ params }) {
  const resolvedParams = await params;
  const token = resolvedParams?.token;

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-xl font-black text-white">Enlace Inválido</h1>
          <p className="text-xs text-slate-400">No se proporcionó un token válido de convocatoria.</p>
        </div>
      </div>
    );
  }

  const res = await getTechnicalExamCallByToken(token);

  if (!res.success || !res.call) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <Clock4 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">
              Cronograma de Tandas No Disponible
            </h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {res.error || 'El enlace provisto es inválido o la convocatoria ha expirado. Por favor consulte con el Sensei del dojo.'}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Ir al Inicio</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PublicTandasLiveView
      initialCall={res.call}
      initialStudents={res.students || []}
      initialCostConfig={res.costConfig || null}
    />
  );
}
