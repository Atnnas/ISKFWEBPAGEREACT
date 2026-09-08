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
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
          <Link href="/admin/examinations" className="hover:text-[#2D2E83] flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Examinaciones
          </Link>
          <span>/</span>
          <span className="text-[#BE1622] font-mono uppercase tracking-wider">Exámenes Técnicos</span>
        </div>
      </div>

      {/* Main Under Construction Card */}
      <div className="relative bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-3xl p-8 md:p-14 text-center shadow-sm overflow-hidden text-gray-900">
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          {/* Animated Icon */}
          <div className="relative inline-flex">
            <div className="w-24 h-24 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm mx-auto">
              <Construction className="w-12 h-12 text-amber-500 animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 bg-[#BE1622] rounded-xl text-white shadow-md">
              <Award className="w-5 h-5" />
            </div>
          </div>

          {/* Badge */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-widest font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Módulo en Construcción
            </span>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h1 className="text-3xl md:text-5xl font-black text-[#2D2E83] tracking-tight uppercase">
              Exámenes Técnicos en Tatami
            </h1>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed font-medium">
              Estamos desarrollando la plataforma de evaluación técnica oficial para el registro en tiempo real de puntuaciones de <strong className="text-gray-900">Kihon</strong>, <strong className="text-gray-900">Kata</strong> y <strong className="text-gray-900">Kumite</strong> por parte del Tribunal Técnico ISKF.
            </p>
          </div>

          {/* Planned Features Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-left space-y-3 shadow-xs">
            <h3 className="text-xs uppercase font-bold text-gray-700 tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Funcionalidades que se incluirán próximamente:
            </h3>
            <ul className="space-y-2.5 text-xs md:text-sm text-gray-600 font-medium">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-gray-900">Planilla digital de evaluación:</strong> Registro en vivo de notas de jueces en tatami para cada aspirante.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-gray-900">Rúbricas oficiales ISKF:</strong> Ponderación automática reglamentaria (Kihon 30%, Kata 40%, Kumite 30%).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-gray-900">Actas de grado y certificación:</strong> Emisión y firma digital de actas avaladas por el Tribunal Técnico.</span>
              </li>
            </ul>
          </div>

          {/* Navigation Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/admin/examinations"
              className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Examinaciones
            </Link>

            <Link
              href="/admin/examinations/written"
              className="w-full sm:w-auto px-6 py-3 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-[#2D2E83]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
