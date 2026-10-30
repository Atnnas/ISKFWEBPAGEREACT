/**
 * Utilidades puras para el Evaluador de Examen Técnico en Tatami (ISKF Costa Rica)
 */

export function parseCustomDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const str = String(val).trim();

  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
  }

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

export function calculateAge(birthDateInput) {
  const birthDate = parseCustomDate(birthDateInput);
  if (!birthDate) return null;

  const today = new Date();
  if (birthDate > today) return null;

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

export function formatDateDDMMAAAA(birthDateInput) {
  const d = parseCustomDate(birthDateInput);
  if (!d) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getBeltBadge(rankStr) {
  if (!rankStr) return { bg: 'bg-gray-100 text-gray-700 border-gray-300', label: 'Sin Cinta' };
  const r = rankStr.toLowerCase();
  if (r.includes('blanca')) return { bg: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Blanca' };
  if (r.includes('amarilla')) return { bg: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Amarilla' };
  if (r.includes('naranja')) return { bg: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Naranja' };
  if (r.includes('verde')) return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Verde' };
  if (r.includes('morada') || r.includes('azul')) return { bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', label: 'Morada' };
  if (r.includes('café') || r.includes('cafe')) return { bg: 'bg-amber-100 text-amber-900 border-amber-400', label: 'Café' };
  if (r.includes('negra') || r.includes('dan')) return { bg: 'bg-gray-900 text-white border-gray-950', label: 'Negra' };
  return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: rankStr };
}

export function getTandasRosterSignature(schedules) {
  if (!Array.isArray(schedules)) return '';
  return schedules.map(s => `${s.blockName || ''}@${(s.studentIds || []).map(String).join(',')}`).join('||');
}

export function parseAspectPoint(pointItem, idx, prefix, isSection2 = false) {
  if (!pointItem) return null;
  let raw = '';
  let isEvaluable = !isSection2;

  if (typeof pointItem === 'object' && pointItem !== null) {
    raw = String(pointItem.text || pointItem.point || pointItem.rawText || '').trim();
    if (typeof pointItem.isEvaluable === 'boolean') {
      isEvaluable = pointItem.isEvaluable;
    } else if (typeof pointItem.evaluableInExam === 'boolean') {
      isEvaluable = pointItem.evaluableInExam;
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
    isEvaluable
  };
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

