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
  ChevronUp,
  Sparkles,
  UserCheck,
  Edit3,
  Trash2,
  Plus,
  RotateCcw,
  X,
  Save
} from 'lucide-react';
import { getTribunalProgressForCall, saveConsolidatedVerdict } from '../../lib/actions/technicalExams';
import { generateTechnicalExamCertificatePDF } from '../../lib/pdf/technicalExamCertificateGenerator';
import { synthesizePhaseBulletsWithAI } from '../../lib/utils/martialAiSynthesizer';
import { getNextRank, isKyuExemptFromWrittenExam } from '../../lib/constants/kyuRanks';

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

// Helper inteligente para comparar y sintetizar viñetas consensuadas por fase entre todos los evaluadores
function getPhaseImprovementBullets(phase, notesList, techniqueScores = [], phaseAverage = 75, targetRank = '9° Kyu (Cinta Amarilla)') {
  return synthesizePhaseBulletsWithAI({
    phase,
    notesList,
    techniqueScores,
    phaseAverage,
    targetRank
  });
}

// Helper para clasificar el origen de una viñeta para la visualización del Director Técnico (Shihan Roy Gatjens)
function getOriginBadgeData(itemOrText) {
  if (itemOrText && typeof itemOrText === 'object') {
    const type = itemOrText.sourceType || (itemOrText.coincidenceCount >= 2 ? 'sensei_consensus' : 'sensei_only');
    const icon = itemOrText.sourceIcon || (
      type === 'stars_only' ? '⭐' :
      type === 'hybrid_consensus' ? '⭐👤👤' :
      type === 'sensei_consensus' ? '👤👤' :
      type === 'hybrid' ? '⭐👤' :
      '👤'
    );
    const label = itemOrText.sourceLabel || (
      type === 'stars_only' ? 'Métrica de Estrellas (<100%)' :
      type === 'hybrid_consensus' ? 'Consenso de 2+ Senseis + Estrellas' :
      type === 'sensei_consensus' ? 'Coincidencia de 2 o más Senseis' :
      type === 'hybrid' ? 'Estrellas + Comentario de Sensei' :
      'Comentario Directo de Sensei'
    );
    return { type, icon, label };
  }

  const str = String(itemOrText || '').toLowerCase();
  const hasStarsPattern = /\(\d+%\)/.test(str) || str.includes('consenso de estrellas') || str.includes('para alcanzar el 100%');
  const hasMultiSenseiKeywords = str.includes('consenso de') || str.includes('varios senseis') || str.includes('ambos senseis') || str.includes('tribunal unificado');
  const hasSenseiKeywords = str.includes('sensei') || str.includes('tribunal') || str.includes('evaluador');

  if (hasStarsPattern && hasMultiSenseiKeywords) {
    return { type: 'hybrid_consensus', icon: '⭐👤👤', label: 'Consenso de 2+ Senseis + Estrellas' };
  } else if (hasMultiSenseiKeywords) {
    return { type: 'sensei_consensus', icon: '👤👤', label: 'Coincidencia de 2 o más Senseis' };
  } else if (hasStarsPattern && hasSenseiKeywords) {
    return { type: 'hybrid', icon: '⭐👤', label: 'Estrellas + Comentario de Sensei' };
  } else if (hasStarsPattern) {
    return { type: 'stars_only', icon: '⭐', label: 'Métrica de Estrellas (<100%)' };
  }
  return { type: 'sensei_only', icon: '👤', label: 'Comentario Directo de Sensei' };
}

