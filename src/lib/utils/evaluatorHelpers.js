/**
 * Utilidades puras para el Evaluador de Examen Técnico en Tatami (ISKF Costa Rica)
 */

import { normalizeRankKey } from '../constants/kyuRanks.js';

export { 
  parseCustomDate, 
  calculateAge, 
  formatDateDDMMAAAA, 
  formatDateTimeDDMMAAAA, 
  toCostaRicaDate, 
  toIsoDate 
} from './dateFormatter.js';

export function getBeltBadge(rankStr) {
  if (!rankStr) return { bg: 'bg-gray-100 text-gray-700 border-gray-300', dot: 'bg-gray-400', label: 'Sin Grado' };
  const str = String(rankStr).trim();
  const kyu = str.toLowerCase();
  const normKey = normalizeRankKey(str);

  if (normKey === '10-kyu' || ((kyu.includes('blanco') || kyu.includes('blanca')) && !kyu.includes('amarill') && !kyu.includes('linea') && !kyu.includes('línea') && !kyu.includes('morad'))) {
    return { bg: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-400', label: '10° Kyu (Blanca)' };
  }
  if (normKey === '9-kyu' || kyu.includes('amarill')) {
    return { bg: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-500', label: '9° Kyu (Amarilla)' };
  }
  if (normKey === '8-kyu' || kyu.includes('naranj')) {
    return { bg: 'bg-orange-100 text-orange-900 border-orange-300', dot: 'bg-orange-500', label: '8° Kyu (Naranja)' };
  }
  if (normKey === '7-kyu' || (kyu.includes('verd') && !kyu.includes('azul'))) {
    return { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-500', label: '7° Kyu (Verde)' };
  }
  if (normKey === '6-kyu' || kyu.includes('azul')) {
    return { bg: 'bg-blue-100 text-blue-900 border-blue-300', dot: 'bg-blue-500', label: '6° Kyu (Azul)' };
  }
  if (normKey === '4-kyu' || ((kyu.includes('linea') || kyu.includes('línea')) && kyu.includes('morad')) || (kyu.includes('4') && kyu.includes('morad'))) {
    return { bg: 'bg-purple-100 text-purple-900 border-purple-400 border-dashed', dot: 'bg-purple-600', label: '4° Kyu (Morada I)' };
  }
  if (normKey === '5-kyu' || kyu.includes('morad') || kyu.includes('púrpura') || kyu.includes('purpura')) {
    return { bg: 'bg-purple-100 text-purple-900 border-purple-300', dot: 'bg-purple-600', label: '5° Kyu (Morada)' };
  }
  if (normKey === '3-kyu' || ((kyu.includes('marrón') || kyu.includes('marron') || kyu.includes('cafe') || kyu.includes('café')) && (kyu.includes('3') || kyu.includes('iii')))) {
    return { bg: 'bg-amber-950/10 text-amber-950 border-amber-900/30', dot: 'bg-amber-800', label: '3° Kyu (Marrón 3)' };
  }
  if (normKey === '2-kyu' || ((kyu.includes('marrón') || kyu.includes('marron') || kyu.includes('cafe') || kyu.includes('café')) && (kyu.includes('2') || kyu.includes('ii')))) {
    return { bg: 'bg-amber-950/10 text-amber-950 border-amber-900/30', dot: 'bg-amber-800', label: '2° Kyu (Marrón 2)' };
  }
  if (normKey === '1-kyu' || kyu.includes('marrón') || kyu.includes('marron') || kyu.includes('cafe') || kyu.includes('café')) {
    return { bg: 'bg-amber-950/10 text-amber-950 border-amber-900/30', dot: 'bg-amber-800', label: '1° Kyu (Marrón 1)' };
  }
  if (normKey.endsWith('-dan') || kyu.includes('dan') || kyu.includes('negr') || kyu.includes('shodan')) {
    const danMatch = kyu.match(/(\d+)\s*[°º]?\s*dan/i);
    const danNum = danMatch ? `${danMatch[1]}° Dan` : '1° Dan';
    return { bg: 'bg-gray-900 text-white border-black', dot: 'bg-red-500', label: `${danNum} (Negra)` };
  }
  return { bg: 'bg-gray-100 text-gray-800 border-gray-300', dot: 'bg-gray-400', label: str || 'Kyu' };
}

export function getTandasRosterSignature(schedules) {
  if (!Array.isArray(schedules)) return '';
  return schedules.map(s => `${s.blockName || ''}@${(s.studentIds || []).map(String).join(',')}`).join('||');
}

export function parseAspectPoint(pointItem, idx, prefix, isSection2 = false) {
  if (!pointItem) return null;
  let raw = '';
  let isEvaluable = !isSection2;
  let appliesTo = [];

  if (typeof pointItem === 'object' && pointItem !== null) {
    raw = String(pointItem.text || pointItem.point || pointItem.rawText || '').trim();
    if (typeof pointItem.isEvaluable === 'boolean') {
      isEvaluable = pointItem.isEvaluable;
    } else if (typeof pointItem.evaluableInExam === 'boolean') {
      isEvaluable = pointItem.evaluableInExam;
    }
    if (Array.isArray(pointItem.appliesTo)) {
      appliesTo = pointItem.appliesTo;
    }
  } else {
    raw = String(pointItem).trim();
  }

  if (!raw) return null;
  if (isSection2 && !isEvaluable) {
    return null;
  }

  let label = raw;
  let desc = raw;
  if (raw.includes(':')) {
    const parts = raw.split(':');
    label = parts[0].trim();
    desc = parts.slice(1).join(':').trim() || label;
  }

  return {
    key: `${prefix}_${idx}`,
    label,
    desc,
    rawText: raw,
    isEvaluable,
    appliesTo
  };
}

/**
 * Determina si un criterio técnico aplica a una técnica específica de Kihon/Kumite/Kata.
 * 1. Prioriza 'appliesTo' configurado por el usuario en el temario.
 * 2. Si no tiene 'appliesTo' o es general, aplica filtro de exclusión de seguridad
 *    (evita por ejemplo criterios de Gyaku Zuki en Oi Zuki, o de Mae Geri en Yoko Geri).
 */
export function doesCriterionApplyToTechnique(criterionPoint, technique) {
  if (!criterionPoint || !technique) return false;
  const techName = String(technique.name || '').toLowerCase().trim();
  const techId = String(technique.id || '').toLowerCase().trim();
  const normTech = techName.replace(/tsuki/g, 'zuki');

  // 1. Verificación por appliesTo explícito
  const appliesTo = Array.isArray(criterionPoint.appliesTo) ? criterionPoint.appliesTo : [];
  if (appliesTo.length > 0 && !appliesTo.includes('all')) {
    return appliesTo.some(t => {
      const target = String(t).toLowerCase().trim();
      const normTarget = target.replace(/tsuki/g, 'zuki');
      return target === techName || target === techId || 
             normTarget === normTech ||
             techName.includes(target) || target.includes(techName) ||
             normTech.includes(normTarget) || normTarget.includes(normTech);
    });
  }

  // 2. Filtro semántico de exclusión para criterios sin 'appliesTo' específico
  const rawText = String(criterionPoint.rawText || criterionPoint.text || criterionPoint.desc || '').toLowerCase();

  // Caso Tsuki: No mezclar Oi Zuki con Gyaku Zuki
  if (techName.includes('oi') && techName.includes('zuki')) {
    if (rawText.includes('gyaku')) return false;
  }
  if (techName.includes('gyaku') && techName.includes('zuki') && !techName.includes('age') && !techName.includes('soto') && !techName.includes('uchi') && !techName.includes('gedan')) {
    if (rawText.includes('oi zuki') || rawText.includes('oi tsuki')) return false;
  }

  // Caso Uke: Bloqueos no deben mostrar fallas específicas de otros bloqueos
  if (techName.includes('age') && techName.includes('uke')) {
    if (rawText.includes('soto') || rawText.includes('uchi') || rawText.includes('gedan') || rawText.includes('shuto')) return false;
  }
  if (techName.includes('soto') && techName.includes('uke')) {
    if (rawText.includes('age') || rawText.includes('uchi') || rawText.includes('gedan') || rawText.includes('shuto')) return false;
  }
  if (techName.includes('uchi') && techName.includes('uke')) {
    if (rawText.includes('age') || rawText.includes('soto') || rawText.includes('gedan') || rawText.includes('shuto')) return false;
  }
  if (techName.includes('gedan') && techName.includes('barai')) {
    if (rawText.includes('age') || rawText.includes('soto') || rawText.includes('uchi') || rawText.includes('shuto')) return false;
  }
  if (techName.includes('shuto') && techName.includes('uke')) {
    if (rawText.includes('age') || rawText.includes('soto') || rawText.includes('uchi') || rawText.includes('gedan')) return false;
  }

  // Caso Geri: Patadas no deben cruzarse
  if (techName.includes('mae') && techName.includes('geri')) {
    if (rawText.includes('yoko') || rawText.includes('mawashi') || rawText.includes('ushiro')) return false;
  }
  if (techName.includes('yoko') && techName.includes('geri')) {
    if (rawText.includes('mae geri') || rawText.includes('mawashi') || rawText.includes('ushiro')) return false;
  }
  if (techName.includes('mawashi') && techName.includes('geri')) {
    if (rawText.includes('mae geri') || rawText.includes('yoko') || rawText.includes('ushiro')) return false;
  }

  return true;
}

/**
 * Calcula el peso biomecánico de un criterio técnico para Shotokan Karate:
 * 10: Dachi Waza (Postura, base, anclaje y pies firmes) - PRIMERO
 * 20: Uke Waza (Bloqueos y defensas preparatorias)
 * 30: Tsuki / Geri (Técnicas de impacto: puños, golpes y patadas)
 * 40: Foco general (Kime, kiai, zanshin, mirada/chakugan, respiración)
 * 50: Otros aspectos técnicos
 */
export function getMartialCriterionWeight(criterion) {
  if (!criterion) return 50;
  const key = String(criterion.key || '').toLowerCase();
  const cat = String(criterion.category || '').toLowerCase();
  const text = `${criterion.label || ''} ${criterion.desc || ''} ${criterion.rawText || ''} ${criterion.short || ''}`.toLowerCase();

  // 1. Dachi Waza / Postura y Base (Prioridad 1: peso 10)
  if (
    key.startsWith('dachi') ||
    key.includes('dachi') ||
    cat === 'dachi' ||
    text.includes('dachi') ||
    text.includes('postura') ||
    text.includes('base') ||
    text.includes('zenkutsu') ||
    text.includes('kokutsu') ||
    text.includes('kiba') ||
    text.includes('fudo') ||
    text.includes('anclaje') ||
    text.includes('pie de apoyo') ||
    text.includes('talon') ||
    text.includes('talón') ||
    text.includes('pies firmes')
  ) {
    return 10;
  }

  // 2. Bloqueos / Uke Waza (Prioridad 2: peso 20)
  if (
    key.startsWith('uke') ||
    key.includes('uke') ||
    cat === 'uke' ||
    text.includes('uke') ||
    text.includes('barai') ||
    text.includes('bloqueo') ||
    text.includes('angulación') ||
    text.includes('angulacion')
  ) {
    return 20;
  }

  // 3. Tsuki Waza y Geri Waza (Prioridad 3: peso 30)
  if (
    key.startsWith('tsuki') ||
    key.includes('tsuki') ||
    key.includes('zuki') ||
    cat === 'tsuki' ||
    text.includes('tsuki') ||
    text.includes('zuki') ||
    text.includes('puño') ||
    text.includes('golpe') ||
    text.includes('chudan') ||
    text.includes('jodan') ||
    text.includes('hikite') ||
    text.includes('trayectoria directa')
  ) {
    return 30;
  }

  if (
    key.startsWith('geri') ||
    key.includes('geri') ||
    cat === 'geri' ||
    text.includes('geri') ||
    text.includes('patada') ||
    text.includes('hikiashi')
  ) {
    return 30;
  }

  // 4. Kiai, Kime, Zanshin, Chakugan / Mirada (Prioridad 4: peso 40)
  if (
    text.includes('kiai') ||
    text.includes('kime') ||
    text.includes('zanshin') ||
    text.includes('mirada') ||
    text.includes('chakugan') ||
    text.includes('respiración') ||
    text.includes('respiracion') ||
    text.includes('espíritu') ||
    text.includes('espiritu')
  ) {
    return 40;
  }

  return 50;
}

/**
 * Ordena una lista de criterios según la secuencia biomecánica tradicional de Shotokan:
 * 1° Dachi Waza (Base / Postura)
 * 2° Uke Waza (Defensa)
 * 3° Tsuki Waza / Geri Waza (Ataque / Impacto)
 * 4° Kime, Kiai, Zanshin y Foco
 */
export function sortCriteriaMartialOrder(criteriaList = []) {
  if (!Array.isArray(criteriaList) || criteriaList.length <= 1) return criteriaList || [];
  return [...criteriaList].sort((a, b) => {
    const wA = getMartialCriterionWeight(a);
    const wB = getMartialCriterionWeight(b);
    return wA - wB;
  });
}

/**
 * Obtiene el icono marcial representativo para el aspecto
 */
export function getMartialCriterionIcon(criterion) {
  const w = getMartialCriterionWeight(criterion);
  if (w === 10) return '🦵';
  if (w === 20) return '🛡️';
  if (w === 30) {
    const text = `${criterion?.label || ''} ${criterion?.desc || ''} ${criterion?.key || ''}`.toLowerCase();
    if (text.includes('geri') || text.includes('patada')) return '🦶';
    return '👊';
  }
  return '⚡';
}

export const KIHON_CANON_ORDER = [
  'oizuki',
  'ageuke',
  'sotouke',
  'uchiuke',
  'gedanbarai',
  'shutouke',
  'maegeri',
  'yokogeri',
  'mawashigeri'
];

export const KATA_CANON_ORDER = [
  'heian_shodan',
  'heian_nidan',
  'heian_sandan',
  'heian_yondan',
  'heian_godan',
  'tekki_shodan',
  'bassai_dai',
  'kanku_dai',
  'jion',
  'enpi'
];

export function getCanonicalTechKey(name = '') {
  const norm = String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (norm.includes('oi') && norm.includes('zuki')) return 'oizuki';
  if (norm.includes('gyaku') && norm.includes('zuki')) return 'gyakuzuki';

  if (norm.includes('age') && norm.includes('uke')) return 'ageuke';
  if (norm.includes('soto') && norm.includes('uke')) return 'sotouke';
  if (norm.includes('uchi') && norm.includes('uke')) return 'uchiuke';
  if (norm.includes('gedan') && norm.includes('barai')) return 'gedanbarai';
  if (norm.includes('shuto') && norm.includes('uke')) return 'shutouke';

  if (norm.includes('mae') && norm.includes('geri')) return 'maegeri';
  if (norm.includes('yoko') && norm.includes('geri')) return 'yokogeri';
  if (norm.includes('mawashi') && norm.includes('geri')) return 'mawashigeri';

  if (norm.includes('heian') && norm.includes('shodan')) return 'heian_shodan';
  if (norm.includes('heian') && norm.includes('nidan')) return 'heian_nidan';
  if (norm.includes('heian') && norm.includes('sandan')) return 'heian_sandan';
  if (norm.includes('heian') && norm.includes('yondan')) return 'heian_yondan';
  if (norm.includes('heian') && norm.includes('godan')) return 'heian_godan';
  if (norm.includes('tekki') && norm.includes('shodan')) return 'tekki_shodan';
  if (norm.includes('bassai') && norm.includes('dai')) return 'bassai_dai';
  if (norm.includes('kanku') && norm.includes('dai')) return 'kanku_dai';
  if (norm.includes('jion')) return 'jion';
  if (norm.includes('enpi') || norm.includes('empi')) return 'enpi';

  if (norm.includes('gohon')) return 'gohon_kumite';
  if (norm.includes('sambon') || norm.includes('sanbon')) return 'sambon_kumite';
  if (norm.includes('kihon') && norm.includes('ippon')) return 'kihon_ippon_kumite';
  if (norm.includes('jiyu') && norm.includes('ippon')) return 'jiyu_ippon_kumite';
  if (norm.includes('jiyu') && norm.includes('kumite')) return 'jiyu_kumite';

  return norm.replace(/\s+/g, '_');
}

export const DEFAULT_TECHNIQUES = {
  kihon: [
    { id: 'k1', name: 'Oi-Zuki Chudan (Zenkutsu-Dachi)', stance: 'Zenkutsu Dachi', direction: 'Adelante (Mae)', repetitions: 3 },
    { id: 'k2', name: 'Gyaku-Zuki Chudan (Zenkutsu-Dachi)', stance: 'Zenkutsu Dachi', direction: 'Adelante (Mae)', repetitions: 3 },
    { id: 'k3', name: 'Age-Uke / Gyaku-Zuki', stance: 'Zenkutsu Dachi', direction: 'Atrás (Ushiro)', repetitions: 3 },
    { id: 'k4', name: 'Soto-Uke / Gyaku-Zuki', stance: 'Zenkutsu Dachi', direction: 'Adelante (Mae)', repetitions: 3 },
    { id: 'k5', name: 'Uchi-Uke / Gyaku-Zuki', stance: 'Zenkutsu Dachi', direction: 'Atrás (Ushiro)', repetitions: 3 },
    { id: 'k6', name: 'Gedan-Barai / Gyaku-Zuki', stance: 'Zenkutsu Dachi', direction: 'Adelante (Mae)', repetitions: 3 },
    { id: 'k7', name: 'Shuto-Uke (Kokutsu-Dachi)', stance: 'Kokutsu Dachi', direction: 'Atrás (Ushiro)', repetitions: 3 },
    { id: 'k8', name: 'Mae-Geri Keage / Chudan', stance: 'Zenkutsu Dachi', direction: 'Adelante (Mae)', repetitions: 3 },
    { id: 'k9', name: 'Yoko-Geri Keage (Kiba-Dachi)', stance: 'Kiba Dachi', direction: 'Lateral', repetitions: 3 },
    { id: 'k10', name: 'Mawashi-Geri Chudan', stance: 'Zenkutsu Dachi', direction: 'Adelante (Mae)', repetitions: 3 }
  ],
  kata: [
    { id: 'kt1', name: 'Heian Shodan', stance: 'Zenkutsu / Kokutsu', notes: 'Primer Kata de la serie Heian' },
    { id: 'kt2', name: 'Heian Nidan', stance: 'Zenkutsu / Kokutsu', notes: 'Segundo Kata de la serie Heian' },
    { id: 'kt3', name: 'Heian Sandan', stance: 'Kiba Dachi', notes: 'Tercer Kata de la serie Heian' },
    { id: 'kt4', name: 'Heian Yondan', stance: 'Kosa / Kokutsu', notes: 'Cuarto Kata de la serie Heian' },
    { id: 'kt5', name: 'Heian Godan', stance: 'Kosa / Kiba', notes: 'Quinto Kata de la serie Heian' },
    { id: 'kt6', name: 'Tekki Shodan', stance: 'Kiba Dachi', notes: 'Kata del Jinete de Hierro' },
    { id: 'kt7', name: 'Bassai Dai', stance: 'Zenkutsu / Kokutsu / Kiba', notes: 'Romper la fortaleza (Kata mayor)' }
  ],
  kumite: [
    { id: 'km1', name: 'Gohon Kumite (Ataque y Defensa)', stance: 'Zenkutsu Dachi', notes: 'Combate predeterminado a 5 pasos' },
    { id: 'km2', name: 'Kihon Ippon Kumite', stance: 'Zenkutsu / Kokutsu', notes: 'Combate básico a 1 paso con ataque anunciado' },
    { id: 'km3', name: 'Jiyu Ippon Kumite', stance: 'Kamae', notes: 'Combate semi-libre a 1 paso' }
  ],
  aspectos: []
};

