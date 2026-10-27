import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ChevronLeft, Lock } from 'lucide-react';
import { getExamCallForEvaluator } from '../../../../lib/actions/technicalExams';
import TechnicalExamEvaluatorCore from '../../../../components/examinations/TechnicalExamEvaluatorCore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Mesa de Evaluación Técnica — ISKF Costa Rica',
  description: 'Panel de Sinodal para evaluación técnica de aspirantes de Karate-Do ISKF.',
};

export default async function EvaluatorTatamiPage({ params }) {
  const resolvedParams = await params;
  const { callToken, senseiToken } = resolvedParams || {};

  const result = await getExamCallForEvaluator({
    accessToken: callToken,
    evaluatorToken: senseiToken,
  });

  if (!result.success || !result.call) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-900 via-gray-900 to-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">
              Enlace de Evaluación No Disponible
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-2">
              {result.error || 'No fue posible acceder a la mesa técnica con este enlace. Por favor verifique el enlace provisto por la administración.'}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/admin/examinations/technical"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Volver a Convocatorias</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Si la convocatoria fue cerrada por el Sensei Administrador
  if (result.call.status === 'cerrado') {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-900 via-gray-900 to-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Tribunal Examinador ISKF
            </span>
            <h1 className="text-xl font-black text-white">
              Se Cerró la Evaluación
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Las votaciones y calificaciones para esta convocatoria han finalizado oficialmente. Por favor espere sus notas y actas finales emitidas por el Sensei Administrador.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/admin/examinations/technical"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Volver a Convocatorias</span>
            </Link>
            <Link
              href={`/convocatoria/${callToken}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all"
            >
              <span>Ver Acta del Dojo</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900 py-4 sm:py-6 px-3 sm:px-6">
      <TechnicalExamEvaluatorCore
        call={result.call}
        evaluator={result.evaluator}
        students={result.students || []}
        syllabi={result.syllabi || []}
        initialEvaluations={result.evaluations || []}
        isAdmin={false}
      />
    </div>
  );
}