// Drawer interactivo con pestañas de Promedios Colegiados y pestañas por cada Sensei Evaluador
function StudentMonitorDrawer({
  call,
  student,
  evaluatorsProgress,
  syllabusTechniques = [],
  consolidation = null,
  onDownloadPdf,
  isDownloading,
  onRefresh
}) {
  const [phaseAdjustments, setPhaseAdjustments] = useState({
    kihon: consolidation?.phaseAdjustments?.kihon ?? 0,
    kata: consolidation?.phaseAdjustments?.kata ?? 0,
    kumite: consolidation?.phaseAdjustments?.kumite ?? 0
  });
  const [martialAdjustmentReason, setMartialAdjustmentReason] = useState(consolidation?.martialAdjustmentReason ?? '');
  const [isSavingVerdict, setIsSavingVerdict] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(null);

  useEffect(() => {
    if (consolidation) {
      if (consolidation.phaseAdjustments) {
        setPhaseAdjustments({
          kihon: Number(consolidation.phaseAdjustments.kihon) || 0,
          kata: Number(consolidation.phaseAdjustments.kata) || 0,
          kumite: Number(consolidation.phaseAdjustments.kumite) || 0
        });
      } else if (typeof consolidation.martialAdjustment === 'number' && consolidation.martialAdjustment !== 0) {
        setPhaseAdjustments({
          kihon: consolidation.martialAdjustment,
          kata: consolidation.martialAdjustment,
          kumite: consolidation.martialAdjustment
        });
      }
      if (typeof consolidation.martialAdjustmentReason === 'string') {
        setMartialAdjustmentReason(consolidation.martialAdjustmentReason);
      }
    }
  }, [consolidation]);
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

  // Bases numéricas de cada fase
  const baseKihon = colegiadoKihon !== null 
    ? colegiadoKihon 
    : (consolidation?.phaseScores?.kihon ?? (consolidation?.technicalPercentage || 80));
  const baseKata = colegiadoKata !== null 
    ? colegiadoKata 
    : (consolidation?.phaseScores?.kata ?? (consolidation?.technicalPercentage || 80));
  const baseKumite = colegiadoKumite !== null 
    ? colegiadoKumite 
    : (consolidation?.phaseScores?.kumite ?? (consolidation?.technicalPercentage || 80));

  // Calificaciones finales ajustadas por fase (clamped 0 a 100%)
  const finalKihon = Math.min(100, Math.max(0, baseKihon + (phaseAdjustments.kihon || 0)));
  const finalKata = Math.min(100, Math.max(0, baseKata + (phaseAdjustments.kata || 0)));
  const finalKumite = Math.min(100, Math.max(0, baseKumite + (phaseAdjustments.kumite || 0)));

  // Promedio técnico base sin ajustes
  const baseTechnicalScore = Math.round((baseKihon + baseKata + baseKumite) / 3);

  // El promedio final se calcula solo automáticamente a partir de las 3 fases
  const calculatedFinalScore = Math.round((finalKihon + finalKata + finalKumite) / 3);
  const calculatedIsPassed = calculatedFinalScore >= 70;
  const netAdjustment = calculatedFinalScore - baseTechnicalScore;
  const hasAnyAdjustment = (phaseAdjustments.kihon !== 0 || phaseAdjustments.kata !== 0 || phaseAdjustments.kumite !== 0);

  // Manejador de incremento / decremento con flechitas
  const handleAdjustPhase = (phaseKey, delta) => {
    setPhaseAdjustments(prev => {
      const currentAdj = prev[phaseKey] || 0;
      const base = phaseKey === 'kihon' ? baseKihon : phaseKey === 'kata' ? baseKata : baseKumite;
      const nextScore = Math.min(100, Math.max(0, base + currentAdj + delta));
      return {
        ...prev,
        [phaseKey]: nextScore - base
      };
    });
  };

  // Apuntes de todos los Senseis clasificados por fase técnica
  const kihonNotesList = evalItems
    .map(e => ({
      evaluatorName: e.evaluator.name,
      evaluatorRole: e.evaluator.role,
      note: e.evalRecord?.phaseNotes?.kihon || ''
    }))
    .filter(item => item.note && item.note.trim().length > 0);

  const kataNotesList = evalItems
    .flatMap(e => {
      const items = [];
      if (e.evalRecord?.phaseNotes?.kata) {
        items.push({
          evaluatorName: e.evaluator.name,
          evaluatorRole: e.evaluator.role,
          note: e.evalRecord.phaseNotes.kata
        });
      }
      if (e.evalRecord?.phaseNotes?.kata_2) {
        items.push({
          evaluatorName: e.evaluator.name,
          evaluatorRole: e.evaluator.role,
          note: e.evalRecord.phaseNotes.kata_2
        });
      }
      return items;
    })
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
  const targetRankStr = consolidation?.promotedRank
    || student?.targetRank
    || getNextRank(student?.currentRank)
    || '8° Kyu (Cinta Naranja)';

  // Extraer promedios por técnica del temario según las notas asignadas
  const kihonTechScores = (syllabusTechniques || [])
    .filter(t => (t.group || t.phase || 'kihon').toLowerCase() === 'kihon')
    .map(t => {
      const vals = evalItems.map(e => e.evalRecord?.techniqueAverages?.[t.id]).filter(v => typeof v === 'number');
      const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      return { id: t.id, name: t.name, score: avg };
    });

  const kataTechScores = (syllabusTechniques || [])
    .filter(t => (t.group || t.phase || '').toLowerCase() === 'kata')
    .map(t => {
      const vals = evalItems.map(e => e.evalRecord?.techniqueAverages?.[t.id]).filter(v => typeof v === 'number');
      const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      return { id: t.id, name: t.name, score: avg };
    });

  const kumiteTechScores = (syllabusTechniques || [])
    .filter(t => (t.group || t.phase || '').toLowerCase() === 'kumite')
    .map(t => {
      const vals = evalItems.map(e => e.evalRecord?.techniqueAverages?.[t.id]).filter(v => typeof v === 'number');
      const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      return { id: t.id, name: t.name, score: avg };
    });

  const defaultKihonBullets = useMemo(() => {
    return getPhaseImprovementBullets('kihon', kihonNotesList, kihonTechScores, colegiadoKihon, targetRankStr);
  }, [kihonNotesList, kihonTechScores, colegiadoKihon, targetRankStr]);

  const defaultKataBullets = useMemo(() => {
    return getPhaseImprovementBullets('kata', kataNotesList, kataTechScores, colegiadoKata, targetRankStr);
  }, [kataNotesList, kataTechScores, colegiadoKata, targetRankStr]);

  const defaultKumiteBullets = useMemo(() => {
    return getPhaseImprovementBullets('kumite', kumiteNotesList, kumiteTechScores, colegiadoKumite, targetRankStr);
  }, [kumiteNotesList, kumiteTechScores, colegiadoKumite, targetRankStr]);

  const defaultAspectosBullets = useMemo(() => {
    return getPhaseImprovementBullets('aspectos', aspectosNotesList, [], colegiadoAspectos, targetRankStr);
  }, [aspectosNotesList, colegiadoAspectos, targetRankStr]);

  // Viñetas oficiales editables directamente por Shihan Roy para cada fase
  const [phaseBullets, setPhaseBullets] = useState({
    kihon: consolidation?.customPhaseBullets?.kihon || null,
    kata: consolidation?.customPhaseBullets?.kata || null,
    kumite: consolidation?.customPhaseBullets?.kumite || null,
    aspectos: consolidation?.customPhaseBullets?.aspectos || null
  });

  useEffect(() => {
    if (consolidation?.customPhaseBullets) {
      setPhaseBullets({
        kihon: consolidation.customPhaseBullets.kihon || null,
        kata: consolidation.customPhaseBullets.kata || null,
        kumite: consolidation.customPhaseBullets.kumite || null,
        aspectos: consolidation.customPhaseBullets.aspectos || null
      });
    }
  }, [consolidation]);

  const currentKihonBullets = phaseBullets.kihon || defaultKihonBullets;
  const currentKataBullets = phaseBullets.kata || defaultKataBullets;
  const currentKumiteBullets = phaseBullets.kumite || defaultKumiteBullets;
  const currentAspectosBullets = phaseBullets.aspectos || defaultAspectosBullets;

  const allPhaseBullets = useMemo(() => {
    return [...currentKihonBullets, ...currentKataBullets, ...currentKumiteBullets, ...currentAspectosBullets];
  }, [currentKihonBullets, currentKataBullets, currentKumiteBullets, currentAspectosBullets]);

  // Estados de edición para Shihan Roy
  const [editingBullet, setEditingBullet] = useState(null); // { phase, index, text }
  const [addingBulletPhase, setAddingBulletPhase] = useState(null); // 'kihon' | 'kata' | 'kumite' | 'aspectos'
  const [newBulletText, setNewBulletText] = useState('');

  const handleUpdateBullet = (phase, index, newText) => {
    if (!newText || !newText.trim()) return;
    const currentList = phase === 'kihon' ? currentKihonBullets : phase === 'kata' ? currentKataBullets : phase === 'kumite' ? currentKumiteBullets : currentAspectosBullets;
    const list = [...currentList];
    const oldItem = list[index];
    const updated = typeof oldItem === 'object'
      ? { ...oldItem, text: newText.trim() }
      : { text: newText.trim(), sourceType: 'sensei_only', sourceIcon: '👤', sourceLabel: 'Editado por Shihan Roy' };
    list[index] = updated;
    setPhaseBullets(prev => ({ ...prev, [phase]: list }));
    setEditingBullet(null);
  };

  const handleDeleteBullet = (phase, index) => {
    const currentList = phase === 'kihon' ? currentKihonBullets : phase === 'kata' ? currentKataBullets : phase === 'kumite' ? currentKumiteBullets : currentAspectosBullets;
    const list = [...currentList];
    list.splice(index, 1);
    setPhaseBullets(prev => ({ ...prev, [phase]: list }));
  };

  const handleAddBullet = (phase, text) => {
    if (!text || !text.trim()) return;
    const currentList = phase === 'kihon' ? currentKihonBullets : phase === 'kata' ? currentKataBullets : phase === 'kumite' ? currentKumiteBullets : currentAspectosBullets;
    const list = [...currentList];
    list.push({
      text: text.trim(),
      sourceType: 'sensei_only',
      sourceIcon: '👤',
      sourceLabel: 'Agregado por Shihan Roy Gatjens'
    });
    setPhaseBullets(prev => ({ ...prev, [phase]: list }));
    setAddingBulletPhase(null);
    setNewBulletText('');
  };

  const handleResetPhaseBullets = (phase) => {
    setPhaseBullets(prev => ({ ...prev, [phase]: null }));
  };

  const handleSaveConsolidatedWithAdjustment = async () => {
    if (hasAnyAdjustment && (!martialAdjustmentReason || !martialAdjustmentReason.trim())) {
      alert('Debe indicar la justificación obligatoria del ajuste marcial aplicado.');
      return;
    }
    setIsSavingVerdict(true);
    setSaveFeedback(null);
    try {
      const evaluatorsList = evalItems.map(e => ({
        evaluatorName: e.evaluator.name,
        evaluatorEmail: e.evaluator.email,
        percentage: e.evalRecord?.percentage || 0,
        isPassed: (e.evalRecord?.percentage || 0) >= 70
      }));

      const res = await saveConsolidatedVerdict({
        callId: call?._id || call?.id,
        studentId: sId,
        studentName: student.name,
        studentRank: student.currentRank,
        targetRank: targetRankStr,
        dojoId: call?.dojoId,
        dojoName: call?.dojoName,
        syllabusId: call?.syllabusSnapshots?.[0]?.id || call?.syllabusId,
        syllabusName: call?.syllabusSnapshots?.[0]?.name || 'Temario Oficial ISKF',
        evaluators: evaluatorsList,
        phaseScores: {
          kihon: finalKihon,
          kata: finalKata,
          kumite: finalKumite
        },
        phaseAdjustments: {
          kihon: phaseAdjustments.kihon || 0,
          kata: phaseAdjustments.kata || 0,
          kumite: phaseAdjustments.kumite || 0
        },
        technicalPercentage: baseTechnicalScore,
        martialAdjustment: netAdjustment,
        martialAdjustmentReason: (martialAdjustmentReason || '').trim(),
        customPhaseBullets: {
          kihon: currentKihonBullets,
          kata: currentKataBullets,
          kumite: currentKumiteBullets,
          ...(aspectosNotesList.length > 0 ? { aspectos: currentAspectosBullets } : {})
        },
        overallPercentage: calculatedFinalScore,
        isPassed: calculatedIsPassed,
        aiConsolidatedSummary: consolidation?.aiAnalysis || consolidation?.observations || 'Dictamen colegiado oficializado por el tribunal.',
        consolidatedBy: 'Comisión Técnica ISKF'
      });

      if (res?.success) {
        setSaveFeedback({ type: 'success', message: '¡Dictamen oficial y ajustes guardados en base de datos!' });
        if (typeof onRefresh === 'function') {
          onRefresh();
        }
      } else {
        setSaveFeedback({ type: 'error', message: res?.error || 'Error al persistir dictamen.' });
      }
    } catch (err) {
      console.error('Error al guardar veredicto con ajuste:', err);
      setSaveFeedback({ type: 'error', message: 'Error de conexión al persistir veredicto.' });
    } finally {
      setIsSavingVerdict(false);
      setTimeout(() => setSaveFeedback(null), 5000);
    }
  };

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
          onClick={() => onDownloadPdf(student, evalItems, {
            ...consolidation,
            phaseScores: {
              kihon: finalKihon,
              kata: finalKata,
              kumite: finalKumite
            },
            phaseAdjustments,
            technicalPercentage: baseTechnicalScore,
            martialAdjustment: netAdjustment,
            martialAdjustmentReason: (martialAdjustmentReason || '').trim(),
            customPhaseBullets: {
              kihon: currentKihonBullets,
              kata: currentKataBullets,
              kumite: currentKumiteBullets,
              aspectos: currentAspectosBullets
            },
            finalGrade: calculatedFinalScore,
            isPassed: calculatedIsPassed
          })}
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
          {/* 1. Tarjetas de Resumen Numérico Colegiado con flechitas de ajuste arriba/abajo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* KIHON COLEGIADO */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">Kihon Colegiado</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Básicos</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-blue-950 font-mono">{finalKihon}%</span>
                    {phaseAdjustments.kihon !== 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${phaseAdjustments.kihon > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {phaseAdjustments.kihon > 0 ? `+${phaseAdjustments.kihon}%` : `${phaseAdjustments.kihon}%`}
                      </span>
                    )}
                  </div>
                  {/* Flechitas arriba / abajo (tamaño óptimo para tablet) */}
                  <div className="flex items-center gap-1 bg-white border border-blue-200 rounded-xl p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleAdjustPhase('kihon', -1)}
                      disabled={finalKihon <= 0}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-blue-700 hover:bg-blue-100 active:bg-blue-200 disabled:opacity-25 cursor-pointer transition-colors"
                      title="Disminuir calificación de Kihon (-1%)"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustPhase('kihon', 1)}
                      disabled={finalKihon >= 100}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-blue-700 hover:bg-blue-100 active:bg-blue-200 disabled:opacity-25 cursor-pointer transition-colors"
                      title="Aumentar calificación de Kihon (+1%)"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-blue-600 font-medium mt-1.5 pt-1 border-t border-blue-100/60">
                <span>Base: {baseKihon}% ({kihonVals.length} Senseis)</span>
                {phaseAdjustments.kihon !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleAdjustPhase('kihon', -phaseAdjustments.kihon)}
                    className="text-[9px] text-blue-700 font-bold underline hover:text-blue-900 cursor-pointer"
                  >
                    Restablecer
                  </button>
                )}
              </div>
            </div>

            {/* KATA COLEGIADO */}
            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-800">Kata Colegiado</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Forma</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-purple-950 font-mono">{finalKata}%</span>
                    {phaseAdjustments.kata !== 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${phaseAdjustments.kata > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {phaseAdjustments.kata > 0 ? `+${phaseAdjustments.kata}%` : `${phaseAdjustments.kata}%`}
                      </span>
                    )}
                  </div>
                  {/* Flechitas arriba / abajo (tamaño óptimo para tablet) */}
                  <div className="flex items-center gap-1 bg-white border border-purple-200 rounded-xl p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleAdjustPhase('kata', -1)}
                      disabled={finalKata <= 0}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-purple-700 hover:bg-purple-100 active:bg-purple-200 disabled:opacity-25 cursor-pointer transition-colors"
                      title="Disminuir calificación de Kata (-1%)"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustPhase('kata', 1)}
                      disabled={finalKata >= 100}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-purple-700 hover:bg-purple-100 active:bg-purple-200 disabled:opacity-25 cursor-pointer transition-colors"
                      title="Aumentar calificación de Kata (+1%)"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-purple-600 font-medium mt-1.5 pt-1 border-t border-purple-100/60">
                <span>Base: {baseKata}% ({kataVals.length} Senseis)</span>
                {phaseAdjustments.kata !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleAdjustPhase('kata', -phaseAdjustments.kata)}
                    className="text-[9px] text-purple-700 font-bold underline hover:text-purple-900 cursor-pointer"
                  >
                    Restablecer
                  </button>
                )}
              </div>
            </div>

            {/* KUMITE COLEGIADO */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Kumite Colegiado</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Combate</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-amber-950 font-mono">{finalKumite}%</span>
                    {phaseAdjustments.kumite !== 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${phaseAdjustments.kumite > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {phaseAdjustments.kumite > 0 ? `+${phaseAdjustments.kumite}%` : `${phaseAdjustments.kumite}%`}
                      </span>
                    )}
                  </div>
                  {/* Flechitas arriba / abajo (tamaño óptimo para tablet) */}
                  <div className="flex items-center gap-1 bg-white border border-amber-200 rounded-xl p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleAdjustPhase('kumite', -1)}
                      disabled={finalKumite <= 0}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-amber-700 hover:bg-amber-100 active:bg-amber-200 disabled:opacity-25 cursor-pointer transition-colors"
                      title="Disminuir calificación de Kumite (-1%)"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustPhase('kumite', 1)}
                      disabled={finalKumite >= 100}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-amber-700 hover:bg-amber-100 active:bg-amber-200 disabled:opacity-25 cursor-pointer transition-colors"
                      title="Aumentar calificación de Kumite (+1%)"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-amber-600 font-medium mt-1.5 pt-1 border-t border-amber-100/60">
                <span>Base: {baseKumite}% ({kumiteVals.length} Senseis)</span>
                {phaseAdjustments.kumite !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleAdjustPhase('kumite', -phaseAdjustments.kumite)}
                    className="text-[9px] text-amber-700 font-bold underline hover:text-amber-900 cursor-pointer"
                  >
                    Restablecer
                  </button>
                )}
              </div>
            </div>

            {/* NOTA TOTAL COLEGIADA (Se calcula sola automáticamente) */}
            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-300 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900">Nota Total Colegiada</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${calculatedIsPassed ? 'bg-emerald-200/90 text-emerald-900' : 'bg-red-200 text-red-900'}`}>
                    {calculatedIsPassed ? 'Aprobado' : 'Pendiente'}
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-950 mt-1 font-mono">
                  {calculatedFinalScore}%
                </div>
              </div>
              <div className="text-[10px] text-emerald-800 font-medium mt-1.5 pt-1 border-t border-emerald-200">
                {hasAnyAdjustment
                  ? `Promedio auto: (${finalKihon} + ${finalKata} + ${finalKumite}) ÷ 3 | Ajuste neto: ${netAdjustment >= 0 ? `+${netAdjustment}%` : `${netAdjustment}%`}`
                  : `Promedio exacto automático de las 3 fases (${baseTechnicalScore}%)`}
              </div>
            </div>
          </div>

          {/* Barra Sobria de Oficialización del Dictamen */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#2D2E83] text-white flex items-center justify-center text-sm shadow-xs shrink-0">
                  🥋
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span>Dictamen Oficial</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${calculatedIsPassed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
                      {calculatedFinalScore}% — {calculatedIsPassed ? 'Aprobado' : 'Pendiente'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Promedio automático de las 3 fases ({finalKihon}% Kihon, {finalKata}% Kata, {finalKumite}% Kumite).
                  </p>
                </div>
              </div>

              {/* Botón Oficializar y Guardar Dictamen */}
              <div className="flex items-center gap-2 shrink-0">
                {hasAnyAdjustment && (
                  <button
                    type="button"
                    onClick={() => setPhaseAdjustments({ kihon: 0, kata: 0, kumite: 0 })}
                    className="h-10 px-3.5 text-xs text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-200/70 rounded-xl transition-all cursor-pointer"
                  >
                    Restablecer
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveConsolidatedWithAdjustment}
                  disabled={isSavingVerdict}
                  className="h-10 px-5 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isSavingVerdict ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Oficializar Dictamen</span>
                </button>
              </div>
            </div>

            {/* Observación / nota institucional opcional */}
            <div className="pt-2 border-t border-slate-200/80">
              <input
                type="text"
                value={martialAdjustmentReason}
                onChange={(e) => setMartialAdjustmentReason(e.target.value)}
                placeholder="Observación o nota institucional del dictamen (opcional)..."
                className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:ring-1 focus:ring-[#2D2E83] outline-hidden font-medium"
              />
            </div>

            {/* Feedback al guardar */}
            {saveFeedback && (
              <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                saveFeedback.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'
              }`}>
                {saveFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <EyeOff className="w-4 h-4 text-red-700" />}
                <span>{saveFeedback.message}</span>
              </div>
            )}
          </div>

          {/* 2. Sección Detallada: Puntos a Mejorar Desglosados en Viñetas (Kihon, Kata y Kumite) — Totalmente Editables para Shihan Roy */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Puntos Técnicos a Mejorar por Fase (Consenso del Tribunal)</span>
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full font-bold">
                  ✏️ Shihan Roy: puedes editar, añadir o quitar correcciones directamente aquí
                </span>
                <button
                  type="button"
                  onClick={handleSaveConsolidatedWithAdjustment}
                  disabled={isSavingVerdict}
                  className="px-3.5 py-1.5 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Guardar las correcciones modificadas en el dictamen oficial"
                >
                  {isSavingVerdict ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Guardar Dictamen</span>
                </button>
              </div>
            </div>

            {/* Leyenda de Origen de Observaciones (Exclusivo Shihan Roy / Dirección Técnica) */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 px-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950 font-medium shadow-2xs">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <span>🥋 Origen del Criterio:</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-amber-200 shadow-2xs">
                <span className="text-xs">⭐</span>
                <span className="font-semibold text-gray-700">Métrica de Estrellas (&lt;100%)</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-amber-200 shadow-2xs">
                <span className="text-xs">👤</span>
                <span className="font-semibold text-gray-700">Comentario de 1 Sensei</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-amber-200 shadow-2xs">
                <span className="text-xs">👤👤</span>
                <span className="font-semibold text-gray-700">Coincidencia de 2+ Senseis</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-amber-200 shadow-2xs">
                <span className="text-xs">⭐👤</span>
                <span className="font-semibold text-gray-700">Híbrido (Estrellas + Sensei)</span>
              </span>
              <span className="text-amber-800/80 text-[10px] ml-auto font-medium hidden sm:inline">
                (Las viñetas editadas se imprimirán exactamente así en el Certificado PDF)
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
                    {currentKihonBullets.map((bItem, bIdx) => {
                      const text = typeof bItem === 'string' ? bItem : bItem.text;
                      const badge = getOriginBadgeData(bItem);
                      const isEditingThis = editingBullet?.phase === 'kihon' && editingBullet?.index === bIdx;

                      if (isEditingThis) {
                        return (
                          <div key={bIdx} className="p-2 rounded-lg bg-blue-50 border border-blue-300 space-y-2">
                            <textarea
                              rows={3}
                              value={editingBullet.text}
                              onChange={(e) => setEditingBullet(prev => ({ ...prev, text: e.target.value }))}
                              className="w-full p-2 bg-white rounded border border-blue-200 text-xs text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium leading-relaxed"
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingBullet(null)}
                                className="px-2 py-0.5 rounded text-[10px] text-gray-600 hover:bg-gray-200 font-semibold cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateBullet('kihon', bIdx, editingBullet.text)}
                                className="px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={bIdx} className="group relative flex items-start gap-2 text-[11px] text-gray-800 leading-relaxed font-medium p-1 rounded-md hover:bg-blue-50/50 transition-colors">
                          <span
                            title={badge.label}
                            className="inline-flex items-center justify-center shrink-0 text-xs px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 shadow-2xs font-normal cursor-help select-none mt-0.5"
                          >
                            {badge.icon}
                          </span>
                          <span className="flex-1">{text}</span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 mt-0.5">
                            <button
                              type="button"
                              onClick={() => setEditingBullet({ phase: 'kihon', index: bIdx, text })}
                              className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-100 cursor-pointer"
                              title="Editar corrección"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBullet('kihon', bIdx)}
                              className="p-1 rounded text-slate-400 hover:text-red-700 hover:bg-red-100 cursor-pointer"
                              title="Eliminar esta viñeta"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Formulario para agregar nueva viñeta a Kihon */}
                    {addingBulletPhase === 'kihon' && (
                      <div className="p-2 rounded-lg bg-blue-50 border border-blue-300 space-y-2">
                        <textarea
                          rows={2}
                          value={newBulletText}
                          onChange={(e) => setNewBulletText(e.target.value)}
                          placeholder="Aspecto Técnico - ... : Escriba la corrección para Kihon..."
                          className="w-full p-2 bg-white rounded border border-blue-200 text-xs text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium leading-relaxed"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => { setAddingBulletPhase(null); setNewBulletText(''); }}
                            className="px-2 py-0.5 rounded text-[10px] text-gray-600 hover:bg-gray-200 font-semibold cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBullet('kihon', newBulletText)}
                            className="px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold cursor-pointer"
                          >
                            + Agregar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones de pie de tarjeta de Kihon */}
                <div className="flex items-center justify-between pt-1 border-t border-blue-100 text-[10px]">
                  <button
                    type="button"
                    onClick={() => { setAddingBulletPhase('kihon'); setNewBulletText(''); }}
                    className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar corrección</span>
                  </button>
                  {phaseBullets.kihon && (
                    <button
                      type="button"
                      onClick={() => handleResetPhaseBullets('kihon')}
                      className="text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1 cursor-pointer"
                      title="Restablecer a sugerencias automáticas"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Restablecer</span>
                    </button>
                  )}
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
                    {currentKataBullets.map((bItem, bIdx) => {
                      const text = typeof bItem === 'string' ? bItem : bItem.text;
                      const isKarategui = text.toLowerCase().includes('karategui') || text.toLowerCase().includes('cabello') || text.toLowerCase().includes('uniforme');
                      const badge = getOriginBadgeData(bItem);
                      const isEditingThis = editingBullet?.phase === 'kata' && editingBullet?.index === bIdx;

                      if (isEditingThis) {
                        return (
                          <div key={bIdx} className="p-2 rounded-lg bg-purple-50 border border-purple-300 space-y-2">
                            <textarea
                              rows={3}
                              value={editingBullet.text}
                              onChange={(e) => setEditingBullet(prev => ({ ...prev, text: e.target.value }))}
                              className="w-full p-2 bg-white rounded border border-purple-200 text-xs text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-purple-500 font-medium leading-relaxed"
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingBullet(null)}
                                className="px-2 py-0.5 rounded text-[10px] text-gray-600 hover:bg-gray-200 font-semibold cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateBullet('kata', bIdx, editingBullet.text)}
                                className="px-2.5 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={bIdx}
                          className={`group relative flex items-start gap-2 text-[11px] leading-relaxed p-1 rounded-md transition-colors ${
                            isKarategui ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200/70' : 'text-gray-800 font-medium hover:bg-purple-50/50'
                          }`}
                        >
                          <span
                            title={badge.label}
                            className="inline-flex items-center justify-center shrink-0 text-xs px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 shadow-2xs font-normal cursor-help select-none mt-0.5"
                          >
                            {badge.icon}
                          </span>
                          <span className="flex-1">{text}</span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 mt-0.5">
                            <button
                              type="button"
                              onClick={() => setEditingBullet({ phase: 'kata', index: bIdx, text })}
                              className="p-1 rounded text-slate-500 hover:text-purple-700 hover:bg-purple-100 cursor-pointer"
                              title="Editar corrección"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBullet('kata', bIdx)}
                              className="p-1 rounded text-slate-400 hover:text-red-700 hover:bg-red-100 cursor-pointer"
                              title="Eliminar esta viñeta"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Formulario para agregar nueva viñeta a Kata */}
                    {addingBulletPhase === 'kata' && (
                      <div className="p-2 rounded-lg bg-purple-50 border border-purple-300 space-y-2">
                        <textarea
                          rows={2}
                          value={newBulletText}
                          onChange={(e) => setNewBulletText(e.target.value)}
                          placeholder="Aspecto Técnico - Kata ... : Escriba la corrección para Kata..."
                          className="w-full p-2 bg-white rounded border border-purple-200 text-xs text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-purple-500 font-medium leading-relaxed"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => { setAddingBulletPhase(null); setNewBulletText(''); }}
                            className="px-2 py-0.5 rounded text-[10px] text-gray-600 hover:bg-gray-200 font-semibold cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBullet('kata', newBulletText)}
                            className="px-2.5 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold cursor-pointer"
                          >
                            + Agregar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones de pie de tarjeta de Kata */}
                <div className="flex items-center justify-between pt-1 border-t border-purple-100 text-[10px]">
                  <button
                    type="button"
                    onClick={() => { setAddingBulletPhase('kata'); setNewBulletText(''); }}
                    className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar corrección</span>
                  </button>
                  {phaseBullets.kata && (
                    <button
                      type="button"
                      onClick={() => handleResetPhaseBullets('kata')}
                      className="text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1 cursor-pointer"
                      title="Restablecer a sugerencias automáticas"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Restablecer</span>
                    </button>
                  )}
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
                    {currentKumiteBullets.map((bItem, bIdx) => {
                      const text = typeof bItem === 'string' ? bItem : bItem.text;
                      const badge = getOriginBadgeData(bItem);
                      const isEditingThis = editingBullet?.phase === 'kumite' && editingBullet?.index === bIdx;

                      if (isEditingThis) {
                        return (
                          <div key={bIdx} className="p-2 rounded-lg bg-amber-50 border border-amber-300 space-y-2">
                            <textarea
                              rows={3}
                              value={editingBullet.text}
                              onChange={(e) => setEditingBullet(prev => ({ ...prev, text: e.target.value }))}
                              className="w-full p-2 bg-white rounded border border-amber-200 text-xs text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-medium leading-relaxed"
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingBullet(null)}
                                className="px-2 py-0.5 rounded text-[10px] text-gray-600 hover:bg-gray-200 font-semibold cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateBullet('kumite', bIdx, editingBullet.text)}
                                className="px-2.5 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={bIdx} className="group relative flex items-start gap-2 text-[11px] text-gray-800 leading-relaxed font-medium p-1 rounded-md hover:bg-amber-50/50 transition-colors">
                          <span
                            title={badge.label}
                            className="inline-flex items-center justify-center shrink-0 text-xs px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 shadow-2xs font-normal cursor-help select-none mt-0.5"
                          >
                            {badge.icon}
                          </span>
                          <span className="flex-1">{text}</span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 mt-0.5">
                            <button
                              type="button"
                              onClick={() => setEditingBullet({ phase: 'kumite', index: bIdx, text })}
                              className="p-1 rounded text-slate-500 hover:text-amber-800 hover:bg-amber-100 cursor-pointer"
                              title="Editar corrección"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBullet('kumite', bIdx)}
                              className="p-1 rounded text-slate-400 hover:text-red-700 hover:bg-red-100 cursor-pointer"
                              title="Eliminar esta viñeta"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Formulario para agregar nueva viñeta a Kumite */}
                    {addingBulletPhase === 'kumite' && (
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-300 space-y-2">
                        <textarea
                          rows={2}
                          value={newBulletText}
                          onChange={(e) => setNewBulletText(e.target.value)}
                          placeholder="Aspecto Técnico - Combate ... : Escriba la corrección para Kumite..."
                          className="w-full p-2 bg-white rounded border border-amber-200 text-xs text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-medium leading-relaxed"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => { setAddingBulletPhase(null); setNewBulletText(''); }}
                            className="px-2 py-0.5 rounded text-[10px] text-gray-600 hover:bg-gray-200 font-semibold cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddBullet('kumite', newBulletText)}
                            className="px-2.5 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold cursor-pointer"
                          >
                            + Agregar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones de pie de tarjeta de Kumite */}
                <div className="flex items-center justify-between pt-1 border-t border-amber-100 text-[10px]">
                  <button
                    type="button"
                    onClick={() => { setAddingBulletPhase('kumite'); setNewBulletText(''); }}
                    className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar corrección</span>
                  </button>
                  {phaseBullets.kumite && (
                    <button
                      type="button"
                      onClick={() => handleResetPhaseBullets('kumite')}
                      className="text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1 cursor-pointer"
                      title="Restablecer a sugerencias automáticas"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Restablecer</span>
                    </button>
                  )}
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
                  {currentAspectosBullets.map((bItem, bIdx) => {
                    const text = typeof bItem === 'string' ? bItem : bItem.text;
                    const badge = getOriginBadgeData(bItem);
                    return (
                      <div key={bIdx} className="flex items-start gap-2 text-[11px] text-gray-800 leading-relaxed font-medium">
                        <span
                          title={badge.label}
                          className="inline-flex items-center justify-center shrink-0 text-xs px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 shadow-2xs font-normal cursor-help select-none mt-0.5"
                        >
                          {badge.icon}
                        </span>
                        <span className="flex-1">{text}</span>
                      </div>
                    );
                  })}
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

              {/* Renderizar cada viñeta/enunciado de manera ejecutiva con su respectivo badge de origen */}
              <div className="space-y-1.5 pt-1">
                {(consolidation.aiAnalysis || consolidation.observations || 'Evaluación técnica completada.')
                  .split('\n')
                  .filter(line => line && line.trim().length > 0)
                  .map((line, lIdx) => {
                    const cleanLine = line
                      .replace(/^\*\s*/, '')
                      .replace(/^ajuste t[eé]cnico:?\s*/i, '')
                      .replace(/^observaciones directas del [^:]+:?\s*/i, '')
                      .replace(/^observaciones directas de [^:]+:?\s*/i, '')
                      .replace(/\s*\([^)]*tribunal[^)]*\):?/gi, ':')
                      .replace(/\s*\([^)]*profesores[^)]*\):?/gi, ':')
                      .trim();

                    if (!cleanLine) return null;

                    const isWarning = cleanLine.toLowerCase().includes('karategui') || cleanLine.toLowerCase().includes('corrección') || cleanLine.toLowerCase().includes('falla grave') || cleanLine.toLowerCase().includes('deficiencia crítica');
                    const isMissing = cleanLine.toLowerCase().includes('carencias') || cleanLine.toLowerCase().includes('10/10') || cleanLine.toLowerCase().includes('100%') || cleanLine.toLowerCase().includes('no aprobación');

                    // Buscar coincidencia en allPhaseBullets para obtener la clasificación exacta
                    const lineNorm = cleanLine.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const matchingBullet = allPhaseBullets.find(b => {
                      const bNorm = (b.text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                      return bNorm.includes(lineNorm.slice(0, 25)) || lineNorm.includes(bNorm.slice(0, 25));
                    });
                    const badgeInfo = matchingBullet ? getOriginBadgeData(matchingBullet) : getOriginBadgeData(cleanLine);

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
                        <span
                          title={badgeInfo.label}
                          className="inline-flex items-center justify-center shrink-0 text-xs px-1.5 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs font-normal cursor-help select-none mt-0.5"
                        >
                          {badgeInfo.icon}
                        </span>
                        <span className="flex-1">{cleanLine}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        
          {/* Tabla Comparativa de Votación por Técnica (Estrellas de cada Sensei) */}
          {syllabusTechniques.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Votación de Estrellas por Técnica (Tribunal Evaluador)</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-medium">
                  {evalItems.length} Senseis evaluando
                </span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase font-black text-slate-500 bg-slate-100/70">
                      <th className="py-2 px-3">Fase</th>
                      <th className="py-2 px-3">Técnica Evaluada</th>
                      {evalItems.map(e => (
                        <th key={e.key} className="py-2 px-3 text-center">
                          🥋 {e.evaluator.name.split(' ')[0]}
                        </th>
                      ))}
                      <th className="py-2 px-3 text-right">Promedio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {syllabusTechniques.map(t => {
                      const grp = (t.group || t.phase || 'kihon').toUpperCase();
                      const vals = evalItems
                        .map(e => e.evalRecord?.techniqueAverages?.[t.id])
                        .filter(v => typeof v === 'number');
                      const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2 px-3">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              grp === 'KIHON' ? 'bg-blue-100 text-blue-800' :
                              grp === 'KATA' ? 'bg-purple-100 text-purple-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {grp}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-800">
                            {t.name}
                          </td>
                          {evalItems.map(e => {
                            const score = e.evalRecord?.techniqueAverages?.[t.id];
                            const stars = score !== undefined && score !== null ? Math.max(1, Math.min(5, Math.round((score / 100) * 5))) : null;

                            return (
                              <td key={e.key} className="py-2 px-3 text-center">
                                {stars !== null ? (
                                  <div className="inline-flex items-center gap-1.5">
                                    <span className="text-amber-500 font-bold tracking-tight text-xs">
                                      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                                    </span>
                                    <span className="font-mono font-bold text-slate-700 text-[11px]">
                                      {score}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 font-mono text-xs">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2 px-3 text-right">
                            {avg !== null ? (
                              <span className={`font-mono font-black text-xs ${avg >= 70 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {avg}%
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
                  const stars = score !== undefined && score !== null ? Math.max(1, Math.min(5, Math.round((score / 100) * 5))) : null;

                  return (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-lg bg-white border border-gray-200 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="truncate flex-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 mr-1.5">
                          {grp}
                        </span>
                        <span className="text-[11px] font-bold text-gray-800">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {stars !== null ? (
                          <>
                            <span className="text-amber-500 font-bold tracking-tight text-xs" title={`${stars} de 5 estrellas`}>
                              {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
                            </span>
                            <span className={`text-xs font-mono font-black ${
                              score >= 70 ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {score}%
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">—</span>
                        )}
                      </div>
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

      const aspirantInfo = (progressData?.aspirants || []).find(a => String(a.studentId) === sId)
        || (call?.aspirants || []).find(a => String(a.studentId) === sId);

      const currentRank = st.currentRank || aspirantInfo?.currentRank || '9° Kyu (Cinta Amarilla)';

      const targetRank = cons?.promotedRank
        || st.targetRank
        || aspirantInfo?.targetRank
        || getNextRank(currentRank)
        || call?.syllabusSnapshots?.[0]?.targetRank
        || '8° Kyu (Cinta Naranja)';

      const examDate = call?.examDate || new Date().toLocaleDateString('es-CR');

      const kihonVals = evalItems.map(e => e.evalRecord?.phaseAverages?.kihon).filter(v => typeof v === 'number');
      const kataVals = evalItems.map(e => e.evalRecord?.phaseAverages?.kata).filter(v => typeof v === 'number');
      const kumiteVals = evalItems.map(e => e.evalRecord?.phaseAverages?.kumite).filter(v => typeof v === 'number');
      const totalVals = evalItems.map(e => e.evalRecord?.percentage).filter(v => typeof v === 'number' && v > 0);

      const kScore = cons?.phaseScores?.kihon !== undefined
        ? Number(cons.phaseScores.kihon)
        : (kihonVals.length ? Math.round(kihonVals.reduce((a, b) => a + b, 0) / kihonVals.length) : (cons?.finalGrade || 80));
      const kaScore = cons?.phaseScores?.kata !== undefined
        ? Number(cons.phaseScores.kata)
        : (kataVals.length ? Math.round(kataVals.reduce((a, b) => a + b, 0) / kataVals.length) : (cons?.finalGrade || 80));
      const kuScore = cons?.phaseScores?.kumite !== undefined
        ? Number(cons.phaseScores.kumite)
        : (kumiteVals.length ? Math.round(kumiteVals.reduce((a, b) => a + b, 0) / kumiteVals.length) : (cons?.finalGrade || 80));

      // El promedio colegiado final es estrictamente el promedio automático de las 3 fases
      const phaseScoresList = [kScore, kaScore, kuScore].filter(v => typeof v === 'number' && v > 0);
      const finalScore = cons?.finalGrade !== undefined
        ? Number(cons.finalGrade)
        : (phaseScoresList.length > 0
            ? Math.round(phaseScoresList.reduce((a, b) => a + b, 0) / phaseScoresList.length)
            : (totalVals.length ? Math.round(totalVals.reduce((a, b) => a + b, 0) / totalVals.length) : 80));

      const allTechs = progressData?.syllabusTechniques || [];
      const kihonTechScores = allTechs
        .filter(t => (t.group || t.phase || 'kihon').toLowerCase() === 'kihon')
        .map(t => {
          const vals = evalItems.map(e => e.evalRecord?.techniqueAverages?.[t.id]).filter(v => typeof v === 'number');
          const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
          return { id: t.id, name: t.name, score: avg };
        });

      const kataTechScores = allTechs
        .filter(t => (t.group || t.phase || '').toLowerCase() === 'kata')
        .map(t => {
          const vals = evalItems.map(e => e.evalRecord?.techniqueAverages?.[t.id]).filter(v => typeof v === 'number');
          const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
          return { id: t.id, name: t.name, score: avg };
        });

      const kumiteTechScores = allTechs
        .filter(t => (t.group || t.phase || '').toLowerCase() === 'kumite')
        .map(t => {
          const vals = evalItems.map(e => e.evalRecord?.techniqueAverages?.[t.id]).filter(v => typeof v === 'number');
          const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
          return { id: t.id, name: t.name, score: avg };
        });

      const kihonRawList = evalItems.map(e => ({ evaluatorName: e.evaluator.name, note: e.evalRecord?.phaseNotes?.kihon })).filter(i => i.note);
      const kumiteRawList = evalItems.map(e => ({ evaluatorName: e.evaluator.name, note: e.evalRecord?.phaseNotes?.kumite })).filter(i => i.note);

      // Priorizar viñetas personalizadas/editadas por Shihan Roy si existen
      const customKihon = cons?.customPhaseBullets?.kihon || progressData?.consolidationsByStudent?.[sId]?.customPhaseBullets?.kihon;
      const customKata = cons?.customPhaseBullets?.kata || progressData?.consolidationsByStudent?.[sId]?.customPhaseBullets?.kata;
      const customKumite = cons?.customPhaseBullets?.kumite || progressData?.consolidationsByStudent?.[sId]?.customPhaseBullets?.kumite;

      const resolvedKihonNotes = (customKihon && customKihon.length > 0)
        ? customKihon.map(b => (typeof b === 'string' ? b : b.text)).join('\n')
        : synthesizePhaseBulletsWithAI({
            phase: 'kihon',
            notesList: kihonRawList,
            techniqueScores: kihonTechScores,
            phaseAverage: kScore,
            targetRank
          }).map(b => b.text).join('\n');

      let katasPayload = [];
      let resolvedKataNotes = '';

      if (customKata && customKata.length > 0) {
        resolvedKataNotes = customKata.map(b => (typeof b === 'string' ? b : b.text)).join('\n');
        katasPayload = [
          { name: kataTechScores[0]?.name || getKataForRank(targetRank), score: kaScore, text: resolvedKataNotes }
        ];
      } else if (kataTechScores.length > 1) {
        // Kata 1
        const k1 = kataTechScores[0];
        const k1RawList = evalItems.map(e => {
          const note = e.evalRecord?.phaseNotes?.kata || e.evalRecord?.phaseNotes?.kata_1 || e.evalRecord?.observations?.[k1.id];
          return { evaluatorName: e.evaluator.name, note };
        }).filter(i => i.note);
        const k1Bullets = synthesizePhaseBulletsWithAI({
          phase: 'kata',
          notesList: k1RawList,
          techniqueScores: [k1],
          phaseAverage: k1.score || kaScore,
          targetRank,
          specificKataName: k1.name
        }).map(b => b.text).join('\n');

        // Kata 2
        const k2 = kataTechScores[1];
        const k2RawList = evalItems.map(e => {
          const note = e.evalRecord?.phaseNotes?.kata_2 || e.evalRecord?.observations?.[k2.id];
          return { evaluatorName: e.evaluator.name, note };
        }).filter(i => i.note);
        const k2Bullets = synthesizePhaseBulletsWithAI({
          phase: 'kata',
          notesList: k2RawList,
          techniqueScores: [k2],
          phaseAverage: k2.score || kaScore,
          targetRank,
          specificKataName: k2.name
        }).map(b => b.text).join('\n');

        katasPayload = [
          { name: k1.name, score: k1.score || kaScore, text: k1Bullets },
          { name: k2.name, score: k2.score || kaScore, text: k2Bullets }
        ];
        resolvedKataNotes = `${k1Bullets}\n\n${k2Bullets}`;
      } else {
        const kataRawList = evalItems.map(e => ({ evaluatorName: e.evaluator.name, note: e.evalRecord?.phaseNotes?.kata })).filter(i => i.note);
        resolvedKataNotes = synthesizePhaseBulletsWithAI({
          phase: 'kata',
          notesList: kataRawList,
          techniqueScores: kataTechScores,
          phaseAverage: kaScore,
          targetRank
        }).map(b => b.text).join('\n');
        katasPayload = [
          { name: kataTechScores[0]?.name || getKataForRank(targetRank), score: kaScore, text: resolvedKataNotes }
        ];
      }

      const resolvedKumiteNotes = (customKumite && customKumite.length > 0)
        ? customKumite.map(b => (typeof b === 'string' ? b : b.text)).join('\n')
        : synthesizePhaseBulletsWithAI({
            phase: 'kumite',
            notesList: kumiteRawList,
            techniqueScores: kumiteTechScores,
            phaseAverage: kuScore,
            targetRank
          }).map(b => b.text).join('\n');

      // Aspectos Positivos: Únicamente lo que el sensei colocó al agregar al atleta uno a uno
      const positiveText = (st?.positiveAspects || '').trim();

      const baseTechnical = finalScore;
      const adj = Number(cons?.martialAdjustment) || 0;
      const adjustedFinalScore = Math.min(100, Math.max(0, Math.round(baseTechnical + adj)));
      const isWrittenExempt = isKyuExemptFromWrittenExam(targetRank || st?.currentRank);
      const writtenScore = isWrittenExempt ? null : 95;

      await generateTechnicalExamCertificatePDF({
        studentName,
        dojoName,
        dojoSensei,
        targetRank,
        examDate,
        kihonScore: kScore,
        kataScore: kaScore,
        kumiteScore: kuScore,
        writtenScore,
        technicalScore: baseTechnical,
        finalScore: adjustedFinalScore,
        martialAdjustment: adj,
        martialAdjustmentReason: cons?.martialAdjustmentReason || '',
        isPassed: adjustedFinalScore >= 70,
        kihonText: resolvedKihonNotes,
        kataText: resolvedKataNotes,
        kumiteText: resolvedKumiteNotes,
        katas: katasPayload,
        kata1Name: katasPayload[0]?.name,
        kata1Score: katasPayload[0]?.score,
        kata1Text: katasPayload[0]?.text,
        kata2Name: katasPayload[1]?.name,
        kata2Score: katasPayload[1]?.score,
        kata2Text: katasPayload[1]?.text,
        positiveText,
        finalComments: (
          cons?.finalComments ||
          progressData?.consolidations?.[sId]?.finalComments ||
          evalItems.find(e => e.evalRecord?.finalComments)?.evalRecord?.finalComments ||
          evalItems.find(e => e.evalRecord?.phaseNotes?.promedio_final)?.evalRecord?.phaseNotes?.promedio_final ||
          ''
        ).trim(),
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
      // Optimización de rendimiento y batería: pausar si la pestaña está en segundo plano
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
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
                      const sId = String(id);
                      const fromProps = (students || []).find(s => String(s._id || s.id) === sId);
                      const fromAspirants = (progressData?.aspirants || []).find(a => String(a.studentId) === sId)
                        || (call?.aspirants || []).find(a => String(a.studentId) === sId);
                      const fromCons = progressData?.consolidationsByStudent?.[sId];

                      if (!fromProps && !fromAspirants) return null;

                      const currentRank = fromAspirants?.currentRank || fromProps?.currentRank || '10° Kyu (Cinta Blanca)';
                      const targetRank = fromCons?.promotedRank
                        || fromAspirants?.targetRank
                        || fromProps?.targetRank
                        || getNextRank(currentRank)
                        || call?.syllabusSnapshots?.[0]?.targetRank
                        || '8° Kyu (Cinta Naranja)';
                      const positiveAspects = (fromProps?.positiveAspects || fromAspirants?.positiveAspects || '').trim();

                      return {
                        ...(fromProps || {}),
                        _id: sId,
                        id: sId,
                        name: fromProps?.name || fromAspirants?.studentName || 'Estudiante',
                        currentRank,
                        targetRank,
                        positiveAspects
                      };
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
                                const cons = progressData?.consolidationsByStudent?.[sId] || null;

                                // Promedio colegiado entre las tres fases finales (Kihon, Kata y Kumite) para este aspirante
                                const stKihonVals = evaluatorsProgress
                                  .map(item => item.evaluationsByStudent[sId]?.phaseAverages?.kihon)
                                  .filter(v => typeof v === 'number');
                                const stKataVals = evaluatorsProgress
                                  .map(item => item.evaluationsByStudent[sId]?.phaseAverages?.kata)
                                  .filter(v => typeof v === 'number');
                                const stKumiteVals = evaluatorsProgress
                                  .map(item => item.evaluationsByStudent[sId]?.phaseAverages?.kumite)
                                  .filter(v => typeof v === 'number');

                                const stKihonAvg = stKihonVals.length ? (stKihonVals.reduce((a, b) => a + b, 0) / stKihonVals.length) : null;
                                const stKataAvg = stKataVals.length ? (stKataVals.reduce((a, b) => a + b, 0) / stKataVals.length) : null;
                                const stKumiteAvg = stKumiteVals.length ? (stKumiteVals.reduce((a, b) => a + b, 0) / stKumiteVals.length) : null;

                                const stPhaseAvgs = [stKihonAvg, stKataAvg, stKumiteAvg].filter(v => v !== null);

                                const avg = stPhaseAvgs.length > 0
                                  ? Math.round(stPhaseAvgs.reduce((a, b) => a + b, 0) / stPhaseAvgs.length)
                                  : (() => {
                                      const studentGrades = evaluatorsProgress
                                        .map(item => item.evaluationsByStudent[sId]?.percentage)
                                        .filter(p => typeof p === 'number' && p > 0);
                                      return studentGrades.length > 0
                                        ? Math.round(studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length)
                                        : null;
                                    })();

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
                                          <div className="inline-flex flex-col items-center gap-0.5">
                                            <span className={`px-2 py-0.5 rounded-lg text-xs ${
                                              (cons?.finalGrade || avg) >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                              {cons?.finalGrade || avg}%
                                            </span>
                                            {cons?.martialAdjustment ? (
                                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                                🥋 {cons.martialAdjustment > 0 ? `+${cons.martialAdjustment}%` : `${cons.martialAdjustment}%`}
                                              </span>
                                            ) : null}
                                          </div>
                                        ) : (
                                          <span className="text-gray-300">—</span>
                                        )}
                                      </td>
                                    </tr>

                                    {isExpanded && (
                                      <tr className="bg-slate-50/95 border-b border-indigo-200 animate-in fade-in duration-150">
                                        <td colSpan={evaluatorsProgress.length + 3} className="p-3 sm:p-5">
                                          <StudentMonitorDrawer
                                            call={call}
                                            student={st}
                                            evaluatorsProgress={evaluatorsProgress}
                                            syllabusTechniques={progressData?.syllabusTechniques || []}
                                            consolidation={progressData?.consolidationsByStudent?.[sId] || null}
                                            onDownloadPdf={handleDownloadCertificateForStudent}
                                            isDownloading={downloadingStudentId === sId}
                                            onRefresh={() => fetchProgress(true)}
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
