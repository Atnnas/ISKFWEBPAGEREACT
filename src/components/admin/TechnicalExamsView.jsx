"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Construction, 
  ArrowLeft, 
  ShieldCheck, 
  Award, 
  Clock, 
  FileText,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function TechnicalExamsView() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-4 pb-12">
      {/* Breadcrumb Navigation */}
      <div>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Link href="/admin/examinations" className="hover:text-white flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Examinaciones
          </Link>
          <span>/</span>
          <span className="text-iskf-red font-medium">Exámenes Técnicos</span>
        </div>
      </div>

      {/* Main Under Construction Card */}
      <div className="relative bg-neutral-800/80 border border-neutral-700 rounded-3xl p-8 md:p-14 text-center shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Background glow & accents */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          {/* Animated/Glowing Icon */}
          <div className="relative inline-flex">
            <div className="w-24 h-24 rounded-3xl bg-neutral-900/90 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-2xl mx-auto">
              <Construction className="w-12 h-12 text-amber-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 bg-red-600 rounded-xl text-white shadow-lg border border-neutral-900">
              <Award className="w-5 h-5" />
            </div>
          </div>

          {/* Badge */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest font-mono">
              <Clock className="w-3.5 h-3.5" />
              Módulo en Construcción
            </span>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Exámenes Técnicos en Tatami
            </h1>
            <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
              Estamos desarrollando la plataforma de evaluación técnica oficial para el registro en tiempo real de puntuaciones de <strong className="text-neutral-200">Kihon</strong>, <strong className="text-neutral-200">Kata</strong> y <strong className="text-neutral-200">Kumite</strong> por parte del Tribunal Técnico ISKF.
            </p>
          </div>

          {/* Planned Features Preview */}
          <div className="bg-neutral-900/70 border border-neutral-700/80 rounded-2xl p-6 text-left space-y-3 shadow-inner">
            <h3 className="text-xs uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Funcionalidades que se incluirán próximamente:
            </h3>
            <ul className="space-y-2.5 text-xs md:text-sm text-neutral-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Planilla digital de evaluación:</strong> Registro en vivo de notas de jueces en tatami para cada aspirante.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Rúbricas oficiales ISKF:</strong> Ponderación automática reglamentaria (Kihon 30%, Kata 40%, Kumite 30%).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Actas de grado y certificación:</strong> Emisión y firma digital de actas avaladas por el Tribunal Técnico.</span>
              </li>
            </ul>
          </div>

          {/* Navigation Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/admin/examinations"
              className="w-full sm:w-auto px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Examinaciones
            </Link>

            <Link
              href="/admin/examinations/written"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Ir a Exámenes Escritos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
