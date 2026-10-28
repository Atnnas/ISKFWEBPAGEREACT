"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Users, 
  Award, 
  BookOpen, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  Shield, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Info,
  X,
  UserCheck,
  Star,
  StarHalf,
  Eye,
  Filter,
  Check,
  Camera,
  Upload,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCheck,
  Save,
  Flame,
  Repeat,
  ArrowRightLeft,
  Database,
  MessageSquare,
  SlidersHorizontal,
  Bot,
  UserPlus,
  FileCheck,
  Clock,
  Copy,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  GripVertical,
  UserMinus,
  ShieldAlert
} from 'lucide-react';
import { 
  getStudentsByDojo, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  getDojosForSelector,
  toggleStudentExamPromotion
} from '../../lib/actions/students';
import { getExamSyllabi } from '../../lib/actions/syllabi';
import { 
  getTechnicalEvaluationsByDojo, 
  saveTatamiBatchScores,
  getAllSenseiEvaluationsForTatami,
  synthesizeSenseiObservationsWithAI,
  saveConsolidatedVerdict,
  getConsolidatedEvaluationsByDojo,
  createTechnicalExamCall,
  getExamCallsByDojo,
  closeExamCall,
  reopenExamCall,
  deleteExamCall,
  getStudentsReadyForExam,
  saveCallSchedules,
  toggleStudentPromotionForCall,
  updateExamCallSchedulesAndEvaluators,
  updateExamCallMaxPerTanda
} from '../../lib/actions/technicalExams';
import { getExamCostConfig } from '../../lib/actions/examCosts';
import { generateTechnicalExamCertificatePDF } from '../../lib/pdf/technicalExamCertificateGenerator';
import ConfirmModal from '../ui/ConfirmModal';
import AlertModal from '../ui/AlertModal';
import TechnicalExamEvaluatorCore from '../examinations/TechnicalExamEvaluatorCore';
import TribunalProgressMonitor from './TribunalProgressMonitor';
import { DEFAULT_TECHNICAL_ASPECTS } from '../../lib/constants/technicalAspects';
import { handleBulletInputChange, handleBulletKeyDown } from '../../lib/utils/bulletNotes';

function pointToRubric(pointStr, idx, category, defaultIcon = '🎯') {
  let text = '';
  if (typeof pointStr === 'object' && pointStr !== null) {
    text = String(pointStr.text || pointStr.point || pointStr.rawText || '').trim();
  } else {
    text = String(pointStr || '').trim();
  }
  if (!text) return null;

  // ID estable basado en categoría, índice y texto
  const slug = text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, '_')
    .substring(0, 30);
  const id = `rub_${category}_${slug}`;

  let label = text;
  let desc = text;
  if (text.includes(':')) {
    const parts = text.split(':');
    label = parts[0].trim();
    desc = parts.slice(1).join(':').trim() || label;
  }
  let icon = defaultIcon;

  const lower = text.toLowerCase();

  // Detección de icono contextual según temática marcial
  if (lower.includes('equilibrio') || lower.includes('balance') || lower.includes('estabilidad')) {
    icon = '⚖️';
  } else if (lower.includes('velocidad') || lower.includes('speed') || lower.includes('rapidez')) {
    icon = '⚡';
  } else if (lower.includes('fuerza') || lower.includes('potencia') || lower.includes('strength')) {
    icon = '💪';
  } else if (lower.includes('tiempo') || lower.includes('timing') || lower.includes('sincroniz') || lower.includes('ritmo')) {
    icon = '⏱️';
  } else if (lower.includes('respiración') || lower.includes('respiracion') || lower.includes('breathing')) {
    icon = '💨';
  } else if (lower.includes('transición') || lower.includes('transicion') || lower.includes('transition') || lower.includes('giro') || lower.includes('desplazamiento')) {
    icon = '🔄';
  } else if (lower.includes('conformidad') || lower.includes('conformance') || lower.includes('consistencia')) {
    icon = '📜';
  } else if (lower.includes('kime') || lower.includes('enfoque') || lower.includes('focus') || lower.includes('kiai')) {
    icon = '🔥';
  } else if (lower.includes('dedo') || lower.includes('apreta') || lower.includes('puño') || lower.includes('tsuki') || lower.includes('zuki') || lower.includes('golpe')) {
    icon = '👊';
  } else if (lower.includes('angulación') || lower.includes('codo') || lower.includes('bloqueo') || lower.includes('uke') || lower.includes('barai') || lower.includes('defensa')) {
    icon = '🛡️';
  } else if (lower.includes('patada') || lower.includes('geri') || lower.includes('pie base') || lower.includes('koshi') || lower.includes('hikiashi')) {
    icon = '🦶';
  } else if (lower.includes('zenkutsu') || lower.includes('kokutsu') || lower.includes('kiba') || lower.includes('postura') || lower.includes('dachi') || lower.includes('stance') || lower.includes('paso')) {
    icon = '🦵';
  } else if (lower.includes('tecnica') || lower.includes('técnica') || lower.includes('technique') || lower.includes('waza') || lower.includes('hikite') || lower.includes('cadera') || lower.includes('hanmi')) {
    icon = '🥋';
  } else if (lower.includes('tronco') || lower.includes('hombro') || lower.includes('vista')) {
    icon = '🧍';
  } else if (lower.includes('saludo') || lower.includes('seiretsu') || lower.includes('seiza') || lower.includes('mokuso') || lower.includes('rei')) {
    icon = '⛩️';
  } else if (lower.includes('comando') || lower.includes('orden')) {
    icon = '⚡';
  } else if (lower.includes('dojo kun') || lower.includes('disciplina') || lower.includes('etiqueta')) {
    icon = '📜';
  }

  return { id, label, desc, icon, rawText: text };
}

export function generateExamTechniques(syllabus) {
  if (!syllabus) return [];

  const aspects = Array.isArray(syllabus.technicalAspects) ? syllabus.technicalAspects : [];
  const techniques = Array.isArray(syllabus.techniques) ? syllabus.techniques : [];

  const tsukiAspect = aspects.find(a => a.category === 'tsuki');
  const ukeAspect = aspects.find(a => a.category === 'uke');
  const dachiAspect = aspects.find(a => a.category === 'dachi');
  const geriAspect = aspects.find(a => a.category === 'geri');

  const items = [];

  // =========================================================================
  // 1. TÉCNICAS OFICIALES REGISTRADAS EN LA BASE DE DATOS (Kihon, Kumite, Kata)
  // =========================================================================
  techniques.forEach((tech, idx) => {
    let phase = tech.group || 'kihon';
    let phaseLabel = '1. KIHON (Técnicas Básicas)';
    if (phase === 'kumite') phaseLabel = '2. YAKUSOKU-KUMITE';
    if (phase === 'kata') phaseLabel = '3. KATA (Forma Oficial)';

    let rubrics = [];
    const techNameLower = (tech.name || '').toLowerCase();

    if (phase === 'kihon') {
      if (techNameLower.includes('zuki') || techNameLower.includes('tsuki') || techNameLower.includes('chudan') || techNameLower.includes('jodan') || techNameLower.includes('puño') || techNameLower.includes('golpe')) {
        // Mapea dinámicamente TODOS los puntos del aspecto Tsuki Waza desde MongoDB (incluyendo opciones agregadas)
        const tsukiRubrics = (tsukiAspect?.points || []).map((p, pIdx) => pointToRubric(p, pIdx, 'tsuki', '👊')).filter(Boolean);
        const dachiRubric = dachiAspect?.points?.[0] ? pointToRubric(dachiAspect.points[0], 0, 'dachi', '🦵') : null;

        rubrics = [...tsukiRubrics];
        if (dachiRubric) rubrics.push(dachiRubric);
      } else if (techNameLower.includes('uke') || techNameLower.includes('barai') || techNameLower.includes('bloqueo')) {
        // Mapea dinámicamente TODOS los puntos del aspecto Uke Waza desde MongoDB
        const ukeRubrics = (ukeAspect?.points || []).map((p, pIdx) => pointToRubric(p, pIdx, 'uke', '🛡️')).filter(Boolean);
        const dachiRubric = dachiAspect?.points?.[1] ? pointToRubric(dachiAspect.points[1], 1, 'dachi', '🦵') : null;

        rubrics = [...ukeRubrics];
        if (dachiRubric) rubrics.push(dachiRubric);
      } else if (techNameLower.includes('geri') || techNameLower.includes('patada')) {
        // Mapea dinámicamente TODOS los puntos del aspecto Geri Waza desde MongoDB
        const geriRubrics = (geriAspect?.points || []).map((p, pIdx) => pointToRubric(p, pIdx, 'geri', '🦶')).filter(Boolean);
        const dachiRubric = dachiAspect?.points?.[0] ? pointToRubric(dachiAspect.points[0], 0, 'dachi', '🦵') : null;

        rubrics = [...geriRubrics];
        if (dachiRubric) rubrics.push(dachiRubric);
      } else {
        const dachiRubrics = (dachiAspect?.points || []).map((p, pIdx) => pointToRubric(p, pIdx, 'dachi', '🦵')).filter(Boolean);
        rubrics = dachiRubrics.length > 0 ? dachiRubrics : [
          pointToRubric('Precisión Técnica: Mecánica y trayectoria', 0, 'gen', '🎯'),
          pointToRubric('Postura y Estabilidad: Base firme sin paso en falso', 1, 'gen', '🦵'),
          pointToRubric('Kime y Enfoque: Respiración, cadera y punto de impacto', 2, 'gen', '⚡')
        ].filter(Boolean);
      }
    } else if (phase === 'kumite') {
      const kumiteAspect = aspects.find(a => (a.category || a.id || '').toLowerCase().includes('kumite'));
      if (kumiteAspect && Array.isArray(kumiteAspect.points)) {
        rubrics = kumiteAspect.points.map((p, pIdx) => pointToRubric(p, pIdx, 'kumite', '⚔️')).filter(Boolean);
      } else {
        const defaultKumite = DEFAULT_TECHNICAL_ASPECTS.find(a => a.category === 'kumite');
        rubrics = (defaultKumite?.points || []).map((p, pIdx) => pointToRubric(p, pIdx, 'kumite', '⚔️')).filter(Boolean);
      }
    } else if (phase === 'kata') {
      const kataAspect = aspects.find(a => (a.category || a.id || '').toLowerCase().includes('kata'));
      if (kataAspect && Array.isArray(kataAspect.points)) {
        rubrics = kataAspect.points.map((p, pIdx) => pointToRubric(p, pIdx, 'kata', '📜')).filter(Boolean);
      } else {
        const defaultKata = DEFAULT_TECHNICAL_ASPECTS.find(a => a.category === 'kata');
        rubrics = (defaultKata?.points || []).map((p, pIdx) => pointToRubric(p, pIdx, 'kata', '📜')).filter(Boolean);
      }
    }

    items.push({
      id: tech.id || `tech-eval-${idx}`,
      phase,
      phaseLabel,
      name: tech.name,
      subname: tech.notes || `${tech.direction || 'Mae'} • ${tech.stance || 'Zenkutsu Dachi'}`,
      stance: tech.stance || 'Zenkutsu Dachi',
      direction: tech.direction || 'Adelante (Mae)',
      repetitions: tech.repetitions || 3,
      tripType: tech.tripType || 'ida_y_vuelta',
      command: tech.notes || `Ejecutar ${tech.name} con ritmo oficial`,
      embusen: tech.embusen || (tech.group === 'kata' ? 'Embusen Oficial ISKF' : ''),
      rubrics
    });
  });

  // =========================================================================
  // 2. ASPECTOS GENERALES EVALUABLES (Físicos, Mentales y DO)
  // Las técnicas fundamentales (Tsuki, Uke, Dachi, Geri) ya fueron evaluadas
  // dentro de cada técnica del Kihon, por lo tanto NO deben aparecer a evaluar por sí mismas.
  // =========================================================================
  aspects.forEach((aspect, aIdx) => {
    const cat = (aspect.category || '').toLowerCase();
    
    // Omitir Tsuki, Uke, Dachi, Geri, Kata y Kumite: ya se evalúan dentro de sus técnicas respectivas
    if (['tsuki', 'uke', 'dachi', 'geri', 'kata', 'kumite'].includes(cat)) {
      return;
    }

    const isSec2 = ['physical', 'mental', 'do'].includes(cat);
    
    // Si es sección 2, filtramos solo los que tienen isEvaluable === true
    const validPoints = (aspect.points || []).filter(p => {
      if (!p) return false;
      if (!isSec2) return true;
      if (typeof p === 'object') {
        return Boolean(p.isEvaluable || p.evaluableInExam || p.evaluable);
      }
      return false; // Strings antiguos de sección 2 son sólo formativos/preparatorios
    });

    if (validPoints.length === 0) return;

    const aspectRubrics = validPoints.map((p, pIdx) => pointToRubric(p, pIdx, aspect.category || `cat_${aIdx}`, '⭐')).filter(Boolean);
    if (aspectRubrics.length === 0) return;

    items.push({
      id: `eval_aspect_${aspect.id || aspect.category || aIdx}`,
      phase: 'aspectos',
      phaseLabel: '4. ASPECTOS GENERALES & EL “DO”',
      name: aspect.title || `Aspecto ${aIdx + 1}`,
      subname: aspect.subtitle || aspect.categoryLabel || 'Evaluación de Parámetros Normativos Oficiales',
      stance: 'Evaluación Técnica Normativa',
      direction: 'Tatami',
      repetitions: 1,
      tripType: 'solo_ida',
      command: `Evaluar con 1-5★ cada uno de los ${aspectRubrics.length} puntos oficiales de ${aspect.title}`,
      rubrics: aspectRubrics
    });
  });

  return items;
}

const KYU_OPTIONS = [
  '10° Kyu (Cinta Blanca)',
  '9° Kyu (Cinta Amarilla)',
  '8° Kyu (Cinta Naranja)',
  '7° Kyu (Cinta Verde)',
  '6° Kyu (Cinta Azul)',
  '5° Kyu (Cinta Morada)',
  '4° Kyu (Cinta Morada con Línea Blanca)',
  '3° Kyu (Cinta Marrón 3)',
  '2° Kyu (Cinta Marrón 2)',
  '1° Kyu (Cinta Marrón 1)',
  '1° Dan (Cinta Negra / Shodan)',
];

function getRankWeight(rank) {
  if (!rank) return 999;
  const r = rank.toLowerCase();
  if (r.includes('blanca') || r.includes('10')) return 10;
  if (r.includes('amarilla') || r.includes('9')) return 9;
  if (r.includes('naranja') || r.includes('8')) return 8;
  if (r.includes('verde') && !r.includes('azul')) return 7;
  if (r.includes('azul')) return 6;
  if (r.includes('morada') && !r.includes('línea') && !r.includes('linea')) return 5;
  if (r.includes('morada') && (r.includes('línea') || r.includes('linea'))) return 4;
  if (r.includes('marrón') || r.includes('marron')) {
    if (r.includes('3') || r.includes('iii')) return 3;
    if (r.includes('2') || r.includes('ii')) return 2;
    if (r.includes('1') || r.includes('i')) return 1;
    return 3;
  }
  if (r.includes('dan') || r.includes('negra')) return 0;
  const match = rank.match(/(\d+)/);
  if (match) return parseInt(match[1], 10);
  return 999;
}

function parseCustomDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const str = String(val).trim();

  // Formato ISO (ej. 2026-02-20T00:00:00.000Z)
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      // Usar fecha UTC para prevenir desfases por zona horaria local (UTC-6)
      return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
  }

  // Formato DD/MM/AAAA o DD-MM-AAAA
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
      return d;
    }
    return null;
  }

  // Formato YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
      return d;
    }
    return null;
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function calculateAge(birthDateInput) {
  const birthDate = parseCustomDate(birthDateInput);
  if (!birthDate) return null;

  const today = new Date();
  if (birthDate > today) return null; // Fechas futuras no tienen edad cumplida

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

function formatDateDDMMAAAA(birthDateInput) {
  const d = parseCustomDate(birthDateInput);
  if (!d) return 'No indicada';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function normalizeSearchText(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getBeltBadge(kyuString) {
  const kyu = (kyuString || '').toLowerCase();
  if (kyu.includes('10') || (kyu.includes('blanco') || kyu.includes('blanca')) && !kyu.includes('amarill') && !kyu.includes('linea') && !kyu.includes('línea')) {
    return { bg: 'bg-gray-100 text-gray-800 border-gray-300', dot: 'bg-gray-400', label: 'Cinta Blanca' };
  }
  if (kyu.includes('9') || kyu.includes('amarill')) {
    return { bg: 'bg-yellow-100 text-yellow-900 border-yellow-300', dot: 'bg-yellow-500', label: 'Cinta Amarilla' };
  }
  if (kyu.includes('8') || kyu.includes('naranj')) {
    return { bg: 'bg-orange-100 text-orange-900 border-orange-300', dot: 'bg-orange-500', label: 'Cinta Naranja' };
  }
  if (kyu.includes('7') || kyu.includes('verd')) {
    return { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-500', label: 'Cinta Verde' };
  }
  if (kyu.includes('6') || kyu.includes('azul')) {
    return { bg: 'bg-blue-100 text-blue-900 border-blue-300', dot: 'bg-blue-500', label: 'Cinta Azul' };
  }
  if (kyu.includes('4') || ((kyu.includes('linea') || kyu.includes('línea')) && kyu.includes('morad'))) {
    return { bg: 'bg-purple-100 text-purple-900 border-purple-400 border-dashed', dot: 'bg-purple-600', label: 'Morada / Línea Blanca' };
  }
  if (kyu.includes('5') || kyu.includes('morad') || kyu.includes('púrpura') || kyu.includes('purpura')) {
    return { bg: 'bg-purple-100 text-purple-900 border-purple-300', dot: 'bg-purple-600', label: 'Cinta Morada' };
  }
  if (kyu.includes('3') || ((kyu.includes('marrón') || kyu.includes('marron') || kyu.includes('cafe') || kyu.includes('café')) && kyu.includes('3'))) {
    return { bg: 'bg-amber-950/10 text-amber-950 border-amber-900/30', dot: 'bg-amber-800', label: 'Cinta Marrón 3' };
  }
  if (kyu.includes('2') || ((kyu.includes('marrón') || kyu.includes('marron') || kyu.includes('cafe') || kyu.includes('café')) && kyu.includes('2'))) {
    return { bg: 'bg-amber-950/10 text-amber-950 border-amber-900/30', dot: 'bg-amber-800', label: 'Cinta Marrón 2' };
  }
  if (kyu.includes('1') || kyu.includes('marrón') || kyu.includes('marron') || kyu.includes('cafe') || kyu.includes('café')) {
    return { bg: 'bg-amber-950/10 text-amber-950 border-amber-900/30', dot: 'bg-amber-800', label: 'Cinta Marrón 1' };
  }
  if (kyu.includes('dan') || kyu.includes('negr') || kyu.includes('shodan')) {
    return { bg: 'bg-gray-900 text-white border-black', dot: 'bg-red-500', label: 'Cinta Negra' };
  }
  return { bg: 'bg-gray-100 text-gray-800 border-gray-300', dot: 'bg-gray-400', label: 'Kyu' };
}

function getEvaluatorPhaseDetails(ev, techniques = []) {
  const techMap = {};
  techniques.forEach(t => {
    if (t.id) {
      techMap[t.id] = {
        name: t.name || t.id,
        phase: (t.group || t.phase || 'kihon').toLowerCase()
      };
    }
  });

  const phases = {
    kihon: { name: 'Kihon', icon: '🥋', techniques: [], notes: ev.phaseNotes?.kihon || '' },
    kata: { name: 'Kata', icon: '🥋', techniques: [], notes: ev.phaseNotes?.kata || '' },
    kumite: { name: 'Kumite', icon: '🥋', techniques: [], notes: ev.phaseNotes?.kumite || '' }
  };

  if (Array.isArray(ev.grades) && ev.grades.length > 0) {
    ev.grades.forEach(g => {
      const ph = (g.phase || g.techniqueGroup || techMap[g.techniqueId]?.phase || 'kihon').toLowerCase();
      const target = phases[ph] || phases.kihon;
      target.techniques.push({
        id: g.techniqueId,
        name: g.techniqueName || techMap[g.techniqueId]?.name || g.techniqueId,
        score: Number(g.average) || 0
      });
    });
  } else if (ev.techniqueAverages && typeof ev.techniqueAverages === 'object') {
    Object.entries(ev.techniqueAverages).forEach(([techId, avg]) => {
      const ph = techMap[techId]?.phase || (techId.includes('-ka') ? 'kata' : techId.includes('-ku') ? 'kumite' : 'kihon');
      const target = phases[ph] || phases.kihon;
      target.techniques.push({
        id: techId,
        name: techMap[techId]?.name || techId,
        score: (Number(avg) <= 10 && Number(avg) > 0 ? Math.round(Number(avg) * 10) : (Number(avg) || 0))
      });
    });
  }

  const result = {};
  Object.keys(phases).forEach(k => {
    const list = phases[k].techniques;
    const avg = list.length > 0
      ? Math.round(list.reduce((sum, t) => sum + t.score, 0) / list.length)
      : 0;
    result[k] = {
      ...phases[k],
      average: avg
    };
  });

  return result;
}

function getStudentConsolidatedPhases(evaluations = [], techniques = []) {
  const phaseStats = {
    kihon: { name: 'Kihon General', sum: 0, count: 0, techniquesMap: {} },
    kata: { name: 'Kata General', sum: 0, count: 0, techniquesMap: {} },
    kumite: { name: 'Kumite General', sum: 0, count: 0, techniquesMap: {} }
  };

  evaluations.forEach(ev => {
    const evPhases = getEvaluatorPhaseDetails(ev, techniques);
    Object.keys(phaseStats).forEach(phKey => {
      const p = evPhases[phKey];
      if (p && p.average > 0 && p.techniques.length > 0) {
        phaseStats[phKey].sum += p.average;
        phaseStats[phKey].count++;
        p.techniques.forEach(t => {
          if (!phaseStats[phKey].techniquesMap[t.id]) {
            phaseStats[phKey].techniquesMap[t.id] = { id: t.id, name: t.name, sum: 0, count: 0 };
          }
          phaseStats[phKey].techniquesMap[t.id].sum += t.score;
          phaseStats[phKey].techniquesMap[t.id].count++;
        });
      }
    });
  });

  const res = {};
  Object.keys(phaseStats).forEach(phKey => {
    const item = phaseStats[phKey];
    const avg = item.count > 0 ? Math.round(item.sum / item.count) : 0;
    const techs = Object.values(item.techniquesMap).map(t => ({
      id: t.id,
      name: t.name,
      score: t.count > 0 ? Math.round(t.sum / t.count) : 0
    }));
    res[phKey] = {
      name: item.name,
      average: avg,
      techniques: techs
    };
  });

  return res;
}

function StudentEvaluationBreakdown({ item, examTechniques = [], onGenerateAI, isSynthesizing }) {
  const [activeTabKey, setActiveTabKey] = useState('final');
  const evaluations = useMemo(() => item.evaluations || [], [item.evaluations]);
  const consolidated = useMemo(() => getStudentConsolidatedPhases(evaluations, examTechniques), [evaluations, examTechniques]);

  const selectedEval = evaluations.find(e => (e.evaluatorEmail || e.evaluationId) === activeTabKey);
  const selectedEvalPhases = useMemo(() => {
    return selectedEval ? getEvaluatorPhaseDetails(selectedEval, examTechniques) : null;
  }, [selectedEval, examTechniques]);

  return (
    <div className="w-full space-y-3 pt-2">
      {/* Barra de Tabs: Promedios Finales + Cada Sensei */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTabKey('final')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTabKey === 'final'
              ? 'bg-[#2D2E83] text-white shadow-xs'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Promedio Colegiado</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black ${
            activeTabKey === 'final' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
          }`}>
            {item.averagePercentage}%
          </span>
        </button>

        {evaluations.map((ev, idx) => {
          const tabId = ev.evaluatorEmail || ev.evaluationId || `sensei-${idx}`;
          const isSelected = activeTabKey === tabId;
          const senseiName = ev.evaluatorName || `Sinodal ${idx + 1}`;
          return (
            <button
              key={tabId}
              type="button"
              onClick={() => setActiveTabKey(tabId)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/60'
              }`}
            >
              <span>🥋</span>
              <span>{senseiName}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black ${
                isSelected ? 'bg-white/20 text-white' : 'bg-white text-indigo-900 border border-indigo-200'
              }`}>
                {ev.percentage}%
              </span>
            </button>
          );
        })}
      </div>

      {/* CONTENIDO DEL TAB SELECCIONADO */}
      {activeTabKey === 'final' ? (
        <div className="space-y-3 animate-in fade-in-50 duration-150">
          {/* Tarjetas de Promedios por Fase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
              <div className="flex items-center justify-between text-blue-950 font-bold">
                <span className="flex items-center gap-1">🥋 Kihon General</span>
                <span className="font-mono font-black text-blue-900 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                  {consolidated.kihon.average}%
                </span>
              </div>
              <p className="text-[11px] text-blue-800/80">
                {consolidated.kihon.techniques.length} técnicas promediadas
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
              <div className="flex items-center justify-between text-amber-950 font-bold">
                <span className="flex items-center gap-1">🥋 Kata General</span>
                <span className="font-mono font-black text-amber-900 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                  {consolidated.kata.average}%
                </span>
              </div>
              <p className="text-[11px] text-amber-800/80">
                {consolidated.kata.techniques.length} kata evaluado
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs space-y-1">
              <div className="flex items-center justify-between text-rose-950 font-bold">
                <span className="flex items-center gap-1">🥋 Kumite General</span>
                <span className="font-mono font-black text-rose-900 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                  {consolidated.kumite.average}%
                </span>
              </div>
              <p className="text-[11px] text-rose-800/80">
                {consolidated.kumite.techniques.length} técnica de kumite
              </p>
            </div>
          </div>

          {/* Comparativa entre Evaluadores */}
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Calificación por Sinodal:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {evaluations.map((ev, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-white border border-gray-200 font-bold text-gray-700 text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <span className="text-gray-500">🥋 {ev.evaluatorName}:</span>
                  <span className="font-mono font-black text-[#2D2E83]">{ev.percentage}%</span>
                </span>
              ))}
            </div>
          </div>

          {/* Dictamen de Observaciones IA */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-black text-[#2D2E83] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Dictamen Oficial de Puntos Comunes (IA)
              </span>
              {onGenerateAI && (
                <button
                  type="button"
                  onClick={onGenerateAI}
                  disabled={isSynthesizing}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  {isSynthesizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                  <span>{item.aiSummary ? 'Regenerar con IA' : 'Generar Síntesis IA'}</span>
                </button>
              )}
            </div>

            {item.aiSummary ? (
              <div className="text-gray-800 font-medium leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-slate-200">
                {item.aiSummary}
              </div>
            ) : (
              <p className="text-gray-400 italic text-[11px]">
                Presione &ldquo;Generar Síntesis IA&rdquo; para extraer los puntos comunes de las notas de los evaluadores.
              </p>
            )}
          </div>
        </div>
      ) : selectedEval && selectedEvalPhases ? (
        <div className="space-y-3 animate-in fade-in-50 duration-150">
          <div className="p-2.5 rounded-xl bg-indigo-50/90 border border-indigo-200 flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-950">
              Evaluación detallada de: <strong>{selectedEval.evaluatorName}</strong>
            </span>
            <span className="font-black font-mono text-indigo-900 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
              Nota Global: {selectedEval.percentage}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Kihon de este Sensei */}
            <div className="p-3 rounded-2xl bg-white border border-blue-200 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-blue-100">
                <span className="font-black text-blue-950">🥋 Kihon</span>
                <span className="font-mono font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                  Promedio: {selectedEvalPhases.kihon.average}%
                </span>
              </div>
              <div className="space-y-1">
                {selectedEvalPhases.kihon.techniques.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-[11px] text-gray-700">
                    <span className="truncate pr-1">• {t.name}</span>
                    <span className="font-mono font-bold text-gray-900 shrink-0">{t.score}%</span>
                  </div>
                ))}
              </div>
              {selectedEvalPhases.kihon.notes && (
                <div className="pt-1.5 border-t border-gray-100 text-[10px] text-gray-600 italic whitespace-pre-line">
                  {selectedEvalPhases.kihon.notes}
                </div>
              )}
            </div>

            {/* Kata de este Sensei */}
            <div className="p-3 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-100">
                <span className="font-black text-amber-950">🥋 Kata</span>
                <span className="font-mono font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md">
                  Promedio: {selectedEvalPhases.kata.average}%
                </span>
              </div>
              <div className="space-y-1">
                {selectedEvalPhases.kata.techniques.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-[11px] text-gray-700">
                    <span className="truncate pr-1">• {t.name}</span>
                    <span className="font-mono font-bold text-gray-900 shrink-0">{t.score}%</span>
                  </div>
                ))}
              </div>
              {selectedEvalPhases.kata.notes && (
                <div className="pt-1.5 border-t border-gray-100 text-[10px] text-gray-600 italic whitespace-pre-line">
                  {selectedEvalPhases.kata.notes}
                </div>
              )}
            </div>

            {/* Kumite de este Sensei */}
            <div className="p-3 rounded-2xl bg-white border border-rose-200 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-rose-100">
                <span className="font-black text-rose-950">🥋 Kumite</span>
                <span className="font-mono font-black text-rose-900 bg-rose-50 px-2 py-0.5 rounded-md">
                  Promedio: {selectedEvalPhases.kumite.average}%
                </span>
              </div>
              <div className="space-y-1">
                {selectedEvalPhases.kumite.techniques.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-[11px] text-gray-700">
                    <span className="truncate pr-1">• {t.name}</span>
                    <span className="font-mono font-bold text-gray-900 shrink-0">{t.score}%</span>
                  </div>
                ))}
              </div>
              {selectedEvalPhases.kumite.notes && (
                <div className="pt-1.5 border-t border-gray-100 text-[10px] text-gray-600 italic whitespace-pre-line">
                  {selectedEvalPhases.kumite.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TechnicalExamsView({ initialDojos = [], initialSyllabi = [], currentUser = null, initialExamCosts = null }) {
  const isInstructor = currentUser?.role === 'editor';

  // Configuración de costos oficiales para el cálculo en vivo de cobros del padrón
  const [costConfig, setCostConfig] = useState(() => initialExamCosts || {
    senseiDojo: 15000,
    directorGeneral: 10000,
    iskfCr: 5000,
    total: 30000,
    currencySymbol: '₡'
  });

  useEffect(() => {
    getExamCostConfig().then(res => {
      if (res?.success && res.config) {
        setCostConfig(res.config);
      }
    }).catch(console.error);
  }, []);

  // Vista principal: Convocatorias de Examen Técnico
  const [activeTab, setActiveTab] = useState('convocatorias');

  // Temarios Oficiales sincronizados desde MongoDB
  const [syllabi, setSyllabi] = useState(initialSyllabi);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState(() => {
    return initialSyllabi.length > 0 ? (initialSyllabi[0]._id || initialSyllabi[0].id) : '';
  });

  // Evaluaciones persistidas en MongoDB por estudiante: { [studentId]: evaluationDoc }
  const [evaluationsByStudent, setEvaluationsByStudent] = useState({});
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);
  const [isSavingScores, setIsSavingScores] = useState(false);

  // Modal para ver informe completo de notas de un estudiante
  const [selectedStudentReport, setSelectedStudentReport] = useState(null);


  // Sincronizar temarios oficiales frescos directamente desde MongoDB al montar y al cambiar de pestaña
  useEffect(() => {
    let isMounted = true;
    getExamSyllabi().then(fresh => {
      if (isMounted && fresh && fresh.length > 0) {
        setSyllabi(fresh);
        setSelectedSyllabusId(prev => {
          if (prev && fresh.some(s => (s._id || s.id) === prev)) return prev;
          return fresh[0]._id || fresh[0].id;
        });
      }
    }).catch(err => console.error("Error al refrescar temarios desde MongoDB:", err));

    return () => { isMounted = false; };
  }, [activeTab]);

  // Dojos y selección activa directamente conectados a MongoDB
  const [dojos, setDojos] = useState(initialDojos);
  
  const getInitialDojoId = () => {
    if (currentUser?.dojoId) {
      const match = initialDojos.find(d => (d._id || d.id) === currentUser.dojoId.toString());
      if (match) return match._id || match.id;
    }
    if (currentUser?.dojoName) {
      const match = initialDojos.find(d => d.name?.toLowerCase() === currentUser.dojoName.toLowerCase());
      if (match) return match._id || match.id;
    }
    return initialDojos.length > 0 ? (initialDojos[0]._id || initialDojos[0].id) : '';
  };

  const [selectedDojoId, setSelectedDojoId] = useState(getInitialDojoId);

  // Sincronización continua con la base de datos real
  useEffect(() => {
    if (initialDojos && initialDojos.length > 0) {
      setDojos(initialDojos);
      if (!selectedDojoId || isInstructor) {
        let targetId = initialDojos[0]._id || initialDojos[0].id;
        if (currentUser?.dojoId) {
          const match = initialDojos.find(d => (d._id || d.id) === currentUser.dojoId.toString());
          if (match) targetId = match._id || match.id;
        } else if (currentUser?.dojoName) {
          const match = initialDojos.find(d => d.name?.toLowerCase() === currentUser.dojoName.toLowerCase());
          if (match) targetId = match._id || match.id;
        }
        setSelectedDojoId(targetId);
      }
    } else {
      getDojosForSelector().then(freshDojos => {
        if (freshDojos && freshDojos.length > 0) {
          setDojos(freshDojos);
          let targetId = freshDojos[0]._id || freshDojos[0].id;
          if (currentUser?.dojoId) {
            const match = freshDojos.find(d => (d._id || d.id) === currentUser.dojoId.toString());
            if (match) targetId = match._id || match.id;
          } else if (currentUser?.dojoName) {
            const match = freshDojos.find(d => d.name?.toLowerCase() === currentUser.dojoName.toLowerCase());
            if (match) targetId = match._id || match.id;
          }
          setSelectedDojoId(targetId);
        }
      }).catch(err => console.error("Error sincronizando dojos desde MongoDB:", err));
    }
  }, [initialDojos, currentUser, isInstructor, selectedDojoId]);

  // Cargar automáticamente consolidaciones del tribunal al entrar a la pestaña de Cierre Oficial
  useEffect(() => {
    if (activeTab === 'closure' && selectedDojoId) {
      handleOpenConsolidation(false);
    }
  }, [activeTab, selectedDojoId]);

  // Senseis disponibles registrados en la base de datos de los Dojos + Sensei Roy Gatjens como Director Nacional
  const availableSenseis = useMemo(() => {
    const map = new Map();

    // 1. Sensei Roy Gatjens (padre) como Director Nacional de la ISKF (convocado permanente)
    map.set('sensei roy gatjens', {
      id: 'sensei-roy-gatjens',
      name: 'Sensei Roy Gatjens',
      email: 'roygatjens@iskf.cr',
      rank: 'Director Nacional ISKF / 7° Dan',
      role: 'Director Nacional / Sinodal Principal',
      dojoName: 'Honbu Dojo ISKF Costa Rica',
      province: 'San José',
      isPermanent: true
    });

    dojos.forEach(d => {
      const rawSensei = String(d.sensei || '').trim();
      if (!rawSensei) return;
      const cleanName = rawSensei.startsWith('Sensei ') ? rawSensei : `Sensei ${rawSensei}`;
      const key = cleanName.toLowerCase();
      
      // Omitir solo a Sensei Roy Gatjens padre para no duplicarlo, pero conservar a Sensei Roy Lee
      if (key.includes('gatjens') && !key.includes('lee')) return;

      if (!map.has(key)) {
        const email = (d.email && d.email.includes('@'))
          ? d.email.trim().toLowerCase()
          : `sensei.${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@iskf.cr`;
        map.set(key, {
          id: d._id || d.id,
          dojoId: (d._id || d.id)?.toString(),
          name: cleanName,
          email,
          rank: d.rank || 'Sensei ISKF',
          dojoName: d.name,
          province: d.province
        });
      }
    });

    // Colocar a Sensei Roy Gatjens (Director Nacional) de primero y el resto alfabéticamente (incluyendo a Sensei Roy Lee Gatjens)
    const all = Array.from(map.values());
    const royDirector = all.find(s => s.isPermanent || (s.name.toLowerCase().includes('gatjens') && !s.name.toLowerCase().includes('lee')));
    const others = all.filter(s => s !== royDirector).sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return royDirector ? [royDirector, ...others] : others;
  }, [dojos]);

  // Helper para verificar si un Sensei es el titular o dueño del dojo que se está evaluando.
  // Por reglamento técnico de la ISKF, el Sensei titular no puede evaluar a sus propios alumnos
  // para evitar cualquier conflicto de interés.
  const isDojoOwnerSensei = useCallback((sensei, targetDojo) => {
    if (!sensei || !targetDojo) return false;

    // Coincidencia directa por ID de Dojo
    const targetDojoId = (targetDojo._id || targetDojo.id)?.toString();
    if (sensei.dojoId && targetDojoId && sensei.dojoId === targetDojoId) {
      return true;
    }

    const clean = (val) =>
      String(val || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/^sensei\s+/, '')
        .trim();

    const sName = clean(sensei.name);
    const dSensei = clean(targetDojo.sensei);
    const sEmail = String(sensei.email || '').toLowerCase().trim();
    const dEmail = String(targetDojo.email || '').toLowerCase().trim();

    // 1. Coincidencia por nombre del Sensei
    if (dSensei && sName) {
      if (dSensei === sName || dSensei.includes(sName) || sName.includes(dSensei)) {
        return true;
      }
    }

    // 2. Coincidencia por correo electrónico registrado del dojo
    if (sEmail && dEmail && sEmail === dEmail) {
      return true;
    }

    // 3. Coincidencia por nombre de dojo (siempre que no sea el Director Nacional permanente)
    const sDojoName = clean(sensei.dojoName);
    const dName = clean(targetDojo.name);
    if (sDojoName && dName && (sDojoName === dName || sDojoName.includes(dName) || dName.includes(sDojoName))) {
      if (!sensei.isPermanent) {
        return true;
      }
    }

    return false;
  }, []);

  // ==========================================
  // CONVOCATORIAS OFICIALES PARA EL DOJO (ETAPAS 1, 2 Y 3)
  // ==========================================
  const [examCalls, setExamCalls] = useState([]);
  const [isLoadingExamCalls, setIsLoadingExamCalls] = useState(false);
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [isCreatingCall, setIsCreatingCall] = useState(false);
  const [createdCallResult, setCreatedCallResult] = useState(null);
  const [copiedCallToken, setCopiedCallToken] = useState(null);
  const [newCallForm, setNewCallForm] = useState({
    title: 'Convocatoria Oficial de Examen Técnico ISKF',
    dojoId: '',
    examDate: new Date().toISOString().split('T')[0],
    startTime: '09:00 AM',
    location: '',
    notes: '',
    maxPerTanda: 6,
  });
  const [selectedSenseisForCall, setSelectedSenseisForCall] = useState([]);

  // Selector desplegable con Logo de Dojos dentro del modal Convocar a Examen
  const [isModalDojoDropdownOpen, setIsModalDojoDropdownOpen] = useState(false);
  const [modalDojoSearch, setModalDojoSearch] = useState('');
  const modalDojoDropdownRef = useRef(null);

  const currentModalDojo = useMemo(() => {
    return dojos.find(d => (d._id || d.id) === (newCallForm.dojoId || selectedDojoId)) || dojos[0];
  }, [dojos, newCallForm.dojoId, selectedDojoId]);

  useEffect(() => {
    const handleClickOutsideModalDojo = (e) => {
      if (modalDojoDropdownRef.current && !modalDojoDropdownRef.current.contains(e.target)) {
        setIsModalDojoDropdownOpen(false);
      }
    };
    if (isModalDojoDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutsideModalDojo);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideModalDojo);
    };
  }, [isModalDojoDropdownOpen]);

  // Detalle de Convocatoria Activa y Configuración de Tandas
  const [selectedCallForDetail, setSelectedCallForDetail] = useState(null);
  const [callReadyStudents, setCallReadyStudents] = useState([]);
  const [dojoAllStudents, setDojoAllStudents] = useState([]);
  const [isLoadingCallStudents, setIsLoadingCallStudents] = useState(false);
  const [studentListFilterTab, setStudentListFilterTab] = useState('promoted'); // 'promoted' | 'unpromoted'
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isTogglingPromotionId, setIsTogglingPromotionId] = useState(null);
  const [callTandas, setCallTandas] = useState([]);
  const [draggedStudentData, setDraggedStudentData] = useState(null); // { studentId, sourceTandaId }
  const [dragOverTargetId, setDragOverTargetId] = useState(null); // tanda.id o 'unassigned'
  const [dragOverStudentId, setDragOverStudentId] = useState(null); // stId para intercambio directo
  const [draggedTandaData, setDraggedTandaData] = useState(null); // { tandaId, index }
  const [dragOverTandaReorderIndex, setDragOverTandaReorderIndex] = useState(null);
  const [detailMaxPerTanda, setDetailMaxPerTanda] = useState(6);
  const [isUpdatingMaxPerTanda, setIsUpdatingMaxPerTanda] = useState(false);
  const [callDetailSubTab, setCallDetailSubTab] = useState('tandas'); // 'tandas' | 'evaluation' | 'monitor'

  const callEvaluationStudents = useMemo(() => {
    const map = new Map();
    (callReadyStudents || []).forEach(s => {
      map.set(String(s._id || s.id), s);
    });
    (dojoAllStudents || []).forEach(s => {
      const sId = String(s._id || s.id);
      if (!map.has(sId)) {
        map.set(sId, s);
      }
    });
    return Array.from(map.values());
  }, [callReadyStudents, dojoAllStudents]);

  useEffect(() => {
    if (selectedCallForDetail?.maxPerTanda) {
      setDetailMaxPerTanda(Number(selectedCallForDetail.maxPerTanda) || 6);
    }
  }, [selectedCallForDetail?.maxPerTanda]);

  // Refrescar temarios y criterios oficiales automáticamente al ingresar a la mesa de evaluación
  useEffect(() => {
    if (callDetailSubTab === 'evaluation') {
      // Si la convocatoria está cerrada y cuenta con un snapshot histórico, respetar dicho temario inmutable
      if (selectedCallForDetail?.status === 'cerrado' && Array.isArray(selectedCallForDetail?.syllabusSnapshots) && selectedCallForDetail.syllabusSnapshots.length > 0) {
        setSyllabi(selectedCallForDetail.syllabusSnapshots);
        return;
      }
      getExamSyllabi().then(fresh => {
        if (fresh && fresh.length > 0) setSyllabi(fresh);
      }).catch(console.error);
    }
  }, [callDetailSubTab, selectedCallForDetail]);

  const handleChangeMaxPerTanda = async (newVal) => {
    const parsed = parseInt(newVal, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 50) return;
    setDetailMaxPerTanda(parsed);
    if (!selectedCallForDetail) return;
    const callId = selectedCallForDetail._id || selectedCallForDetail.id;
    if (!callId) return;

    setSelectedCallForDetail(prev => prev ? ({ ...prev, maxPerTanda: parsed }) : null);
    setExamCalls(prev => prev.map(c => ((c._id || c.id) === callId ? { ...c, maxPerTanda: parsed } : c)));

    setIsUpdatingMaxPerTanda(true);
    try {
      const res = await updateExamCallMaxPerTanda({ callId, maxPerTanda: parsed });
      if (!res.success) {
        showAlert(res.error || 'Error al actualizar cupo por tanda.', 'Error', true);
      }
    } catch (err) {
      console.error('Error al actualizar maxPerTanda:', err);
      showAlert('Error de conexión al actualizar cupo por tanda.', 'Error', true);
    } finally {
      setIsUpdatingMaxPerTanda(false);
    }
  };

  // Edición de Senseis Evaluadores en convocatorias creadas
  const [editingTribunalCall, setEditingTribunalCall] = useState(null);
  const [editingSenseisList, setEditingSenseisList] = useState([]);
  const [isUpdatingTribunal, setIsUpdatingTribunal] = useState(false);
  const [customSenseiName, setCustomSenseiName] = useState('');
  const [customSenseiEmail, setCustomSenseiEmail] = useState('');

  const adminEvaluator = useMemo(() => {
    if (selectedCallForDetail && Array.isArray(selectedCallForDetail.evaluators)) {
      const match = selectedCallForDetail.evaluators.find(e => e.email === currentUser?.email);
      if (match) return match;
      if (selectedCallForDetail.evaluators[0]) return selectedCallForDetail.evaluators[0];
    }
    return {
      name: currentUser?.name || 'Sensei Administrador',
      email: currentUser?.email || 'admin@iskf.cr',
      role: 'Sinodal Administrador',
      token: 'admin'
    };
  }, [selectedCallForDetail, currentUser]);

  // Persistir tandas directamente en MongoDB ante eventos específicos del usuario
  const persistTandasEvent = useCallback(async (newTandas) => {
    if (!selectedCallForDetail) return;
    const callId = selectedCallForDetail._id || selectedCallForDetail.id;
    if (!callId) return;

    try {
      const res = await saveCallSchedules({
        callId,
        schedules: newTandas,
        maxPerTanda: detailMaxPerTanda
      });
      if (res.success) {
        setSelectedCallForDetail(prev => prev ? ({
          ...prev,
          schedulesCount: newTandas.length,
          schedules: res.schedules,
          status: res.status || prev.status
        }) : null);
        setExamCalls(prev => prev.map(c => {
          if ((c._id || c.id) === callId) {
            return {
              ...c,
              schedulesCount: newTandas.length,
              schedules: res.schedules,
              status: res.status || c.status
            };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error('Error al persistir tandas por evento:', err);
    }
  }, [selectedCallForDetail, detailMaxPerTanda]);

  // Estudiantes del dojo que NO están postulados para examen
  const unpromotedDojoStudents = useMemo(() => {
    const readyIds = new Set(callReadyStudents.map(s => s._id || s.id));
    return (dojoAllStudents || []).filter(s => !readyIds.has(s._id || s.id));
  }, [dojoAllStudents, callReadyStudents]);

  // Filtro por búsqueda de nombre o rango
  const filteredReadyStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return callReadyStudents;
    const q = studentSearchQuery.toLowerCase();
    return callReadyStudents.filter(s => 
      (s.name || '').toLowerCase().includes(q) || 
      (s.currentRank || '').toLowerCase().includes(q)
    );
  }, [callReadyStudents, studentSearchQuery]);

  const filteredUnpromotedStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return unpromotedDojoStudents;
    const q = studentSearchQuery.toLowerCase();
    return unpromotedDojoStudents.filter(s => 
      (s.name || '').toLowerCase().includes(q) || 
      (s.currentRank || '').toLowerCase().includes(q)
    );
  }, [unpromotedDojoStudents, studentSearchQuery]);

  // Cargar todas las convocatorias vigentes en el sistema
  useEffect(() => {
    let isMounted = true;
    setIsLoadingExamCalls(true);
    getExamCallsByDojo('all').then(calls => {
      if (isMounted) {
        setExamCalls(calls || []);
      }
    }).catch(err => console.error("Error al cargar convocatorias:", err))
      .finally(() => {
        if (isMounted) setIsLoadingExamCalls(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Dropdown selector personalizado de dojos
  const [isDojoDropdownOpen, setIsDojoDropdownOpen] = useState(false);
  const [dojoSearchFilter, setDojoSearchFilter] = useState('');
  const dojoDropdownRef = useRef(null);
  const dojoSearchInputRef = useRef(null);

  // Auto-enfoque al abrir el menú desplegable
  useEffect(() => {
    if (isDojoDropdownOpen) {
      const timer = setTimeout(() => {
        dojoSearchInputRef.current?.focus();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isDojoDropdownOpen]);

  // Filtrado exhaustivo por toda la descripción: nombre, provincia, sensei, dirección, etc. (Insensible a tildes y mayúsculas)
  const filteredDojos = useMemo(() => {
    const query = normalizeSearchText(dojoSearchFilter);
    if (!query) return dojos;
    const tokens = query.split(/\s+/).filter(Boolean);

    return dojos.filter((dojo) => {
      const fullText = normalizeSearchText(
        `${dojo.name} ${dojo.province} ${dojo.sensei} ${dojo.address || ''} ${dojo.idName || ''} ${dojo.rank || ''} Dojo Sensei ${dojo.studentCount || 0} alumnos`
      );
      return tokens.every((token) => fullText.includes(token));
    });
  }, [dojos, dojoSearchFilter]);

  // Cerrar selector al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dojoDropdownRef.current && !dojoDropdownRef.current.contains(e.target)) {
        setIsDojoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Estudiantes del dojo seleccionado
  const [students, setStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [selectedStudentForAspects, setSelectedStudentForAspects] = useState(null);

  // Filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [rankFilter, setRankFilter] = useState('all');
  const [promotionFilter, setPromotionFilter] = useState('all'); // 'all' | 'promoted' | 'not_promoted'
  const [togglingPromotionId, setTogglingPromotionId] = useState(null);
  const [studentSortField, setStudentSortField] = useState('index');
  const [studentSortDirection, setStudentSortDirection] = useState('asc');

  // Conteo de alumnos postulados a examen
  const promotedCount = useMemo(() => {
    return students.filter(s => s.isPromotedForExam).length;
  }, [students]);

  // Filtrado de estudiantes
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesRank = rankFilter === 'all' || student.currentRank === rankFilter;
      const matchesPromotion = promotionFilter === 'all' ||
        (promotionFilter === 'promoted' && Boolean(student.isPromotedForExam)) ||
        (promotionFilter === 'not_promoted' && !student.isPromotedForExam);
      return matchesSearch && matchesRank && matchesPromotion;
    });
  }, [students, searchQuery, rankFilter, promotionFilter]);

  const handleStudentSort = (field) => {
    if (studentSortField === field) {
      setStudentSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setStudentSortField(field);
      setStudentSortDirection('asc');
    }
  };

  const sortedStudents = useMemo(() => {
    const list = filteredStudents.map((s, idx) => ({ ...s, originalIndex: idx + 1 }));
    if (studentSortField === 'index') {
      return studentSortDirection === 'desc' ? list.reverse() : list;
    }

    list.sort((a, b) => {
      let comparison = 0;
      if (studentSortField === 'name') {
        comparison = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      } else if (studentSortField === 'rank') {
        comparison = getRankWeight(b.currentRank) - getRankWeight(a.currentRank);
      } else if (studentSortField === 'birthDate') {
        const timeA = a.birthDate ? new Date(a.birthDate).getTime() : 0;
        const timeB = b.birthDate ? new Date(b.birthDate).getTime() : 0;
        comparison = timeA - timeB;
      } else if (studentSortField === 'status') {
        const statA = a.isPromotedForExam ? 1 : 0;
        const statB = b.isPromotedForExam ? 1 : 0;
        comparison = statB - statA;
      }
      return studentSortDirection === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [filteredStudents, studentSortField, studentSortDirection]);

  // Manejo de alternancia rápida de Matrícula para Examen (Promoción)
  const handleTogglePromotion = async (student) => {
    const studentId = student._id || student.id;
    const nextState = !student.isPromotedForExam;
    setTogglingPromotionId(studentId);

    // Actualización optimista en memoria
    setStudents(prev => prev.map(s => {
      if ((s._id || s.id) === studentId) {
        return {
          ...s,
          isPromotedForExam: nextState,
          promotedAt: nextState ? new Date().toISOString() : null
        };
      }
      return s;
    }));

    try {
      const res = await toggleStudentExamPromotion(studentId, nextState);
      if (res.success) {
        showAlert(
          nextState 
            ? `Estudiante "${student.name}" matriculado como candidato a examen.` 
            : `Se removió la postulación a examen de "${student.name}".`,
          nextState ? 'Candidato a Examen' : 'Postulación Removida'
        );
      } else {
        // Rollback
        setStudents(prev => prev.map(s => {
          if ((s._id || s.id) === studentId) {
            return {
              ...s,
              isPromotedForExam: !nextState,
              promotedAt: student.promotedAt
            };
          }
          return s;
        }));
        showAlert(res.error || 'No se pudo actualizar el estado de examen.', 'Error', true);
      }
    } catch (err) {
      console.error('Error toggling promotion:', err);
      // Rollback
      setStudents(prev => prev.map(s => {
        if ((s._id || s.id) === studentId) {
          return {
            ...s,
            isPromotedForExam: !nextState,
            promotedAt: student.promotedAt
          };
        }
        return s;
      }));
      showAlert('Error de conexión al guardar el estado.', 'Error', true);
    } finally {
      setTogglingPromotionId(null);
    }
  };

  // ==========================================
  // ESTADO DE EVALUACIÓN EN TATAMI DINÁMICO
  // ==========================================
  const activeSyllabus = useMemo(() => {
    if (!syllabi || syllabi.length === 0) return null;
    return syllabi.find(s => (s._id || s.id) === selectedSyllabusId) || syllabi[0];
  }, [syllabi, selectedSyllabusId]);

  const dynamicTechniques = useMemo(() => {
    return generateExamTechniques(activeSyllabus);
  }, [activeSyllabus]);

  const [examTechniques, setExamTechniques] = useState(dynamicTechniques);
  const [activeTechniqueIndex, setActiveTechniqueIndex] = useState(0);
  const [tatamiBatchIndex, setTatamiBatchIndex] = useState(0);
  const [tatamiScores, setTatamiScores] = useState({}); // { [studentId]: { [techniqueId]: { [rubricId]: score (1-5) } } }
  const [tatamiObservations, setTatamiObservations] = useState({}); // { [studentId]: { [techniqueId]: string } }

  // ==========================================
  // TRIBUNAL EVALUADOR MULTI-SENSEI (1 A 5 SENSEIS)
  // ==========================================
  const initialTribunal = useMemo(() => {
    const list = [];
    const mainSenseiName = currentUser?.name || 'Sensei Principal ISKF';
    const mainSenseiEmail = currentUser?.email || 'sensei.principal@iskf.cr';
    list.push({ name: mainSenseiName, email: mainSenseiEmail, role: 'Sensei Principal' });
    list.push({ name: 'Sensei Carlos Artavia', email: 'carlos.artavia@iskf.cr', role: 'Sinodal 1' });
    list.push({ name: 'Sensei Laura Brenes', email: 'laura.brenes@iskf.cr', role: 'Sinodal 2' });
    return list;
  }, [currentUser]);

  const [tribunalSenseis, setTribunalSenseis] = useState(initialTribunal);
  const [activeEvaluatorName, setActiveEvaluatorName] = useState(() => currentUser?.name || 'Sensei Principal ISKF');
  const [activeEvaluatorEmail, setActiveEvaluatorEmail] = useState(() => currentUser?.email || 'sensei.principal@iskf.cr');
  const [isTribunalModalOpen, setIsTribunalModalOpen] = useState(false);
  const [newTribunalName, setNewTribunalName] = useState('');
  const [newTribunalRole, setNewTribunalRole] = useState('Sinodal');

  // ==========================================
  // MESA DE CONSOLIDACIÓN Y DICTAMEN CON IA
  // ==========================================
  const [isConsolidationModalOpen, setIsConsolidationModalOpen] = useState(false);
  const [isLoadingConsolidation, setIsLoadingConsolidation] = useState(false);
  const [consolidationDataByStudent, setConsolidationDataByStudent] = useState({});
  const [aiSynthesizingId, setAiSynthesizingId] = useState(null);
  const [isSynthesizingAll, setIsSynthesizingAll] = useState(false);
  const [isSavingConsolidationId, setIsSavingConsolidationId] = useState(null);
  const [expandedObservationsStudentId, setExpandedObservationsStudentId] = useState(null);
  const [consolidatedVerdictsByStudent, setConsolidatedVerdictsByStudent] = useState({});

  // Sincronizar técnicas cuando cambie el temario activo
  useEffect(() => {
    setExamTechniques(dynamicTechniques);
    setActiveTechniqueIndex(0);
  }, [dynamicTechniques]);

  // Cargar evaluaciones técnicas guardadas en MongoDB para el dojo seleccionado y el Sensei activo
  useEffect(() => {
    if (!selectedDojoId) return;

    let isMounted = true;
    setIsLoadingEvaluations(true);

    // Cargar tanto las notas del evaluador activo como los dictámenes consolidados
    Promise.all([
      getTechnicalEvaluationsByDojo(selectedDojoId, selectedSyllabusId, activeEvaluatorEmail),
      getConsolidatedEvaluationsByDojo(selectedDojoId, selectedSyllabusId)
    ]).then(([evals, consolidations]) => {
      if (!isMounted) return;
      const map = {};
      const loadedScores = {};
      const loadedObservations = {};

      evals.forEach(e => {
        map[e.studentId] = e;
        if (e.scores && typeof e.scores === 'object') {
          loadedScores[e.studentId] = e.scores;
        }
        if (e.observations && typeof e.observations === 'object') {
          loadedObservations[e.studentId] = e.observations;
        }
      });

      const verdictsMap = {};
      (consolidations || []).forEach(c => {
        verdictsMap[c.studentId] = c;
      });
      setConsolidatedVerdictsByStudent(verdictsMap);

      setEvaluationsByStudent(map);
      setTatamiScores(loadedScores);
      setTatamiObservations(loadedObservations);
    }).catch(err => {
      console.error("Error cargando evaluaciones técnicas desde MongoDB:", err);
    }).finally(() => {
      if (isMounted) setIsLoadingEvaluations(false);
    });

    return () => { isMounted = false; };
  }, [selectedDojoId, selectedSyllabusId, activeEvaluatorEmail]);

  // Cambiar de Sensei evaluador en este dispositivo
  const handleSwitchEvaluator = async (sensei) => {
    setActiveEvaluatorName(sensei.name);
    setActiveEvaluatorEmail(sensei.email);
    if (!selectedDojoId) return;
    setIsLoadingEvaluations(true);
    try {
      const evals = await getTechnicalEvaluationsByDojo(selectedDojoId, selectedSyllabusId, sensei.email);
      const loadedScores = {};
      const loadedObservations = {};
      evals.forEach(e => {
        if (e.scores && typeof e.scores === 'object') loadedScores[e.studentId] = e.scores;
        if (e.observations && typeof e.observations === 'object') loadedObservations[e.studentId] = e.observations;
      });
      setTatamiScores(loadedScores);
      setTatamiObservations(loadedObservations);
    } catch (err) {
      console.error("Error al alternar evaluador:", err);
    } finally {
      setIsLoadingEvaluations(false);
    }
  };

  // Agregar nuevo Sensei al Tribunal (máximo 5)
  const handleAddTribunalSensei = () => {
    const trimmed = newTribunalName.trim();
    if (!trimmed) {
      showAlert('Por favor ingresa el nombre del Sensei.', 'Atención', true);
      return;
    }
    if (tribunalSenseis.length >= 5) {
      showAlert('El tribunal colegiado tiene un límite máximo de 5 Senseis evaluadores.', 'Límite de Tribunal', true);
      return;
    }
    const cleanEmail = `sensei.${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@iskf.cr`;
    const newMember = {
      name: trimmed,
      email: cleanEmail,
      role: newTribunalRole || `Sinodal ${tribunalSenseis.length}`
    };
    setTribunalSenseis(prev => [...prev, newMember]);
    setNewTribunalName('');
  };

  // Remover Sensei del Tribunal (mínimo 1)
  const handleRemoveTribunalSensei = (emailToRemove) => {
    if (tribunalSenseis.length <= 1) {
      showAlert('El tribunal debe contar con al menos un Sensei evaluador.', 'Atención', true);
      return;
    }
    setTribunalSenseis(prev => prev.filter(s => s.email !== emailToRemove));
    if (activeEvaluatorEmail === emailToRemove) {
      const remaining = tribunalSenseis.filter(s => s.email !== emailToRemove);
      if (remaining[0]) {
        handleSwitchEvaluator(remaining[0]);
      }
    }
  };

  // Guardar permanentemente en MongoDB las notas de la tanda / grupo evaluado para el Sensei Activo
  const handleSaveTatamiScores = async () => {
    if (!selectedDojo) {
      showAlert('Por favor selecciona un dojo válido.', 'Atención', true);
      return;
    }

    if (currentTatamiGroup.length === 0) {
      showAlert('No hay estudiantes en esta tanda para guardar.', 'Atención', true);
      return;
    }

    setIsSavingScores(true);
    try {
      const batchData = currentTatamiGroup.map(st => {
        const studentId = st._id || st.id;
        const sScores = tatamiScores[studentId] || {};
        const sObservations = tatamiObservations[studentId] || {};
        const overall = getStudentOverallExam(studentId);

        const averages = {};
        examTechniques.forEach(tech => {
          const avg = getStudentTechniqueScore(studentId, tech);
          if (avg !== null) averages[tech.id] = Number(avg);
        });

        return {
          studentId,
          studentName: st.name,
          studentRank: st.currentRank,
          targetRank: activeSyllabus?.targetRank || st.currentRank,
          scores: sScores,
          observations: sObservations,
          techniqueAverages: averages,
          percentage: overall.pct,
          pointsEarned: overall.points,
          pointsPossible: overall.totalMax,
          isPassed: overall.isPassed
        };
      });

      const res = await saveTatamiBatchScores({
        dojoId: selectedDojo._id || selectedDojo.id,
        dojoName: selectedDojo.name,
        syllabusId: activeSyllabus?._id || activeSyllabus?.id,
        syllabusName: activeSyllabus?.name || 'Temario Oficial ISKF',
        targetRank: activeSyllabus?.targetRank || '10° Kyu (Cinta Blanca)',
        evaluatorName: activeEvaluatorName,
        evaluatorEmail: activeEvaluatorEmail,
        batchScoresByStudent: batchData
      });

      if (res.success) {
        setEvaluationsByStudent(prev => {
          const updated = { ...prev };
          batchData.forEach(item => {
            updated[item.studentId] = {
              ...(updated[item.studentId] || {}),
              studentId: item.studentId,
              studentName: item.studentName,
              studentRank: item.studentRank,
              targetRank: item.targetRank,
              syllabusName: activeSyllabus?.name || 'Temario Oficial ISKF',
              scores: item.scores,
              observations: item.observations,
              techniqueAverages: item.techniqueAverages,
              percentage: item.percentage,
              pointsEarned: item.pointsEarned,
              pointsPossible: item.pointsPossible,
              isPassed: item.isPassed,
              evaluatorName: activeEvaluatorName,
              evaluatorEmail: activeEvaluatorEmail,
              evaluatedAt: new Date().toISOString()
            };
          });
          return updated;
        });

        showAlert(
          `¡Notas de ${activeEvaluatorName} guardadas con éxito en MongoDB! El tribunal acumula las evaluaciones de cada Sensei para promediar y consolidar con IA al finalizar.`,
          'Evaluación de Sensei Guardada'
        );
      } else {
        showAlert(res.error || 'Ocurrió un error al guardar en la base de datos.', 'Error', true);
      }
    } catch (err) {
      console.error('Error al guardar notas de tatami:', err);
      showAlert('Error de conexión al guardar en la base de datos.', 'Error', true);
    } finally {
      setIsSavingScores(false);
    }
  };

  // Abrir Mesa de Consolidación y Dictamen del Tribunal con IA
  const handleOpenConsolidation = async (openModal = false) => {
    if (!selectedDojo) {
      if (openModal) showAlert('Por favor selecciona un dojo válido.', 'Atención', true);
      return;
    }
    if (openModal) setIsConsolidationModalOpen(true);
    setIsLoadingConsolidation(true);
    try {
      const targetList = candidateStudents.length > 0 ? candidateStudents : students;
      const studentIds = targetList.map(s => s._id || s.id);
      const [allEvalsRes, existingConsolidations] = await Promise.all([
        getAllSenseiEvaluationsForTatami({
          dojoId: selectedDojo._id || selectedDojo.id,
          syllabusId: activeSyllabus?._id || activeSyllabus?.id,
          studentIds,
          callId: selectedCallForDetail?._id || selectedCallForDetail?.id || null
        }),
        getConsolidatedEvaluationsByDojo(
          selectedDojo._id || selectedDojo.id,
          activeSyllabus?._id || activeSyllabus?.id
        )
      ]);

      const existingMap = {};
      (existingConsolidations || []).forEach(c => {
        existingMap[c.studentId] = c;
      });

      const merged = {};
      targetList.forEach(st => {
        const sId = st._id || st.id;
        const evData = allEvalsRes.success && allEvalsRes.byStudent ? (allEvalsRes.byStudent[sId] || { evaluations: [] }) : { evaluations: [] };
        const existing = existingMap[sId] || null;

        let evals = evData.evaluations || [];
        if (evals.length === 0 && existing && Array.isArray(existing.evaluators) && existing.evaluators.length > 0) {
          evals = existing.evaluators.map(ev => ({
            evaluatorName: ev.evaluatorName,
            evaluatorEmail: ev.evaluatorEmail,
            percentage: ev.percentage,
            isPassed: ev.isPassed,
            scores: existing.averagedScores || {},
            techniqueAverages: existing.averagedTechniqueScores || {},
            phaseNotes: {
              kihon: existing.aiConsolidatedSummary || '',
              kata: '',
              kumite: ''
            }
          }));
        }

        // Promedio colegiado calculado estrictamente entre las tres fases finales: Kihon, Kata y Kumite
        const consolidatedPhases = getStudentConsolidatedPhases(evals, examTechniques);
        const phaseAveragesList = [
          consolidatedPhases.kihon?.average,
          consolidatedPhases.kata?.average,
          consolidatedPhases.kumite?.average
        ].filter(v => typeof v === 'number' && v > 0);

        let avgPct = 0;
        if (phaseAveragesList.length > 0) {
          avgPct = Math.round(phaseAveragesList.reduce((sum, v) => sum + v, 0) / phaseAveragesList.length);
        } else if (evals.length > 0) {
          avgPct = Math.round(evals.reduce((sum, e) => sum + (e.percentage || 0), 0) / evals.length);
        } else if (existing) {
          avgPct = existing.overallPercentage || 0;
        }

        // Agrupar observaciones de los Senseis por fase (Kihon, Kata, Kumite) y por técnica
        const rawObs = {};
        evals.forEach(ev => {
          // 1. Observaciones condensadas por fase
          if (ev.phaseNotes && typeof ev.phaseNotes === 'object') {
            Object.entries(ev.phaseNotes).forEach(([phaseKey, text]) => {
              if (text && String(text).trim().length > 0) {
                const phaseId = `fase_${phaseKey}`;
                if (!rawObs[phaseId]) rawObs[phaseId] = [];
                rawObs[phaseId].push({
                  evaluatorName: ev.evaluatorName || 'Sensei',
                  observation: text.trim()
                });
              }
            });
          } else if (ev.notes && String(ev.notes).trim().length > 0) {
            // Retrocompatibilidad con notas generales antiguas
            if (!rawObs['fase_kihon']) rawObs['fase_kihon'] = [];
            rawObs['fase_kihon'].push({
              evaluatorName: ev.evaluatorName || 'Sensei',
              observation: ev.notes.trim()
            });
          }

          // 2. Observaciones por técnica específica si las hubiera
          if (ev.observations && typeof ev.observations === 'object') {
            Object.entries(ev.observations).forEach(([techId, text]) => {
              if (text && String(text).trim().length > 0) {
                if (!rawObs[techId]) rawObs[techId] = [];
                rawObs[techId].push({
                  evaluatorName: ev.evaluatorName || 'Sensei',
                  observation: String(text).trim()
                });
              }
            });
          }
        });

        merged[sId] = {
          student: st,
          evaluations: evals,
          evaluatorCount: evals.length,
          averagePercentage: avgPct,
          isPassed: avgPct >= 70,
          rawObservations: rawObs,
          aiSummary: existing?.aiConsolidatedSummary || '',
          isSaved: Boolean(existing?.aiConsolidatedSummary)
        };
      });

      setConsolidationDataByStudent(merged);
    } catch (err) {
      console.error("Error al preparar consolidación del tribunal:", err);
      showAlert("Error al recopilar las evaluaciones del tribunal.", "Error", true);
    } finally {
      setIsLoadingConsolidation(false);
    }
  };

  // Generar con IA el dictamen unificado para un aspirante
  const handleGenerateStudentAISynthesis = async (studentId) => {
    const item = consolidationDataByStudent[studentId];
    if (!item) return;

    setAiSynthesizingId(studentId);
    try {
      const notesList = [];
      Object.entries(item.rawObservations || {}).forEach(([techId, list]) => {
        let techName = techId;
        if (techId === 'fase_kihon') techName = 'Kihon';
        else if (techId === 'fase_kata') techName = 'Kata';
        else if (techId === 'fase_kumite') techName = 'Kumite';
        else if (techId === 'fase_aspectos') techName = 'Aspectos Técnicos';
        else {
          const techObj = examTechniques.find(t => t.id === techId);
          techName = techObj?.name || techId;
        }
        list.forEach(obs => {
          notesList.push({
            evaluatorName: obs.evaluatorName,
            techniqueName: techName,
            observation: obs.observation
          });
        });
      });

      const aggregatedTechAvgs = {};
      const techCounts = {};
      (item.evaluations || []).forEach(ev => {
        Object.entries(ev.techniqueAverages || {}).forEach(([tId, avg]) => {
          if (typeof avg === 'number') {
            aggregatedTechAvgs[tId] = (aggregatedTechAvgs[tId] || 0) + avg;
            techCounts[tId] = (techCounts[tId] || 0) + 1;
          }
        });
      });
      Object.keys(aggregatedTechAvgs).forEach(tId => {
        aggregatedTechAvgs[tId] = Math.round(aggregatedTechAvgs[tId] / techCounts[tId]);
      });

      const res = await synthesizeSenseiObservationsWithAI({
        studentName: item.student.name,
        targetRank: activeSyllabus?.targetRank || item.student.currentRank,
        syllabusName: activeSyllabus?.name || 'Temario Oficial ISKF',
        averagedPercentage: item.averagePercentage,
        isPassed: item.isPassed,
        senseiObservations: notesList,
        techniqueAverages: aggregatedTechAvgs,
        techniques: activeSyllabus?.techniques || [],
        technicalAspects: activeSyllabus?.technicalAspects || []
      });

      if (res.success && res.summary) {
        setConsolidationDataByStudent(prev => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            aiSummary: res.summary
          }
        }));
      } else {
        showAlert(res.error || 'No se pudo generar la síntesis con IA', 'Atención', true);
      }
    } catch (err) {
      console.error("Error generando dictamen con IA:", err);
      showAlert("Error de conexión al generar la síntesis con IA.", "Error", true);
    } finally {
      setAiSynthesizingId(null);
    }
  };

  // Generar con IA para todos los aspirantes convocados
  const handleGenerateAllAISyntheses = async () => {
    setIsSynthesizingAll(true);
    try {
      for (const st of candidateStudents) {
        const sId = st._id || st.id;
        await handleGenerateStudentAISynthesis(sId);
      }
    } finally {
      setIsSynthesizingAll(false);
    }
  };

  // Oficializar y guardar en MongoDB el dictamen final del tribunal
  const handleSaveStudentConsolidatedVerdict = async (studentId) => {
    const item = consolidationDataByStudent[studentId];
    if (!item) return;

    setIsSavingConsolidationId(studentId);
    try {
      const evaluatorsList = (item.evaluations || []).map(e => ({
        evaluatorName: e.evaluatorName,
        evaluatorEmail: e.evaluatorEmail,
        percentage: e.percentage,
        isPassed: e.isPassed
      }));

      const res = await saveConsolidatedVerdict({
        studentId,
        studentName: item.student.name,
        studentRank: item.student.currentRank,
        targetRank: activeSyllabus?.targetRank || item.student.currentRank,
        dojoId: selectedDojo._id || selectedDojo.id,
        dojoName: selectedDojo.name,
        syllabusId: activeSyllabus?._id || activeSyllabus?.id,
        syllabusName: activeSyllabus?.name || 'Temario Oficial ISKF',
        evaluators: evaluatorsList,
        overallPercentage: item.averagePercentage,
        isPassed: item.isPassed,
        rawObservationsByTechnique: item.rawObservations,
        aiConsolidatedSummary: item.aiSummary || '',
        consolidatedBy: currentUser?.name || activeEvaluatorName || 'Comisión Técnica ISKF'
      });

      if (res.success) {
        setConsolidationDataByStudent(prev => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            isSaved: true
          }
        }));
        setConsolidatedVerdictsByStudent(prev => ({
          ...prev,
          [studentId]: {
            studentId,
            overallPercentage: item.averagePercentage,
            aiConsolidatedSummary: item.aiSummary || '',
            consolidatedBy: currentUser?.name || activeEvaluatorName || 'Comisión Técnica ISKF'
          }
        }));
        showAlert(`¡Dictamen oficial registrado en base de datos para ${item.student.name}!`, 'Dictamen Oficializado');
      } else {
        showAlert(res.error || 'Error al guardar dictamen.', 'Error', true);
      }
    } catch (err) {
      console.error("Error guardando dictamen consolidado:", err);
      showAlert("Error al guardar en base de datos.", "Error", true);
    } finally {
      setIsSavingConsolidationId(null);
    }
  };

  // Abrir modal para crear nueva convocatoria oficial
  const handleOpenNewCallModal = () => {
    setCreatedCallResult(null);
    setIsModalDojoDropdownOpen(false);
    setModalDojoSearch('');
    const targetDojo = selectedDojo || dojos[0];
    const initialSenseis = [];

    // Sensei Roy Gatjens como Director Nacional de la ISKF siempre preside el tribunal
    const royGatjens = availableSenseis.find(s => s.name.toLowerCase().includes('gatjens') && !s.name.toLowerCase().includes('lee')) || {
      id: 'sensei-roy-gatjens',
      name: 'Sensei Roy Gatjens',
      email: 'roygatjens@iskf.cr',
      rank: 'Director Nacional ISKF / 7° Dan',
      role: 'Director Nacional / Sinodal Principal',
      dojoName: 'Honbu Dojo ISKF Costa Rica',
      isPermanent: true
    };
    initialSenseis.push(royGatjens);

    // Completar hasta 3 evaluadores por defecto si están disponibles,
    // EXCLUYENDO rigurosamente al sensei titular del dojo a evaluar (conflicto de interés)
    for (const s of availableSenseis) {
      if (initialSenseis.length >= 3) break;
      if (isDojoOwnerSensei(s, targetDojo)) continue;
      if (!initialSenseis.some(item => item.email === s.email)) {
        initialSenseis.push(s);
      }
    }

    setSelectedSenseisForCall(initialSenseis);
    setNewCallForm({
      title: targetDojo ? `Convocatoria Oficial de Examen Técnico — ${targetDojo.name}` : 'Examen Técnico ISKF',
      dojoId: targetDojo?._id || targetDojo?.id || selectedDojoId,
      examDate: new Date().toISOString().split('T')[0],
      startTime: '09:00 AM',
      location: targetDojo?.location || targetDojo?.address || '',
      notes: '',
      maxPerTanda: 6,
    });
    setShowNewCallModal(true);
  };

  // Crear una nueva convocatoria oficial de examen y matricular los aspirantes listos
  const handleCreateExamCall = async (e) => {
    e.preventDefault();
    const targetDojoId = newCallForm.dojoId || selectedDojoId;
    const targetDojo = dojos.find(d => (d._id || d.id) === targetDojoId) || selectedDojo;

    if (!targetDojoId || !targetDojo) {
      showAlert('Por favor selecciona el Dojo donde se realizará el examen.', 'Atención', true);
      return;
    }

    // Filtrar para excluir cualquier Sensei titular del dojo a evaluar
    const validSenseis = (selectedSenseisForCall || []).filter(s => !isDojoOwnerSensei(s, targetDojo));

    if (validSenseis.length === 0) {
      showAlert('Por favor convoca entre 1 y 5 Senseis evaluadores. El Sensei titular del dojo a evaluar no puede evaluarse a sí mismo.', 'Tribunal Requerido', true);
      return;
    }

    setIsCreatingCall(true);
    try {
      const evaluatorsList = validSenseis.slice(0, 5).map((s, idx) => ({
        name: s.name,
        email: s.email,
        role: idx === 0 ? 'Sinodal Principal' : `Sinodal ${idx + 1}`
      }));

      const res = await createTechnicalExamCall({
        dojoId: targetDojo._id || targetDojo.id,
        title: newCallForm.title,
        examDate: newCallForm.examDate,
        startTime: newCallForm.startTime,
        location: newCallForm.location || targetDojo.location || targetDojo.address || '',
        notes: newCallForm.notes,
        evaluators: evaluatorsList,
        syllabusIds: [selectedSyllabusId],
        maxPerTanda: Number(newCallForm.maxPerTanda) > 0 ? Number(newCallForm.maxPerTanda) : 6
      });

      if (res.success) {
        setShowNewCallModal(false);
        setCreatedCallResult(null);
        setSelectedCallForDetail(null);
        const calls = await getExamCallsByDojo('all');
        setExamCalls(calls || []);
      } else {
        showAlert(res.error || 'Error al crear la convocatoria.', 'Error', true);
      }
    } catch (err) {
      console.error(err);
      showAlert('Error al conectar con el servidor.', 'Error', true);
    } finally {
      setIsCreatingCall(false);
    }
  };

  // Abrir modal de edición de Senseis del Tribunal Evaluador para una convocatoria creada
  const handleOpenEditTribunal = (call) => {
    if (!call) return;
    setEditingTribunalCall(call);
    const existing = Array.isArray(call.evaluators) ? call.evaluators : [];
    const callDojo = dojos.find(d => (d._id || d.id)?.toString() === (call.dojoId?._id || call.dojoId)?.toString()) || selectedDojo;
    
    // Normalizar lista de senseis actuales mapeándolos con availableSenseis si existe coincidencia
    let currentList = existing.map((ev, idx) => {
      const match = availableSenseis.find(s => 
        (s.email && ev.email && s.email.toLowerCase() === ev.email.toLowerCase()) ||
        (s.name && ev.name && s.name.toLowerCase() === ev.name.toLowerCase())
      );
      return match || {
        name: ev.name || `Sensei ${idx + 1}`,
        email: ev.email || `sensei_${idx + 1}@iskf.cr`,
        role: ev.role || (idx === 0 ? 'Director Nacional / Sinodal Principal' : `Sinodal ${idx + 1}`),
        dojoName: 'Dojo Convocado',
        province: 'Costa Rica',
        token: ev.token
      };
    });

    // Excluir al sensei titular del dojo evaluado para evitar conflicto de interés
    currentList = currentList.filter(s => !isDojoOwnerSensei(s, callDojo));

    // Asegurar que Sensei Roy Gatjens (Director Nacional) siempre esté convocado
    const roy = availableSenseis.find(s => s.name.toLowerCase().includes('gatjens') && !s.name.toLowerCase().includes('lee')) || {
      name: 'Sensei Roy Gatjens',
      email: 'roygatjens@iskf.cr',
      role: 'Director Nacional / Sinodal Principal',
      isPermanent: true
    };
    if (!currentList.some(s => s.name.toLowerCase().includes('gatjens') && !s.name.toLowerCase().includes('lee'))) {
      currentList.unshift(roy);
    }

    setEditingSenseisList(currentList);
    setCustomSenseiName('');
    setCustomSenseiEmail('');
  };

  const handleToggleSenseiForEdit = (sensei) => {
    const isDirector = Boolean(sensei.isPermanent || (sensei.name.toLowerCase().includes('gatjens') && !sensei.name.toLowerCase().includes('lee')));
    if (isDirector) return; // Sensei Roy Gatjens es inamovible en la mesa colegiada

    const callDojo = dojos.find(d => (d._id || d.id)?.toString() === (editingTribunalCall?.dojoId?._id || editingTribunalCall?.dojoId)?.toString()) || selectedDojo;
    if (isDojoOwnerSensei(sensei, callDojo)) {
      showAlert(`Sensei ${sensei.name} es el titular del dojo a evaluar y no puede formar parte del tribunal examinador de sus propios alumnos.`, 'Conflicto de Interés', true);
      return;
    }

    const isAlready = editingSenseisList.some(s => 
      (s.email && sensei.email && s.email.toLowerCase() === sensei.email.toLowerCase()) ||
      (s.name && sensei.name && s.name.toLowerCase() === sensei.name.toLowerCase())
    );

    if (isAlready) {
      if (editingSenseisList.length <= 1) {
        showAlert('El tribunal debe contar con al menos 1 Sensei evaluador.', 'Atención', true);
        return;
      }
      setEditingSenseisList(prev => prev.filter(s => 
        (s.email && sensei.email ? s.email.toLowerCase() !== sensei.email.toLowerCase() : true) &&
        (s.name && sensei.name ? s.name.toLowerCase() !== sensei.name.toLowerCase() : true)
      ));
    } else {
      if (editingSenseisList.length >= 5) {
        showAlert('El tribunal colegiado permite un máximo de 5 Senseis evaluadores.', 'Límite Máximo', true);
        return;
      }
      setEditingSenseisList(prev => [...prev, sensei]);
    }
  };

  const handleAddCustomSenseiToEdit = () => {
    const name = customSenseiName.trim();
    if (!name) {
      showAlert('Por favor ingresa el nombre del Sensei.', 'Dato Requerido', true);
      return;
    }
    if (editingSenseisList.length >= 5) {
      showAlert('El tribunal colegiado permite un máximo de 5 Senseis evaluadores.', 'Límite Máximo', true);
      return;
    }
    const email = customSenseiEmail.trim() || `sensei.${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@iskf.cr`;
    const cleanName = name.startsWith('Sensei ') ? name : `Sensei ${name}`;
    const newSensei = {
      name: cleanName,
      email: email.toLowerCase(),
      role: `Sinodal ${editingSenseisList.length + 1}`,
      dojoName: 'Sensei Invitado / Sinodal',
      province: 'Costa Rica'
    };

    const callDojo = dojos.find(d => (d._id || d.id)?.toString() === (editingTribunalCall?.dojoId?._id || editingTribunalCall?.dojoId)?.toString()) || selectedDojo;
    if (isDojoOwnerSensei(newSensei, callDojo)) {
      showAlert(`El Sensei ${cleanName} es titular del dojo a evaluar y no puede agregarse al tribunal.`, 'Conflicto de Interés', true);
      return;
    }

    setEditingSenseisList(prev => [...prev, newSensei]);
    setCustomSenseiName('');
    setCustomSenseiEmail('');
  };

  const handleSaveEditedTribunal = async () => {
    if (!editingTribunalCall) return;
    if (editingSenseisList.length < 1 || editingSenseisList.length > 5) {
      showAlert('El tribunal debe contar con entre 1 y 5 Senseis evaluadores.', 'Tribunal Inválido', true);
      return;
    }
    setIsUpdatingTribunal(true);
    try {
      const callId = editingTribunalCall._id || editingTribunalCall.id;
      const res = await updateExamCallSchedulesAndEvaluators({
        callId,
        evaluators: editingSenseisList,
        schedules: editingTribunalCall.schedules || []
      });

      if (res.success) {
        showAlert('Tribunal evaluador actualizado con éxito en la convocatoria.', 'Tribunal Actualizado');
        const updatedEvaluators = res.evaluators || editingSenseisList;
        // Actualizar lista local de examCalls
        setExamCalls(prev => prev.map(c => {
          if ((c._id || c.id) === callId) {
            return {
              ...c,
              evaluators: updatedEvaluators,
              evaluatorCount: updatedEvaluators.length
            };
          }
          return c;
        }));
        // Si estamos viendo los detalles de esta misma convocatoria, sincronizarla
        setSelectedCallForDetail(prev => {
          if (prev && ((prev._id || prev.id) === callId)) {
            return {
              ...prev,
              evaluators: updatedEvaluators,
              evaluatorCount: updatedEvaluators.length
            };
          }
          return prev;
        });
        setEditingTribunalCall(null);
      } else {
        showAlert(res.error || 'Error al actualizar el tribunal evaluador.', 'Error', true);
      }
    } catch (err) {
      console.error('Error al guardar tribunal editado:', err);
      showAlert('Error de conexión al actualizar el tribunal evaluador.', 'Error', true);
    } finally {
      setIsUpdatingTribunal(false);
    }
  };

  // Abrir vista detallada de una convocatoria para gestionar examinandos y tandas
  const handleOpenCallDetail = async (call) => {
    setSelectedCallForDetail(call);
    setDetailMaxPerTanda(Number(call.maxPerTanda) || 6);
    setIsLoadingCallStudents(true);
    setStudentListFilterTab('promoted');
    setStudentSearchQuery('');
    setCallDetailSubTab('tandas');
    try {
      const [readyStudents, allStudents, freshSyllabi] = await Promise.all([
        getStudentsReadyForExam(call.dojoId),
        getStudentsByDojo(call.dojoId),
        getExamSyllabi()
      ]);
      setCallReadyStudents(readyStudents || []);
      setDojoAllStudents((allStudents || []).filter(s => s.status !== 'inactive'));
      if (freshSyllabi && freshSyllabi.length > 0) {
        setSyllabi(freshSyllabi);
      }

      if (Array.isArray(call.schedules) && call.schedules.length > 0) {
        setCallTandas(call.schedules.map((s, idx) => ({
          id: `tanda_${idx}_${Date.now()}`,
          blockName: s.blockName || `Tanda ${idx + 1}`,
          startTime: s.startTime || '09:00 AM',
          endTime: s.endTime || '09:45 AM',
          studentIds: Array.isArray(s.studentIds) ? s.studentIds.map(String) : []
        })));
      } else if (readyStudents && readyStudents.length > 0) {
        // Autodistribuir inicialmente en tandas según maxPerTanda si está vacía
        const chunks = [];
        const chunkSize = Number(call.maxPerTanda) || 6;
        for (let i = 0; i < readyStudents.length; i += chunkSize) {
          const chunk = readyStudents.slice(i, i + chunkSize);
          const tandaNum = Math.floor(i / chunkSize) + 1;
          const startM = (9 * 60) + (tandaNum - 1) * 45;
          const endM = startM + 45;
          const fmt = (min) => {
            const h = Math.floor(min / 60) % 24;
            const m = min % 60;
            const p = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
          };
          chunks.push({
            id: `tanda_${tandaNum}_${Date.now()}`,
            blockName: `Tanda ${tandaNum}`,
            startTime: fmt(startM),
            endTime: fmt(endM),
            studentIds: chunk.map(s => s._id || s.id)
          });
        }
        setCallTandas(chunks);
      } else {
        setCallTandas([]);
      }
    } catch (err) {
      console.error("Error al abrir detalle de convocatoria:", err);
      showAlert("Error al cargar los examinandos de la convocatoria.", "Error", true);
    } finally {
      setIsLoadingCallStudents(false);
    }
  };

  // Reagrupar automáticamente a los examinandos en tandas según detailMaxPerTanda
  const handleAutoGroupTandas = () => {
    if (callReadyStudents.length === 0) {
      showAlert('No hay estudiantes listos para examen en este dojo para agrupar.', 'Sin Examinandos', true);
      return;
    }
    const maxPerTanda = detailMaxPerTanda || 6;
    const chunks = [];
    const chunkSize = maxPerTanda;
    for (let i = 0; i < callReadyStudents.length; i += chunkSize) {
      const chunk = callReadyStudents.slice(i, i + chunkSize);
      const tandaNum = Math.floor(i / chunkSize) + 1;
      const startM = (9 * 60) + (tandaNum - 1) * 45;
      const endM = startM + 45;
      const fmt = (min) => {
        const h = Math.floor(min / 60) % 24;
        const m = min % 60;
        const p = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
      };
      chunks.push({
        id: `tanda_${tandaNum}_${Date.now()}`,
        blockName: `Tanda ${tandaNum}`,
        startTime: fmt(startM),
        endTime: fmt(endM),
        studentIds: chunk.map(s => s._id || s.id)
      });
    }
    setCallTandas(chunks);
    persistTandasEvent(chunks);
    showAlert(`Se organizaron ${callReadyStudents.length} examinandos en ${chunks.length} tandas de ${maxPerTanda} karatecas.`, 'Tandas Organizadas');
  };

  // Funciones utilitarias para cálculo y sincronización de horarios de tandas
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 9 * 60;
    const clean = timeStr.trim().toUpperCase();
    const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
    if (!match) return 9 * 60;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3];

    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    return (hours * 60) + minutes;
  };

  const minutesToFormattedTime = (totalMinutes) => {
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    const hours24 = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    const meridiem = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`;
  };

  const getTandaDurationStr = (startTime, endTime) => {
    const startM = parseTimeToMinutes(startTime);
    const endM = parseTimeToMinutes(endTime);
    let diff = endM - startM;
    if (diff < 0) diff += 1440;
    return `${diff} min`;
  };

  // Sincronización en cascada de tandas para evitar solapamientos y desfases
  const syncTandasCascade = (tandas, tIdx, field, targetMinutes) => {
    const list = tandas.map(t => ({ ...t }));

    if (field === 'endTime') {
      const startM = parseTimeToMinutes(list[tIdx].startTime);
      let endM = targetMinutes;
      // La hora fin no puede ser menor o igual a la hora de inicio de la misma tanda
      if (endM <= startM) {
        endM = startM + 15;
      }
      list[tIdx].endTime = minutesToFormattedTime(endM);

      // Sincronizar en cascada hacia la tanda siguiente y posteriores
      if (tIdx < list.length - 1) {
        let currentHandover = endM;
        for (let nextIdx = tIdx + 1; nextIdx < list.length; nextIdx++) {
          const nextStartM = parseTimeToMinutes(list[nextIdx].startTime);
          const nextEndM = parseTimeToMinutes(list[nextIdx].endTime);
          const duration = Math.max(15, nextEndM - nextStartM);

          list[nextIdx].startTime = minutesToFormattedTime(currentHandover);
          const newNextEndM = currentHandover + duration;
          list[nextIdx].endTime = minutesToFormattedTime(newNextEndM);
          currentHandover = newNextEndM;
        }
      }
    } else if (field === 'startTime') {
      const startM = targetMinutes;
      list[tIdx].startTime = minutesToFormattedTime(startM);

      const currentEndM = parseTimeToMinutes(list[tIdx].endTime);
      if (currentEndM <= startM) {
        list[tIdx].endTime = minutesToFormattedTime(startM + 15);
      }

      // Sincronizar hacia la tanda anterior (su fin es el inicio de la actual)
      if (tIdx > 0) {
        const prevIdx = tIdx - 1;
        list[prevIdx].endTime = minutesToFormattedTime(startM);
        const prevStartM = parseTimeToMinutes(list[prevIdx].startTime);
        if (prevStartM >= startM) {
          list[prevIdx].startTime = minutesToFormattedTime(Math.max(0, startM - 15));
        }
      }

      // Asegurar que las tandas siguientes mantengan continuidad
      const updatedEndM = parseTimeToMinutes(list[tIdx].endTime);
      if (tIdx < list.length - 1) {
        let currentHandover = updatedEndM;
        for (let nextIdx = tIdx + 1; nextIdx < list.length; nextIdx++) {
          const nextStartM = parseTimeToMinutes(list[nextIdx].startTime);
          const nextEndM = parseTimeToMinutes(list[nextIdx].endTime);
          const duration = Math.max(15, nextEndM - nextStartM);

          list[nextIdx].startTime = minutesToFormattedTime(currentHandover);
          const newNextEndM = currentHandover + duration;
          list[nextIdx].endTime = minutesToFormattedTime(newNextEndM);
          currentHandover = newNextEndM;
        }
      }
    }

    return list;
  };

  // Ajustar hora de tanda mediante botones arriba/abajo (stepper de 15 min)
  const handleStepTandaTime = (tIdx, field, deltaMinutes) => {
    if (!callTandas || !callTandas[tIdx]) return;
    const currentM = parseTimeToMinutes(callTandas[tIdx][field]);
    const targetM = currentM + deltaMinutes;
    const updated = syncTandasCascade(callTandas, tIdx, field, targetM);
    setCallTandas(updated);
    persistTandasEvent(updated);
  };

  // Ajustar hora de tanda mediante tipeo directo
  const handleUpdateTandaTime = (tIdx, field, value) => {
    if (!callTandas || !callTandas[tIdx]) return;
    const newTandas = callTandas.map(t => ({ ...t }));
    newTandas[tIdx][field] = value;
    const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
      const targetM = parseTimeToMinutes(value);
      const updated = syncTandasCascade(newTandas, tIdx, field, targetM);
      setCallTandas(updated);
      persistTandasEvent(updated);
    } else {
      setCallTandas(newTandas);
    }
  };

  // Agregar una nueva tanda vacía
  const handleAddNewTanda = () => {
    const nextNum = callTandas.length + 1;
    let startM = 9 * 60;
    if (callTandas.length > 0) {
      const lastTanda = callTandas[callTandas.length - 1];
      startM = parseTimeToMinutes(lastTanda.endTime);
    }
    const endM = startM + 45;
    const newTandas = [
      ...callTandas,
      {
        id: `tanda_${nextNum}_${Date.now()}`,
        blockName: `Tanda ${nextNum}`,
        startTime: minutesToFormattedTime(startM),
        endTime: minutesToFormattedTime(endM),
        studentIds: []
      }
    ];
    setCallTandas(newTandas);
    persistTandasEvent(newTandas);
  };

  // Eliminar una tanda y resincronizar
  const handleRemoveTanda = (tandaId) => {
    const newTandas = callTandas.filter(t => t.id !== tandaId);
    setCallTandas(newTandas);
    persistTandasEvent(newTandas);
  };

  // Modificar campo de una tanda (blockName)
  const handleUpdateTandaField = (tandaId, field, value) => {
    const newTandas = callTandas.map(t => {
      if (t.id === tandaId) {
        return { ...t, [field]: value };
      }
      return t;
    });
    setCallTandas(newTandas);
    persistTandasEvent(newTandas);
  };

  // Asignar estudiante a una tanda respetando el límite configurado detailMaxPerTanda
  const handleAddStudentToTanda = (tandaId, studentId) => {
    const maxPerTanda = detailMaxPerTanda || 6;
    const target = callTandas.find(t => t.id === tandaId);
    if (!target) return;
    if (target.studentIds.includes(studentId)) return;
    if (target.studentIds.length >= maxPerTanda) {
      showAlert(`Esta tanda ya tiene el aforo completo de ${maxPerTanda} karatecas.`, 'Tanda Completa', true);
      return;
    }
    const newTandas = callTandas.map(t => {
      if (t.id === tandaId) {
        return { ...t, studentIds: [...t.studentIds, studentId] };
      }
      // Si el estudiante ya estaba en otra tanda, removerlo de esa para mantener unicidad
      return { ...t, studentIds: t.studentIds.filter(id => id !== studentId) };
    });
    setCallTandas(newTandas);
    persistTandasEvent(newTandas);
  };

  // Remover estudiante de una tanda
  const handleRemoveStudentFromTanda = (tandaId, studentId) => {
    const newTandas = callTandas.map(t => {
      if (t.id === tandaId) {
        return { ...t, studentIds: t.studentIds.filter(id => id !== studentId) };
      }
      return t;
    });
    setCallTandas(newTandas);
    persistTandasEvent(newTandas);
  };

  // Convocar o despostular a un karateca directamente desde la vista de tandas (sin recargar)
  const handleToggleStudentPromotion = async (student, shouldPromote) => {
    if (!selectedCallForDetail) return;
    const sId = student._id || student.id;
    const callId = selectedCallForDetail._id || selectedCallForDetail.id;

    setIsTogglingPromotionId(sId);
    try {
      const res = await toggleStudentPromotionForCall({
        callId,
        studentId: sId,
        isPromoted: shouldPromote,
        targetRank: student.currentRank
      });

      if (!res.success) {
        showAlert(res.error || 'Error al actualizar el estado de convocatoria.', 'Error', true);
        return;
      }

      if (shouldPromote) {
        setCallReadyStudents(prev => {
          if (prev.some(s => (s._id || s.id) === sId)) return prev;
          return [...prev, { ...student, isPromotedForExam: true }];
        });
      } else {
        setCallReadyStudents(prev => prev.filter(s => (s._id || s.id) !== sId));
        const updated = callTandas.map(t => ({
          ...t,
          studentIds: (t.studentIds || []).filter(id => id !== sId)
        }));
        setCallTandas(updated);
        persistTandasEvent(updated);
      }
    } catch (err) {
      console.error('Error al cambiar postulación de alumno:', err);
      showAlert('Error de conexión al actualizar la postulación.', 'Error', true);
    } finally {
      setIsTogglingPromotionId(null);
    }
  };

  // Drag and Drop de karatecas entre tandas y lista de convocados
  const handleStudentDragStart = (e, studentId, sourceTandaId) => {
    const payload = { studentId, sourceTandaId };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.setData('text/plain', studentId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedStudentData(payload);
  };

  const handleStudentDragEnd = () => {
    setDraggedStudentData(null);
    setDragOverTargetId(null);
    setDragOverStudentId(null);
  };

  const handleStudentDragOver = (e, targetStudentId) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStudentId !== targetStudentId) {
      setDragOverStudentId(targetStudentId);
    }
  };

  const handleStudentDragLeave = (e, targetStudentId) => {
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverStudentId === targetStudentId) {
      setDragOverStudentId(null);
    }
  };

  // Intercambiar karatecas (dentro de la misma tanda para reordenar, o entre diferentes tandas)
  const handleDropOnStudent = (e, targetStudentId, targetTandaId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverStudentId(null);
    setDragOverTargetId(null);

    let data = draggedStudentData;
    if (!data) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) data = JSON.parse(raw);
      } catch (err) {
        console.debug('Error al leer datos transferidos:', err);
      }
    }
    if (!data || !data.studentId) return;

    const { studentId, sourceTandaId } = data;
    if (studentId === targetStudentId) {
      setDraggedStudentData(null);
      return;
    }

    let updated = callTandas;
    // 1. Misma tanda: Intercambiar posiciones entre los dos karatecas (reordenar)
    if (sourceTandaId === targetTandaId) {
      updated = callTandas.map(t => {
        if (t.id === targetTandaId) {
          const ids = [...(t.studentIds || [])];
          const idxSource = ids.indexOf(studentId);
          const idxTarget = ids.indexOf(targetStudentId);
          if (idxSource !== -1 && idxTarget !== -1) {
            ids[idxSource] = targetStudentId;
            ids[idxTarget] = studentId;
          }
          return { ...t, studentIds: ids };
        }
        return t;
      });
    } else if (sourceTandaId && sourceTandaId !== targetTandaId) {
      // 2. Diferentes tandas: Intercambio 1 a 1 entre tandas (no altera el aforo total de ninguna)
      updated = callTandas.map(t => {
        if (t.id === targetTandaId) {
          const ids = (t.studentIds || []).map(id => id === targetStudentId ? studentId : id);
          return { ...t, studentIds: ids };
        }
        if (t.id === sourceTandaId) {
          const ids = (t.studentIds || []).map(id => id === studentId ? targetStudentId : id);
          return { ...t, studentIds: ids };
        }
        return t;
      });
    } else {
      // 3. Viene de la lista de convocados (sin asignar): sustituye al karateca en la tanda
      updated = callTandas.map(t => {
        if (t.id === targetTandaId) {
          const ids = (t.studentIds || []).map(id => id === targetStudentId ? studentId : id);
          return { ...t, studentIds: ids };
        }
        return { ...t, studentIds: (t.studentIds || []).filter(id => id !== studentId) };
      });
    }
    setCallTandas(updated);
    persistTandasEvent(updated);

    // Si el estudiante arrastrado aún no estaba postulado en la convocatoria, autopostularlo de inmediato
    const unpromotedStudent = dojoAllStudents.find(s => (s._id || s.id) === studentId);
    if (unpromotedStudent && !callReadyStudents.some(s => (s._id || s.id) === studentId)) {
      setCallReadyStudents(prev => [...prev, { ...unpromotedStudent, isPromotedForExam: true }]);
      toggleStudentPromotionForCall({
        callId: selectedCallForDetail._id || selectedCallForDetail.id,
        studentId,
        isPromoted: true,
        targetRank: unpromotedStudent.currentRank
      }).catch(err => console.error('Error al autopostular karateca:', err));
    }

    setDraggedStudentData(null);
  };

  const handleTandaDragOver = (e, tandaId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTargetId !== tandaId) {
      setDragOverTargetId(tandaId);
    }
  };

  const handleTandaDragLeave = (e, tandaId) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverTargetId === tandaId) {
      setDragOverTargetId(null);
    }
  };

  const handleDropOnTanda = (e, targetTandaId) => {
    e.preventDefault();
    setDragOverTargetId(null);
    let data = draggedStudentData;
    if (!data) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) data = JSON.parse(raw);
      } catch (err) {
        console.debug('Error al leer datos transferidos:', err);
      }
    }
    if (!data || !data.studentId) return;

    const { studentId, sourceTandaId } = data;
    if (sourceTandaId === targetTandaId) {
      setDraggedStudentData(null);
      return;
    }

    const maxPerTanda = detailMaxPerTanda || 6;
    const target = callTandas.find(t => t.id === targetTandaId);
    if (!target) return;
    if ((target.studentIds || []).includes(studentId)) return;
    if ((target.studentIds || []).length >= maxPerTanda) {
      showAlert(`Esta tanda ya tiene el aforo completo de ${maxPerTanda} karatecas.`, 'Tanda Completa', true);
      return;
    }

    // Si el estudiante arrastrado aún no estaba postulado en la convocatoria, autopostularlo de inmediato
    const unpromoted = dojoAllStudents.find(s => (s._id || s.id) === studentId);
    if (unpromoted && !callReadyStudents.some(s => (s._id || s.id) === studentId)) {
      setCallReadyStudents(prevReady => [...prevReady, { ...unpromoted, isPromotedForExam: true }]);
      toggleStudentPromotionForCall({
        callId: selectedCallForDetail._id || selectedCallForDetail.id,
        studentId,
        isPromoted: true,
        targetRank: unpromoted.currentRank
      }).catch(err => console.error('Error al autopostular karateca:', err));
    }

    const updated = callTandas.map(t => {
      if (t.id === targetTandaId) {
        return { ...t, studentIds: [...(t.studentIds || []), studentId] };
      }
      if (t.id === sourceTandaId || (t.studentIds || []).includes(studentId)) {
        return { ...t, studentIds: (t.studentIds || []).filter(id => id !== studentId) };
      }
      return t;
    });
    setCallTandas(updated);
    persistTandasEvent(updated);
    setDraggedStudentData(null);
  };

  const handleDropOnUnassigned = (e) => {
    e.preventDefault();
    setDragOverTargetId(null);
    let data = draggedStudentData;
    if (!data) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) data = JSON.parse(raw);
      } catch (err) {
        console.debug('Error al leer datos transferidos:', err);
      }
    }
    if (!data || !data.studentId) return;
    const { studentId, sourceTandaId } = data;
    if (!sourceTandaId) {
      setDraggedStudentData(null);
      return;
    }

    const updated = callTandas.map(t => {
      if (t.id === sourceTandaId || (t.studentIds || []).includes(studentId)) {
        return { ...t, studentIds: (t.studentIds || []).filter(id => id !== studentId) };
      }
      return t;
    });
    setCallTandas(updated);
    persistTandasEvent(updated);
    setDraggedStudentData(null);
  };

  // Drag and Drop para reordenar tandas completas
  const handleTandaDragStart = (e, tandaId, index) => {
    e.stopPropagation();
    const payload = { type: 'tanda', tandaId, index };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.setData('text/plain', `tanda:${tandaId}`);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTandaData(payload);
  };

  const handleTandaDragEnd = () => {
    setDraggedTandaData(null);
    setDragOverTandaReorderIndex(null);
  };

  const handleDropReorderTanda = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTandaReorderIndex(null);

    let data = draggedTandaData;
    if (!data) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) data = JSON.parse(raw);
      } catch (err) {
        console.debug('Error al leer datos de tanda arrastrada:', err);
      }
    }
    if (!data || data.type !== 'tanda') return;

    const sourceIndex = data.index;
    if (sourceIndex === targetIndex) {
      setDraggedTandaData(null);
      return;
    }

    const list = [...callTandas];
    const [movedTanda] = list.splice(sourceIndex, 1);
    list.splice(targetIndex, 0, movedTanda);

    // Recalcular horarios continuos manteniendo la duración de cada bloque
    if (list.length > 0) {
      let currentM = parseTimeToMinutes(callTandas[0].startTime);
      for (let i = 0; i < list.length; i++) {
        const prevStart = parseTimeToMinutes(list[i].startTime);
        const prevEnd = parseTimeToMinutes(list[i].endTime);
        const duration = Math.max(15, prevEnd - prevStart);

        list[i].startTime = minutesToFormattedTime(currentM);
        currentM += duration;
        list[i].endTime = minutesToFormattedTime(currentM);

        // Si el nombre sigue la numeración estándar 'Tanda X', sincronizar su número
        if (/^Tanda\s+\d+$/i.test(list[i].blockName || '')) {
          list[i].blockName = `Tanda ${i + 1}`;
        }
      }
    }

    setCallTandas(list);
    persistTandasEvent(list);
    setDraggedTandaData(null);
  };

  // Mover tanda arriba o abajo con botones step
  const handleMoveTandaStep = (index, delta) => {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= callTandas.length) return;

    const list = [...callTandas];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    if (list.length > 0) {
      let currentM = parseTimeToMinutes(callTandas[0].startTime);
      for (let i = 0; i < list.length; i++) {
        const prevStart = parseTimeToMinutes(list[i].startTime);
        const prevEnd = parseTimeToMinutes(list[i].endTime);
        const duration = Math.max(15, prevEnd - prevStart);

        list[i].startTime = minutesToFormattedTime(currentM);
        currentM += duration;
        list[i].endTime = minutesToFormattedTime(currentM);

        if (/^Tanda\s+\d+$/i.test(list[i].blockName || '')) {
          list[i].blockName = `Tanda ${i + 1}`;
        }
      }
    }

    setCallTandas(list);
    persistTandasEvent(list);
  };

  // Cerrar oficialmente una convocatoria con validación de completitud
  const handleCloseExamCall = async (callId, force = false) => {
    try {
      const res = await closeExamCall({ callId, force });
      if (res.success) {
        showAlert(res.message || 'Convocatoria de examen cerrada oficialmente. Se ha finalizado la mesa.', 'Examen Concluido');
        const calls = await getExamCallsByDojo('all');
        setExamCalls(calls || []);
      } else if (res.isIncomplete) {
        showConfirm({
          title: '⚠️ Examen Incompleto — Fases Pendientes',
          message: `${res.error}\n\n¿Deseas FORZAR el cierre anticipado de la convocatoria de todas formas? Al cerrarla, los sinodales no podrán registrar más notas.`,
          confirmText: 'Forzar Cierre Anticipado',
          cancelText: 'Volver y Completar Evaluación',
          isDanger: true,
          onConfirm: async () => {
            await handleCloseExamCall(callId, true);
          }
        });
      } else {
        showAlert(res.error || 'Error al cerrar convocatoria.', 'Error', true);
      }
    } catch (err) {
      console.error(err);
      showAlert('Error al procesar el cierre del examen.', 'Error', true);
    }
  };

  // Reabrir una convocatoria cerrada oficialmente para continuar evaluando
  const handleReopenExamCall = async (callId) => {
    showConfirm({
      title: '¿Reabrir Convocatoria de Examen?',
      message: 'Esta acción reactivará la convocatoria para que los sinodales puedan seguir evaluando y completando las notas de Kihon, Kata y Kumite.',
      confirmText: 'Sí, Reabrir Convocatoria',
      cancelText: 'Cancelar',
      isDanger: false,
      onConfirm: async () => {
        try {
          const res = await reopenExamCall({ callId, targetStatus: 'en_tatami' });
          if (res.success) {
            showAlert(res.message, 'Convocatoria Reabierta');
            const calls = await getExamCallsByDojo('all');
            setExamCalls(calls || []);
          } else {
            showAlert(res.error || 'Error al reabrir la convocatoria.', 'Error', true);
          }
        } catch (err) {
          console.error(err);
          showAlert('Error al reabrir la convocatoria.', 'Error', true);
        }
      }
    });
  };

  // Eliminar convocatoria permanentemente con confirmación
  const handleDeleteExamCall = (call) => {
    const callId = call._id || call.id;
    showConfirm({
      title: '¿Eliminar Convocatoria de Examen?',
      message: `¿Estás seguro de que deseas eliminar permanentemente la convocatoria "${call.title}"? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, Eliminar Convocatoria',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await deleteExamCall({ callId });
          if (res.success) {
            showAlert('La convocatoria ha sido eliminada exitosamente.', 'Convocatoria Eliminada');
            setExamCalls(prev => prev.filter(c => (c._id || c.id) !== callId));
            if (selectedCallForDetail && (selectedCallForDetail._id || selectedCallForDetail.id) === callId) {
              setSelectedCallForDetail(null);
            }
          } else {
            showAlert(res.error || 'Error al eliminar la convocatoria.', 'Error', true);
          }
        } catch (err) {
          console.error('Error al eliminar convocatoria:', err);
          showAlert('Error al procesar la eliminación de la convocatoria.', 'Error', true);
        }
      }
    });
  };

  // Descargar Certificado Oficial en PDF con firmas y observaciones condensadas
  const handleDownloadCertificate = async (item) => {
    try {
      const evals = item.evaluations || [];

      // Calcular promedios por grupo técnico: Kihon, Kata, Kumite
      const calcGroupScore = (grp) => {
        const groupTechs = examTechniques.filter(t => (t.group || t.phase || 'kihon').toLowerCase() === grp);
        if (groupTechs.length === 0) return 0;
        let total = 0;
        let count = 0;
        evals.forEach(ev => {
          groupTechs.forEach(t => {
            const score = ev.techniqueAverages?.[t.id];
            if (typeof score === 'number' && score > 0) {
              total += (score <= 10 ? score * 10 : score);
              count++;
            }
          });
        });
        return count > 0 ? Math.round(total / count) : 0;
      };

      const kihonScore = calcGroupScore('kihon');
      const kataScore = calcGroupScore('kata');
      const kumiteScore = calcGroupScore('kumite');
      const writtenScore = 95; // Nota teórica oficial
      // El promedio colegiado técnico es estrictamente entre las tres fases finales: Kihon, Kata y Kumite
      const activePhaseScores = [kihonScore, kataScore, kumiteScore].filter(v => typeof v === 'number' && v > 0);
      const finalScore = activePhaseScores.length > 0
        ? Math.round(activePhaseScores.reduce((sum, v) => sum + v, 0) / activePhaseScores.length)
        : (item.averagePercentage || 85);

      // Agrupar observaciones de texto de todos los Senseis por Kihon, Kata y Kumite
      const getGroupObservations = (grp) => {
        const groupTechs = examTechniques.filter(t => t.group === grp);
        const notes = [];
        evals.forEach(ev => {
          groupTechs.forEach(t => {
            const obs = ev.observations?.[t.id];
            if (obs && String(obs).trim().length > 0) {
              const trimmed = obs.trim();
              if (!notes.includes(trimmed)) {
                notes.push(trimmed);
              }
            }
          });
        });
        return notes.join('. ');
      };

      const kihonText = getGroupObservations('kihon');
      const kataText = getGroupObservations('kata');
      const kumiteText = getGroupObservations('kumite');

      // Aspectos Positivos
      let positiveText = '';
      if (item.aiSummary) {
        const lines = item.aiSummary
          .split('\n')
          .filter(l => l.includes('*') && (l.toLowerCase().includes('satisfactorio') || l.toLowerCase().includes('actitud') || l.toLowerCase().includes('firme') || l.toLowerCase().includes('disciplina') || l.toLowerCase().includes('constancia')));
        if (lines.length > 0) {
          positiveText = lines.map(l => l.replace(/^\*\s*/, '')).join('. ');
        }
      }
      if (!positiveText || positiveText.length < 15) {
        if (item.student.positiveAspects && item.student.positiveAspects.trim().length > 0) {
          positiveText = item.student.positiveAspects.trim();
        } else {
          positiveText = `${item.student.name} es un ejemplo de tenacidad y disciplina en el dojo, luchando diariamente con esfuerzo continuo. Su constancia en los entrenamientos es admirable, siempre esforzándose por dar lo mejor de sí y superando valientemente cualquier desafío que se le presente.`;
        }
      }

      const generalComment = 'Tomar las notas y recomendaciones anteriores para corregir y asi mejorar su nivel';

      await generateTechnicalExamCertificatePDF({
        studentName: item.student.name,
        dojoName: selectedDojo?.name || 'Kuma',
        dojoSensei: selectedDojo?.sensei || 'David Artavia Rodríguez',
        targetRank: activeSyllabus?.targetRank || item.student.currentRank,
        examDate: new Date().toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' }),
        kihonScore,
        kataScore,
        kumiteScore,
        writtenScore,
        finalScore,
        isPassed: item.isPassed,
        kihonText,
        kataText,
        kumiteText,
        positiveText,
        generalComment,
        evaluators: tribunalSenseis
      });
    } catch (err) {
      console.error(err);
      showAlert('Error al generar la boleta oficial de examen en PDF.', 'Error', true);
    }
  };

  // Estudiantes candidatos en tatami: ÚNICAMENTE los postulados/promovidos con "Listo para Examen"
  const candidateStudents = useMemo(() => {
    return students.filter(s => Boolean(s.isPromotedForExam || s.isReadyForExam));
  }, [students]);

  const totalTatamiBatches = useMemo(() => {
    return Math.max(1, Math.ceil(candidateStudents.length / 6));
  }, [candidateStudents]);

  // Asegurar que el índice de tanda esté siempre dentro de los límites si cambia la lista
  useEffect(() => {
    if (tatamiBatchIndex >= totalTatamiBatches) {
      setTatamiBatchIndex(0);
    }
  }, [tatamiBatchIndex, totalTatamiBatches]);

  const currentTatamiGroup = useMemo(() => {
    return candidateStudents.slice(tatamiBatchIndex * 6, (tatamiBatchIndex + 1) * 6);
  }, [candidateStudents, tatamiBatchIndex]);

  const activeTechnique = useMemo(() => {
    return examTechniques[activeTechniqueIndex] || examTechniques[0];
  }, [examTechniques, activeTechniqueIndex]);

  const adminStarTrackerRef = useRef({});

  // Manejo de puntuación de un rubro específico (1 a 10 estrellas)
  const applyTatamiScore = (studentId, techniqueId, rubricId, score) => {
    setTatamiScores(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [techniqueId]: {
          ...((prev[studentId] || {})[techniqueId] || {}),
          [rubricId]: score
        }
      }
    }));
  };

  const handleAdminStarClick = (studentId, techniqueId, rubricId, starNum, e) => {
    e?.preventDefault?.();
    const cellKey = `${studentId}__${techniqueId}__${rubricId}`;
    const now = Date.now();
    const tracker = adminStarTrackerRef.current[cellKey] || { time: 0, star: null, initialVal: 0 };
    const isQuickSecondClick = tracker.star === starNum && (now - tracker.time < 350);

    const currentScore = tatamiScores[studentId]?.[techniqueId]?.[rubricId] || 0;

    if (isQuickSecondClick) {
      const baseVal = tracker.initialVal;
      const targetVal = (baseVal === starNum - 0.5 || currentScore === starNum - 0.5)
        ? starNum
        : starNum - 0.5;
      adminStarTrackerRef.current[cellKey] = { time: 0, star: null, initialVal: targetVal };
      applyTatamiScore(studentId, techniqueId, rubricId, targetVal);
    } else {
      adminStarTrackerRef.current[cellKey] = { time: now, star: starNum, initialVal: currentScore };
      applyTatamiScore(studentId, techniqueId, rubricId, starNum);
    }
  };

  const handleAdminStarDoubleClick = (studentId, techniqueId, rubricId, starNum, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const cellKey = `${studentId}__${techniqueId}__${rubricId}`;
    const currentScore = tatamiScores[studentId]?.[techniqueId]?.[rubricId] || 0;
    const targetVal = currentScore === starNum ? starNum - 0.5 : (currentScore === starNum - 0.5 ? starNum : starNum - 0.5);
    adminStarTrackerRef.current[cellKey] = { time: 0, star: null, initialVal: targetVal };
    applyTatamiScore(studentId, techniqueId, rubricId, targetVal);
  };

  // Manejo de observaciones puntuales por técnica para cada estudiante
  const handleSetObservation = (studentId, techniqueId, text) => {
    setTatamiObservations(prev => {
      const studentMap = prev[studentId] || {};
      return {
        ...prev,
        [studentId]: {
          ...studentMap,
          [techniqueId]: text
        }
      };
    });
  };

  // Promedio de un estudiante en la técnica activa (1 a 5 estrellas)
  const getStudentTechniqueScore = (studentId, technique) => {
    const sScores = tatamiScores[studentId]?.[technique.id] || {};
    const values = technique.rubrics.map(r => sScores[r.id] || 0).filter(v => v > 0);
    if (values.length === 0) return null;
    const avg = values.reduce((a, b) => a + b, 0) / technique.rubrics.length;
    return avg.toFixed(1);
  };

  // Calificación global del estudiante en todo el examen (0 a 100%)
  const getStudentOverallExam = (studentId) => {
    const sMap = tatamiScores[studentId] || {};
    let totalScore = 0;
    let totalMax = 0;
    examTechniques.forEach(tech => {
      const tScores = sMap[tech.id] || {};
      tech.rubrics.forEach(r => {
        const val = tScores[r.id] || 0;
        if (val > 0) {
          totalMax += 10;
          totalScore += val;
        }
      });
    });
    if (totalMax === 0) return { pct: 0, points: 0, totalMax: 0, isPassed: false };
    const pct = Math.round((totalScore / totalMax) * 100);
    return {
      pct,
      points: totalScore,
      totalMax,
      isPassed: pct >= 70
    };
  };

  // Modal Crear / Editar Estudiante
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentModalMode, setStudentModalMode] = useState('create'); // 'create' | 'edit'
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [studentBirthDate, setStudentBirthDate] = useState('');
  const [studentRank, setStudentRank] = useState(KYU_OPTIONS[0]);
  const [studentNotes, setStudentNotes] = useState('');
  const [studentPhoto, setStudentPhoto] = useState('');
  const [studentPositiveAspects, setStudentPositiveAspects] = useState('');
  const [studentHasSpecialCondition, setStudentHasSpecialCondition] = useState(false);
  const [studentSpecialCondition, setStudentSpecialCondition] = useState('');
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const photoInputRef = useRef(null);

  // Modales de Alerta y Confirmación
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    isDanger: true,
    onConfirm: () => {}
  });

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    isError: false
  });

  const showAlert = (message, title = 'Atención', isError = false) => {
    setAlertModal({ isOpen: true, title, message, isError });
  };

  const showConfirm = ({ title, message, onConfirm, confirmText = 'Confirmar', isDanger = true }) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, confirmText, isDanger });
  };

  // Dojo actualmente seleccionado
  const selectedDojo = useMemo(() => {
    return dojos.find(d => (d._id || d.id) === selectedDojoId) || null;
  }, [dojos, selectedDojoId]);

  // Cargar estudiantes al cambiar el dojo
  useEffect(() => {
    if (!selectedDojoId) return;

    let isMounted = true;
    async function loadStudents() {
      setIsLoadingStudents(true);
      try {
        const data = await getStudentsByDojo(selectedDojoId);
        if (isMounted) {
          setStudents(data);
        }
      } catch (err) {
        console.error('Error cargando estudiantes:', err);
        if (isMounted) {
          showAlert('No se pudieron cargar los estudiantes de este dojo.', 'Error de Carga', true);
        }
      } finally {
        if (isMounted) {
          setIsLoadingStudents(false);
        }
      }
    }

    loadStudents();
    return () => { isMounted = false; };
  }, [selectedDojoId]);

  // Manejo de carga de fotografía de estudiante (máx 2MB)
  const handleStudentPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert('La foto es demasiado pesada. El tamaño máximo permitido es 2MB.', 'Archivo muy grande', true);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Manejo de Modal de Estudiante
  const handleOpenCreateStudent = () => {
    if (!selectedDojo) {
      showAlert('Primero debes seleccionar un dojo.', 'Atención', true);
      return;
    }
    setStudentModalMode('create');
    setEditingStudentId(null);
    setStudentName('');
    setStudentBirthDate('');
    setStudentRank(KYU_OPTIONS[0]);
    setStudentNotes('');
    setStudentPhoto('');
    setStudentPositiveAspects('');
    setStudentHasSpecialCondition(false);
    setStudentSpecialCondition('');
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student) => {
    setStudentModalMode('edit');
    setEditingStudentId(student._id || student.id);
    setStudentName(student.name || '');
    setStudentBirthDate(student.birthDate ? formatDateDDMMAAAA(student.birthDate) : '');
    setStudentRank(student.currentRank || KYU_OPTIONS[0]);
    setStudentNotes(student.notes || '');
    setStudentPhoto(student.photo || '');
    setStudentPositiveAspects(student.positiveAspects || '');
    setStudentHasSpecialCondition(Boolean(student.hasSpecialCondition));
    setStudentSpecialCondition(student.specialCondition || '');
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();

    if (!studentName.trim()) {
      showAlert('Por favor ingresa el nombre completo del estudiante.', 'Campo Requerido', true);
      return;
    }

    const cleanBirth = (studentBirthDate || '').trim();
    if (cleanBirth && cleanBirth !== 'No indicada' && cleanBirth !== 'No registrada') {
      const parsedBirth = parseCustomDate(cleanBirth);
      if (!parsedBirth) {
        showAlert('La fecha de nacimiento no es válida. Por favor utiliza el formato DD/MM/AAAA (ejemplo: 20/02/1995).', 'Fecha Inválida', true);
        return;
      }

      if (parsedBirth > new Date()) {
        showAlert('La fecha de nacimiento no puede ser una fecha futura.', 'Fecha Inválida', true);
        return;
      }
    }

    const finalPositiveAspects = (studentPositiveAspects || '').trim();
    const finalSpecialCondition = studentHasSpecialCondition
      ? (studentSpecialCondition.trim() || '• Condición especial')
      : '';

    setIsSavingStudent(true);
    try {
      if (studentModalMode === 'create') {
        const res = await createStudent({
          name: studentName,
          birthDate: cleanBirth,
          currentRank: studentRank,
          dojoId: selectedDojo._id || selectedDojo.id,
          notes: studentNotes,
          photo: studentPhoto,
          positiveAspects: finalPositiveAspects,
          hasSpecialCondition: studentHasSpecialCondition,
          specialCondition: finalSpecialCondition
        });

        if (res.success && res.student) {
          setStudents(prev => [...prev, res.student]);
          // Actualizar conteo en la lista de dojos
          setDojos(prev => prev.map(d => {
            if ((d._id || d.id) === selectedDojoId) {
              return { ...d, studentCount: (d.studentCount || 0) + 1 };
            }
            return d;
          }));
          setIsStudentModalOpen(false);
          showAlert(`Estudiante "${res.student.name}" registrado correctamente en ${selectedDojo.name}.`, 'Registro Exitoso');
        } else {
          showAlert(res.error || 'No se pudo registrar el estudiante.', 'Error', true);
        }
      } else {
        const res = await updateStudent(editingStudentId, {
          name: studentName,
          birthDate: cleanBirth,
          currentRank: studentRank,
          notes: studentNotes,
          photo: studentPhoto,
          positiveAspects: finalPositiveAspects,
          hasSpecialCondition: studentHasSpecialCondition,
          specialCondition: finalSpecialCondition
        });

        if (res.success && res.student) {
          setStudents(prev => prev.map(s => (String(s._id || s.id) === String(editingStudentId)) ? res.student : s));
          setCallReadyStudents(prev => prev.map(s => (String(s._id || s.id) === String(editingStudentId)) ? res.student : s));
          setDojoAllStudents(prev => prev.map(s => (String(s._id || s.id) === String(editingStudentId)) ? res.student : s));
          setIsStudentModalOpen(false);
          showAlert(`Datos de "${res.student.name}" actualizados con éxito.`, 'Actualización Exitosa');
        } else {
          showAlert(res.error || 'No se pudo actualizar el estudiante.', 'Error', true);
        }
      }
    } catch (err) {
      console.error('Error al guardar estudiante:', err);
      showAlert('Ocurrió un error inesperado al guardar.', 'Error', true);
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleDeleteStudent = (student) => {
    showConfirm({
      title: 'Eliminar Estudiante',
      message: `¿Estás seguro de que deseas eliminar a "${student.name}" del padrón de ${selectedDojo?.name}? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, Eliminar',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await deleteStudent(student._id || student.id);
          if (res.success) {
            setStudents(prev => prev.filter(s => (s._id || s.id) !== (student._id || student.id)));
            setDojos(prev => prev.map(d => {
              if ((d._id || d.id) === selectedDojoId) {
                return { ...d, studentCount: Math.max(0, (d.studentCount || 1) - 1) };
              }
              return d;
            }));
            showAlert(`El estudiante "${student.name}" fue eliminado del padrón.`, 'Eliminado');
          } else {
            showAlert(res.error || 'No se pudo eliminar el estudiante.', 'Error', true);
          }
        } catch (err) {
          console.error(err);
          showAlert('Error al procesar la eliminación.', 'Error', true);
        }
      }
    });
  };

  // Edad en tiempo real para el modal
  const modalCalculatedAge = useMemo(() => {
    return calculateAge(studentBirthDate);
  }, [studentBirthDate]);

  return (
    <div className="space-y-6 pt-2 pb-12 font-sans text-gray-900">
      {/* Breadcrumb Principal */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
          <Link href="/admin/examinations" className="text-[#2D2E83] hover:underline flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Examinaciones
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-[#BE1622] font-mono uppercase tracking-wider">Módulo Técnico</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: CONVOCATORIAS OFICIALES Y ENLACE ÚNICO DEL DOJO (ETAPA 1) */}
      {/* ========================================================================= */}
      {activeTab === 'convocatorias' && (
        <div className="space-y-6">
          {selectedCallForDetail ? (
            /* ========================================================================= */
            /* VISTA DETALLE: GESTIÓN DE EXAMINANDOS Y CONFIGURACIÓN DE TANDAS DE 6 */
            /* ========================================================================= */
            <div className="space-y-6">
              {/* Barra Superior de Navegación de la Convocatoria: Sub-Pestañas Ágiles */}
              <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCallForDetail(null)}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Volver al Listado</span>
                </button>

                {/* Selector de Pestañas: Tandas vs Mi Evaluación (Admin) vs Monitor del Tribunal */}
                <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setCallDetailSubTab('tandas')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      callDetailSubTab === 'tandas'
                        ? 'bg-white text-indigo-950 shadow-2xs font-black'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>📋 Tandas y Horarios</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 font-mono">
                      {callTandas.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCallDetailSubTab('evaluation')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      callDetailSubTab === 'evaluation'
                        ? 'bg-white text-amber-950 shadow-2xs font-black'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Califica técnica por técnica con estrellas a la par de los otros jueces"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>⭐ Mi Evaluación</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Admin Juez
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCallDetailSubTab('monitor')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      callDetailSubTab === 'monitor'
                        ? 'bg-white text-blue-950 shadow-2xs font-black'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Supervisa en vivo el avance de los Senseis evaluadores y envía sus enlaces"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>📡 Monitor del Tribunal</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 font-mono">
                      {(selectedCallForDetail.evaluators || []).length}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditTribunal(selectedCallForDetail)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2D2E83] border border-blue-200/90 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                    title="Modificar Senseis del Tribunal Evaluador"
                  >
                    <Users className="w-3.5 h-3.5 text-[#2D2E83]" />
                    <span>Editar Tribunal</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-[#2D2E83] font-mono font-bold">
                      {(selectedCallForDetail.evaluators || []).length}
                    </span>
                  </button>
                  {(() => {
                    const callDojo = dojos.find(d => String(d._id || d.id) === String(selectedCallForDetail.dojoId))
                      || dojos.find(d => (d.name || '').trim().toLowerCase() === (selectedCallForDetail.dojoName || '').trim().toLowerCase());
                    const dojoLogoSrc = callDojo?.logo || selectedCallForDetail?.dojoLogo || '/images/dojos/default_logo.jpg';

                    return (
                      <div className="flex items-center gap-2 bg-gray-50/90 hover:bg-white border border-gray-200/90 py-1 px-2.5 rounded-xl shadow-2xs transition-all">
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-300 bg-white shrink-0 flex items-center justify-center shadow-xs">
                          <img
                            src={dojoLogoSrc}
                            alt={`Logo ${selectedCallForDetail.dojoName}`}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/images/dojos/default_logo.jpg';
                            }}
                          />
                        </div>
                        <span className="text-xs font-black text-gray-900 truncate max-w-[150px] sm:max-w-[220px]">
                          {selectedCallForDetail.dojoName}
                        </span>
                      </div>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => handleDeleteExamCall(selectedCallForDetail)}
                    className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200/80 flex items-center justify-center cursor-pointer active:scale-95"
                    title="Eliminar convocatoria"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {callDetailSubTab === 'tandas' && (
                <>
                  {/* Barra de Acciones Superior Compacta de Tandas */}
                  <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-3 sm:p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-xs font-bold text-gray-700">
                        Configuración de Tandas
                      </div>

                      {/* Control Interactivo de Capacidad de Karatecas por Tanda */}
                      <div className="flex items-center gap-1.5 bg-indigo-50/80 border border-indigo-200/90 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
                        <span className="text-[11px] font-black uppercase text-indigo-900 tracking-wider">
                          Karatecas por Tanda:
                        </span>
                        <div className="flex items-center gap-1 bg-white border border-indigo-300 rounded-lg p-0.5 shadow-2xs">
                          <button
                            type="button"
                            disabled={detailMaxPerTanda <= 1 || isUpdatingMaxPerTanda}
                            onClick={() => handleChangeMaxPerTanda(detailMaxPerTanda - 1)}
                            className="w-6 h-6 rounded flex items-center justify-center font-black text-indigo-700 hover:bg-indigo-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="Reducir capacidad de karatecas por tanda"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={detailMaxPerTanda}
                            onChange={(e) => handleChangeMaxPerTanda(e.target.value)}
                            className="w-10 text-center font-mono font-black text-xs text-indigo-950 focus:outline-none"
                            title="Capacidad máxima de aspirantes por tanda"
                          />
                          <button
                            type="button"
                            disabled={detailMaxPerTanda >= 50 || isUpdatingMaxPerTanda}
                            onClick={() => handleChangeMaxPerTanda(detailMaxPerTanda + 1)}
                            className="w-6 h-6 rounded flex items-center justify-center font-black text-indigo-700 hover:bg-indigo-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="Aumentar capacidad de karatecas por tanda"
                          >
                            +
                          </button>
                        </div>
                        {isUpdatingMaxPerTanda && (
                          <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin ml-0.5" />
                        )}
                      </div>
                    </div>

                {/* Botones de Acción de Tandas y Convocatoria Alineados */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* 2. Agrupar en Tandas */}
                  <button
                    type="button"
                    onClick={handleAutoGroupTandas}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    title={`Divide a los examinandos listos en tandas de máximo ${detailMaxPerTanda} karatecas`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>⚡ Agrupar en Tandas de {detailMaxPerTanda}</span>
                  </button>

                  {/* 3. Nueva Tanda */}
                  <button
                    type="button"
                    onClick={handleAddNewTanda}
                    className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Nueva Tanda</span>
                  </button>

                  {/* Eliminar Convocatoria */}
                  <button
                    type="button"
                    onClick={() => handleDeleteExamCall(selectedCallForDetail)}
                    className="p-2.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200/80 flex items-center justify-center cursor-pointer active:scale-95"
                    title="Eliminar convocatoria"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Paneles de Dos Columnas: Examinandos Listos vs Configuración de Tandas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Columna Izquierda: Gestión Ágil de Examinandos (Postulados vs No Postulados del Dojo) */}
                <div 
                  className={`lg:col-span-5 space-y-4 rounded-2xl transition-all ${
                    dragOverTargetId === 'unassigned' && draggedStudentData?.sourceTandaId
                      ? 'ring-2 ring-amber-400 bg-amber-50/50 p-1'
                      : ''
                  }`}
                  onDragOver={(e) => {
                    if (draggedStudentData?.sourceTandaId) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverTargetId !== 'unassigned') setDragOverTargetId('unassigned');
                    }
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget)) return;
                    if (dragOverTargetId === 'unassigned') setDragOverTargetId(null);
                  }}
                  onDrop={handleDropOnUnassigned}
                >
                  <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs">
                    {/* Encabezado del Panel Izquierdo */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#2D2E83]" />
                          <span>Padrón de Alumnos del Dojo</span>
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          Convoca o despostula karatecas sin salir de esta pantalla
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {callReadyStudents.length} postulados
                      </span>
                    </div>

                    {/* Selector de Pestañas Ágiles: Postulados vs No Postulados */}
                    <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl my-3 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setStudentListFilterTab('promoted')}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          studentListFilterTab === 'promoted'
                            ? 'bg-white text-indigo-900 shadow-2xs font-black'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Postulados ({callReadyStudents.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudentListFilterTab('unpromoted')}
                        onDragOver={(e) => {
                          if (draggedStudentData) {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverTargetId !== 'unpromoted_tab') setDragOverTargetId('unpromoted_tab');
                          }
                        }}
                        onDragLeave={(e) => {
                          e.stopPropagation();
                          if (dragOverTargetId === 'unpromoted_tab') setDragOverTargetId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverTargetId(null);
                          let data = draggedStudentData;
                          if (!data) {
                            try {
                              const raw = e.dataTransfer.getData('application/json');
                              if (raw) data = JSON.parse(raw);
                            } catch (err) {
                              console.debug('Error en drop:', err);
                            }
                          }
                          if (data?.studentId) {
                            const st = callReadyStudents.find(s => (s._id || s.id) === data.studentId) ||
                                       dojoAllStudents.find(s => (s._id || s.id) === data.studentId);
                            if (st) {
                              handleToggleStudentPromotion(st, false);
                              setStudentListFilterTab('unpromoted');
                            }
                          }
                          setDraggedStudentData(null);
                        }}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          dragOverTargetId === 'unpromoted_tab'
                            ? 'bg-rose-100 text-rose-900 border-2 border-dashed border-rose-400 scale-[1.02] shadow-sm font-black animate-pulse'
                            : studentListFilterTab === 'unpromoted'
                            ? 'bg-white text-amber-900 shadow-2xs font-black'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                        title="Ver no postulados (o arrastra a un karateca aquí para desconvocarlo)"
                      >
                        <UserMinus className={`w-3.5 h-3.5 ${dragOverTargetId === 'unpromoted_tab' ? 'text-rose-600' : 'text-amber-600'}`} />
                        <span>{dragOverTargetId === 'unpromoted_tab' ? 'Soltar para Desconvocar' : `No Postulados (${unpromotedDojoStudents.length})`}</span>
                      </button>
                    </div>

                    {/* Barra de Búsqueda Rápida */}
                    <div className="relative mb-3">
                      <input
                        type="text"
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        placeholder={studentListFilterTab === 'promoted' ? "Buscar entre postulados..." : "Buscar alumno del dojo para convocar..."}
                        className="w-full pl-8 pr-7 py-1.5 bg-gray-50/90 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:border-indigo-500 outline-hidden transition-all shadow-2xs"
                      />
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                      {studentSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setStudentSearchQuery('')}
                          className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Aviso visual al arrastrar un karateca desde una tanda para desasignarlo */}
                    {draggedStudentData?.sourceTandaId && (
                      <div className={`mb-3 py-2 px-3 rounded-xl text-center text-xs font-bold border transition-all ${
                        dragOverTargetId === 'unassigned'
                          ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                          : 'bg-amber-50 text-amber-700 border-amber-200 border-dashed'
                      }`}>
                        ⬇️ Suelta aquí para desasignar de la tanda
                      </div>
                    )}

                    {isLoadingCallStudents ? (
                      <div className="py-12 text-center">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-bold">Cargando alumnos del dojo...</p>
                      </div>
                    ) : studentListFilterTab === 'promoted' ? (
                      /* ========================================================================= */
                      /* PESTAÑA 1: EXAMINANDOS POSTULADOS / CONVOCADOS */
                      /* ========================================================================= */
                      filteredReadyStudents.length === 0 ? (
                        <div className="py-10 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl p-4">
                          <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                          <p className="text-xs font-bold text-gray-700">
                            {studentSearchQuery ? 'No se encontraron postulados con ese nombre' : 'No hay karatecas postulados todavía'}
                          </p>
                          <p className="text-[11px] text-gray-400 max-w-xs mx-auto mt-1 mb-3">
                            Puedes convocar alumnos directamente desde la pestaña &ldquo;No Postulados&rdquo;.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setStudentListFilterTab('unpromoted');
                              setStudentSearchQuery('');
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Ver Alumnos No Postulados</span>
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 max-h-[580px] overflow-y-auto pr-1 space-y-0.5">
                          {filteredReadyStudents.map((st, idx) => {
                            const sId = st._id || st.id;
                            const assignedTanda = callTandas.find(t => (t.studentIds || []).includes(sId));
                            const belt = getBeltBadge(st.currentRank);
                            const isBeingDragged = draggedStudentData?.studentId === sId;

                            return (
                              <div 
                                key={sId}
                                draggable={true}
                                onDragStart={(e) => handleStudentDragStart(e, sId, assignedTanda?.id || null)}
                                onDragEnd={handleStudentDragEnd}
                                className={`group py-2 flex items-center justify-between gap-2 px-2 rounded-xl transition-all cursor-grab active:cursor-grabbing border select-none ${
                                  isBeingDragged
                                    ? 'opacity-40 border-dashed border-indigo-400 bg-indigo-50/40 scale-98'
                                    : 'border-transparent hover:border-gray-200 hover:bg-gray-50/90 hover:shadow-2xs'
                                }`}
                                title="Arrastra a cualquier tanda, o usa el botón rojo para despostularlo"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-600 shrink-0 transition-colors" />
                                  <span className="w-4 text-center text-[11px] font-mono font-bold text-gray-400 shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div className="w-8 h-8 rounded-full bg-[#2D2E83]/10 text-[#2D2E83] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-gray-200">
                                    {st.photo ? (
                                      <img src={st.photo} alt={st.name} className="w-full h-full object-cover" />
                                    ) : (
                                      st.name.substring(0, 2).toUpperCase()
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditStudent(st);
                                        }}
                                        className="p-1 rounded-lg text-gray-400 hover:text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all cursor-pointer shrink-0"
                                        title="Editar datos del karateca"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="text-xs font-bold text-gray-900 truncate">
                                        {st.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${belt.bg}`}>
                                        {belt.label}
                                      </span>
                                      {st.birthDate && (
                                        <span className="text-[10px] text-gray-500 font-mono" title={`Nacimiento: ${formatDateDDMMAAAA(st.birthDate)}`}>
                                          {calculateAge(st.birthDate) !== null ? `${calculateAge(st.birthDate)} años` : ''} ({formatDateDDMMAAAA(st.birthDate)})
                                        </span>
                                      )}
                                      {st.hasSpecialCondition && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200" title={st.specialCondition}>
                                          Especial
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {assignedTanda ? (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 text-right">
                                      {assignedTanda.blockName || 'Tanda'}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      Sin Asignar
                                    </span>
                                  )}

                                  {/* Botón Ágil para Despostular / Desconvocar */}
                                  <button
                                    type="button"
                                    disabled={isTogglingPromotionId === sId}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleStudentPromotion(st, false);
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 shadow-2xs active:scale-95"
                                    title="Despostular / desconvocar a este karateca del examen oficial"
                                  >
                                    {isTogglingPromotionId === sId ? (
                                      <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                                    ) : (
                                      <UserMinus className="w-3 h-3 text-rose-500" />
                                    )}
                                    <span>Desconvocar</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      /* ========================================================================= */
                      /* PESTAÑA 2: ALUMNOS DEL DOJO NO POSTULADOS (PARA CONVOCAR ÁGILMENTE) */
                      /* ========================================================================= */
                      filteredUnpromotedStudents.length === 0 ? (
                        <div className="py-10 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl p-4">
                          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                          <p className="text-xs font-bold text-gray-700">
                            {studentSearchQuery ? 'No se encontraron alumnos con ese nombre' : '¡Todos los alumnos activos están postulados!'}
                          </p>
                          <p className="text-[11px] text-gray-400 max-w-xs mx-auto mt-1">
                            No quedan alumnos pendientes en este dojo para convocar.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 max-h-[580px] overflow-y-auto pr-1 space-y-0.5">
                          {filteredUnpromotedStudents.map((st, idx) => {
                            const sId = st._id || st.id;
                            const belt = getBeltBadge(st.currentRank);
                            const isBeingDragged = draggedStudentData?.studentId === sId;

                            return (
                              <div 
                                key={sId}
                                draggable={true}
                                onDragStart={(e) => handleStudentDragStart(e, sId, null)}
                                onDragEnd={handleStudentDragEnd}
                                className={`group py-2 flex items-center justify-between gap-2 px-2 rounded-xl transition-all cursor-grab active:cursor-grabbing border select-none ${
                                  isBeingDragged
                                    ? 'opacity-40 border-dashed border-emerald-400 bg-emerald-50/40 scale-98'
                                    : 'border-transparent hover:border-gray-200 hover:bg-gray-50/90 hover:shadow-2xs'
                                }`}
                                title="Presiona 'Convocar' o arrastra directamente a una tanda"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-600 shrink-0 transition-colors" />
                                  <span className="w-4 text-center text-[11px] font-mono font-bold text-gray-400 shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-gray-200">
                                    {st.photo ? (
                                      <img src={st.photo} alt={st.name} className="w-full h-full object-cover" />
                                    ) : (
                                      st.name.substring(0, 2).toUpperCase()
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditStudent(st);
                                        }}
                                        className="p-1 rounded-lg text-gray-400 hover:text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all cursor-pointer shrink-0"
                                        title="Editar datos del karateca"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="text-xs font-bold text-gray-900 truncate">
                                        {st.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${belt.bg}`}>
                                        {belt.label}
                                      </span>
                                      {st.birthDate && (
                                        <span className="text-[10px] text-gray-500 font-mono" title={`Nacimiento: ${formatDateDDMMAAAA(st.birthDate)}`}>
                                          {calculateAge(st.birthDate) !== null ? `${calculateAge(st.birthDate)} años` : ''} ({formatDateDDMMAAAA(st.birthDate)})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  {/* Botón Ágil para Convocar / Postular */}
                                  <button
                                    type="button"
                                    disabled={isTogglingPromotionId === sId}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleStudentPromotion(st, true);
                                    }}
                                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 shadow-2xs active:scale-95"
                                    title="Convocar inmediatamente al examen oficial"
                                  >
                                    {isTogglingPromotionId === sId ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    )}
                                    <span>Convocar</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>

                  {/* Cuadro Dinámico y Minimalista de Aranceles de Examen por Aspirante */}
                  {(() => {
                    const count = callReadyStudents.length;
                    const sCost = Number(costConfig?.senseiDojo) || 0;
                    const dCost = Number(costConfig?.directorGeneral) || 0;
                    const iCost = Number(costConfig?.iskfCr) || 0;
                    const unitTotal = sCost + dCost + iCost;

                    return (
                      <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 shadow-xs">
                        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                          <div>
                            <h4 className="text-xs font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-[#2D2E83]" />
                              <span>Detalle de Aranceles por Aspirante</span>
                            </h4>
                            <p className="text-[10px] text-gray-500">
                              Cálculo en vivo según karatecas convocados
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-indigo-50 text-[#2D2E83] border border-indigo-200">
                            {count} {count === 1 ? 'karateca' : 'karatecas'}
                          </span>
                        </div>

                        <div className="overflow-x-auto mt-2">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100">
                                <th className="py-2 px-1 font-mono">Rubro</th>
                                <th className="py-2 px-1 text-right font-mono">Por Alumno</th>
                                <th className="py-2 px-1 text-right font-mono">Total ({count})</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-medium">
                              <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-2 px-1 text-gray-800 font-semibold">Sensei Dojo</td>
                                <td className="py-2 px-1 text-right font-mono text-gray-600">
                                  ₡{sCost.toLocaleString('es-CR')}
                                </td>
                                <td className="py-2 px-1 text-right font-mono font-bold text-gray-900">
                                  ₡{(sCost * count).toLocaleString('es-CR')}
                                </td>
                              </tr>
                              <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-2 px-1 text-gray-800 font-semibold">Director General</td>
                                <td className="py-2 px-1 text-right font-mono text-gray-600">
                                  ₡{dCost.toLocaleString('es-CR')}
                                </td>
                                <td className="py-2 px-1 text-right font-mono font-bold text-gray-900">
                                  ₡{(dCost * count).toLocaleString('es-CR')}
                                </td>
                              </tr>
                              <tr className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-2 px-1 text-gray-800 font-semibold">ISKF CR</td>
                                <td className="py-2 px-1 text-right font-mono text-gray-600">
                                  ₡{iCost.toLocaleString('es-CR')}
                                </td>
                                <td className="py-2 px-1 text-right font-mono font-bold text-gray-900">
                                  ₡{(iCost * count).toLocaleString('es-CR')}
                                </td>
                              </tr>
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-gray-200 bg-gray-50/80 font-black">
                                <td className="py-2.5 px-1 text-gray-900 text-[11px] uppercase tracking-wider">
                                  TOTAL
                                </td>
                                <td className="py-2.5 px-1 text-right font-mono text-gray-900 font-bold">
                                  ₡{unitTotal.toLocaleString('es-CR')}
                                </td>
                                <td className="py-2.5 px-1 text-right font-mono text-[#2D2E83] text-sm font-black">
                                  ₡{(unitTotal * count).toLocaleString('es-CR')}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Columna Derecha: Configuración de Tandas */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs">
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                          <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                          <span>Configuración de Tandas (Máximo {detailMaxPerTanda})</span>
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          Arrastra tandas para darles orden, o mueve e intercambia karatecas entre ellas
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddNewTanda}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Tanda</span>
                      </button>
                    </div>

                    {callTandas.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl p-6 mt-4">
                        <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <h4 className="text-xs font-bold text-gray-800">No hay tandas configuradas aún</h4>
                        <p className="text-[11px] text-gray-400 max-w-sm mx-auto mt-1 mb-4">
                          Presione &ldquo;⚡ Agrupar en Tandas de {detailMaxPerTanda}&rdquo; para organizar automáticamente a los {callReadyStudents.length} examinandos en bloques de {detailMaxPerTanda}.
                        </p>
                        <button
                          type="button"
                          onClick={handleAutoGroupTandas}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-all shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>⚡ Organizar en Tandas de {detailMaxPerTanda}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 mt-4">
                        {callTandas.map((tanda, tIdx) => {
                          const assignedCount = (tanda.studentIds || []).length;
                          const isFull = assignedCount >= detailMaxPerTanda;
                          const isOver = assignedCount > detailMaxPerTanda;

                          // Alumnos disponibles que no están en esta tanda
                          const availableForThisTanda = callReadyStudents.filter(
                            s => !(tanda.studentIds || []).includes(s._id || s.id)
                          );

                          return (
                            <React.Fragment key={tanda.id || tIdx}>
                              <div 
                                onDragOver={(e) => {
                                  if (draggedTandaData) {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                    if (dragOverTandaReorderIndex !== tIdx) {
                                      setDragOverTandaReorderIndex(tIdx);
                                    }
                                  } else {
                                    handleTandaDragOver(e, tanda.id);
                                  }
                                }}
                                onDragLeave={(e) => {
                                  if (draggedTandaData) {
                                    if (e.currentTarget.contains(e.relatedTarget)) return;
                                    if (dragOverTandaReorderIndex === tIdx) {
                                      setDragOverTandaReorderIndex(null);
                                    }
                                  } else {
                                    handleTandaDragLeave(e, tanda.id);
                                  }
                                }}
                                onDrop={(e) => {
                                  if (draggedTandaData) {
                                    handleDropReorderTanda(e, tIdx);
                                  } else {
                                    handleDropOnTanda(e, tanda.id);
                                  }
                                }}
                                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                                  draggedTandaData?.index === tIdx
                                    ? 'opacity-30 border-dashed border-indigo-400 bg-indigo-50/20 scale-[0.99]'
                                    : dragOverTandaReorderIndex === tIdx
                                    ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-500 scale-[1.01] shadow-md'
                                    : dragOverTargetId === tanda.id
                                    ? isFull && !tanda.studentIds?.includes(draggedStudentData?.studentId)
                                      ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400 scale-[1.01]'
                                      : 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500 scale-[1.01]'
                                    : 'bg-gray-50/60 border-gray-200/90 shadow-2xs'
                                }`}
                              >
                                {/* Banner visual durante reordenamiento de tanda completa */}
                                {dragOverTandaReorderIndex === tIdx && draggedTandaData?.index !== tIdx && (
                                  <div className="py-2 px-3 rounded-xl bg-indigo-600 text-white text-center text-xs font-black shadow-sm flex items-center justify-center gap-2 animate-in fade-in duration-150">
                                    <ArrowUpDown className="w-4 h-4 text-indigo-200 animate-bounce" />
                                    <span>Soltar aquí para mover a la Posición #{tIdx + 1}</span>
                                  </div>
                                )}

                                {/* Indicador visual durante Drag & Drop de karateca */}
                                {dragOverTargetId === tanda.id && !draggedTandaData && (
                                  <div className={`py-1.5 px-3 rounded-xl text-center text-xs font-bold border transition-all animate-pulse ${
                                    isFull && !tanda.studentIds?.includes(draggedStudentData?.studentId)
                                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                                      : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                  }`}>
                                    {isFull && !tanda.studentIds?.includes(draggedStudentData?.studentId)
                                      ? `⚠️ Capacidad máxima alcanzada (${detailMaxPerTanda} karatecas)`
                                      : `⬇️ Suelta al karateca aquí para asignarlo a ${tanda.blockName || `Tanda ${tIdx + 1}`}`}
                                  </div>
                                )}

                                {/* Encabezado de la Tanda */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-gray-200/80">
                                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                                    {/* Drag Handle para reordenar la tanda completa */}
                                    <div
                                      draggable={true}
                                      onDragStart={(e) => handleTandaDragStart(e, tanda.id, tIdx)}
                                      onDragEnd={handleTandaDragEnd}
                                      className="p-1 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-100/70 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
                                      title="Arrastrar para mover y reordenar esta tanda completa"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </div>

                                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                                      {tIdx + 1}
                                    </span>

                                    {/* Botones rápidos subir/bajar tanda de orden */}
                                    <div className="flex items-center border border-gray-200 bg-white rounded-lg p-0.5 shadow-2xs">
                                      <button
                                        type="button"
                                        disabled={tIdx === 0}
                                        onClick={() => handleMoveTandaStep(tIdx, -1)}
                                        className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-25 disabled:pointer-events-none rounded hover:bg-indigo-50 transition-colors"
                                        title="Subir tanda de posición"
                                      >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={tIdx === callTandas.length - 1}
                                        onClick={() => handleMoveTandaStep(tIdx, 1)}
                                        className="p-1 text-gray-400 hover:text-indigo-600 disabled:opacity-25 disabled:pointer-events-none rounded hover:bg-indigo-50 transition-colors"
                                        title="Bajar tanda de posición"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <input
                                      type="text"
                                      value={tanda.blockName || `Tanda ${tIdx + 1}`}
                                      onChange={(e) => handleUpdateTandaField(tanda.id, 'blockName', e.target.value)}
                                      className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-black text-gray-900 focus:border-indigo-600 outline-hidden w-28"
                                      placeholder="Nombre Tanda"
                                    />

                                    {/* Horarios con controladores de Arriba / Abajo sincronizados */}
                                    <div className="flex items-center gap-1.5 text-xs">
                                      {/* Hora de Inicio */}
                                      <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-2xs">
                                        <input
                                          type="text"
                                          value={tanda.startTime || '09:00 AM'}
                                          onChange={(e) => handleUpdateTandaTime(tIdx, 'startTime', e.target.value)}
                                          placeholder="09:00 AM"
                                          className="w-18 px-1.5 py-1 text-xs font-mono font-bold text-gray-800 text-center outline-hidden focus:bg-indigo-50/30"
                                          title="Hora de Inicio (sincroniza fin de tanda anterior)"
                                        />
                                        <div className="flex flex-col border-l border-gray-200 bg-gray-50/90">
                                          <button
                                            type="button"
                                            onClick={() => handleStepTandaTime(tIdx, 'startTime', +15)}
                                            className="px-1 py-0.5 hover:bg-indigo-100 text-gray-500 hover:text-indigo-700 transition-colors cursor-pointer border-b border-gray-200"
                                            title="+15 min (sincroniza tanda anterior)"
                                          >
                                            <ChevronUp className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleStepTandaTime(tIdx, 'startTime', -15)}
                                            className="px-1 py-0.5 hover:bg-indigo-100 text-gray-500 hover:text-indigo-700 transition-colors cursor-pointer"
                                            title="-15 min (sincroniza tanda anterior)"
                                          >
                                            <ChevronDown className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>

                                      <span className="text-gray-400 font-bold">-</span>

                                      {/* Hora de Fin */}
                                      <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-2xs">
                                        <input
                                          type="text"
                                          value={tanda.endTime || '09:45 AM'}
                                          onChange={(e) => handleUpdateTandaTime(tIdx, 'endTime', e.target.value)}
                                          placeholder="09:45 AM"
                                          className="w-18 px-1.5 py-1 text-xs font-mono font-bold text-gray-800 text-center outline-hidden focus:bg-indigo-50/30"
                                          title="Hora de Fin (sincroniza inicio de tanda siguiente)"
                                        />
                                        <div className="flex flex-col border-l border-gray-200 bg-gray-50/90">
                                          <button
                                            type="button"
                                            onClick={() => handleStepTandaTime(tIdx, 'endTime', +15)}
                                            className="px-1 py-0.5 hover:bg-indigo-100 text-gray-500 hover:text-indigo-700 transition-colors cursor-pointer border-b border-gray-200"
                                            title="+15 min (sincroniza tanda siguiente)"
                                          >
                                            <ChevronUp className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleStepTandaTime(tIdx, 'endTime', -15)}
                                            className="px-1 py-0.5 hover:bg-indigo-100 text-gray-500 hover:text-indigo-700 transition-colors cursor-pointer"
                                            title="-15 min (sincroniza tanda siguiente)"
                                          >
                                            <ChevronDown className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Duración de la tanda */}
                                      <span 
                                        className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/60 hidden xl:inline-block"
                                        title="Duración total de esta tanda"
                                      >
                                        {getTandaDurationStr(tanda.startTime, tanda.endTime)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Contador de Capacidad y Botón Eliminar */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-black border ${
                                      isOver
                                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                                        : isFull
                                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    }`}>
                                      {assignedCount} / {detailMaxPerTanda} Karatecas {isFull && !isOver ? '✓' : ''}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTanda(tanda.id)}
                                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Eliminar esta tanda"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Lista de Examinandos asignados a esta tanda */}
                                {assignedCount === 0 ? (
                                  <div className={`py-4 px-3 text-center text-xs rounded-xl border border-dashed transition-all ${
                                    dragOverTargetId === tanda.id
                                      ? 'border-indigo-400 bg-white text-indigo-700 font-bold'
                                      : 'border-gray-200 text-gray-400 font-medium'
                                  }`}>
                                    {dragOverTargetId === tanda.id
                                      ? '⬇️ ¡Suelta aquí al karateca!'
                                      : 'Esta tanda no tiene examinandos aún. Arrastra un karateca aquí para asignarlo.'}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {(tanda.studentIds || []).map((stId, sIdx) => {
                                      const studentObj = callReadyStudents.find(s => (s._id || s.id) === stId) || dojoAllStudents.find(s => (s._id || s.id) === stId);
                                      const isBeingDragged = draggedStudentData?.studentId === stId;
                                      const isDropTargetHover = dragOverStudentId === stId && draggedStudentData?.studentId !== stId;
                                      const hasAspects = Boolean(
                                        (studentObj?.hasSpecialCondition && studentObj?.specialCondition?.trim()) ||
                                        studentObj?.specialCondition?.trim() ||
                                        studentObj?.positiveAspects?.trim() ||
                                        studentObj?.notes?.trim()
                                      );

                                      return (
                                        <div
                                          key={stId}
                                          draggable={true}
                                          onDragStart={(e) => handleStudentDragStart(e, stId, tanda.id)}
                                          onDragEnd={handleStudentDragEnd}
                                          onDragOver={(e) => handleStudentDragOver(e, stId)}
                                          onDragLeave={(e) => handleStudentDragLeave(e, stId)}
                                          onDrop={(e) => handleDropOnStudent(e, stId, tanda.id)}
                                          className={`relative group p-2 rounded-xl bg-white border flex items-center justify-between gap-2 shadow-2xs transition-all cursor-grab active:cursor-grabbing select-none overflow-hidden ${
                                            isBeingDragged
                                              ? 'opacity-40 border-dashed border-indigo-400 scale-95'
                                              : isDropTargetHover
                                              ? 'ring-2 ring-amber-500 bg-amber-50/90 border-amber-400 scale-[1.02] shadow-md z-10'
                                              : 'border-gray-200/80 hover:border-indigo-300 hover:shadow-xs'
                                          }`}
                                          title={
                                            draggedStudentData?.sourceTandaId === tanda.id
                                              ? 'Suelta encima para intercambiar orden en esta tanda'
                                              : 'Arrastra para mover o suelta encima de otro para intercambiar'
                                          }
                                        >
                                          {/* Overlay de Intercambio / Reordenamiento al pasar el ratón por encima */}
                                          {isDropTargetHover && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl flex items-center justify-center gap-1.5 text-xs font-black z-20 shadow-sm pointer-events-none px-2 text-center animate-in fade-in duration-150">
                                              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-100 shrink-0" />
                                              <span className="truncate">
                                                {draggedStudentData?.sourceTandaId === tanda.id
                                                  ? `Reordenar con #${sIdx + 1}`
                                                  : 'Intercambiar karatecas'}
                                              </span>
                                            </div>
                                          )}

                                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                            {/* Botón para editar datos al lado izquierdo del atleta */}
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (studentObj) handleOpenEditStudent(studentObj);
                                              }}
                                              className="p-1 rounded-lg text-gray-400 hover:text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all cursor-pointer shrink-0"
                                              title="Editar datos del atleta (verificar edad, nombre, aspectos)"
                                            >
                                              <Edit3 className="w-3.5 h-3.5" />
                                            </button>

                                            <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-600 shrink-0 transition-colors" />
                                            <span className="w-4 text-[10px] font-mono font-bold text-gray-400 shrink-0">
                                              {sIdx + 1}.
                                            </span>
                                            <div className="min-w-0 flex-1">
                                               <div className="flex flex-col gap-1 min-w-0">
                                                 {hasAspects ? (
                                                   <span
                                                     className="text-xs font-black text-gray-950 whitespace-normal break-words leading-snug line-clamp-2 dark-radiance-glow"
                                                     style={{
                                                       textShadow: '0 1px 2px rgba(0, 0, 0, 0.45), 0 0 6px rgba(0, 0, 0, 0.25)'
                                                     }}
                                                     title={studentObj?.name || 'Estudiante'}
                                                   >
                                                     {studentObj?.name || 'Estudiante'}
                                                   </span>
                                                 ) : (
                                                   <span
                                                     className="text-xs font-bold text-gray-900 whitespace-normal break-words leading-snug line-clamp-2"
                                                     title={studentObj?.name || 'Estudiante'}
                                                   >
                                                     {studentObj?.name || 'Estudiante'}
                                                   </span>
                                                 )}
                                                 {studentObj?.birthDate && (
                                                   <span className="text-[10px] text-gray-500 font-mono" title={`Nacimiento: ${formatDateDDMMAAAA(studentObj.birthDate)}`}>
                                                     {calculateAge(studentObj.birthDate) !== null ? `${calculateAge(studentObj.birthDate)} años` : ''} ({formatDateDDMMAAAA(studentObj.birthDate)})
                                                   </span>
                                                 )}
                                                 {hasAspects && (
                                                   <div>
                                                     <button
                                                       type="button"
                                                       onClick={(e) => {
                                                         e.stopPropagation();
                                                         setSelectedStudentForAspects(studentObj);
                                                       }}
                                                       className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[9px] font-black transition-colors cursor-pointer shrink-0"
                                                       title="Ver aspectos a considerar"
                                                     >
                                                       <AlertTriangle className="w-2.5 h-2.5 text-amber-600 animate-pulse shrink-0" />
                                                       <span>REVISAR</span>
                                                     </button>
                                                   </div>
                                                 )}
                                               </div>
                                             </div>
                                          </div>

                                          <div className="flex items-center gap-1 shrink-0">
                                            {/* Quitar de esta tanda (pasa a Sin Asignar) */}
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveStudentFromTanda(tanda.id, stId)}
                                              className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                              title="Quitar de esta tanda (pasa a Sin Asignar)"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Desconvocar totalmente del examen */}
                                            <button
                                              type="button"
                                              disabled={isTogglingPromotionId === stId}
                                              onClick={() => {
                                                const st = studentObj || dojoAllStudents.find(s => (s._id || s.id) === stId);
                                                if (st) handleToggleStudentPromotion(st, false);
                                              }}
                                              className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer disabled:opacity-40"
                                              title="Desconvocar totalmente del examen (quitar del padrón)"
                                            >
                                              {isTogglingPromotionId === stId ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                                              ) : (
                                                <UserMinus className="w-3.5 h-3.5" />
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Asignar estudiante a la tanda */}
                                {!isFull ? (
                                  <div className="pt-1">
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleAddStudentToTanda(tanda.id, e.target.value);
                                        }
                                      }}
                                      className="w-full px-3 py-1.5 bg-white border border-dashed border-gray-300 rounded-xl text-xs font-bold text-indigo-700 hover:border-indigo-400 focus:border-indigo-600 outline-hidden cursor-pointer"
                                    >
                                      <option value="">+ Asignar Karateca a esta Tanda ({Math.max(0, detailMaxPerTanda - assignedCount)} cupos disponibles)...</option>
                                      {availableForThisTanda.map((st) => {
                                        const isAssignedOther = callTandas.some(
                                          t => t.id !== tanda.id && (t.studentIds || []).includes(st._id || st.id)
                                        );
                                        return (
                                          <option key={st._id || st.id} value={st._id || st.id}>
                                            {st.name} — {st.currentRank} {isAssignedOther ? '(se moverá desde otra tanda)' : ''}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>
                                ) : (
                                  <div className="text-center py-1 text-[11px] font-bold text-blue-700 bg-blue-50/70 border border-blue-200/60 rounded-xl">
                                    ✓ Tanda completa con {detailMaxPerTanda} karatecas
                                  </div>
                                )}
                              </div>

                              {/* Controlador de Relevo entre tandas consecutivas */}
                              {tIdx < callTandas.length - 1 && (
                                <div className="flex items-center justify-center -my-1 py-1 relative z-10">
                                  <div className="bg-white border border-indigo-200/90 rounded-full px-3 py-1 shadow-2xs flex items-center gap-2 text-[11px] font-mono text-gray-700">
                                    <span className="text-[10px] uppercase font-bold text-gray-400">Pase Tanda {tIdx + 1} ➔ {tIdx + 2}:</span>
                                    <span className="font-black text-indigo-700">{tanda.endTime}</span>
                                    <div className="flex items-center gap-0.5 border-l border-gray-200 pl-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleStepTandaTime(tIdx, 'endTime', +15)}
                                        className="p-1 hover:bg-indigo-50 text-gray-500 hover:text-indigo-700 rounded-md cursor-pointer transition-colors"
                                        title="Avanzar relevo +15 min (sincroniza fin e inicio)"
                                      >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleStepTandaTime(tIdx, 'endTime', -15)}
                                        className="p-1 hover:bg-indigo-50 text-gray-500 hover:text-indigo-700 rounded-md cursor-pointer transition-colors"
                                        title="Retroceder relevo -15 min (sincroniza fin e inicio)"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}

                    {/* Barra inferior informativa */}
                    {callTandas.length > 0 && (
                      <div className="pt-3 mt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                        <span className="text-xs text-gray-500 font-bold">
                          Total tandas configuradas: <strong className="text-gray-900">{callTandas.length}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* SUB-PESTAÑA 2: MI EVALUACIÓN (SENSEI ADMINISTRADOR JUEZ ACTIVO) */}
          {/* ========================================================================= */}
          {callDetailSubTab === 'evaluation' && (
            <div className="space-y-4">
              <TechnicalExamEvaluatorCore
                call={selectedCallForDetail}
                evaluator={adminEvaluator}
                students={callEvaluationStudents}
                syllabi={syllabi}
                isAdmin={true}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-PESTAÑA 3: MONITOR EN VIVO DEL TRIBUNAL DE EVALUADORES */}
          {/* ========================================================================= */}
          {callDetailSubTab === 'monitor' && (
            <div className="space-y-4">
              <TribunalProgressMonitor
                call={selectedCallForDetail}
                students={callEvaluationStudents}
                onEditTribunal={() => handleOpenEditTribunal(selectedCallForDetail)}
              />
            </div>
          )}
        </div>
      ) : (
            /* ========================================================================= */
            /* VISTA LISTADO: CONVOCATORIAS OFICIALES REGISTRADAS */
            /* ========================================================================= */
            <>
              {/* Listado de Convocatorias Registradas */}
              {isLoadingExamCalls ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-gray-200/80">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-bold">Cargando convocatorias...</p>
                </div>
              ) : examCalls.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300 p-8">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <FileCheck className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">No hay convocatorias activas</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-5">
                    Presione &ldquo;Convocar a Examen&rdquo; para generar una nueva convocatoria técnica y seleccionar el dojo y los senseis convocados.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenNewCallModal}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Convocar a Examen</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Barra Superior de la Lista */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                        Convocatorias Registradas
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {examCalls.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenNewCallModal}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer self-start sm:self-auto active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Convocar a Examen</span>
                    </button>
                  </div>

                  {/* Tabla / Lista de Convocatorias estilo Exámenes Escritos */}
                  <div className="bg-white/95 border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs backdrop-blur-md">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50/90 text-[11px] uppercase tracking-wider font-mono text-gray-700">
                            <th className="py-3.5 px-5 font-bold">Convocatoria & Fecha</th>
                            <th className="py-3.5 px-4 font-bold">Dojo Sede</th>
                            <th className="py-3.5 px-4 font-bold">Tribunal Evaluador</th>
                            <th className="py-3.5 px-4 font-bold text-center">Estado</th>
                            <th className="py-3.5 px-4 font-bold text-center">Padrón / Tandas</th>
                            <th className="py-3.5 px-5 font-bold text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                          {examCalls.map((call) => {
                            const matchedDojo = dojos.find(d => 
                              String(d.id || d._id) === String(call.dojoId) || 
                              d.name?.toLowerCase().trim() === call.dojoName?.toLowerCase().trim()
                            );

                            return (
                              <tr key={call._id || call.id} className="hover:bg-blue-50/20 transition-colors group">
                                {/* Col 1: Convocatoria, Fecha */}
                                <td className="py-4 px-5 align-middle">
                                    <div className="space-y-1.5 max-w-xs sm:max-w-sm">
                                      <div className="font-black text-sm text-gray-900 group-hover:text-[#2D2E83] transition-colors leading-snug">
                                        {call.title?.replace(/^Convocatoria Oficial de Examen Técnico\s*[-—–:]\s*/i, '') || call.title || call.dojoName}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                        <span className="flex items-center gap-1 font-bold">
                                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                          {call.examDate}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1 text-gray-500">
                                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                                          {call.startTime}
                                        </span>
                                      </div>
                                    </div>
                                  </td>

                                {/* Col 2: Dojo Sede con Logo a la Izquierda */}
                                <td className="py-4 px-4 align-middle">
                                  <div className="flex items-center gap-2.5 min-w-0 max-w-[220px]">
                                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 bg-white shrink-0 flex items-center justify-center shadow-2xs">
                                      <img
                                        src={matchedDojo?.logo || '/images/dojos/default_logo.jpg'}
                                        alt={`Logo ${call.dojoName}`}
                                        className="w-full h-full object-contain p-0.5"
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = '/images/dojos/default_logo.jpg';
                                        }}
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-gray-900 truncate">
                                          {call.dojoName || 'Dojo'}
                                        </span>
                                        {matchedDojo?.province && (
                                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-[#2D2E83] border border-blue-200/60 shrink-0">
                                            {matchedDojo.province}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                                        Sensei: {matchedDojo?.sensei || call.dojoSensei || 'Sensei Titular'}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* Col 3: Tribunal de Senseis */}
                                <td className="py-4 px-4 align-middle">
                                  <div className="space-y-1.5 max-w-[220px]">
                                    <div className="flex flex-wrap gap-1">
                                      {(call.evaluators && call.evaluators.length > 0) ? (
                                        call.evaluators.map((ev, evIdx) => (
                                          <span
                                            key={evIdx}
                                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 truncate max-w-[180px]"
                                            title={`${ev.name} (${ev.role || 'Sinodal'})`}
                                          >
                                            🥋 {ev.name}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-gray-400 text-[11px] italic">
                                          {call.evaluatorCount || 1} Senseis
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditTribunal(call)}
                                      className="text-[10px] text-[#2D2E83] hover:text-[#BE1622] font-black flex items-center gap-1 transition-colors cursor-pointer hover:underline"
                                      title="Modificar Senseis del tribunal"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>Editar Senseis ({call.evaluators?.length || call.evaluatorCount || 0})</span>
                                    </button>
                                  </div>
                                </td>

                                {/* Col 4: Estado */}
                                <td className="py-4 px-4 align-middle text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border inline-block ${
                                    call.status === 'cerrado'
                                      ? 'bg-gray-100 text-gray-600 border-gray-300'
                                      : call.status === 'en_tatami'
                                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  }`}>
                                    {call.status}
                                  </span>
                                </td>

                                {/* Col 5: Padrón & Tandas */}
                                <td className="py-4 px-4 align-middle text-center">
                                  <div className="inline-flex flex-col items-center gap-1">
                                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs">
                                      {call.aspirantsCount || 0} aspirantes
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-mono">
                                      {call.schedulesCount || (call.schedules?.length) || 0} tandas (máx {call.maxPerTanda || 6})
                                    </span>
                                  </div>
                                </td>

                                {/* Col 6: Acciones */}
                                <td className="py-4 px-5 align-middle text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCallDetail(call)}
                                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                                      title={`Configurar tandas de ${call.maxPerTanda || 6} y examinandos`}
                                    >
                                      <SlidersHorizontal className="w-3.5 h-3.5" />
                                      <span>Configurar</span>
                                    </button>

                                    <Link
                                      href={`/convocatoria/${call.accessToken}`}
                                      target="_blank"
                                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-200 cursor-pointer"
                                      title="Abrir vista pública del Dojo"
                                    >
                                      <ArrowRight className="w-4 h-4" />
                                    </Link>

                                    {call.status !== 'cerrado' ? (
                                      <button
                                        type="button"
                                        onClick={() => handleCloseExamCall(call._id || call.id)}
                                        className="px-2 py-1 text-[11px] text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors font-medium cursor-pointer"
                                        title="Cerrar examen"
                                      >
                                        Cerrar
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleReopenExamCall(call._id || call.id)}
                                        className="px-2 py-1 text-[11px] text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors font-medium cursor-pointer"
                                        title="Reabrir convocatoria de examen"
                                      >
                                        Reabrir
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteExamCall(call)}
                                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                                      title="Eliminar convocatoria"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PADRÓN DE ESTUDIANTES POR DOJO */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Barra Superior de Selección de Dojo */}
          <div className={`bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-5 shadow-xs transition-all ${isDojoDropdownOpen ? 'relative z-50' : 'relative z-20'}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Combobox de Dojos / Vista Fija para Instructor */}
              <div className="flex-1 space-y-1.5">
                {isInstructor ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-[#2D2E83] flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#2D2E83]" />
                      Mi Dojo Asignado
                    </label>
                    <div className="w-full px-4 py-3 bg-blue-50/60 border-2 border-[#2D2E83]/20 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 bg-white shrink-0 flex items-center justify-center shadow-2xs">
                          <img
                            src={selectedDojo?.logo || '/images/dojos/default_logo.jpg'}
                            alt={`Logo ${selectedDojo?.name}`}
                            className="w-full h-full object-contain p-0.5"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm md:text-base font-black text-[#2D2E83] truncate">
                              {selectedDojo?.name || 'Dojo del Instructor'}
                            </span>
                            {selectedDojo?.province && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white text-[#2D2E83] border border-[#2D2E83]/20 shrink-0">
                                {selectedDojo.province}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs text-gray-600 font-semibold truncate mt-0.5">
                            Sensei Titular: <span className="text-gray-900 font-bold">{selectedDojo?.sensei}</span>
                            <span className="ml-2 font-mono text-[#2D2E83] font-bold">[{students.length} alumnos registrados]</span>
                          </p>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Dojo Activo</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#2D2E83]" />
                      Seleccionar Dojo Afiliado
                    </label>
                    <div className="relative z-50" ref={dojoDropdownRef}>
                      {/* Botón Selector Principal con Logo del Dojo Seleccionado */}
                      <button
                        type="button"
                        onClick={() => setIsDojoDropdownOpen(prev => !prev)}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsDojoDropdownOpen(true);
                          } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                            setIsDojoDropdownOpen(true);
                            setDojoSearchFilter(e.key);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-gray-50/90 hover:bg-white border-2 border-gray-200 hover:border-[#2D2E83]/40 focus:border-[#2D2E83] focus:bg-white rounded-xl text-left transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-3"
                      >
                        {selectedDojo ? (
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 bg-white shrink-0 flex items-center justify-center shadow-2xs">
                              <img
                                src={selectedDojo.logo || '/images/dojos/default_logo.jpg'}
                                alt={`Logo ${selectedDojo.name}`}
                                className="w-full h-full object-contain p-0.5"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = '/images/dojos/default_logo.jpg';
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm md:text-base font-black text-gray-900 truncate">
                                  {selectedDojo.name}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#2D2E83] border border-blue-200/60 shrink-0">
                                  {selectedDojo.province}
                                </span>
                              </div>
                              <p className="text-[11px] sm:text-xs text-gray-500 font-semibold truncate mt-0.5">
                                Sensei: <span className="text-gray-800">{selectedDojo.sensei?.toLowerCase().startsWith('sensei') ? selectedDojo.sensei.substring(6).trim() : selectedDojo.sensei}</span>
                                <span className="ml-2 font-mono text-[#2D2E83] font-bold">[{selectedDojo.studentCount || 0} alumnos]</span>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm font-semibold">Seleccionar Dojo Afiliado...</span>
                        )}
                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          <span className="hidden sm:inline text-[11px] font-bold text-gray-400 uppercase">Cambiar</span>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDojoDropdownOpen ? 'rotate-180 text-[#2D2E83]' : ''}`} />
                        </div>
                      </button>

                      {/* Menú Desplegable con el Logo a la Izquierda de Cada Registro */}
                      {isDojoDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-[100] bg-white border-2 border-gray-200/90 rounded-2xl shadow-2xl overflow-hidden divide-y divide-gray-100 animate-in fade-in duration-150">
                          {/* Barra de Búsqueda Siempre Visible con Enfoque Directo */}
                          <div className="p-2.5 bg-gray-50/95 border-b border-gray-100 sticky top-0 z-20 backdrop-blur-xs">
                            <div className="relative">
                              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                ref={dojoSearchInputRef}
                                type="text"
                                value={dojoSearchFilter}
                                onChange={(e) => setDojoSearchFilter(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    setIsDojoDropdownOpen(false);
                                  } else if (e.key === 'Enter' && filteredDojos.length > 0) {
                                    e.preventDefault();
                                    setSelectedDojoId(filteredDojos[0]._id || filteredDojos[0].id);
                                    setIsDojoDropdownOpen(false);
                                    setDojoSearchFilter('');
                                  }
                                }}
                                placeholder="Buscar por dojo, sensei o provincia (ej. ku, kuma, alajuela)..."
                                className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs md:text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/10"
                              />
                              {dojoSearchFilter && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDojoSearchFilter('');
                                    dojoSearchInputRef.current?.focus();
                                  }}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-md cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Lista de Registros Filtrados */}
                          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 overscroll-contain">
                            {filteredDojos.length === 0 ? (
                              <div className="p-6 text-center text-xs md:text-sm text-gray-500 space-y-2">
                                <p className="font-semibold text-gray-700">
                                  No se encontró ningún dojo para &ldquo;{dojoSearchFilter}&rdquo;
                                </p>
                                <p className="text-xs text-gray-400">
                                  Busca por nombre de dojo, Sensei o provincia.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDojoSearchFilter('');
                                    dojoSearchInputRef.current?.focus();
                                  }}
                                  className="text-xs font-bold text-[#2D2E83] hover:underline cursor-pointer"
                                >
                                  Ver todos los dojos
                                </button>
                              </div>
                            ) : (
                              filteredDojos.map((dojo) => {
                                const isSelected = (dojo._id || dojo.id) === selectedDojoId;
                                return (
                                  <div
                                    key={dojo._id || dojo.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setSelectedDojoId(dojo._id || dojo.id);
                                      setIsDojoDropdownOpen(false);
                                      setDojoSearchFilter('');
                                    }}
                                    onClick={() => {
                                      setSelectedDojoId(dojo._id || dojo.id);
                                      setIsDojoDropdownOpen(false);
                                      setDojoSearchFilter('');
                                    }}
                                    className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer select-none ${
                                      isSelected ? 'bg-blue-50/90 text-[#2D2E83]' : 'hover:bg-gray-50 text-gray-800'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      {/* LOGO A LA IZQUIERDA DE CADA REGISTRO */}
                                      <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 bg-white shrink-0 flex items-center justify-center shadow-2xs">
                                        <img
                                          src={dojo.logo || '/images/dojos/default_logo.jpg'}
                                          alt={`Logo ${dojo.name}`}
                                          className="w-full h-full object-contain p-0.5"
                                          onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = '/images/dojos/default_logo.jpg';
                                          }}
                                        />
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-[#2D2E83]' : 'text-gray-900'}`}>
                                            {dojo.name}
                                          </span>
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 shrink-0">
                                            {dojo.province}
                                          </span>
                                        </div>
                                        <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5 truncate">
                                          Sensei: <strong className="font-semibold text-gray-800">{dojo.sensei?.toLowerCase().startsWith('sensei') ? dojo.sensei.substring(6).trim() : dojo.sensei}</strong>
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="px-2 py-1 rounded-lg text-[11px] font-bold font-mono bg-white border border-gray-200 text-gray-700 shadow-2xs">
                                        {dojo.studentCount || 0} alumnos
                                      </span>
                                      {isSelected && (
                                        <Check className="w-4 h-4 text-[#2D2E83] shrink-0" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Botón de Acción Principal: Registrar Alumno */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleOpenCreateStudent}
                  disabled={!selectedDojo}
                  className="w-full sm:w-auto px-6 py-3 bg-[#2D2E83] hover:bg-[#232468] disabled:bg-gray-300 text-white rounded-xl text-xs md:text-sm font-black transition-all shadow-md shadow-[#2D2E83]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Estudiante en este Dojo
                </button>
              </div>
            </div>
          </div>


          {/* Barra de Filtros y Búsqueda de Estudiantes */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/90 border border-gray-200/80 rounded-2xl p-3.5 shadow-xs relative z-10">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre de alumno..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 focus:border-[#2D2E83] focus:bg-white rounded-xl text-xs md:text-sm font-medium text-gray-900 transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              {/* Filtro Rápido: Todos vs Para Examen */}
              <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setPromotionFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    promotionFilter === 'all'
                      ? 'bg-white text-[#2D2E83] shadow-xs font-black'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Todos ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPromotionFilter('promoted')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    promotionFilter === 'promoted'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Para Examen ({promotedCount})
                </button>
              </div>

              {/* Selector de Kyu */}
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <select
                  value={rankFilter}
                  onChange={(e) => setRankFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 bg-gray-50 border border-gray-200 focus:border-[#2D2E83] rounded-xl text-xs font-bold text-gray-800 transition-all cursor-pointer"
                >
                  <option value="all">Todos los Kyu</option>
                  {KYU_OPTIONS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de Estudiantes (Optimizado para Tablet y Computadora) */}
          <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden">
            {isLoadingStudents ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-[#2D2E83]" />
                <p className="text-xs md:text-sm font-bold">Cargando padrón de estudiantes...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 md:p-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">
                  <Users className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-base font-black text-gray-900">
                    {searchQuery || rankFilter !== 'all' 
                      ? 'No se encontraron alumnos con los filtros seleccionados' 
                      : `Aún no hay alumnos registrados en ${selectedDojo?.name || 'este dojo'}`}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {searchQuery || rankFilter !== 'all'
                      ? 'Prueba restableciendo los filtros de búsqueda o kyu.'
                      : 'El Sensei titular puede comenzar a inscribir a sus alumnos para mantener el padrón listo para las fechas de examen.'}
                  </p>
                </div>
                {!searchQuery && rankFilter === 'all' && (
                  <button
                    onClick={handleOpenCreateStudent}
                    className="px-5 py-2.5 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-black transition-all shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Registrar Primer Alumno
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-black uppercase tracking-wider text-gray-600 select-none">
                      <th 
                        onClick={() => handleStudentSort('index')}
                        className="py-3.5 px-3 md:px-4 text-center w-14 cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        title="Ordenar por número consecutivo"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>#</span>
                          {studentSortField === 'index' ? (
                            studentSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2D2E83]" /> : <ArrowDown className="w-3 h-3 text-[#2D2E83]" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 opacity-30" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleStudentSort('name')}
                        className="py-3.5 px-4 md:px-6 cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        title="Ordenar por nombre"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Estudiante</span>
                          {studentSortField === 'name' ? (
                            studentSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#2D2E83]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#2D2E83]" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleStudentSort('rank')}
                        className="py-3.5 px-4 md:px-6 cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        title="Ordenar por cinturón / kyu"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Cinturón / Grado Actual</span>
                          {studentSortField === 'rank' ? (
                            studentSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#2D2E83]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#2D2E83]" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleStudentSort('birthDate')}
                        className="py-3.5 px-4 md:px-6 cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        title="Ordenar por fecha de nacimiento / edad"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Nacimiento & Edad</span>
                          {studentSortField === 'birthDate' ? (
                            studentSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#2D2E83]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#2D2E83]" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleStudentSort('status')}
                        className="py-3.5 px-4 md:px-6 text-center cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        title="Ordenar por matrícula para examen"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Matrícula a Examen</span>
                          {studentSortField === 'status' ? (
                            studentSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#2D2E83]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#2D2E83]" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </div>
                      </th>
                      <th className="py-3.5 px-4 md:px-6 text-center">Evaluación Técnica (BD)</th>
                      <th className="py-3.5 px-4 md:px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs md:text-sm font-medium text-gray-800">
                    {sortedStudents.map((student) => {
                      const badge = getBeltBadge(student.currentRank);
                      const age = calculateAge(student.birthDate);
                      const birthFormatted = formatDateDDMMAAAA(student.birthDate);

                      return (
                        <tr 
                          key={student._id || student.id}
                          className="hover:bg-blue-50/40 transition-colors group"
                        >
                          {/* Numeral Consecutivo */}
                          <td className="py-4 px-3 md:px-4 text-center font-mono text-xs font-bold text-gray-400 select-none">
                            {student.originalIndex}
                          </td>

                          {/* Columna: Nombre */}
                          <td className="py-4 px-4 md:px-6">
                            <div className="flex items-center gap-3">
                              {student.photo ? (
                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#2D2E83]/20 bg-white shrink-0 shadow-2xs">
                                  <img 
                                    src={student.photo} 
                                    alt={student.name} 
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-[#2D2E83]/10 text-[#2D2E83] font-black text-xs flex items-center justify-center shrink-0 border border-[#2D2E83]/20 shadow-2xs">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-gray-900 block leading-tight">
                                    {student.name}
                                  </span>
                                  {student.hasSpecialCondition && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300" title={student.specialCondition}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                      Condición Especial
                                    </span>
                                  )}
                                </div>
                                {student.hasSpecialCondition && (
                                  <div className="text-[11px] text-amber-900 font-medium mt-0.5 line-clamp-1">
                                    <span className="font-bold text-amber-800">Condición:</span> {student.specialCondition || 'En observación'}
                                  </div>
                                )}
                                {student.positiveAspects && (
                                  <div className="mt-1 space-y-0.5" title={student.positiveAspects}>
                                    {student.positiveAspects.split('\n').filter(Boolean).map((line, i) => (
                                      <div key={i} className="flex items-start gap-1 text-[11px] text-emerald-800 font-medium">
                                        <span className="text-emerald-600 font-black shrink-0 leading-none mt-0.5">•</span>
                                        <span className="line-clamp-1">{line.replace(/^[\s•\-*]+/, '')}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {student.notes && (
                                  <span className="text-[11px] text-gray-500 line-clamp-1 italic mt-0.5 block">
                                    {student.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Columna: Kyu */}
                          <td className="py-4 px-4 md:px-6 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                              {student.currentRank}
                            </span>
                          </td>

                          {/* Columna: Nacimiento & Edad */}
                          <td className="py-4 px-4 md:px-6 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900 font-mono font-bold text-xs sm:text-sm">
                                {birthFormatted}
                              </span>
                              {age !== null ? (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-blue-50 text-[#2D2E83] border border-blue-200">
                                  {age} años
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-gray-100 text-gray-500">
                                  —
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Columna: Matrícula para Examen (Promocionado) */}
                          <td className="py-4 px-4 md:px-6 whitespace-nowrap text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePromotion(student)}
                              disabled={togglingPromotionId === (student._id || student.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-2xs border cursor-pointer active:scale-95 disabled:opacity-50 ${
                                student.isPromotedForExam
                                  ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-emerald-600/20'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                              }`}
                              title={student.isPromotedForExam ? "Haga clic para quitar postulación a examen" : "Haga clic para postular a examen"}
                            >
                              {togglingPromotionId === (student._id || student.id) ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                              ) : student.isPromotedForExam ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400" />
                              )}
                              <span>{student.isPromotedForExam ? 'Listo para Examen' : 'En Preparación'}</span>
                            </button>
                          </td>

                          {/* Columna: Evaluación Técnica en BD */}
                          <td className="py-4 px-4 md:px-6 whitespace-nowrap text-center">
                            {evaluationsByStudent[student._id || student.id] ? (
                              <button
                                type="button"
                                onClick={() => setSelectedStudentReport(evaluationsByStudent[student._id || student.id])}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border shadow-2xs cursor-pointer active:scale-95 ${
                                  evaluationsByStudent[student._id || student.id].isPassed
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                    : evaluationsByStudent[student._id || student.id].percentage > 0
                                    ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                    : 'bg-gray-100 text-gray-500 border-gray-200'
                                }`}
                                title="Ver desglose detallado de notas con estrellas"
                              >
                                <Star className={`w-3.5 h-3.5 ${evaluationsByStudent[student._id || student.id].isPassed ? 'fill-emerald-600 text-emerald-600' : 'fill-amber-500 text-amber-500'}`} />
                                <span>{evaluationsByStudent[student._id || student.id].percentage}%</span>
                                <span>{evaluationsByStudent[student._id || student.id].isPassed ? '✓ Aprobado' : 'En Evaluación'}</span>
                                <Eye className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs italic font-medium">Sin evaluar</span>
                            )}
                          </td>

                          {/* Columna: Acciones */}
                          <td className="py-4 px-4 md:px-6 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditStudent(student)}
                                className="p-2 rounded-xl text-gray-600 hover:text-[#2D2E83] hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                                title="Editar estudiante"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student)}
                                className="p-2 rounded-xl text-gray-400 hover:text-[#BE1622] hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                                title="Eliminar estudiante"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MESA DE EVALUACIÓN EN TATAMI (OPCIÓN B - 6 COLUMNAS CON MICRO-BARRAS) */}
      {/* ========================================================================= */}
      {activeTab === 'tatami' && (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* BARRA DE TRIBUNAL EVALUADOR (1 A 5 SENSEIS) & ACCIÓN "EXPONER EVALUACIÓN" */}
          {/* ========================================================================= */}
          <div className="bg-linear-to-r from-slate-900 via-[#2D2E83] to-blue-900 rounded-2xl p-4 text-white shadow-lg border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-lg shrink-0 shadow-md border border-amber-300">
                🥋
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 font-mono">
                    Tribunal Examinador Convocado
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/10 text-blue-100 border border-white/20">
                    <Users className="w-3 h-3" />
                    {tribunalSenseis.length} {tribunalSenseis.length === 1 ? 'Sensei' : 'Senseis'}
                  </span>
                  {isLoadingEvaluations && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-mono">
                      <Loader2 className="w-3 h-3 animate-spin" /> Sincronizando notas...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-blue-200 font-medium">Evaluando en este dispositivo:</span>
                  <div className="relative inline-block">
                    <select
                      value={activeEvaluatorEmail}
                      onChange={(e) => {
                        const match = tribunalSenseis.find(s => s.email === e.target.value);
                        if (match) handleSwitchEvaluator(match);
                      }}
                      className="bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl px-3 py-1 text-xs font-black cursor-pointer appearance-none pr-7 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      {tribunalSenseis.map((s, idx) => (
                        <option key={s.email || idx} value={s.email} className="text-gray-900 font-bold">
                          🥋 {s.name} ({s.role || `Sinodal ${idx + 1}`})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/70 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTribunalModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/20"
                    title="Configurar Tribunal (Convocatoria de 1 a 5 Senseis)"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
                    <span className="text-[11px]">Convocatoria</span>
                  </button>
                </div>
              </div>
            </div>

            {/* BOTÓN PRINCIPAL: EXPONER EVALUACIÓN */}
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={handleOpenConsolidation}
                className="w-full md:w-auto px-5 py-2.5 bg-linear-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 font-black rounded-xl text-xs md:text-sm shadow-lg shadow-amber-400/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 border border-amber-300"
              >
                <Sparkles className="w-4 h-4 fill-amber-950 text-amber-950 animate-pulse" />
                <span>Exponer Evaluación (Tribunal & IA)</span>
              </button>
            </div>
          </div>

          {/* Selector de Fases y Técnicas del Temario Oficial */}
          <div className="bg-white/95 border border-gray-200/90 rounded-2xl p-4 shadow-xs space-y-3">
            {/* Pestañas de Fases Dinámicas + Controles Compactos */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['kihon', 'kumite', 'kata', 'aspectos'].map((phaseKey) => {
                const isCurrentPhase = activeTechnique.phase === phaseKey;
                const phaseIcons = { kihon: '🥋', kumite: '⚔️', kata: '📜', aspectos: '⭐' };
                const phaseCount = examTechniques.filter(t => t.phase === phaseKey).length;
                if (phaseCount === 0) return null;
                const phaseTitles = { 
                  kihon: `1. KIHON (${phaseCount})`, 
                  kumite: `2. KUMITE (${phaseCount})`, 
                  kata: `3. KATA (${phaseCount})`, 
                  aspectos: `4. ASPECTOS TÉCNICOS & RÚBRICA (${phaseCount})` 
                };

                return (
                  <button
                    key={phaseKey}
                    type="button"
                    onClick={() => {
                      const firstTechIndex = examTechniques.findIndex(t => t.phase === phaseKey);
                      if (firstTechIndex !== -1) setActiveTechniqueIndex(firstTechIndex);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                      isCurrentPhase
                        ? 'bg-[#2D2E83] text-white shadow-md shadow-[#2D2E83]/20'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{phaseIcons[phaseKey]}</span>
                    <span>{phaseTitles[phaseKey]}</span>
                  </button>
                );
              })}
              </div>

              {/* Controles Compactos a la derecha: Temario y Tanda (si aplican) */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {syllabi.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
                    <BookOpen className="w-3.5 h-3.5 text-[#2D2E83]" />
                    <select
                      value={selectedSyllabusId}
                      onChange={(e) => setSelectedSyllabusId(e.target.value)}
                      className="bg-transparent text-xs font-bold text-[#2D2E83] focus:outline-none cursor-pointer max-w-[200px] truncate"
                    >
                      {syllabi.map(s => (
                        <option key={s._id || s.id} value={s._id || s.id}>
                          {s.targetRank || s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {totalTatamiBatches > 1 && (
                  <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">Tanda:</span>
                    <select
                      value={tatamiBatchIndex}
                      onChange={(e) => setTatamiBatchIndex(parseInt(e.target.value, 10))}
                      className="bg-transparent text-xs font-bold text-[#2D2E83] focus:outline-none cursor-pointer"
                    >
                      {Array.from({ length: totalTatamiBatches }).map((_, idx) => (
                        <option key={idx} value={idx}>
                          Tanda {idx + 1} ({idx * 6 + 1}-{Math.min((idx + 1) * 6, candidateStudents.length)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Pastillas de Técnicas Específicas Dinámicas de la Fase Seleccionada */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={activeTechniqueIndex === 0}
                onClick={() => setActiveTechniqueIndex(prev => Math.max(0, prev - 1))}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-gray-100 text-gray-700 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 flex-1 justify-center">
                {examTechniques
                  .map((tech, idx) => ({ tech, idx }))
                  .filter(({ tech }) => tech.phase === activeTechnique.phase)
                  .map(({ tech, idx }, localIdx) => {
                    const isActive = idx === activeTechniqueIndex;
                    return (
                      <button
                        key={tech.id}
                        type="button"
                        onClick={() => setActiveTechniqueIndex(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-amber-400 text-amber-950 font-black shadow-xs ring-2 ring-amber-400/30'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <span>{localIdx + 1}. {tech.name}</span>
                      </button>
                    );
                  })}
              </div>

              <button
                type="button"
                disabled={activeTechniqueIndex === examTechniques.length - 1}
                onClick={() => setActiveTechniqueIndex(prev => Math.min(examTechniques.length - 1, prev + 1))}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-[#2D2E83] hover:bg-[#232468] disabled:opacity-40 text-white flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tarjeta de la Técnica Activa en Ejecución */}
          <div className="bg-linear-to-r from-blue-900 via-[#2D2E83] to-slate-900 rounded-2xl p-5 text-white shadow-lg space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 font-mono">
                    Técnica {activeTechniqueIndex + 1} de {examTechniques.length}
                  </span>
                  <span className="text-xs text-blue-200 font-bold">
                    {activeTechnique.phaseLabel}
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  {activeTechnique.name}
                </h3>
                <p className="text-xs text-blue-100 font-medium">
                  {activeTechnique.subname} • <strong className="text-amber-300">🥋 {activeTechnique.stance}</strong>
                </p>


                {/* SOLO KATA: Atributo Embusen */}
                {activeTechnique.phase === 'kata' && (
                  <div className="flex items-center gap-2 pt-1 pb-0.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/40">
                      <span>📜 Embusen:</span>
                      <strong className="text-white font-mono">{activeTechnique.embusen || 'Embusen Oficial ISKF'}</strong>
                    </span>
                  </div>
                )}

                <p className="text-[11px] text-amber-200/90 font-mono">
                  📣 {activeTechnique.phase === 'aspectos' ? 'Pautas Oficiales de Evaluación (BD):' : 'Comando Oficial:'} {activeTechnique.command}
                </p>
              </div>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* TABLA DE EVALUACIÓN EN TATAMI (HASTA 6 ALUMNOS EN LÍNEA SIN CORTES) */}
          {/* ========================================================================= */}
          {currentTatamiGroup.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3">
              <Users className="w-12 h-12 text-gray-300 mx-auto" />
              <h4 className="text-base font-black text-gray-800">No hay estudiantes postulados para evaluación</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Únicamente los estudiantes marcados como &ldquo;Listo para Examen&rdquo; aparecerán en esta mesa de evaluación. Ve a la pestaña &ldquo;Padrón de Estudiantes&rdquo; para postular a los alumnos que saldrán a tatami.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('students')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Users className="w-4 h-4" />
                  Ir al Padrón de Estudiantes
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#2D2E83] text-white text-[11px] uppercase tracking-wider font-bold divide-x divide-[#232468]">
                      <th className="py-3 px-3 w-20 text-center">Puesto</th>
                      <th className="py-3 px-4 min-w-[220px]">Aspirante (Tatami)</th>
                      {activeTechnique.rubrics.map((rub) => (
                        <th key={rub.id} className="py-3 px-4 min-w-[240px] max-w-[340px]">
                          <div className="flex items-start gap-1.5 text-white">
                            <span className="shrink-0 mt-0.5">{rub.icon}</span>
                            <span className="font-bold text-xs normal-case leading-snug">{rub.label}</span>
                          </div>
                        </th>
                      ))}
                      {/* Observaciones como criterio al final de la derecha */}
                      <th className="py-3 px-4 min-w-[260px] max-w-[340px]">
                        <div className="flex items-start gap-1.5 text-white">
                          <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
                          <div>
                            <span className="font-bold text-xs normal-case leading-snug">Observaciones</span>
                            <p className="text-[10px] text-blue-200/90 font-normal normal-case">Puntuales de la técnica</p>
                          </div>
                        </div>
                      </th>
                      <th className="py-3 px-3 w-28 text-center">Técnica</th>
                      <th className="py-3 px-3 w-28 text-center">Examen Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {currentTatamiGroup.map((student, posIdx) => {
                      const studentId = student._id || student.id;
                      const stScores = tatamiScores[studentId]?.[activeTechnique.id] || {};
                      const techAvg = getStudentTechniqueScore(studentId, activeTechnique);
                      const overall = getStudentOverallExam(studentId);
                      const badge = getBeltBadge(student.currentRank);

                      return (
                        <tr
                          key={studentId}
                          className="hover:bg-blue-50/40 transition-colors group divide-x divide-gray-100"
                        >
                          {/* Puesto */}
                          <td className="py-3.5 px-3 text-center align-middle bg-gray-50/50">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-black font-mono bg-[#2D2E83] text-white shadow-2xs">
                              #{posIdx + 1}
                            </span>
                          </td>

                          {/* Aspirante (Nombre completo, foto y cinta sin truncar) */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex items-center gap-3">
                              {student.photo ? (
                                <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-200 bg-white shrink-0 shadow-2xs">
                                  <img
                                    src={student.photo}
                                    alt={student.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-[#2D2E83]/10 text-[#2D2E83] font-black text-sm flex items-center justify-center shrink-0 border border-[#2D2E83]/20 shadow-2xs">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="text-sm font-black text-gray-900 leading-tight">
                                  {student.name}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                    <span>{student.currentRank}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Criterios / Rubros específicos de la técnica con 1 a 5 estrellas */}
                          {activeTechnique.rubrics.map((rub) => {
                            const currentVal = stScores[rub.id] || 0;

                            return (
                              <td key={rub.id} className="py-3.5 px-4 align-middle">
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col gap-1 bg-gray-50 p-1.5 rounded-xl border border-gray-200/90 shadow-2xs select-none">
                                    {/* Fila 1: Estrellas 1 a 5 */}
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map((starNum) => {
                                        const isSelected = currentVal >= starNum;
                                        const isHalf = !isSelected && (currentVal >= starNum - 0.5);
                                        return (
                                          <button
                                            key={starNum}
                                            type="button"
                                            onClick={(e) => handleAdminStarClick(studentId, activeTechnique.id, rub.id, starNum, e)}
                                            onDoubleClick={(e) => handleAdminStarDoubleClick(studentId, activeTechnique.id, rub.id, starNum, e)}
                                            className={`w-5 h-5 rounded text-[10px] font-black transition-all flex items-center justify-center cursor-pointer active:scale-95 select-none relative ${
                                              isSelected
                                                ? 'bg-amber-400 text-amber-950 shadow-2xs'
                                                : isHalf
                                                ? 'bg-amber-100 border border-amber-300'
                                                : 'bg-white text-gray-300 border border-gray-200 hover:border-amber-300 hover:text-amber-500'
                                            }`}
                                            title={`${starNum}/10 estrellas: ${rub.label} (Doble clic para media estrella)`}
                                          >
                                            {isHalf ? (
                                              <span className="relative inline-flex items-center justify-center">
                                                <Star className="w-3 h-3 text-gray-300" />
                                                <StarHalf className="w-3 h-3 absolute inset-0 text-amber-600 fill-amber-500" />
                                              </span>
                                            ) : (
                                              <Star className={`w-3 h-3 ${isSelected ? 'fill-amber-950 text-amber-950' : 'text-gray-300'}`} />
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Fila 2: Estrellas 6 a 10 */}
                                    <div className="flex items-center gap-1">
                                      {[6, 7, 8, 9, 10].map((starNum) => {
                                        const isSelected = currentVal >= starNum;
                                        const isHalf = !isSelected && (currentVal >= starNum - 0.5);
                                        return (
                                          <button
                                            key={starNum}
                                            type="button"
                                            onClick={(e) => handleAdminStarClick(studentId, activeTechnique.id, rub.id, starNum, e)}
                                            onDoubleClick={(e) => handleAdminStarDoubleClick(studentId, activeTechnique.id, rub.id, starNum, e)}
                                            className={`w-5 h-5 rounded text-[10px] font-black transition-all flex items-center justify-center cursor-pointer active:scale-95 select-none relative ${
                                              isSelected
                                                ? 'bg-amber-400 text-amber-950 shadow-2xs'
                                                : isHalf
                                                ? 'bg-amber-100 border border-amber-300'
                                                : 'bg-white text-gray-300 border border-gray-200 hover:border-amber-300 hover:text-amber-500'
                                            }`}
                                            title={`${starNum}/10 estrellas: ${rub.label} (Doble clic para media estrella)`}
                                          >
                                            {isHalf ? (
                                              <span className="relative inline-flex items-center justify-center">
                                                <Star className="w-3 h-3 text-gray-300" />
                                                <StarHalf className="w-3 h-3 absolute inset-0 text-amber-600 fill-amber-500" />
                                              </span>
                                            ) : (
                                              <Star className={`w-3 h-3 ${isSelected ? 'fill-amber-950 text-amber-950' : 'text-gray-300'}`} />
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  <span className={`text-xs font-black font-mono w-10 text-center ${currentVal > 0 ? 'text-amber-700' : 'text-gray-300'}`}>
                                    {currentVal > 0 ? `${currentVal}/10` : '—'}
                                  </span>
                                </div>
                              </td>
                            );
                          })}

                          {/* Campo de observaciones puntuales por técnica */}
                          <td className="py-3.5 px-4 align-middle min-w-[260px] max-w-[340px]">
                            <textarea
                              value={tatamiObservations[studentId]?.[activeTechnique.id] || ''}
                              onChange={(e) => {
                                const currentVal = tatamiObservations[studentId]?.[activeTechnique.id] || '';
                                handleBulletInputChange(e, currentVal, (formatted) => {
                                  handleSetObservation(studentId, activeTechnique.id, formatted);
                                });
                              }}
                              onKeyDown={(e) => {
                                const currentVal = tatamiObservations[studentId]?.[activeTechnique.id] || '';
                                handleBulletKeyDown(e, currentVal, (formatted) => {
                                  handleSetObservation(studentId, activeTechnique.id, formatted);
                                });
                              }}
                              placeholder="• Escribir observaciones..."
                              rows={2}
                              className="w-full text-xs p-2 rounded-xl border border-gray-200 bg-white focus:bg-white focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 outline-hidden resize-none transition-all placeholder:text-gray-400 font-medium leading-relaxed shadow-2xs"
                            />
                          </td>

                          {/* Promedio de la Técnica Activa */}
                          <td className="py-3.5 px-3 text-center align-middle">
                            {techAvg !== null ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black font-mono bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                {techAvg}
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-gray-400">—</span>
                            )}
                          </td>

                          {/* Examen Total Acumulado */}
                          <td className="py-3.5 px-3 text-center align-middle">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black font-mono border ${
                              overall.pct >= 70
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : overall.pct > 0
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                              {overall.pct}% {overall.pct >= 70 ? '✓' : ''}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Barra Inferior de Navegación y Finalización */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/90 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Técnica evaluada: <strong>{activeTechnique.name}</strong> ({activeTechniqueIndex + 1} de {examTechniques.length})</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('closure');
                  handleOpenConsolidation();
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ir al Cierre de Examen</span>
              </button>

              <button
                type="button"
                disabled={isSavingScores}
                onClick={handleSaveTatamiScores}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {isSavingScores ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando en BD...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Guardar Notas ({activeEvaluatorName.split(' ')[0]})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={activeTechniqueIndex === examTechniques.length - 1}
                onClick={() => setActiveTechniqueIndex(prev => Math.min(examTechniques.length - 1, prev + 1))}
                className="px-5 py-2.5 bg-[#2D2E83] hover:bg-[#232468] disabled:opacity-40 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-[#2D2E83]/20 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Siguiente Técnica</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CIERRE DE EXAMEN, CONDENSACIÓN Y CERTIFICADOS OFICIALES (ETAPA 5) */}
      {/* ========================================================================= */}
      {activeTab === 'closure' && (
        <div className="space-y-6">
          {/* Banner Explicativo de la Etapa 5 */}
          <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-emerald-500/30">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
                    Etapa 5 • Cierre Oficial
                  </span>
                  <span className="text-xs text-emerald-200 font-bold">
                    ISKF Costa Rica • Post-Tatami
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight">
                  Condensación del Tribunal y Emisión de Certificados
                </h2>
                <p className="text-xs md:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
                  Esta fase se realiza <strong>únicamente cuando TODOS los karatecas han terminado</strong> de examinarse en tatami. 
                  El sistema promedia las notas de los evaluadores, la IA analiza exclusivamente las notas del campo <em>Observaciones</em> para encontrar puntos comunes en viñetas (<code className="bg-black/30 px-1 py-0.5 rounded text-amber-300 font-mono">*</code>), y se generan los Certificados Oficiales en PDF.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenConsolidation}
                  disabled={isLoadingConsolidation}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoadingConsolidation ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  <span>Refrescar Notas de Tatami</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateAllAISyntheses}
                  disabled={isSynthesizingAll || isLoadingConsolidation}
                  className="px-5 py-2.5 bg-linear-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-amber-300"
                >
                  {isSynthesizingAll ? <Loader2 className="w-4 h-4 animate-spin text-amber-950" /> : <Bot className="w-4 h-4" />}
                  <span>Sintetizar Observaciones con IA (Todos)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Listado de Aspirantes y Generación de Certificados */}
          {isLoadingConsolidation ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-gray-200">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-bold">Condensando evaluaciones del tribunal...</p>
            </div>
          ) : Object.keys(consolidationDataByStudent).length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-300 p-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <FileCheck className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">No hay evaluaciones registradas aún</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
                Primero deben calificarse a los aspirantes en tatami. Una vez evaluados, aquí aparecerán sus promedios consolidados y certificados.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('tatami')}
                className="px-5 py-2.5 bg-[#BE1622] text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Ir a la Mesa de Tatami</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(consolidationDataByStudent).map((item) => {
                const sId = item.student._id || item.student.id;
                const isSynthesizing = aiSynthesizingId === sId;
                const isSaving = isSavingConsolidationId === sId;
                const belt = getBeltBadge(item.student.currentRank);

                return (
                  <div
                    key={sId}
                    className="p-6 rounded-3xl bg-white border border-gray-200/90 shadow-sm hover:border-emerald-300 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                  >
                    {/* Datos del Karateca y Notas del Tribunal */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#2D2E83] text-white font-black text-sm flex items-center justify-center shadow-xs">
                          {item.student.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-black text-gray-900 leading-snug">{item.student.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${belt.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${belt.dot}`} />
                              <span>{item.student.currentRank}</span>
                            </span>
                            <span className="text-xs text-gray-400">→</span>
                            <span className="text-xs font-black text-[#2D2E83]">
                              {activeSyllabus?.targetRank || 'Pase de Grado'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Desglose Completo de Notas por Sensei y Promedios Finales con Tabs */}
                      <StudentEvaluationBreakdown
                        item={item}
                        examTechniques={examTechniques}
                        onGenerateAI={() => handleGenerateStudentAISynthesis(sId)}
                        isSynthesizing={isSynthesizing}
                      />
                    </div>

                    {/* Acciones de Cierre y Emisión */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleDownloadCertificate(item)}
                        className="px-5 py-2.5 bg-[#BE1622] hover:bg-[#9E121C] text-white rounded-xl text-xs font-black transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Award className="w-4 h-4" />
                        <span>Descargar Certificado (PDF)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveStudentConsolidatedVerdict(sId)}
                        disabled={isSaving}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#2D2E83] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200"
                      >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{item.isSaved ? 'Dictamen Guardado en BD' : 'Oficializar en BD'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* ========================================================================= */}
      {/* MODAL: ASPECTOS A CONSIDERAR DEL KARATECA */}
      {/* ========================================================================= */}
      {selectedStudentForAspects && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-amber-300 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900">Aspectos a Considerar</h4>
                  <p className="text-xs text-amber-800 font-bold">{selectedStudentForAspects.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForAspects(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {/* Condición Especial */}
              {(selectedStudentForAspects.hasSpecialCondition || selectedStudentForAspects.specialCondition) && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-1.5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Condición Especial / Adaptación</span>
                  </div>
                  <div className="text-xs text-amber-950 whitespace-pre-line leading-relaxed font-medium">
                    {selectedStudentForAspects.specialCondition || '• Condición especial en observación.'}
                  </div>
                </div>
              )}

              {/* Aspectos Positivos */}
              {selectedStudentForAspects.positiveAspects && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-300 space-y-1.5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Aspectos Positivos / Fortalezas</span>
                  </div>
                  <div className="text-xs text-emerald-950 whitespace-pre-line leading-relaxed font-medium">
                    {selectedStudentForAspects.positiveAspects}
                  </div>
                </div>
              )}

              {/* Notas del Dojo */}
              {selectedStudentForAspects.notes && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1.5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span>Observaciones del Dojo</span>
                  </div>
                  <div className="text-xs text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                    {selectedStudentForAspects.notes}
                  </div>
                </div>
              )}

              {!selectedStudentForAspects.specialCondition && !selectedStudentForAspects.positiveAspects && !selectedStudentForAspects.notes && (
                <div className="py-6 text-center text-xs text-gray-500">
                  No hay aspectos especiales registrados para este atleta.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentForAspects(null)}
                className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR / EDITAR ESTUDIANTE */}
      {/* ========================================================================= */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/90 w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            {/* Cabecera del Modal */}
            <div className="shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 bg-linear-to-r from-blue-50/80 via-white to-gray-50/80 border-b border-gray-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2D2E83] text-white flex items-center justify-center shadow-sm shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                    {studentModalMode === 'create' ? 'Inscribir Nuevo Karateca' : 'Editar Datos del Karateca'}
                  </h3>
                  <p className="text-xs text-gray-600 font-medium">
                    Dojo: <strong className="text-[#2D2E83]">{selectedDojo?.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStudentModalOpen(false)}
                className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario con Scroll Interno */}
            <form onSubmit={handleSaveStudent} className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
              {/* Foto del Estudiante */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#2D2E83]/20 bg-white shadow-inner flex items-center justify-center">
                    {studentPhoto ? (
                      <img 
                        src={studentPhoto} 
                        alt="Foto del estudiante" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Users className="w-7 h-7 opacity-40" />
                        <span className="text-[10px] font-bold mt-1 text-gray-400">Sin foto</span>
                      </div>
                    )}
                  </div>
                  {studentPhoto && (
                    <button
                      type="button"
                      onClick={() => setStudentPhoto('')}
                      className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-xs cursor-pointer"
                      title="Eliminar foto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                    Fotografía del Estudiante (Opcional)
                  </label>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Formato JPG o PNG, máx. 2MB. Visible en el padrón técnico y actas de examen.
                  </p>
                  <div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleStudentPhotoUpload}
                      className="hidden"
                      id="student-photo-upload"
                    />
                    <label
                      htmlFor="student-photo-upload"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#2D2E83] border border-[#2D2E83]/30 hover:bg-[#2D2E83]/5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {studentPhoto ? 'Cambiar Fotografía' : 'Subir Fotografía'}
                    </label>
                  </div>
                </div>
              </div>
              {/* Nombre Completo */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700">
                  Nombre Completo del Estudiante *
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Ej: Daniel Morales Alvarado"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 focus:border-[#2D2E83] focus:bg-white rounded-xl text-sm font-semibold text-gray-900 transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Fecha de Nacimiento & Edad en Vivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#2D2E83]" />
                      Nacimiento (DD/MM/AAAA) (Opcional)
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={10}
                      value={studentBirthDate}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        let formatted = raw;
                        if (raw.length > 4) {
                          formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)}`;
                        } else if (raw.length > 2) {
                          formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
                        }
                        setStudentBirthDate(formatted);
                      }}
                      placeholder="DD/MM/AAAA (ej. 20/02/1995)"
                      className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-300 focus:border-[#2D2E83] focus:bg-white rounded-xl text-xs md:text-sm font-mono font-bold text-gray-900 transition-all placeholder:text-gray-400 placeholder:font-sans"
                    />
                    <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700">
                    Edad Calculada
                  </label>
                  <div className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                    modalCalculatedAge !== null
                      ? 'bg-blue-50/80 border-blue-200 text-[#2D2E83]'
                      : 'bg-gray-100/90 border-gray-200 text-gray-500'
                  }`}>
                    <span>Años cumplidos:</span>
                    <span className="font-mono text-sm font-black">
                      {modalCalculatedAge !== null ? `${modalCalculatedAge} años` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selector de Kyu / Grado */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700">
                  Cinturón / Grado Actual (Kyu) *
                </label>
                <div className="relative">
                  <select
                    value={studentRank}
                    onChange={(e) => setStudentRank(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-300 focus:border-[#2D2E83] focus:bg-white rounded-xl text-xs md:text-sm font-bold text-gray-900 transition-all cursor-pointer appearance-none"
                  >
                    {KYU_OPTIONS.map((kyu) => (
                      <option key={kyu} value={kyu}>{kyu}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Aspectos Positivos Desglosados en Viñetas Automáticas */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                  Aspectos Positivos
                </label>
                <textarea
                  rows={3}
                  value={studentPositiveAspects}
                  onChange={(e) => handleBulletInputChange(e, studentPositiveAspects, setStudentPositiveAspects)}
                  onKeyDown={(e) => handleBulletKeyDown(e, studentPositiveAspects, setStudentPositiveAspects)}
                  placeholder="• Escriba las fortalezas o aspectos positivos del karateca..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 focus:border-[#2D2E83] focus:bg-white rounded-xl text-xs md:text-sm font-medium text-gray-900 transition-all placeholder:text-gray-400 outline-hidden leading-relaxed resize-y"
                />
                <p className="text-[11px] text-gray-500">
                  Al escribir se inicia automáticamente con viñeta. Presiona <strong>Enter</strong> para crear una nueva línea con viñeta.
                </p>
              </div>

              {/* Toggle Condición Especial */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label htmlFor="toggleSpecialExam" className="text-xs font-black uppercase tracking-wider text-gray-700 cursor-pointer">
                    ¿Tiene Condición Especial?
                  </label>
                  <button
                    type="button"
                    id="toggleSpecialExam"
                    role="switch"
                    aria-checked={studentHasSpecialCondition}
                    onClick={() => {
                      setStudentHasSpecialCondition(prev => !prev);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      studentHasSpecialCondition ? 'bg-amber-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        studentHasSpecialCondition ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {studentHasSpecialCondition && (
                  <div className="space-y-1.5 animate-in fade-in duration-150">
                    <textarea
                      rows={2}
                      value={studentSpecialCondition}
                      onChange={(e) => handleBulletInputChange(e, studentSpecialCondition, setStudentSpecialCondition)}
                      onKeyDown={(e) => handleBulletKeyDown(e, studentSpecialCondition, setStudentSpecialCondition)}
                      placeholder="• Indique la condición física, médica o adaptación especial..."
                      className="w-full px-4 py-2 bg-amber-50/50 border border-amber-300 focus:border-[#2D2E83] focus:bg-white rounded-xl text-xs font-medium text-gray-900 outline-hidden leading-relaxed resize-y"
                    />
                    <p className="text-[11px] text-gray-500">
                      Al escribir se inicia automáticamente con viñeta. Presiona <strong>Enter</strong> para crear una nueva línea con viñeta.
                    </p>
                  </div>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="sticky -bottom-5 sm:-bottom-6 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3.5 bg-white/95 backdrop-blur-md border-t border-gray-200/90 flex items-center justify-end gap-3 z-10 shadow-xs mt-4">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  disabled={isSavingStudent}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingStudent}
                  className="px-5 sm:px-6 py-2.5 rounded-xl text-xs font-black text-white bg-[#2D2E83] hover:bg-[#232468] transition-all shadow-md shadow-[#2D2E83]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingStudent ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando en Base de Datos...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {studentModalMode === 'create' ? 'Registrar Estudiante' : 'Guardar Cambios'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INFORME Y DESGLOSE COMPLETO DE EVALUACIÓN TÉCNICA (MONGODB) */}
      {/* ========================================================================= */}
      {selectedStudentReport && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/90 w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
            {/* Cabecera del Informe Fija */}
            <div className="shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 bg-linear-to-r from-blue-900 via-[#2D2E83] to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/10 backdrop-blur-md text-amber-300 flex items-center justify-center border border-white/20 shrink-0">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                    {selectedStudentReport.studentName}
                  </h3>
                  <p className="text-xs text-blue-200 font-medium">
                    {selectedStudentReport.syllabusName || 'Temario Oficial ISKF'} • {selectedStudentReport.targetRank}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-black font-mono border ${
                  selectedStudentReport.isPassed
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : 'bg-amber-400 text-amber-950 border-amber-300'
                }`}>
                  {selectedStudentReport.percentage}% {selectedStudentReport.isPassed ? '✓ APROBADO' : 'EN EVALUACIÓN'}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudentReport(null)}
                  className="p-1.5 sm:p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Metadatos de la evaluación */}
            <div className="shrink-0 px-5 sm:px-6 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs text-gray-600 flex-wrap gap-2">
              <div>
                <span>Evaluador: </span>
                <strong className="text-gray-900 font-bold">{selectedStudentReport.evaluatorName || 'Comisión Técnica'}</strong>
              </div>
              <div>
                <span>Registrado en BD: </span>
                <strong className="text-gray-900 font-bold">
                  {selectedStudentReport.evaluatedAt ? new Date(selectedStudentReport.evaluatedAt).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                </strong>
              </div>
            </div>

            {/* Desglose por Técnica y Aspecto */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                Puntuación Detallada por Técnica y Criterio Evaluado (1 a 5 Estrellas)
              </h4>

              <div className="space-y-3">
                {examTechniques.map((tech) => {
                  const techScores = selectedStudentReport.scores?.[tech.id] || {};
                  const average = selectedStudentReport.techniqueAverages?.[tech.id];

                  return (
                    <div key={tech.id} className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/90 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-gray-900 block">{tech.name}</span>
                          <span className="text-[11px] text-gray-500 font-medium">{tech.phaseLabel}</span>
                        </div>
                        {average ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black font-mono bg-amber-50 text-amber-900 border border-amber-300">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            {average}★
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium italic">Sin calificar</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-200/60">
                        {tech.rubrics.map((rub) => {
                          const starVal = techScores[rub.id] || 0;
                          return (
                            <div key={rub.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-gray-200/80 text-xs">
                              <span className="font-bold text-gray-700 truncate pr-2">{rub.label}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex flex-col gap-0.5">
                                  {/* Fila 1: 1 a 5 */}
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => {
                                      const isFilled = starVal >= s;
                                      const isHalf = !isFilled && (starVal >= s - 0.5);
                                      return isHalf ? (
                                        <span key={s} className="relative inline-flex items-center justify-center">
                                          <Star className="w-3 h-3 text-gray-200" />
                                          <StarHalf className="w-3 h-3 absolute inset-0 fill-amber-400 text-amber-500" />
                                        </span>
                                      ) : (
                                        <Star
                                          key={s}
                                          className={`w-3 h-3 ${isFilled ? 'fill-amber-400 text-amber-500' : 'text-gray-200'}`}
                                        />
                                      );
                                    })}
                                  </div>
                                  {/* Fila 2: 6 a 10 */}
                                  <div className="flex items-center gap-0.5">
                                    {[6, 7, 8, 9, 10].map((s) => {
                                      const isFilled = starVal >= s;
                                      const isHalf = !isFilled && (starVal >= s - 0.5);
                                      return isHalf ? (
                                        <span key={s} className="relative inline-flex items-center justify-center">
                                          <Star className="w-3 h-3 text-gray-200" />
                                          <StarHalf className="w-3 h-3 absolute inset-0 fill-amber-400 text-amber-500" />
                                        </span>
                                      ) : (
                                        <Star
                                          key={s}
                                          className={`w-3 h-3 ${isFilled ? 'fill-amber-400 text-amber-500' : 'text-gray-200'}`}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>
                                <span className="font-mono font-black text-amber-800 text-xs min-w-7 text-right">
                                  {starVal > 0 ? `${starVal}/10` : '—'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Observaciones registradas para la técnica en el informe */}
                      {selectedStudentReport.observations?.[tech.id] && (
                        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs">
                          <span className="font-bold text-amber-950 flex items-center gap-1.5 mb-1">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-700" /> Observaciones de la técnica:
                          </span>
                          <p className="text-gray-800 italic font-medium leading-relaxed">
                            {selectedStudentReport.observations[tech.id]}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Dictamen Oficial Consolidado del Tribunal con IA si existe */}
              {consolidatedVerdictsByStudent[selectedStudentReport.studentId]?.aiConsolidatedSummary && (
                <div className="p-4 rounded-2xl bg-linear-to-r from-indigo-50/90 via-purple-50/80 to-blue-50/90 border border-indigo-200/90 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#2D2E83] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>Dictamen Oficial Consolidado del Tribunal (IA):</span>
                  </div>
                  <div className="text-xs text-gray-800 font-medium leading-relaxed whitespace-pre-line bg-white/80 p-3 rounded-xl border border-indigo-100">
                    {consolidatedVerdictsByStudent[selectedStudentReport.studentId].aiConsolidatedSummary}
                  </div>
                  <div className="text-[10px] text-gray-500 font-bold pt-1.5 border-t border-indigo-100 flex items-center justify-between">
                    <span>Oficializado por: {consolidatedVerdictsByStudent[selectedStudentReport.studentId].consolidatedBy || 'Comisión Técnica'}</span>
                    <span>Promedio Tribunal: {consolidatedVerdictsByStudent[selectedStudentReport.studentId].overallPercentage}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Pie del Modal Fijo */}
            <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                ISKF Costa Rica • Sistema Oficial de Examinaciones
              </span>
              <button
                type="button"
                onClick={() => setSelectedStudentReport(null)}
                className="px-5 py-2 rounded-xl text-xs font-black bg-[#2D2E83] hover:bg-[#232468] text-white transition-colors cursor-pointer"
              >
                Cerrar Informe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: MESA DE CONSOLIDACIÓN Y DICTAMEN FINAL DEL TRIBUNAL (CON IA) */}
      {/* ========================================================================= */}
      {isConsolidationModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/90 w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
            {/* Cabecera del Modal Fija */}
            <div className="shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 bg-linear-to-r from-blue-900 via-[#2D2E83] to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-md border border-amber-300">
                  <Sparkles className="w-6 h-6 fill-amber-950 text-amber-950" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                    Exponer Evaluación • Dictamen del Tribunal (IA)
                  </h3>
                  <p className="text-xs text-blue-200 font-medium">
                    {selectedDojo?.name} • {activeSyllabus?.targetRank || activeSyllabus?.name} • {candidateStudents.length} aspirantes convocados
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={isSynthesizingAll || isLoadingConsolidation}
                  onClick={handleGenerateAllAISyntheses}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-amber-950 transition-all flex items-center gap-1.5 shadow-md shadow-amber-400/20 cursor-pointer disabled:opacity-50"
                  title="Generar la síntesis con Inteligencia Artificial para todos los aspirantes"
                >
                  {isSynthesizingAll ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sintetizando Todos...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-3.5 h-3.5" />
                      <span>Sintetizar Todo con IA</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsConsolidationModalOpen(false)}
                  className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-barra informativa */}
            <div className="px-6 py-2.5 bg-amber-50/80 border-b border-amber-200 text-amber-950 text-xs font-medium flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <span>🥋</span>
                <strong>Tribunal Convocado:</strong> {tribunalSenseis.map(s => s.name).join(' • ')}
              </span>
              <span className="text-[11px] text-amber-900 font-bold">
                Las notas se promedian automáticamente y las observaciones se unifican por IA.
              </span>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-gray-50/40">
              {isLoadingConsolidation ? (
                <div className="py-20 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#2D2E83] mx-auto" />
                  <p className="text-xs font-bold text-gray-600">
                    Recopilando evaluaciones de los Senseis y calculando promedios...
                  </p>
                </div>
              ) : candidateStudents.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <Users className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-xs font-bold text-gray-500">
                    No hay estudiantes candidatos convocados a examen en este momento.
                  </p>
                </div>
              ) : (
                candidateStudents.map(student => {
                  const studentId = student._id || student.id;
                  const item = consolidationDataByStudent[studentId] || {
                    evaluations: [],
                    evaluatorCount: 0,
                    averagePercentage: 0,
                    isPassed: false,
                    rawObservations: {},
                    aiSummary: '',
                    isSaved: false
                  };

                  const badge = getBeltBadge(student.currentRank);
                  const isExpanded = expandedObservationsStudentId === studentId;
                  const totalRawNotes = Object.values(item.rawObservations || {}).reduce((acc, curr) => acc + (curr?.length || 0), 0);

                  return (
                    <div
                      key={studentId}
                      className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-4 transition-all"
                    >
                      {/* Cabecera del Aspirante */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          {student.photo ? (
                            <img
                              src={student.photo}
                              alt={student.name}
                              className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-2xs"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-[#2D2E83]/10 text-[#2D2E83] font-black text-base flex items-center justify-center border border-[#2D2E83]/20 shadow-2xs">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm sm:text-base font-black text-gray-900 leading-tight">
                              {student.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                <span>{student.currentRank}</span>
                              </span>
                              <span className="text-[11px] font-bold text-gray-400">➜</span>
                              <span className="text-[11px] font-black text-[#2D2E83] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                Opta a: {activeSyllabus?.targetRank || student.currentRank}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Promedio General del Tribunal */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <div className={`px-3.5 py-1.5 rounded-xl text-xs font-black font-mono border flex items-center gap-1.5 shadow-2xs ${
                            item.averagePercentage >= 70
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : item.averagePercentage > 0
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                            <span className="text-sm">{item.averagePercentage}%</span>
                            <span>{item.averagePercentage >= 70 ? '✓ APROBADO' : item.averagePercentage > 0 ? 'EN EVALUACIÓN' : 'PENDIENTE'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Desglose de Evaluadores que Calificaron */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                          Senseis que Evaluaron ({item.evaluations.length} de {tribunalSenseis.length} convocados):
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {tribunalSenseis.map((sensei) => {
                            const evalMatch = item.evaluations.find(e => e.evaluatorEmail?.toLowerCase() === sensei.email?.toLowerCase());
                            return (
                              <div
                                key={sensei.email}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                                  evalMatch
                                    ? 'bg-blue-50 text-[#2D2E83] border-blue-200 shadow-2xs'
                                    : 'bg-gray-50 text-gray-400 border-gray-200 border-dashed'
                                }`}
                              >
                                <span>🥋 {sensei.name}:</span>
                                {evalMatch ? (
                                  <span className="font-mono font-black text-amber-700 bg-white px-1.5 py-0.5 rounded-md border border-amber-200">
                                    {evalMatch.percentage}%
                                  </span>
                                ) : (
                                  <span className="text-[10px] italic">Sin notas</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Acordeón de Observaciones por Técnica */}
                      {totalRawNotes > 0 && (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setExpandedObservationsStudentId(isExpanded ? null : studentId)}
                            className="text-xs font-bold text-gray-600 hover:text-[#2D2E83] flex items-center gap-1 cursor-pointer"
                          >
                            <span>📝 Observaciones de los Senseis por técnica ({totalRawNotes} notas)</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          {isExpanded && (
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                              {Object.entries(item.rawObservations || {}).map(([techId, notes]) => {
                                let techName = techId;
                                if (techId === 'fase_kihon') techName = '🥋 Observaciones de Kihon';
                                else if (techId === 'fase_kata') techName = '🥋 Observaciones de Kata';
                                else if (techId === 'fase_kumite') techName = '🥋 Observaciones de Kumite';
                                else if (techId === 'fase_aspectos') techName = '🥋 Observaciones de Aspectos';
                                else {
                                  const techObj = examTechniques.find(t => t.id === techId);
                                  techName = techObj?.name || techId;
                                }
                                return (
                                  <div key={techId} className="space-y-1 pb-1 border-b border-gray-200/60 last:border-none">
                                    <strong className="text-gray-900 font-bold block">{techName}:</strong>
                                    <div className="space-y-0.5 pl-2">
                                      {notes.map((n, nIdx) => (
                                        <p key={nIdx} className="text-gray-600 italic">
                                          &bull; <strong className="text-gray-800 not-italic">{n.evaluatorName}:</strong> &ldquo;{n.observation}&rdquo;
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Caja del Dictamen Final con IA */}
                      <div className="p-4 rounded-2xl bg-linear-to-r from-indigo-50/80 via-purple-50/70 to-blue-50/80 border border-indigo-200/80 space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                            <span className="text-xs font-black text-[#2D2E83] uppercase tracking-wider">
                              Dictamen Técnico Unificado (IA ISKF)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={aiSynthesizingId === studentId}
                              onClick={() => handleGenerateStudentAISynthesis(studentId)}
                              className="px-3 py-1 rounded-lg text-xs font-bold bg-white text-[#2D2E83] hover:bg-indigo-50 border border-indigo-200 transition-all shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {aiSynthesizingId === studentId ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin text-[#2D2E83]" />
                                  <span>Sintetizando...</span>
                                </>
                              ) : (
                                <>
                                  <Bot className="w-3 h-3 text-[#2D2E83]" />
                                  <span>{item.aiSummary ? 'Regenerar con IA' : 'Generar con IA'}</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={isSavingConsolidationId === studentId || !item.aiSummary}
                              onClick={() => handleSaveStudentConsolidatedVerdict(studentId)}
                              className="px-3.5 py-1 rounded-lg text-xs font-black bg-[#2D2E83] hover:bg-[#232468] text-white transition-all shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-40"
                            >
                              {isSavingConsolidationId === studentId ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                                  <span>Guardando...</span>
                                </>
                              ) : (
                                <>
                                  <FileCheck className="w-3 h-3" />
                                  <span>Oficializar Dictamen</span>
                                </>
                              )}
                            </button>

                            {item.isSaved && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <Check className="w-3 h-3 text-emerald-700" />
                                Guardado en BD
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Textarea editable para la lista de enunciados del dictamen final */}
                        <textarea
                          rows={4}
                          value={item.aiSummary || ''}
                          onChange={(e) => {
                            handleBulletInputChange(e, item.aiSummary || '', (text) => {
                              setConsolidationDataByStudent(prev => ({
                                ...prev,
                                [studentId]: {
                                  ...prev[studentId],
                                  aiSummary: text,
                                  isSaved: false
                                }
                              }));
                            });
                          }}
                          onKeyDown={(e) => {
                            handleBulletKeyDown(e, item.aiSummary || '', (text) => {
                              setConsolidationDataByStudent(prev => ({
                                ...prev,
                                [studentId]: {
                                  ...prev[studentId],
                                  aiSummary: text,
                                  isSaved: false
                                }
                              }));
                            });
                          }}
                          placeholder="• Escribir observaciones del dictamen final..."
                          className="w-full text-xs sm:text-sm p-3 rounded-xl border border-indigo-200/90 bg-white focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 outline-hidden resize-none transition-all placeholder:text-gray-400 font-medium leading-relaxed text-gray-800 shadow-2xs font-sans"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pie del Modal Fijo */}
            <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                ISKF Costa Rica • Sistema Oficial de Dictamen Colegiado
              </span>
              <button
                type="button"
                onClick={() => setIsConsolidationModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-black bg-[#2D2E83] hover:bg-[#232468] text-white transition-colors cursor-pointer"
              >
                Cerrar Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONVOCATORIA DEL TRIBUNAL EVALUADOR (1 A 5 SENSEIS) */}
      {/* ========================================================================= */}
      {isTribunalModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/90 w-full max-w-md max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            {/* Cabecera Fija */}
            <div className="shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 bg-linear-to-r from-blue-900 to-[#2D2E83] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shrink-0">
                  🥋
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Convocatoria del Tribunal
                  </h3>
                  <p className="text-xs text-blue-200">
                    Mesa de Senseis evaluadores (1 a 5 miembros)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTribunalModalOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo con Scroll */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <p className="text-xs text-gray-600 font-medium">
                Cada Sensei convocado puede evaluar desde su propia tablet o computadora. Sus notas se promedian y sus observaciones se unifican al exponer el examen.
              </p>

              {/* Lista actual de Senseis */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Senseis en Mesa ({tribunalSenseis.length} de 5 máximo):
                </span>
                <div className="space-y-1.5">
                  {tribunalSenseis.map((sensei, idx) => {
                    const isCurrent = activeEvaluatorEmail === sensei.email;
                    return (
                      <div
                        key={sensei.email || idx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                          isCurrent
                            ? 'bg-blue-50 border-[#2D2E83] text-[#2D2E83] font-bold'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 font-black">
                            #{idx + 1}
                          </span>
                          <div className="truncate">
                            <span className="font-black text-gray-900 block truncate">{sensei.name}</span>
                            <span className="text-[10px] text-gray-500">{sensei.role || 'Sinodal'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCurrent ? (
                            <span className="text-[10px] font-black bg-[#2D2E83] text-white px-2 py-0.5 rounded-md">
                              Activo
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSwitchEvaluator(sensei)}
                              className="text-[11px] font-bold text-[#2D2E83] hover:underline cursor-pointer"
                            >
                              Seleccionar
                            </button>
                          )}

                          {tribunalSenseis.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTribunalSensei(sensei.email)}
                              className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                              title="Remover de la mesa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Agregar nuevo Sensei si < 5 */}
              {tribunalSenseis.length < 5 && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5">
                  <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-[#2D2E83]" /> Convocar a otro Sensei:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre del Sensei (ej. Sensei Marco)"
                      value={newTribunalName}
                      onChange={(e) => setNewTribunalName(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#2D2E83]"
                    />
                    <input
                      type="text"
                      placeholder="Rol (ej. Sinodal 3)"
                      value={newTribunalRole}
                      onChange={(e) => setNewTribunalRole(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#2D2E83]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTribunalSensei}
                    className="w-full py-2 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
                  >
                    + Agregar a la Mesa Evaluadora
                  </button>
                </div>
              )}
            </div>

            {/* Pie Fijo */}
            <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTribunalModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-black bg-[#2D2E83] hover:bg-[#232468] text-white cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR CONVOCATORIA DE EXAMEN Y GENERAR ENLACE ÚNICO (ETAPA 1) */}
      {/* ========================================================================= */}
      {showNewCallModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/90 w-full max-w-xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            {/* Cabecera Fija */}
            <div className="shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 bg-linear-to-r from-indigo-900 via-[#2D2E83] to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 backdrop-blur-md text-amber-300 flex items-center justify-center border border-white/20 shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                    Nueva Convocatoria de Examen
                  </h3>
                  <p className="text-xs text-blue-200 font-medium">
                    {currentModalDojo?.name ? currentModalDojo.name : 'Configuración Oficial ISKF'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNewCallModal(false)}
                className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con Scroll Independiente */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0">
              {createdCallResult ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-black text-gray-900">¡Convocatoria Creada con Éxito!</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Copie el enlace único a continuación y envíeselo al Sensei del dojo para que postule a los estudiantes y programe los horarios.
                  </p>

                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-left">
                    <div className="text-[10px] font-black text-indigo-900 uppercase tracking-wider mb-1">
                      Enlace Único de Acceso para el Sensei
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={typeof window !== 'undefined' ? `${window.location.origin}${createdCallResult.link}` : createdCallResult.link}
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-indigo-200 rounded-xl font-mono text-gray-800 select-all truncate"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${createdCallResult.link}` : createdCallResult.link;
                          navigator.clipboard.writeText(fullUrl);
                          setCopiedCallToken(createdCallResult.accessToken);
                          setTimeout(() => setCopiedCallToken(null), 2500);
                        }}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {copiedCallToken === createdCallResult.accessToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCallToken === createdCallResult.accessToken ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewCallModal(false)}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateExamCall} className="space-y-4">
                  {/* Selector de Dojo Sede con Logo a la Izquierda */}
                  <div className={`space-y-1.5 ${isModalDojoDropdownOpen ? 'relative z-50' : 'relative z-20'}`} ref={modalDojoDropdownRef}>
                    <label className="text-xs font-bold text-gray-700 block">
                      Dojo Sede del Examen *
                    </label>

                    {/* Botón Principal del Dropdown */}
                    <button
                      type="button"
                      onClick={() => setIsModalDojoDropdownOpen(prev => !prev)}
                      className="w-full px-3 py-2 bg-gray-50 hover:bg-white border-2 border-gray-200 hover:border-[#2D2E83]/40 focus:border-[#2D2E83] focus:bg-white rounded-xl text-left transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-3"
                    >
                      {currentModalDojo ? (
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* LOGO A LA IZQUIERDA DEL DOJO SELECCIONADO */}
                          <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 bg-white shrink-0 flex items-center justify-center shadow-2xs">
                            <img
                              src={currentModalDojo.logo || '/images/dojos/default_logo.jpg'}
                              alt={`Logo ${currentModalDojo.name}`}
                              className="w-full h-full object-contain p-0.5"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/images/dojos/default_logo.jpg';
                              }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-black text-gray-900 truncate">
                                {currentModalDojo.name}
                              </span>
                              {currentModalDojo.province && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#2D2E83] border border-blue-200/60 shrink-0">
                                  {currentModalDojo.province}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                              Sensei Titular: <strong className="text-gray-800">{currentModalDojo.sensei}</strong>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-bold">Seleccionar Dojo Sede...</span>
                      )}

                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isModalDojoDropdownOpen ? 'rotate-180 text-[#2D2E83]' : ''}`} />
                    </button>

                    {/* Menú Desplegable con Todos los Dojos y Logo a la Izquierda */}
                    {isModalDojoDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
                        {/* Buscador de Dojos */}
                        {dojos.length > 3 && (
                          <div className="p-2.5 border-b border-gray-100 bg-gray-50/80">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Filtrar por nombre, provincia o Sensei..."
                                value={modalDojoSearch}
                                onChange={(e) => setModalDojoSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#2D2E83] font-medium"
                                autoFocus
                              />
                            </div>
                          </div>
                        )}

                        <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                          {dojos
                            .filter(d => {
                              if (!modalDojoSearch) return true;
                              const q = modalDojoSearch.toLowerCase().trim();
                              return (
                                d.name?.toLowerCase().includes(q) ||
                                d.province?.toLowerCase().includes(q) ||
                                d.sensei?.toLowerCase().includes(q)
                              );
                            })
                            .map((dojo) => {
                              const isSelected = (dojo._id || dojo.id) === (newCallForm.dojoId || currentModalDojo?._id || currentModalDojo?.id);
                              return (
                                <button
                                  key={dojo._id || dojo.id}
                                  type="button"
                                  onClick={() => {
                                    const targetId = dojo._id || dojo.id;
                                    setNewCallForm(prev => ({
                                      ...prev,
                                      dojoId: targetId,
                                      title: `Convocatoria Oficial de Examen Técnico — ${dojo.name}`,
                                      location: dojo.location || dojo.address || ''
                                    }));

                                    // El sensei titular del dojo a evaluar NO puede ser evaluador por conflicto de interés.
                                    // Se remueve de la lista seleccionada si estaba presente, y se completan evaluadores no titulares.
                                    setSelectedSenseisForCall(prev => {
                                      const filtered = prev.filter(s => !isDojoOwnerSensei(s, dojo));
                                      for (const s of availableSenseis) {
                                        if (filtered.length >= 3) break;
                                        if (isDojoOwnerSensei(s, dojo)) continue;
                                        if (!filtered.some(item => item.email === s.email)) {
                                          filtered.push(s);
                                        }
                                      }
                                      return filtered;
                                    });

                                    setIsModalDojoDropdownOpen(false);
                                    setModalDojoSearch('');
                                  }}
                                  className={`w-full px-3 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer select-none ${
                                    isSelected ? 'bg-indigo-50/90 text-[#2D2E83] font-black' : 'hover:bg-gray-50 text-gray-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {/* LOGO A LA IZQUIERDA DE CADA DOJO */}
                                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 bg-white shrink-0 flex items-center justify-center shadow-2xs">
                                      <img
                                        src={dojo.logo || '/images/dojos/default_logo.jpg'}
                                        alt={`Logo ${dojo.name}`}
                                        className="w-full h-full object-contain p-0.5"
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = '/images/dojos/default_logo.jpg';
                                        }}
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                          {dojo.name}
                                        </span>
                                        {dojo.province && (
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#2D2E83] border border-blue-200/60 shrink-0">
                                            {dojo.province}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                                        Sensei: <span className="text-gray-800 font-semibold">{dojo.sensei}</span>
                                      </p>
                                    </div>
                                  </div>

                                  {isSelected && (
                                    <Check className="w-4 h-4 text-[#2D2E83] shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selector del Tribunal de Evaluación (1 a 5 Senseis de la BD) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-700">
                        Tribunal de Senseis Convocados *
                      </label>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        selectedSenseisForCall.length >= 1 && selectedSenseisForCall.length <= 5
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {selectedSenseisForCall.length} de 5 Senseis
                      </span>
                    </div>

                    <div className="max-h-44 overflow-y-auto p-2 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                      {availableSenseis.map((sensei) => {
                        const currentModalDojo = dojos.find(d => (d._id || d.id) === newCallForm.dojoId) || selectedDojo;
                        const isDirector = Boolean(sensei.isPermanent || (sensei.name.toLowerCase().includes('gatjens') && !sensei.name.toLowerCase().includes('lee')));
                        const isDojoOwner = isDojoOwnerSensei(sensei, currentModalDojo);
                        const isSelected = !isDojoOwner && (isDirector || selectedSenseisForCall.some(s => s.email === sensei.email));

                        return (
                          <label
                            key={sensei.email}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all border ${
                              isDojoOwner
                                ? 'bg-rose-50/50 border-rose-200 text-gray-400 cursor-not-allowed opacity-80'
                                : isDirector
                                ? 'bg-amber-50/90 border-amber-300 text-amber-950 font-bold'
                                : isSelected
                                ? 'bg-indigo-50/90 border-indigo-200 text-indigo-950 font-bold cursor-pointer'
                                : 'bg-white border-gray-100 hover:border-gray-200 text-gray-700 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isDirector || isDojoOwner}
                                onChange={() => {
                                  if (isDirector) return;
                                  if (isDojoOwner) {
                                    showAlert('El Sensei titular del dojo a evaluar no puede ser evaluador por conflicto de interés (no puede evaluar a sus propios alumnos).', 'Reglamento ISKF', true);
                                    return;
                                  }
                                  if (isSelected) {
                                    if (selectedSenseisForCall.length <= 1) {
                                      showAlert('Debe convocar al menos 1 Sensei para el Tribunal.', 'Atención', true);
                                      return;
                                    }
                                    setSelectedSenseisForCall(prev => prev.filter(s => s.email !== sensei.email));
                                  } else {
                                    if (selectedSenseisForCall.length >= 5) {
                                      showAlert('El tribunal colegiado permite un máximo de 5 Senseis convocados.', 'Límite Máximo', true);
                                      return;
                                    }
                                    setSelectedSenseisForCall(prev => [...prev, sensei]);
                                  }
                                }}
                                className={`rounded w-4 h-4 ${
                                  isDojoOwner
                                    ? 'text-gray-300 border-gray-300 cursor-not-allowed'
                                    : isDirector
                                    ? 'text-amber-600 focus:ring-amber-500 cursor-not-allowed opacity-90'
                                    : 'text-indigo-600 focus:ring-indigo-500 cursor-pointer'
                                }`}
                              />
                              <div className="min-w-0 truncate">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`font-bold ${isDojoOwner ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{sensei.name}</span>
                                  {isDojoOwner && (
                                    <span className="text-[9px] bg-rose-100 text-rose-700 border border-rose-300 font-bold px-1.5 py-0.2 rounded">
                                      Titular del Dojo
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-gray-500 font-normal block truncate">
                                  {isDojoOwner ? 'Inhabilitado por reglamento (conflicto de interés)' : `(${sensei.rank || 'Sensei'} • ${sensei.dojoName})`}
                                </span>
                              </div>
                            </div>
                            {isDojoOwner ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 border border-rose-300 text-rose-800 font-bold shrink-0">
                                🚫 Inhabilitado
                              </span>
                            ) : isDirector ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 border border-amber-400 text-amber-950 font-black shrink-0">
                                👑 Director Nacional (Obligatorio)
                              </span>
                            ) : isSelected ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold shrink-0">
                                Convocado
                              </span>
                            ) : null}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Título de la Convocatoria
                    </label>
                    <input
                      type="text"
                      required
                      value={newCallForm.title}
                      onChange={(e) => setNewCallForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Fecha del Examen *
                      </label>
                      <input
                        type="date"
                        required
                        value={newCallForm.examDate}
                        onChange={(e) => setNewCallForm(prev => ({ ...prev, examDate: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white focus:border-[#2D2E83] outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Hora de Inicio General
                      </label>
                      <input
                        type="text"
                        value={newCallForm.startTime}
                        onChange={(e) => setNewCallForm(prev => ({ ...prev, startTime: e.target.value }))}
                        placeholder="ej. 09:00 AM"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white focus:border-[#2D2E83] outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Karatecas por Tanda *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        required
                        value={newCallForm.maxPerTanda ?? 6}
                        onChange={(e) => setNewCallForm(prev => ({ ...prev, maxPerTanda: parseInt(e.target.value, 10) || '' }))}
                        placeholder="6"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-indigo-700 focus:bg-white focus:border-[#2D2E83] outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Lugar o Sede (opcional)
                    </label>
                    <input
                      type="text"
                      value={newCallForm.location}
                      onChange={(e) => setNewCallForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Instalaciones del Dojo sede"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white focus:border-[#2D2E83] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Instrucciones o Notas Especiales
                    </label>
                    <textarea
                      rows={2}
                      value={newCallForm.notes}
                      onChange={(e) => setNewCallForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="ej. Se requiere karategi blanco oficial ISKF y cinta limpia."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white focus:border-[#2D2E83] outline-hidden resize-none"
                    />
                  </div>

                  <div className="sticky -bottom-5 sm:-bottom-6 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3.5 bg-white/95 backdrop-blur-md border-t border-gray-200/90 flex items-center justify-end gap-2 z-10 shadow-xs mt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewCallModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingCall || selectedSenseisForCall.length === 0}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isCreatingCall ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                      <span>Generar Convocatoria y Enlace</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MODIFICAR TRIBUNAL EVALUADOR DE CONVOCATORIA EXISTENTE */}
      {/* ========================================================================= */}
      {editingTribunalCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/90 w-full max-w-xl max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            {/* Cabecera */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-lg font-black shadow-md shrink-0">
                  🥋
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Modificar Tribunal Evaluador
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    {editingTribunalCall.title?.replace(/^Convocatoria Oficial de Examen Técnico\s*[-—–:]\s*/i, '') || editingTribunalCall.title || editingTribunalCall.dojoName} • {editingTribunalCall.examDate}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingTribunalCall(null)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con Scroll */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Mesa Colegiada (1 a 5 Senseis)</p>
                  <p className="text-[11px] text-amber-900 mt-0.5">
                    Sensei Roy Gatjens (Director Nacional) encabeza permanentemente la mesa. Marca o desmarca los Senseis convocados para corregir o actualizar la mesa evaluadora.
                  </p>
                </div>
              </div>

              {/* Contador de seleccionados */}
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span>Senseis Convocados en Mesa:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  editingSenseisList.length >= 1 && editingSenseisList.length <= 5
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {editingSenseisList.length} de 5 Senseis
                </span>
              </div>

              {/* Lista seleccionable de Senseis */}
              <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                {availableSenseis.map((sensei) => {
                  const callDojo = dojos.find(d => (d._id || d.id)?.toString() === (editingTribunalCall?.dojoId?._id || editingTribunalCall?.dojoId)?.toString()) || selectedDojo;
                  const isDojoOwner = isDojoOwnerSensei(sensei, callDojo);
                  const isDirector = Boolean(sensei.isPermanent || (sensei.name.toLowerCase().includes('gatjens') && !sensei.name.toLowerCase().includes('lee')));
                  const isSelected = !isDojoOwner && (isDirector || editingSenseisList.some(s => 
                    (s.email && sensei.email && s.email.toLowerCase() === sensei.email.toLowerCase()) ||
                    (s.name && sensei.name && s.name.toLowerCase() === sensei.name.toLowerCase())
                  ));

                  return (
                    <label
                      key={sensei.email || sensei.name}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isDojoOwner
                          ? 'bg-rose-50/50 border-rose-200 text-gray-400 cursor-not-allowed opacity-80'
                          : isDirector
                          ? 'bg-amber-50/90 border-amber-300 text-amber-950 font-bold'
                          : isSelected
                          ? 'bg-blue-50/90 border-[#2D2E83] text-[#2D2E83] font-bold shadow-2xs cursor-pointer'
                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDirector || isDojoOwner}
                          onChange={() => {
                            if (isDojoOwner) {
                              showAlert(`Sensei ${sensei.name} es el titular del dojo a evaluar y no puede formar parte del tribunal de sus propios alumnos.`, 'Conflicto de Interés', true);
                              return;
                            }
                            handleToggleSenseiForEdit(sensei);
                          }}
                          className={`rounded w-4 h-4 ${
                            isDojoOwner
                              ? 'text-gray-300 border-gray-300 cursor-not-allowed'
                              : isDirector
                              ? 'text-amber-600 cursor-not-allowed opacity-80'
                              : 'text-[#2D2E83] cursor-pointer'
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-black truncate flex items-center gap-1.5">
                            <span className={isDojoOwner ? 'text-gray-500 line-through' : ''}>{sensei.name}</span>
                            {isDirector && (
                              <span className="text-[9px] bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded font-bold">
                                Director
                              </span>
                            )}
                            {isDojoOwner && (
                              <span className="text-[9px] bg-rose-100 text-rose-700 border border-rose-300 font-bold px-1.5 py-0.2 rounded">
                                Titular del Dojo
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium truncate">
                            {isDojoOwner ? 'Inhabilitado por reglamento (conflicto de interés)' : `${sensei.dojoName} • ${sensei.province}`}
                          </div>
                        </div>
                      </div>

                      {isDojoOwner ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                          🚫 Inhabilitado
                        </span>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                          isSelected ? 'bg-[#2D2E83] text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isSelected ? 'Convocado' : 'Disponible'}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Agregar Sensei adicional / Invitado si hay espacio */}
              {editingSenseisList.length < 5 && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                  <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-[#2D2E83]" />
                    <span>¿Convocar a otro Sensei Invitado o adicional?</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre (ej. Sensei Juan Pérez)"
                      value={customSenseiName}
                      onChange={(e) => setCustomSenseiName(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#2D2E83]"
                    />
                    <input
                      type="email"
                      placeholder="Email de contacto"
                      value={customSenseiEmail}
                      onChange={(e) => setCustomSenseiEmail(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#2D2E83]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomSenseiToEdit}
                    className="w-full py-1.5 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    + Agregar Sensei al Tribunal
                  </button>
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingTribunalCall(null)}
                disabled={isUpdatingTribunal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveEditedTribunal}
                disabled={isUpdatingTribunal || editingSenseisList.length < 1 || editingSenseisList.length > 5}
                className="px-5 py-2 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isUpdatingTribunal ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Tribunal ({editingSenseisList.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales Genéricos en Página */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDanger={confirmModal.isDanger}
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        isError={alertModal.isError}
      />
    </div>
  );
}
