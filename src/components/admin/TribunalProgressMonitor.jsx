'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  RefreshCw,
  Copy,
  Check,
  Clock,
  Award,
  ExternalLink,
  MessageCircle,
  Loader2,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { getTribunalProgressForCall } from '../../lib/actions/technicalExams';
import { generateTechnicalExamCertificatePDF } from '../../lib/pdf/technicalExamCertificateGenerator';

// Helper para formatear tiempo relativo transcurrido
function formatTimeAgo(dateStr) {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'Ahora';
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return 'Hace instantes';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Hace ${diffMin}m`;
  const diffHrs = Math.floor(diffMin / 60);
  return `Hace ${diffHrs}h`;
}

// Helper para clasificar con precisión el estado de fases de un aspirante sin adivinanzas
function getEvalPhaseMetrics(evData, syllabusSummary = null) {
  if (!evData || (!evData.scoresCount && !evData.techniquesCount && Object.keys(evData.phaseNotes || {}).length === 0)) {
    return {
      hasStarted: false,
      isFullyDone: false,
      kihonStarted: false,
      kihonDone: false,
      kataStarted: false,
      kataDone: false,
      kumiteStarted: false,
      kumiteDone: false,
      actualEvaluatedCount: 0,
      totalExpectedCount: syllabusSummary?.totalTechniques || 8
    };
  }

  // 1. Usar métricas exactas calculadas por el backend según el temario oficial
  if (evData.phaseStats) {
    const ps = evData.phaseStats;
    return {
      hasStarted: Boolean(ps.kihon?.started || ps.kata?.started || ps.kumite?.started),
      isFullyDone: Boolean(ps.isFullyDone),
      kihonStarted: Boolean(ps.kihon?.started),
      kihonDone: Boolean(ps.kihon?.done),
      kataStarted: Boolean(ps.kata?.started),
      kataDone: Boolean(ps.kata?.done),
      kumiteStarted: Boolean(ps.kumite?.started),
      kumiteDone: Boolean(ps.kumite?.done),
      actualEvaluatedCount: ps.totalEvaluatedTechs || 0,
      totalExpectedCount: ps.totalExpectedTechs || 8
    };
  }

  // 2. Fallback de alta precisión basado en datos reales guardados
  const scoresKeys = Object.keys(evData.scores || {});
  const techKeys = Object.keys(evData.techniqueAverages || {});
  const phaseNotes = evData.phaseNotes || {};

  const kihonScoreKeys = scoresKeys.filter(k => 
    k.includes('_tsuki_') || k.includes('_uke_') || k.includes('_geri_') || k.includes('_dachi_') || k.includes('_kihon_') ||
    techKeys.some(tk => (tk.includes('-k') && !tk.includes('-ka') && !tk.includes('-ku') && k.startsWith(tk)))
  );
  const kataScoreKeys = scoresKeys.filter(k => k.includes('_kata_') || k.includes('-ka') || k.startsWith('kata_'));
  const kumiteScoreKeys = scoresKeys.filter(k => k.includes('_kumite_') || k.includes('-ku') || k.startsWith('kumite_'));

  const kihonTechKeys = techKeys.filter(k => k.includes('-k') && !k.includes('-ka') && !k.includes('-ku'));
  const kataTechKeys = techKeys.filter(k => k.includes('-ka') || k.toLowerCase().includes('kata'));
  const kumiteTechKeys = techKeys.filter(k => k.includes('-ku') || k.toLowerCase().includes('kumite'));

  const kihonStarted = kihonScoreKeys.length > 0 || kihonTechKeys.length > 0 || Boolean(phaseNotes.kihon);
  const kataStarted = kataScoreKeys.length > 0 || kataTechKeys.length > 0 || Boolean(phaseNotes.kata);
  const kumiteStarted = kumiteScoreKeys.length > 0 || kumiteTechKeys.length > 0 || Boolean(phaseNotes.kumite);

  const expKihon = syllabusSummary?.kihonCount || 6;
  const expKata = syllabusSummary?.kataCount || 1;
  const expKumite = syllabusSummary?.kumiteCount || 1;

  const kihonDone = kihonStarted && (kihonTechKeys.length >= expKihon || kihonScoreKeys.length >= expKihon * 3);
  const kataDone = kataStarted && (kataTechKeys.length >= expKata || kataScoreKeys.length >= expKata * 8);
  const kumiteDone = kumiteStarted && (kumiteTechKeys.length >= expKumite || kumiteScoreKeys.length >= expKumite * 3);

  return {
    hasStarted: kihonStarted || kataStarted || kumiteStarted,
    isFullyDone: kihonDone && kataDone && kumiteDone,
    kihonStarted,
    kihonDone,
    kataStarted,
    kataDone,
    kumiteStarted,
    kumiteDone,
    actualEvaluatedCount: kihonTechKeys.length + kataTechKeys.length + kumiteTechKeys.length,
    totalExpectedCount: expKihon + expKata + expKumite
  };
}

// Helper para extraer exclusivamente las viñetas técnicas de corrección y mejora consensuadas por los evaluadores
function getPhaseImprovementBullets(phase, notesList) {
  if (!notesList || notesList.length === 0) {
    return ['Mantener la práctica constante para consolidar las técnicas de esta fase.'];
  }

  const combined = notesList
    .map(n => (typeof n === 'string' ? n : n.note || ''))
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const bullets = [];

  if (phase === 'kata') {
    const hasKarategui = combined.includes('karategui') || combined.includes('dogi') || combined.includes('uniforme') || combined.includes('acomoda') || combined.includes('ropa');
    if (hasKarategui) {
      bullets.push('Uniforme y atención: No tocarse ni acomodarse el karategui durante el kata. Debe mantenerse firme, quieto y con la mirada atenta al frente.');
    }
    if (combined.includes('zanshin') || combined.includes('mirada') || combined.includes('vista') || combined.includes('concentración')) {
      bullets.push('Mirada y concentración: Mantener la vista fija hacia adelante después de cada giro y después de gritar el kiai.');
    }
    if (combined.includes('ritmo') || combined.includes('fluidez') || combined.includes('embusen') || combined.includes('pausas')) {
      bullets.push('Ritmo continuo: Seguir los pasos del kata sin detenerse indebidamente entre un movimiento y otro.');
    }
    if (combined.includes('postura') || combined.includes('balance') || combined.includes('dachi')) {
      bullets.push('Posiciones del kata: Bajar bien en las posiciones (Zenkutsu y Kokutsu Dachi) y mantener el cuerpo firme sin balancearse.');
    }
    if (bullets.length === 0) {
      bullets.push('Mantener posturas firmes, ritmo parejo y la mirada fija al terminar cada técnica.');
    }
    return bullets;
  }

  if (phase === 'kihon') {
    if (combined.includes('zenkutsu') || combined.includes('pierna') || combined.includes('dachi') || combined.includes('postura') || combined.includes('talón')) {
      bullets.push('Posición adelantada (Zenkutsu Dachi): Estirar bien la pierna de atrás apoyando todo el talón en el suelo sin levantarlo al golpear.');
    }
    if (combined.includes('hikite') || combined.includes('cadera') || combined.includes('puño')) {
      bullets.push('Mano a la cintura (Hikite): Jalar y pegar bien el puño que no golpea a la cintura en cada técnica.');
    }
    if (combined.includes('hombro') || combined.includes('gravedad') || combined.includes('centro') || combined.includes('altura')) {
      bullets.push('Altura del cuerpo: Mantener los hombros relajados hacia abajo y no subir el cuerpo al dar los pasos.');
    }
    if (combined.includes('mae geri') || combined.includes('hikiashi') || combined.includes('recoger') || combined.includes('pie de apoyo')) {
      bullets.push('Patada de frente (Mae Geri): Recoger la pierna rápido después de patear y apoyar firme el otro pie sin perder el equilibrio.');
    }
    if (combined.includes('media luna') || combined.includes('pies en falso') || combined.includes('desplazamiento')) {
      bullets.push('Pasos al avanzar: Dar los pasos continuos y directos sin mover los pies en falso antes de avanzar.');
    }
    if (bullets.length === 0) {
      bullets.push('Hacer los bloqueos limpios a un puño del cuerpo y girar bien la cadera al final.');
    }
    return bullets;
  }

  if (phase === 'kumite') {
    if (combined.includes('distancia') || combined.includes('ma-ai') || combined.includes('retrocede')) {
      bullets.push('Distancia con el compañero: Calcular bien el espacio para bloquear y atacar sin retroceder antes de la orden.');
    }
    if (combined.includes('guardia') || combined.includes('kamae') || combined.includes('soto uke')) {
      bullets.push('Guardia defensiva: Proteger el centro del cuerpo y no bajar las manos de defensa tras bloquear.');
    }
    if (combined.includes('kime') || combined.includes('cadera') || combined.includes('contraataque') || combined.includes('rotación')) {
      bullets.push('Golpe de contraataque: Girar la cadera y golpear con fuerza, precisión y un kiai fuerte.');
    }
    if (bullets.length === 0) {
      bullets.push('Mantener la postura de combate lista y responder con atención y rapidez.');
    }
    return bullets;
  }

  if (phase === 'aspectos') {
    bullets.push('Saludo y respeto: Saludar con energía, respeto y buena postura al entrar y salir del tatami.');
    bullets.push('Atención en tatami: Mantenerse quieto y atento a las indicaciones de los profesores evaluadores.');
    return bullets;
  }

  return notesList.map(n => (typeof n === 'string' ? n : n.note || '')).filter(Boolean);
}

// Drawer interactivo con pestañas de Promedios Colegiados y pestañas por cada Sensei Evaluador
function StudentMonitorDrawer({
  student,
  evaluatorsProgress,
  syllabusTechniques = [],
  consolidation = null,
  onDownloadPdf,
  isDownloading
}) {
  const sId = String(student._id || student.id);
  const [activeTab, setActiveTab] = useState('colegiado');

  // Evaluaciones de este alumno por cada Sensei
  const evalItems = evaluatorsProgress.map((item, idx) => ({
    evaluator: item.evaluator,
    evalRecord: item.evaluationsByStudent[sId] || null,
    key: item.evaluator.email || item.evaluator.token || `ev-${idx}`
  }));

  // Promedios colegiados entre todos los evaluadores (normalizados a 0-100%)
  const kihonVals = evalItems.map(e => {
    const val = e.evalRecord?.phaseAverages?.kihon;
    if (typeof val !== 'number') return null;
    return val <= 10 ? val * 10 : val;
  }).filter(v => v !== null);

  const kataVals = evalItems.map(e => {
    const val = e.evalRecord?.phaseAverages?.kata;
    if (typeof val !== 'number') return null;
    return val <= 10 ? val * 10 : val;
  }).filter(v => v !== null);

  const kumiteVals = evalItems.map(e => {
    const val = e.evalRecord?.phaseAverages?.kumite;
    if (typeof val !== 'number') return null;
    return val <= 10 ? val * 10 : val;
  }).filter(v => v !== null);

  const aspectosVals = evalItems.map(e => {
    const val = e.evalRecord?.phaseAverages?.aspectos;
    if (typeof val !== 'number') return null;
    return val <= 10 ? val * 10 : val;
  }).filter(v => v !== null);

  const totalVals = evalItems.map(e => e.evalRecord?.percentage).filter(v => typeof v === 'number' && v > 0);

  const colegiadoKihon = kihonVals.length ? Math.round(kihonVals.reduce((a, b) => a + b, 0) / kihonVals.length) : null;
  const colegiadoKata = kataVals.length ? Math.round(kataVals.reduce((a, b) => a + b, 0) / kataVals.length) : null;
  const colegiadoKumite = kumiteVals.length ? Math.round(kumiteVals.reduce((a, b) => a + b, 0) / kumiteVals.length) : null;
  const colegiadoAspectos = aspectosVals.length ? Math.round(aspectosVals.reduce((a, b) => a + b, 0) / aspectosVals.length) : null;
  const colegiadoTotal = totalVals.length ? Math.round(totalVals.reduce((a, b) => a + b, 0) / totalVals.length) : null;

  // Apuntes de todos los Senseis clasificados por fase técnica
  const kihonNotesList = evalItems
    .map(e => ({
      evaluatorName: e.evaluator.name,
      evaluatorRole: e.evaluator.role,
      note: e.evalRecord?.phaseNotes?.kihon || ''
    }))
    .filter(item => item.note && item.note.trim().length > 0);

  const kataNotesList = evalItems
    .map(e => ({
      evaluatorName: e.evaluator.name,
      evaluatorRole: e.evaluator.role,
      note: e.evalRecord?.phaseNotes?.kata || ''
    }))
    .filter(item => item.note && item.note.trim().length > 0);

  const kumiteNotesList = evalItems
    .map(e => ({
      evaluatorName: e.evaluator.name,
      evaluatorRole: e.evaluator.role,
      note: e.evalRecord?.phaseNotes?.kumite || ''
    }))
    .filter(item => item.note && item.note.trim().length > 0);

  const aspectosNotesList = evalItems
    .map(e => ({
      evaluatorName: e.evaluator.name,
      evaluatorRole: e.evaluator.role,
      note: e.evalRecord?.phaseNotes?.aspectos || ''
    }))
    .filter(item => item.note && item.note.trim().length > 0);

  const selectedEvalItem = evalItems.find(e => e.key === activeTab);

  return (
    <div className="bg-white rounded-2xl border border-indigo-200/90 p-4 sm:p-5 shadow-sm space-y-4 text-xs">
      {/* Barra superior de pestañas */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-gray-100 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('colegiado')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'colegiado'
                ? 'bg-[#2D2E83] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Promedios Colegiados (Total Senseis)</span>
          </button>

          {evalItems.map(e => (
            <button
              key={e.key}
              type="button"
              onClick={() => setActiveTab(e.key)}
              className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === e.key
                  ? 'bg-[#2D2E83] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>🥋 {e.evaluator.name}</span>
            </button>
          ))}
        </div>

        {/* Botón de Descarga del Certificado Oficial en PDF */}
        <button
          type="button"
          onClick={() => onDownloadPdf(student, evalItems, consolidation)}
          disabled={isDownloading}
          className="px-4 py-2 bg-[#BE1622] hover:bg-[#9E121C] text-white rounded-xl font-bold transition-all shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Award className="w-4 h-4" />
          )}
          <span>Descargar Certificado Oficial (PDF)</span>
        </button>
      </div>

      {/* Contenido: Pestaña Promedios Colegiados */}
      {activeTab === 'colegiado' && (
        <div className="space-y-4">
          {/* 1. Tarjetas de Resumen Numérico Colegiado */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">Kihon Colegiado</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Básicos</span>
              </div>
              <div className="text-2xl font-black text-blue-950 mt-1">
                {colegiadoKihon !== null ? `${colegiadoKihon}%` : '—'}
              </div>
              <div className="text-[10px] text-blue-600 font-medium mt-0.5">Promedio de {kihonVals.length} Senseis</div>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-800">Kata Colegiado</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Forma</span>
              </div>
              <div className="text-2xl font-black text-purple-950 mt-1">
                {colegiadoKata !== null ? `${colegiadoKata}%` : '—'}
              </div>
              <div className="text-[10px] text-purple-600 font-medium mt-0.5">Promedio de {kataVals.length} Senseis</div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Kumite Colegiado</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Combate</span>
              </div>
              <div className="text-2xl font-black text-amber-950 mt-1">
                {colegiadoKumite !== null ? `${colegiadoKumite}%` : '—'}
              </div>
              <div className="text-[10px] text-amber-600 font-medium mt-0.5">Promedio de {kumiteVals.length} Senseis</div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-300 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900">Nota Total Colegiada</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                  {consolidation?.officialVerdict || ((consolidation?.finalGrade || colegiadoTotal || 0) >= 70 ? 'Aprobado' : 'Pendiente')}
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-950 mt-1">
                {consolidation?.finalGrade || colegiadoTotal || '—'}%
              </div>
              <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Promedio general del Tribunal</div>
            </div>
          </div>

          {/* 2. Sección Detallada: Puntos a Mejorar Desglosados en Viñetas (Kihon, Kata y Kumite) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Puntos Técnicos a Mejorar por Fase (Consenso del Tribunal)</span>
              </h4>
              <span className="text-[10px] text-gray-500 font-medium">
                Consenso unificado de los {evalItems.length} Senseis evaluadores
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Viñetas Colegiadas: KIHON */}
              <div className="rounded-xl border border-blue-200/90 bg-blue-50/20 p-4 space-y-2 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <span className="text-[11px] font-black uppercase text-blue-900 tracking-wider">Fase 1: Kihon</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Promedio: {colegiadoKihon !== null ? `${colegiadoKihon}%` : '—'}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-2 bg-white p-3 rounded-lg border border-blue-100 shadow-2xs">
                    {getPhaseImprovementBullets('kihon', kihonNotesList).map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2 text-[11px] text-gray-800 leading-relaxed font-medium">
                        <span className="text-blue-600 font-black mt-0.5 select-none">•</span>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[9px] text-blue-700/80 font-bold pt-1">
                  🥋 Coincidencias de {kihonNotesList.length} evaluadores
                </div>
              </div>

              {/* Viñetas Colegiadas: KATA */}
              <div className="rounded-xl border border-purple-200/90 bg-purple-50/20 p-4 space-y-2 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                      <span className="text-[11px] font-black uppercase text-purple-900 tracking-wider">Fase 2: Kata</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      Promedio: {colegiadoKata !== null ? `${colegiadoKata}%` : '—'}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1.5 bg-white p-3 rounded-lg border border-purple-100 shadow-2xs">
                    {getPhaseImprovementBullets('kata', kataNotesList).map((bullet, bIdx) => {
                      const isKarategui = bullet.toLowerCase().includes('karategui');
                      return (
                        <div
                          key={bIdx}
                          className={`flex items-start gap-2 text-[11px] leading-relaxed p-1.5 rounded-md ${
                            isKarategui ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200/70' : 'text-gray-800 font-medium'
                          }`}
                        >
                          <span className={`font-black mt-0.5 select-none ${isKarategui ? 'text-amber-700' : 'text-purple-600'}`}>•</span>
                          <span>{bullet}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="text-[9px] text-purple-700/80 font-bold pt-1">
                  🥋 Coincidencias de {kataNotesList.length} evaluadores
                </div>
              </div>

              {/* Viñetas Colegiadas: KUMITE */}
              <div className="rounded-xl border border-amber-200/90 bg-amber-50/20 p-4 space-y-2 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                      <span className="text-[11px] font-black uppercase text-amber-900 tracking-wider">Fase 3: Kumite</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Promedio: {colegiadoKumite !== null ? `${colegiadoKumite}%` : '—'}
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-2 bg-white p-3 rounded-lg border border-amber-100 shadow-2xs">
                    {getPhaseImprovementBullets('kumite', kumiteNotesList).map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2 text-[11px] text-gray-800 leading-relaxed font-medium">
                        <span className="text-amber-600 font-black mt-0.5 select-none">•</span>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[9px] text-amber-700/80 font-bold pt-1">
                  🥋 Coincidencias de {kumiteNotesList.length} evaluadores
                </div>
              </div>
            </div>

            {/* Resumen adicional de Protocolo y DO si existen observaciones */}
            {aspectosNotesList.length > 0 && (
              <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/20 p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span className="text-[11px] font-black uppercase text-emerald-900 tracking-wider">
                      Fase 4: Protocolo, Actitud y DO
                    </span>
                  </div>
                  {colegiadoAspectos !== null && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Promedio: {colegiadoAspectos}%
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1.5 bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                  {getPhaseImprovementBullets('aspectos', aspectosNotesList).map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2 text-[11px] text-gray-800 leading-relaxed font-medium">
                      <span className="text-emerald-600 font-black mt-0.5 select-none">•</span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200/80 text-[10px] text-gray-500 flex items-center justify-between">
              <span>💡 Para ver los apuntes individuales y notas atómicas de cada Sensei por separado, seleccione las pestañas superiores (🥋 Sensei).</span>
            </div>
          </div>

          {/* 3. Correcciones Técnicas Oficiales (Sin atribución de evaluadores) */}
          {consolidation && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 via-blue-50/80 to-purple-50/80 border border-indigo-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#2D2E83] font-black text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Correcciones Técnicas Oficiales por Mejorar</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  Promedio Final: {consolidation.finalGrade || colegiadoTotal || '—'}%
                </span>
              </div>

              {/* Renderizar cada viñeta/enunciado de manera ejecutiva sin nombres de evaluadores */}
              <div className="space-y-1.5 pt-1">
                {(consolidation.aiAnalysis || consolidation.observations || 'Evaluación técnica completada.')
                  .split('\n')
                  .filter(line => line && line.trim().length > 0)
                  .map((line, lIdx) => {
                    const cleanLine = line
                      .replace(/^\*\s*/, '')
                      .replace(/^observaciones directas del [^:]+:?\s*/i, '')
                      .replace(/^observaciones directas de [^:]+:?\s*/i, '')
                      .replace(/\s*\([^)]*tribunal[^)]*\):?/gi, ':')
                      .replace(/\s*\([^)]*profesores[^)]*\):?/gi, ':')
                      .trim();

                    if (!cleanLine) return null;

                    const isWarning = cleanLine.toLowerCase().includes('karategui') || cleanLine.toLowerCase().includes('corrección') || cleanLine.toLowerCase().includes('falla grave') || cleanLine.toLowerCase().includes('deficiencia crítica');
                    const isMissing = cleanLine.toLowerCase().includes('carencias') || cleanLine.toLowerCase().includes('10/10') || cleanLine.toLowerCase().includes('100%') || cleanLine.toLowerCase().includes('no aprobación');
                    return (
                      <div
                        key={lIdx}
                        className={`p-2.5 rounded-lg border text-[11px] leading-relaxed flex items-start gap-2 ${
                          isWarning
                            ? 'bg-amber-50/60 border-amber-200 text-amber-950 font-medium'
                            : isMissing
                            ? 'bg-red-50/50 border-red-200 text-red-950 font-medium'
                            : 'bg-white/80 border-indigo-100 text-gray-800'
                        }`}
                      >
                        <span className="mt-0.5 font-bold select-none">•</span>
                        <span>{cleanLine}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contenido: Pestaña Individual de un Sensei */}
      {selectedEvalItem && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Kihon</div>
              <div className="text-xl font-black text-gray-800 mt-0.5">
                {selectedEvalItem.evalRecord?.phaseAverages?.kihon !== null && selectedEvalItem.evalRecord?.phaseAverages?.kihon !== undefined
                  ? `${selectedEvalItem.evalRecord.phaseAverages.kihon}%`
                  : '—'}
              </div>
              <div className="text-[10px] text-gray-500">Evaluado por {selectedEvalItem.evaluator.name.split(' ')[0]}</div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Kata</div>
              <div className="text-xl font-black text-gray-800 mt-0.5">
                {selectedEvalItem.evalRecord?.phaseAverages?.kata !== null && selectedEvalItem.evalRecord?.phaseAverages?.kata !== undefined
                  ? `${selectedEvalItem.evalRecord.phaseAverages.kata}%`
                  : '—'}
              </div>
              <div className="text-[10px] text-gray-500">Evaluado por {selectedEvalItem.evaluator.name.split(' ')[0]}</div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Kumite</div>
              <div className="text-xl font-black text-gray-800 mt-0.5">
                {selectedEvalItem.evalRecord?.phaseAverages?.kumite !== null && selectedEvalItem.evalRecord?.phaseAverages?.kumite !== undefined
                  ? `${selectedEvalItem.evalRecord.phaseAverages.kumite}%`
                  : '—'}
              </div>
              <div className="text-[10px] text-gray-500">Evaluado por {selectedEvalItem.evaluator.name.split(' ')[0]}</div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Total Asignado</div>
              <div className="text-xl font-black text-[#2D2E83] mt-0.5">
                {selectedEvalItem.evalRecord?.percentage !== undefined ? `${selectedEvalItem.evalRecord.percentage}%` : '—'}
              </div>
              <div className="text-[10px] font-bold text-indigo-600">
                {selectedEvalItem.evalRecord?.isPassed ? 'Aprobado' : 'Sin completar'}
              </div>
            </div>
          </div>

          {/* Desglose de Técnicas Evaluadas por este Sensei */}
          {syllabusTechniques.length > 0 && (
            <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200 space-y-2">
              <div className="text-[11px] font-black text-gray-800 uppercase tracking-wider flex items-center justify-between">
                <span>Desglose Técnica por Técnica ({selectedEvalItem.evaluator.name})</span>
                <span className="text-gray-500 font-normal">Escala oficial ISKF</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {syllabusTechniques.map(t => {
                  const score = selectedEvalItem.evalRecord?.techniqueAverages?.[t.id] ??
                    selectedEvalItem.evalRecord?.grades?.find(g => g.techniqueId === t.id)?.average;
                  const grp = (t.group || t.phase || 'kihon').toUpperCase();

                  return (
                    <div
                      key={t.id}
                      className="p-2 rounded-lg bg-white border border-gray-200 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="truncate">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 mr-1.5">
                          {grp}
                        </span>
                        <span className="text-[11px] font-bold text-gray-800">{t.name}</span>
                      </div>
                      <span className={`text-xs font-mono font-black ${
                        score !== undefined && score >= 70 ? 'text-emerald-700' : 'text-gray-400'
                      }`}>
                        {score !== undefined ? `${score}%` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observaciones y Viñetas de este Sensei */}
          {selectedEvalItem.evalRecord?.phaseNotes && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {['kihon', 'kata', 'kumite'].map(phase => {
                const note = selectedEvalItem.evalRecord?.phaseNotes?.[phase];
                if (!note) return null;
                return (
                  <div key={phase} className="p-3 rounded-xl bg-white border border-gray-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                      Retroalimentación {phase}
                    </span>
                    <p className="text-[11px] text-gray-700 whitespace-pre-line leading-relaxed">
                      {note}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TribunalProgressMonitor({
  call,
  students = [],
  currentEvaluatorEmail = null,
  currentEvaluatorToken = null,
  onEditTribunal = null
}) {
  const callId = call?._id || call?.id;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [selectedTandaIndex, setSelectedTandaIndex] = useState('all');
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [downloadingStudentId, setDownloadingStudentId] = useState(null);

  // Descarga directa del Certificado Oficial en PDF para un estudiante
  const handleDownloadCertificateForStudent = async (st, evalItems, cons) => {
    const sId = String(st._id || st.id);
    setDownloadingStudentId(sId);
    try {
      const studentName = st.name || 'Estudiante';
      const dojoName = progressData?.dojoName || call?.dojoName || 'Dojo Kuma';
      const dojoSensei = call?.dojoSensei || 'Sensei David Artavia';
      const targetRank = st.targetRank || cons?.promotedRank || '9° Kyu (Cinta Amarilla)';
      const examDate = call?.examDate || new Date().toLocaleDateString('es-CR');

      const kihonVals = evalItems.map(e => e.evalRecord?.phaseAverages?.kihon).filter(v => typeof v === 'number');
      const kataVals = evalItems.map(e => e.evalRecord?.phaseAverages?.kata).filter(v => typeof v === 'number');
      const kumiteVals = evalItems.map(e => e.evalRecord?.phaseAverages?.kumite).filter(v => typeof v === 'number');
      const totalVals = evalItems.map(e => e.evalRecord?.percentage).filter(v => typeof v === 'number' && v > 0);

      const kScore = kihonVals.length ? Math.round(kihonVals.reduce((a, b) => a + b, 0) / kihonVals.length) : (cons?.finalGrade || 90);
      const kaScore = kataVals.length ? Math.round(kataVals.reduce((a, b) => a + b, 0) / kataVals.length) : (cons?.finalGrade || 90);
      const kuScore = kumiteVals.length ? Math.round(kumiteVals.reduce((a, b) => a + b, 0) / kumiteVals.length) : (cons?.finalGrade || 90);
      const finalScore = cons?.finalGrade || (totalVals.length ? Math.round(totalVals.reduce((a, b) => a + b, 0) / totalVals.length) : 90);

      const cleanRankLower = String(targetRank || '').toLowerCase();
      const kataName = cleanRankLower.includes('8°') || cleanRankLower.includes('naranja') || cleanRankLower.includes('azul')
        ? 'Heian Nidan'
        : cleanRankLower.includes('7°') || cleanRankLower.includes('morada')
        ? 'Heian Sandan'
        : cleanRankLower.includes('6°') || cleanRankLower.includes('verde')
        ? 'Heian Yondan'
        : cleanRankLower.includes('5°')
        ? 'Heian Godan'
        : cleanRankLower.includes('4°')
        ? 'Tekki Shodan'
        : cleanRankLower.includes('3°') || cleanRankLower.includes('2°') || cleanRankLower.includes('1°')
        ? 'Bassai Dai'
        : cleanRankLower.includes('dan')
        ? 'Kata Superior'
        : 'Heian Shodan';

      const kumiteName = cleanRankLower.includes('8°') || cleanRankLower.includes('7°')
        ? 'Sanbon Kumite'
        : cleanRankLower.includes('6°') || cleanRankLower.includes('5°') || cleanRankLower.includes('4°')
        ? 'Kihon Ippon Kumite'
        : cleanRankLower.includes('3°') || cleanRankLower.includes('2°') || cleanRankLower.includes('1°')
        ? 'Jiyu Ippon Kumite'
        : cleanRankLower.includes('dan')
        ? 'Jiyu Kumite'
        : 'Gohon Kumite';

      let resolvedKihonNotes = evalItems.map(e => e.evalRecord?.phaseNotes?.kihon).filter(Boolean).join('\n');
      if (!resolvedKihonNotes) {
        if (kScore < 70) {
          resolvedKihonNotes = 'En la posición adelantada (Zenkutsu Dachi), estirar bien la pierna de atrás sin despegar el talón del suelo al avanzar.\nLlevar la mano de Hikite pegada con firmeza sobre la cintura en cada golpe o bloqueo.\nNo subir el cuerpo en los desplazamientos y recoger la pierna rápido al patear (Hikiashi).';
        } else if (kScore >= 85) {
          resolvedKihonNotes = 'Mayor aceleración y sincronía en el tirón del Hikite hacia la cintura en el instante exacto del impacto final.\nDescender medio puño más el centro de gravedad sin oscilar la altura durante los avances.';
        } else {
          resolvedKihonNotes = 'En la posición adelantada (Zenkutsu Dachi), estirar bien la pierna de atrás con el talón apoyado en el suelo.\nLlevar la mano que no golpea bien pegada a la cintura (Hikite).\nNo subir el cuerpo al avanzar y recoger rápido la pierna al patear.';
        }
      }

      let resolvedKataNotes = evalItems.map(e => e.evalRecord?.phaseNotes?.kata).filter(Boolean).join('\n');
      if (!resolvedKataNotes) {
        if (kaScore < 70) {
          resolvedKataNotes = `Durante ${kataName}, no tocarse ni acomodarse el uniforme (karategui). Mantenerse firme, quieto y con la mirada atenta al frente.\nRepasar la secuencia oficial y el embusen para no dudar en los giros.\nBajar bien las posiciones y no balancear el cuerpo.`;
        } else if (kaScore >= 85) {
          resolvedKataNotes = `En ${kataName}, mantener la concentración absoluta e inmovilidad total tras el kiai final sin ningún ajuste a la vestimenta hasta la voz oficial de descanso.\nBajar medio puño más la posición en cada transición para ganar 10 de 10.`;
        } else {
          resolvedKataNotes = `Durante ${kataName}, mantener la vista fija hacia adelante después de cada giro y después del grito (kiai).\nBajar bien las posiciones y evitar tocarse la vestimenta.`;
        }
      }

      let resolvedKumiteNotes = evalItems.map(e => e.evalRecord?.phaseNotes?.kumite).filter(Boolean).join('\n');
      if (!resolvedKumiteNotes) {
        if (kuScore < 70) {
          resolvedKumiteNotes = `En ${kumiteName}, calcular con precisión la distancia de combate (Ma-ai) para no quedar desprotegido.\nNo bajar los brazos de defensa (Kamae) después de bloquear.\nNo retroceder con miedo o antes de tiempo; mantener actitud marcial decidida.`;
        } else if (kuScore >= 85) {
          resolvedKumiteNotes = `En ${kumiteName}, mayor velocidad explosiva y rotación de cadera en la respuesta de contraataque inmediatamente tras el bloqueo.\nMantener la guardia y el zanshin permanente al concluir cada intercambio.`;
        } else {
          resolvedKumiteNotes = `En ${kumiteName}, calcular bien la distancia con su compañero para no quedar muy cerca ni muy lejos.\nNo bajar las manos de defensa después de bloquear.\nGirar la cadera y golpear con fuerza, buena dirección y un kiai fuerte.`;
        }
      }

      const positiveText = cons?.aiAnalysis || `${studentName} demostró un espíritu marcial ejemplar, constancia y disciplina sobresaliente en el tatami.`;

      await generateTechnicalExamCertificatePDF({
        studentName,
        dojoName,
        dojoSensei,
        targetRank,
        examDate,
        kihonScore: kScore,
        kataScore: kaScore,
        kumiteScore: kuScore,
        writtenScore: 95,
        finalScore,
        isPassed: finalScore >= 70,
        kihonText: resolvedKihonNotes,
        kataText: resolvedKataNotes,
        kumiteText: resolvedKumiteNotes,
        positiveText,
        _generalComment: cons?.observations || 'Tomar las recomendaciones para continuar puliendo su técnica hacia el siguiente grado.',
        evaluators: evaluatorsProgress.map(e => ({ name: e.evaluator.name, role: e.evaluator.role }))
      });
    } catch (err) {
      console.error('Error al generar PDF en monitor:', err);
    } finally {
      setDownloadingStudentId(null);
    }
  };

  const fetchProgress = useCallback(async (silent = false) => {
    if (!callId) return;
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await getTribunalProgressForCall({ callId });
      if (res.success) {
        setProgressData(res);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.error('Error al actualizar progreso del tribunal:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [callId]);

  // Carga inicial y sondeo periódico cada 4 segundos para mantener sincronización en vivo
  useEffect(() => {
    fetchProgress(false);
    const interval = setInterval(() => {
      fetchProgress(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchProgress]);

  // Copiar enlace individual al portapapeles
  const handleCopyLink = (token) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://iskf.cr';
    const link = `${origin}/evaluar/${call?.accessToken}/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // Abrir WhatsApp con mensaje prearmado para el Sensei
  const handleSendWhatsApp = (sensei) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://iskf.cr';
    const link = `${origin}/evaluar/${call?.accessToken}/${sensei.token}`;
    const text = `Oss Sensei ${sensei.name}, le compartimos su enlace privado para la evaluación del examen técnico de ${call?.dojoName}:\n\n🥋 ${link}\n\nLa sesión guardará automáticamente su avance técnica por técnica.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Modo sesión de Sensei: no debe ver la propia, solo las de los demás senseis
  const isSenseiSession = Boolean(currentEvaluatorEmail || currentEvaluatorToken);

  const rawEvaluatorsProgress = useMemo(() => {
    return progressData?.progressByEvaluator || [];
  }, [progressData]);

  const schedules = useMemo(() => {
    return progressData?.schedules || call?.schedules || [];
  }, [progressData, call]);

  const evaluatorsProgress = useMemo(() => {
    if (!isSenseiSession) return rawEvaluatorsProgress;
    return rawEvaluatorsProgress.filter(item => {
      const ev = item.evaluator;
      const matchEmail = currentEvaluatorEmail && ev.email?.toLowerCase() === currentEvaluatorEmail.toLowerCase();
      const matchToken = currentEvaluatorToken && ev.token === currentEvaluatorToken;
      return !matchEmail && !matchToken;
    });
  }, [rawEvaluatorsProgress, isSenseiSession, currentEvaluatorEmail, currentEvaluatorToken]);

  // Métricas de progreso colectivo total de los demás Senseis
  const collectiveStats = useMemo(() => {
    if (evaluatorsProgress.length === 0) {
      return { avgPercent: 0, totalEvaluated: 0, totalAspirants: 0, activeSenseis: 0 };
    }
    const totalAspirants = evaluatorsProgress[0]?.totalToEvaluate || 0;
    const avgPercent = Math.round(
      evaluatorsProgress.reduce((acc, e) => acc + (e.percentCompleted || 0), 0) / evaluatorsProgress.length
    );
    const totalScores = evaluatorsProgress.reduce((acc, e) => acc + (e.totalScoresCount || 0), 0);
    const activeSenseis = evaluatorsProgress.filter(e => (e.evaluatedCount || 0) > 0).length;

    return {
      avgPercent,
      totalAspirants,
      totalScores,
      activeSenseis,
      totalColegas: evaluatorsProgress.length
    };
  }, [evaluatorsProgress]);

  // Tandas filtradas según la selección del usuario
  const displayedSchedules = useMemo(() => {
    if (selectedTandaIndex === 'all') return schedules;
    const idx = Number(selectedTandaIndex);
    return schedules[idx] ? [schedules[idx]] : schedules;
  }, [schedules, selectedTandaIndex]);

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR DE CONTROL EN VIVO Y PROGRESO COLECTIVO */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-indigo-200 bg-white shrink-0 flex items-center justify-center shadow-xs">
              <img
                src={progressData?.dojoLogo || call?.dojoLogo || '/images/dojos/default_logo.jpg'}
                alt={`Logo ${progressData?.dojoName || call?.dojoName || 'Dojo'}`}
                className="w-full h-full object-contain p-0.5"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/dojos/default_logo.jpg';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-gray-900">
                  {isSenseiSession ? 'Monitor del Tribunal (Avance de Colegas)' : `Torre de Control — ${progressData?.dojoName || call?.dojoName || 'Tribunal'}`}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En Vivo
                </span>
                {isSenseiSession && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    <EyeOff className="w-3 h-3" />
                    Vista sinodal (excluye tu nota)
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {isSenseiSession
                  ? `Supervisando el avance de los otros ${evaluatorsProgress.length} Senseis evaluadores en tatami`
                  : `Supervisión simultánea del avance de los ${evaluatorsProgress.length} Senseis evaluadores de ${progressData?.dojoName || call?.dojoName || 'Dojo'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastRefreshedAt && (
              <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
                Actualizado: {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}

            {onEditTribunal && !isSenseiSession && (
              <button
                type="button"
                onClick={onEditTribunal}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#2D2E83] border border-indigo-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Modificar Senseis convocados en este tribunal"
              >
                <Users className="w-3.5 h-3.5 text-[#2D2E83]" />
                <span>Modificar Tribunal</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fetchProgress(false)}
              disabled={isLoading || isRefreshing}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* PROGRESO TOTAL COLECTIVO DE POR DÓNDE VAN LOS DEMÁS SENSEIS */}
        <div className="p-3.5 rounded-xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold flex-wrap gap-2">
            <span className="text-indigo-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" />
              Progreso Colectivo del Tribunal ({collectiveStats.activeSenseis} de {collectiveStats.totalColegas} evaluando activamente)
            </span>
            <span className="text-amber-400 font-mono font-black text-sm">
              {collectiveStats.avgPercent}% General
            </span>
          </div>

          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-linear-to-r from-amber-400 via-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${collectiveStats.avgPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium flex-wrap gap-2 pt-0.5">
            <span>
              Tandas programadas: <strong className="text-white font-mono">{schedules.length} tandas</strong>
            </span>
            <span>
              Aspirantes convocados: <strong className="text-white font-mono">{collectiveStats.totalAspirants} karatecas</strong>
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-200">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-gray-600">Consultando hojas de evaluación del tribunal...</p>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 2. TARJETAS DE LOS DEMÁS SENSEIS: POR DÓNDE VAN EVALUANDO */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {evaluatorsProgress.map((item, idx) => {
              const ev = item.evaluator;
              const isCopied = copiedToken === ev.token;
              const isComplete = item.totalToEvaluate > 0 && item.evaluatedCount >= item.totalToEvaluate;

              const syllabusSummary = progressData?.syllabusSummary || { kihonCount: 6, kataCount: 1, kumiteCount: 1, totalTechniques: 8 };

              // Calcular exactamente en qué tanda va el Sensei y el estado de cada tanda con porcentaje y fases reales
              const tandasProgress = schedules.map((sch, sIdx) => {
                const sIds = sch.studentIds || [];
                const totalInTanda = sIds.length;
                const metrics = sIds.map(sId => getEvalPhaseMetrics(item.evaluationsByStudent[sId], syllabusSummary));

                const startedCount = metrics.filter(m => m.hasStarted).length;
                const fullyDoneCount = metrics.filter(m => m.isFullyDone).length;

                const kihonStartedCount = metrics.filter(m => m.kihonStarted).length;
                const kihonDoneCount = metrics.filter(m => m.kihonDone).length;

                const kataStartedCount = metrics.filter(m => m.kataStarted).length;
                const kataDoneCount = metrics.filter(m => m.kataDone).length;

                const kumiteStartedCount = metrics.filter(m => m.kumiteStarted).length;
                const kumiteDoneCount = metrics.filter(m => m.kumiteDone).length;

                const isPending = totalInTanda === 0 || startedCount === 0;
                const isComplete = totalInTanda > 0 && fullyDoneCount >= totalInTanda;
                const isInProgress = totalInTanda > 0 && !isPending && !isComplete;

                // Estado objetivo e independiente de cada fase (sin adivinar estados de fases futuras)
                const phaseStatus = {
                  kihon: (kihonDoneCount >= totalInTanda && totalInTanda > 0) ? 'done' : (kihonStartedCount > 0 ? 'active' : 'pending'),
                  kata: (kataDoneCount >= totalInTanda && totalInTanda > 0) ? 'done' : (kataStartedCount > 0 ? 'active' : 'pending'),
                  kumite: (kumiteDoneCount >= totalInTanda && totalInTanda > 0) ? 'done' : (kumiteStartedCount > 0 ? 'active' : 'pending')
                };

                // Porcentaje exacto basado en técnicas evaluadas vs total esperado en la tanda
                const expectedTotalTechsInTanda = totalInTanda * (syllabusSummary.totalTechniques || 8);
                const actualEvaluatedTechsInTanda = metrics.reduce((acc, m) => acc + (m.actualEvaluatedCount || 0), 0);

                let tandaPercent = 0;
                if (isComplete) {
                  tandaPercent = 100;
                } else if (expectedTotalTechsInTanda > 0 && actualEvaluatedTechsInTanda > 0) {
                  tandaPercent = Math.min(99, Math.max(5, Math.round((actualEvaluatedTechsInTanda / expectedTotalTechsInTanda) * 100)));
                } else if (isInProgress) {
                  tandaPercent = 10;
                }

                // Resumen transparente de las fases que realmente se han calificado
                const phaseParts = [];
                if (phaseStatus.kihon === 'done') phaseParts.push('Kihon ✓');
                else if (phaseStatus.kihon === 'active') phaseParts.push('Kihon ⚡');

                if (phaseStatus.kata === 'done') phaseParts.push('Kata ✓');
                else if (phaseStatus.kata === 'active') phaseParts.push('Kata ⚡');

                if (phaseStatus.kumite === 'done') phaseParts.push('Kumite ✓');
                else if (phaseStatus.kumite === 'active') phaseParts.push('Kumite ⚡');

                const phaseSummaryText = phaseParts.length > 0 ? phaseParts.join(' • ') : 'Por iniciar';

                return {
                  tandaIndex: sIdx + 1,
                  blockName: sch.blockName || `Tanda ${sIdx + 1}`,
                  startTime: sch.startTime,
                  endTime: sch.endTime,
                  evaluatedInTanda: startedCount,
                  totalInTanda,
                  tandaPercent,
                  isComplete,
                  isInProgress,
                  isPending,
                  phaseStatus,
                  phaseSummaryText
                };
              });

              const completedTandas = tandasProgress.filter(t => t.isComplete);
              const inProgressTanda = tandasProgress.find(t => t.isInProgress);
              const nextPendingTanda = tandasProgress.find(t => t.isPending && t.totalInTanda > 0);

              let activeTandaBadge = null;
              if (schedules.length === 0) {
                activeTandaBadge = {
                  label: 'Sin Tandas',
                  status: 'Configuración pendiente',
                  badgeBg: 'bg-gray-100 text-gray-600 border border-gray-200'
                };
              } else if (completedTandas.length === schedules.length && schedules.length > 0) {
                activeTandaBadge = {
                  label: '✓ Concluyó Todas las Tandas',
                  status: `${completedTandas.length} de ${schedules.length} tandas evaluadas`,
                  badgeBg: 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-black'
                };
              } else if (inProgressTanda) {
                activeTandaBadge = {
                  label: `Evaluando: ${inProgressTanda.blockName} (${inProgressTanda.phaseSummaryText})`,
                  status: `${inProgressTanda.evaluatedInTanda} de ${inProgressTanda.totalInTanda} karatecas (${inProgressTanda.tandaPercent}% de tanda)`,
                  badgeBg: 'bg-amber-100 text-amber-950 border border-amber-400 font-black ring-2 ring-amber-400/50'
                };
              } else if (completedTandas.length > 0 && nextPendingTanda) {
                activeTandaBadge = {
                  label: `Siguiente: ${nextPendingTanda.blockName}`,
                  status: `Tandas previas listas (${completedTandas.length}/${schedules.length})`,
                  badgeBg: 'bg-blue-50 text-blue-800 border border-blue-300 font-black'
                };
              } else if (nextPendingTanda) {
                activeTandaBadge = {
                  label: `Por Iniciar: ${nextPendingTanda.blockName}`,
                  status: `${nextPendingTanda.totalInTanda} karatecas asignados`,
                  badgeBg: 'bg-slate-100 text-slate-800 border border-slate-300 font-bold'
                };
              } else {
                activeTandaBadge = {
                  label: 'Tandas Vacías',
                  status: 'Sin karatecas asignados',
                  badgeBg: 'bg-gray-100 text-gray-600 border border-gray-200'
                };
              }

              const timeAgo = formatTimeAgo(item.lastEvaluatedAt);

              return (
                <div
                  key={ev.token || ev.email || idx}
                  className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3.5 hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Encabezado del Evaluador */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 font-black flex items-center justify-center text-sm shadow-2xs shrink-0">
                          🥋
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-black text-gray-900 leading-tight truncate">
                            {ev.name}
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                            {ev.role || `Sinodal ${idx + 1}`}
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isComplete
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : inProgressTanda
                          ? 'bg-amber-50 text-amber-800 border border-amber-300 animate-pulse'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isComplete ? '✓ Completado' : inProgressTanda ? 'En Tatami' : 'En Espera'}
                      </span>
                    </div>

                    {/* EN QUÉ TANDA VA EL SENSEI (DESTACADO PRINCIPAL) */}
                    <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                      inProgressTanda 
                        ? 'bg-amber-50/90 border-amber-300 shadow-2xs' 
                        : isComplete 
                        ? 'bg-emerald-50/90 border-emerald-300' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                        <span className="flex items-center gap-1.5 text-indigo-950">
                          <Layers className="w-3.5 h-3.5 text-indigo-600" />
                          Ubicación en Tatami
                        </span>
                        {inProgressTanda && (
                          <span className="inline-flex items-center gap-1 text-amber-800 font-mono text-[9px] bg-amber-200/70 px-1.5 py-0.2 rounded-full font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                            En Curso
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm font-black text-gray-900">
                        {activeTandaBadge.label}
                      </div>
                      <div className="text-[11px] text-gray-600 font-medium">
                        {activeTandaBadge.status}
                      </div>
                    </div>

                    {/* Barra de Progreso Individual de Karatecas Total */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className="text-gray-700">Karatecas Totales Evaluados</span>
                        <span className="font-mono text-indigo-700">
                          {item.evaluatedCount} / {item.totalToEvaluate} ({item.percentCompleted}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isComplete ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${item.percentCompleted}%` }}
                        />
                      </div>
                    </div>

                    {/* DESGLOSE VISUAL DE TODAS LAS TANDAS CON LLENADO PROGRESIVO Y MICRO-FASES */}
                    {schedules.length > 0 && (
                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          <span>Recorrido de Tandas</span>
                          <span className="font-mono text-indigo-700 font-black">
                            {completedTandas.length} / {schedules.length} listas
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {tandasProgress.map((tp) => (
                            <div
                              key={tp.tandaIndex}
                              className={`relative overflow-hidden p-2 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                                tp.isComplete
                                  ? 'border-emerald-300 shadow-2xs'
                                  : tp.isInProgress
                                  ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                                  : 'border-gray-200 bg-gray-50/70'
                              }`}
                            >
                              {/* Capa de fondo con llenado dinámico (Liquid Progress Fill) */}
                              <div
                                className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out pointer-events-none ${
                                  tp.isComplete
                                    ? 'bg-emerald-100/90'
                                    : tp.isInProgress
                                    ? 'bg-gradient-to-r from-amber-200/90 via-amber-100/80 to-amber-200/60'
                                    : 'bg-transparent'
                                }`}
                                style={{ width: `${tp.tandaPercent}%` }}
                              />

                              {/* Contenido en capa superior legible */}
                              <div className="relative z-10 space-y-1.5 w-full">
                                {/* Cabecera de la tanda: Nombre y Badge de Porcentaje */}
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-[11px] font-black truncate ${
                                    tp.isComplete ? 'text-emerald-950' : tp.isInProgress ? 'text-amber-950 font-black' : 'text-gray-600'
                                  }`}>
                                    {tp.blockName}
                                  </span>
                                  {tp.isComplete ? (
                                    <span className="px-1.5 py-0.2 rounded font-mono font-black text-[9px] bg-emerald-600 text-white shadow-2xs shrink-0">
                                      100% ✓
                                    </span>
                                  ) : tp.isInProgress ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded font-mono font-black text-[9px] bg-amber-500 text-slate-950 shadow-xs shrink-0">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                                      {tp.tandaPercent}%
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 rounded font-mono font-medium text-[9px] bg-gray-200 text-gray-500 shrink-0">
                                      0%
                                    </span>
                                  )}
                                </div>

                                {/* Micro barra de progreso visual */}
                                <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-500 ${
                                      tp.isComplete ? 'bg-emerald-500' : tp.isInProgress ? 'bg-amber-600' : 'bg-transparent'
                                    }`}
                                    style={{ width: `${tp.tandaPercent}%` }}
                                  />
                                </div>

                                {/* Contador de karatecas de la tanda */}
                                <div className="flex items-center justify-between text-[9px] font-mono text-gray-600">
                                  <span>{tp.evaluatedInTanda} de {tp.totalInTanda} kar.</span>
                                  <span className="font-semibold text-gray-500">
                                    {tp.isComplete ? 'Completa' : tp.isInProgress ? 'En Tatami' : 'En Espera'}
                                  </span>
                                </div>

                                {/* Micro-indicadores de Fase (Kihon | Kata | Kumite) */}
                                <div className="flex items-center gap-1 pt-1 border-t border-black/5">
                                  {[
                                    { key: 'kihon', label: 'Kihon' },
                                    { key: 'kata', label: 'Kata' },
                                    { key: 'kumite', label: 'Kumite' }
                                  ].map(phase => {
                                    const status = tp.phaseStatus[phase.key];
                                    return (
                                      <span
                                        key={phase.key}
                                        className={`flex-1 text-center py-0.5 rounded text-[8px] font-bold tracking-tight uppercase transition-all ${
                                          status === 'done'
                                            ? 'bg-emerald-200/90 text-emerald-950 border border-emerald-300 font-bold'
                                            : status === 'active'
                                            ? 'bg-amber-400 text-slate-950 font-black border border-amber-500 animate-pulse shadow-2xs'
                                            : 'bg-black/5 text-gray-400 border border-black/5'
                                        }`}
                                        title={`Fase de ${phase.label}: ${status === 'done' ? 'Completada' : status === 'active' ? 'Evaluando actualmente' : 'Pendiente'}`}
                                      >
                                        {phase.label} {status === 'done' ? '✓' : status === 'active' ? '⚡' : ''}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Último karateca calificado y pulso de actividad */}
                    <div className="flex items-center justify-between gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-200/70 text-[10px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">
                          {item.lastEvaluatedStudentName ? (
                            <>Último: <strong className="text-gray-900">{item.lastEvaluatedStudentName}</strong></>
                          ) : (
                            <span className="text-gray-400">Sin evaluaciones aún</span>
                          )}
                        </span>
                      </div>
                      {timeAgo && (
                        <span className={`shrink-0 font-medium px-1.5 py-0.2 rounded-full font-mono text-[9px] ${
                          Date.now() - new Date(item.lastEvaluatedAt).getTime() < 120000
                            ? 'bg-emerald-100 text-emerald-800 font-bold'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {timeAgo}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones de contacto (solo si no es sesión del propio sensei) */}
                  {!isSenseiSession && (
                    <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(ev)}
                        className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="Enviar enlace por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(ev.token)}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 border cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-black'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                        }`}
                        title="Copiar enlace"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <a
                        href={`/evaluar/${call?.accessToken}/${ev.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-200"
                        title="Abrir vista"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* 3. TANDA POR TANDA DE KARATECAS: EVALUACIÓN DE LOS DEMÁS SENSEIS */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#2D2E83]" />
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-gray-900">
                    Evaluaciones Tanda por Tanda de los demás Senseis
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Supervisa qué ha calificado cada sensei colega para cada karateca
                  </p>
                </div>
              </div>

              {/* Selector de Pestañas de Tandas */}
              {schedules.length > 1 && (
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSelectedTandaIndex('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedTandaIndex === 'all'
                        ? 'bg-[#2D2E83] text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Todas las Tandas ({schedules.length})
                  </button>
                  {schedules.map((sch, sIdx) => (
                    <button
                      key={sch.id || sIdx}
                      type="button"
                      onClick={() => setSelectedTandaIndex(sIdx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        selectedTandaIndex === sIdx
                          ? 'bg-[#2D2E83] text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {sch.blockName || `Tanda ${sIdx + 1}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {displayedSchedules.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 font-bold">
                No hay tandas configuradas para esta convocatoria.
              </div>
            ) : (
              <div className="space-y-4">
                {displayedSchedules.map((tanda, tIdx) => {
                  const studentIds = tanda.studentIds || [];
                  const tandaStudentsList = studentIds
                    .map(id => {
                      const fromProps = students.find(s => String(s._id || s.id) === String(id));
                      if (fromProps) return fromProps;
                      const fromAspirants = (progressData?.aspirants || []).find(a => String(a.studentId) === String(id));
                      if (fromAspirants) {
                        return {
                          _id: fromAspirants.studentId,
                          id: fromAspirants.studentId,
                          name: fromAspirants.studentName,
                          currentRank: fromAspirants.currentRank || '10° Kyu (Cinta Blanca)',
                          targetRank: fromAspirants.targetRank
                        };
                      }
                      return null;
                    })
                    .filter(Boolean);

                  return (
                    <div key={tanda.id || tIdx} className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                      {/* Cabecera de la Tanda */}
                      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center">
                            #{tIdx + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-black text-gray-900">
                            {tanda.blockName || `Tanda ${tIdx + 1}`}
                          </span>
                          <span className="text-[11px] text-gray-500 font-mono">
                            ({tanda.startTime || '09:00 AM'} - {tanda.endTime || '09:45 AM'})
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                          {tandaStudentsList.length} karatecas en tatami
                        </span>
                      </div>

                      {/* Tabla de la Tanda */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-gray-200 bg-white text-[10px] font-black text-gray-400 uppercase tracking-wider">
                              <th className="py-2.5 px-3">Karateca (Clic para desglose)</th>
                              <th className="py-2.5 px-3">Cinta Actual</th>
                              {evaluatorsProgress.map((item, evIdx) => (
                                <th key={evIdx} className="py-2.5 px-3 text-center">
                                  <div className="font-bold text-gray-800 normal-case text-xs">
                                    🥋 {item.evaluator.name.split(' ')[0]} {item.evaluator.name.split(' ')[1] || ''}
                                  </div>
                                  <div className="text-[9px] text-gray-400 normal-case">
                                    {item.evaluator.role?.split('/')[0] || 'Sinodal'}
                                  </div>
                                </th>
                              ))}
                              <th className="py-2.5 px-3 text-center">Promedio Colegiado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {tandaStudentsList.length === 0 ? (
                              <tr>
                                <td colSpan={evaluatorsProgress.length + 3} className="py-6 text-center text-xs text-gray-400 font-medium">
                                  No hay karatecas matriculados en esta tanda todavía.
                                </td>
                              </tr>
                            ) : (
                              tandaStudentsList.map((st, sIdx) => {
                                const sId = String(st._id || st.id);
                                const isExpanded = expandedStudentId === sId;

                                // Promedio del resto de los senseis para este alumno
                                const studentGrades = evaluatorsProgress
                                  .map(item => item.evaluationsByStudent[sId]?.percentage)
                                  .filter(p => typeof p === 'number' && p > 0);

                                const avg = studentGrades.length > 0
                                  ? Math.round(studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length)
                                  : null;

                                return (
                                  <React.Fragment key={sId}>
                                    <tr
                                      onClick={() => setExpandedStudentId(prev => prev === sId ? null : sId)}
                                      className={`transition-colors cursor-pointer ${
                                        isExpanded ? 'bg-indigo-50/70 border-b border-indigo-200' : 'hover:bg-gray-50/80'
                                      }`}
                                    >
                                      <td className="py-2.5 px-3 font-bold text-gray-900">
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            className="p-1 rounded-md text-gray-400 hover:text-[#2D2E83] hover:bg-white transition-colors cursor-pointer"
                                            title="Ver desglose por Sensei y descargar PDF"
                                          >
                                            {isExpanded ? (
                                              <ChevronDown className="w-4 h-4 text-[#2D2E83]" />
                                            ) : (
                                              <ChevronRight className="w-4 h-4 text-gray-400" />
                                            )}
                                          </button>
                                          <div>
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-mono text-gray-400 text-[10px]">
                                                #{sIdx + 1}
                                              </span>
                                              <span className="font-bold text-gray-900 hover:text-[#2D2E83]">
                                                {st.name}
                                              </span>
                                            </div>
                                            <div className="text-[10px] text-indigo-600 font-medium">
                                              {isExpanded ? '▲ Ocultar desglose' : '▼ Clic para ver notas por Sensei y PDF'}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3 text-gray-600 font-medium">
                                        {st.currentRank}
                                      </td>

                                      {evaluatorsProgress.map((item, evIdx) => {
                                        const evRecord = item.evaluationsByStudent[sId];
                                        const isRated = Boolean(evRecord && evRecord.scoresCount > 0);

                                        return (
                                          <td key={evIdx} className="py-2.5 px-3 text-center">
                                            {isRated ? (
                                              <div className="inline-flex flex-col items-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                  {evRecord.percentage}%
                                                </span>
                                                <span className={`text-[9px] font-bold mt-0.5 ${
                                                  evRecord.phaseStats?.isFullyDone ? 'text-emerald-700' : 'text-indigo-600'
                                                }`}>
                                                  {evRecord.phaseStats?.isFullyDone 
                                                    ? '✓ Completo' 
                                                    : `${evRecord.phaseStats?.totalEvaluatedTechs || evRecord.techniquesCount || 1}/${evRecord.phaseStats?.totalExpectedTechs || 8} téc.`}
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-gray-400 bg-gray-50 border border-gray-100 font-mono">
                                                Pendiente
                                              </span>
                                            )}
                                          </td>
                                        );
                                      })}

                                      <td className="py-2.5 px-3 text-center font-bold font-mono">
                                        {avg !== null ? (
                                          <span className={`px-2 py-0.5 rounded-lg text-xs ${
                                            avg >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                          }`}>
                                            {avg}%
                                          </span>
                                        ) : (
                                          <span className="text-gray-300">—</span>
                                        )}
                                      </td>
                                    </tr>

                                    {isExpanded && (
                                      <tr className="bg-slate-50/95 border-b border-indigo-200 animate-in fade-in duration-150">
                                        <td colSpan={evaluatorsProgress.length + 3} className="p-3 sm:p-5">
                                          <StudentMonitorDrawer
                                            student={st}
                                            evaluatorsProgress={evaluatorsProgress}
                                            syllabusTechniques={progressData?.syllabusTechniques || []}
                                            consolidation={progressData?.consolidationsByStudent?.[sId] || null}
                                            onDownloadPdf={handleDownloadCertificateForStudent}
                                            isDownloading={downloadingStudentId === sId}
                                          />
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
