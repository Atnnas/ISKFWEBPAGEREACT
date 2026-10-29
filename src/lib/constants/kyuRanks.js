/**
 * Definición oficial centralizada de Grados Kyu y Dan ISKF Costa Rica
 * Fuente única de verdad para colores sólidos, nombres de cinturones y opciones de grado.
 */

export const ASPECT_ICONS = {
  tsuki: '👊',
  uke: '🛡️',
  dachi: '🦵',
  geri: '🦶',
  kata: '📜',
  kumite: '⚔️',
  physical: '⚡',
  mental: '🧠',
  do: '🥋'
};

export const KYU_DEFINITIONS = [
  { id: '10-kyu', digit: '10° Kyu', name: 'Cinta Blanca', full: '10° Kyu (Cinta Blanca)', solidClass: 'bg-white border-2 border-slate-300' },
  { id: '9-kyu', digit: '9° Kyu', name: 'Cinta Amarilla', full: '9° Kyu (Cinta Amarilla)', solidClass: 'bg-[#EAB308]' },
  { id: '8-kyu', digit: '8° Kyu', name: 'Cinta Naranja', full: '8° Kyu (Cinta Naranja)', solidClass: 'bg-[#EA580C]' },
  { id: '7-kyu', digit: '7° Kyu', name: 'Cinta Verde', full: '7° Kyu (Cinta Verde)', solidClass: 'bg-[#16A34A]' },
  { id: '6-kyu', digit: '6° Kyu', name: 'Cinta Azul', full: '6° Kyu (Cinta Azul)', solidClass: 'bg-[#2563EB]' },
  { id: '5-kyu', digit: '5° Kyu', name: 'Cinta Morada', full: '5° Kyu (Cinta Morada)', solidClass: 'bg-[#7C3AED]' },
  { id: '4-kyu', digit: '4° Kyu', name: 'Cinta Morada (Línea Blanca)', full: '4° Kyu (Cinta Morada con Línea Blanca)', solidClass: 'bg-[#7C3AED] relative overflow-hidden', hasStripe: true },
  { id: '3-kyu', digit: '3° Kyu', name: 'Cinta Marrón 3', full: '3° Kyu (Cinta Marrón 3)', solidClass: 'bg-[#602D0E]' },
  { id: '2-kyu', digit: '2° Kyu', name: 'Cinta Marrón 2', full: '2° Kyu (Cinta Marrón 2)', solidClass: 'bg-[#602D0E]' },
  { id: '1-kyu', digit: '1° Kyu', name: 'Cinta Marrón 1', full: '1° Kyu (Cinta Marrón 1)', solidClass: 'bg-[#602D0E]' },
  { id: '1-dan', digit: '1° Dan', name: 'Cinta Negra (Shodan)', full: '1° Dan (Cinta Negra / Shodan)', solidClass: 'bg-black border border-slate-800' },
  { id: '2-dan', digit: '2° Dan', name: 'Cinta Negra (Nidan)', full: '2° Dan (Cinta Negra / Nidan)', solidClass: 'bg-black border border-slate-800' },
  { id: '3-dan', digit: '3° Dan', name: 'Cinta Negra (Sandan)', full: '3° Dan (Cinta Negra / Sandan)', solidClass: 'bg-black border border-slate-800' },
  { id: '4-dan', digit: '4° Dan', name: 'Cinta Negra (Yondan)', full: '4° Dan (Cinta Negra / Yondan)', solidClass: 'bg-black border border-slate-800' }
];

export const KYU_OPTIONS = KYU_DEFINITIONS.map(k => k.full);

export const COMMON_STANCES = [
  'Zenkutsu Dachi',
  'Kokutsu Dachi',
  'Kiba Dachi',
  'Heiko Dachi',
  'Musubi Dachi',
  'Fudo Dachi / Sochin Dachi',
  'Kosa Dachi'
];

export const COMMON_DIRECTIONS = [
  'Adelante (Mae)',
  'Atrás (Ushiro)',
  'En el lugar (Sonoba)',
  'Diagonal',
  'Lateral (Yoko)',
  'Embusen Oficial'
];

/**
 * Normaliza un texto de grado/cinturón para comparaciones flexibles entre
 * variantes como "10° Kyu (Cinta Blanca)" vs "10 Kyu" o "Cinta Amarilla".
 */
export function normalizeRankKey(rankStr = '') {
  const s = String(rankStr || '').toLowerCase().trim();
  const numMatch = s.match(/(\d+)\s*[°º]?\s*(kyu|dan)/i);
  if (numMatch) {
    return `${numMatch[1]}-${numMatch[2].toLowerCase()}`;
  }
  if (s.includes('blanc') || s.includes('white')) return '10-kyu';
  if (s.includes('amarill') || s.includes('yellow')) return '9-kyu';
  if (s.includes('naranj') || s.includes('orange')) return '8-kyu';
  if (s.includes('verde') || s.includes('green')) return '7-kyu';
  if (s.includes('azul') || s.includes('blue')) return '6-kyu';
  if (s.includes('morad') && (s.includes('linea') || s.includes('línea') || s.includes('blanca'))) return '4-kyu';
  if (s.includes('morad') || s.includes('purple')) return '5-kyu';
  if (s.includes('marron 3') || s.includes('marrón 3') || s.includes('cafe 3') || s.includes('café 3')) return '3-kyu';
  if (s.includes('marron 2') || s.includes('marrón 2') || s.includes('cafe 2') || s.includes('café 2')) return '2-kyu';
  if (s.includes('marron') || s.includes('marrón') || s.includes('cafe') || s.includes('café') || s.includes('brown')) return '1-kyu';
  if (s.includes('negr') || s.includes('black') || s.includes('shodan')) return '1-dan';
  return s;
}

/**
 * Determina si dos cadenas de cinturón representan el mismo grado Kyu/Dan
 */
export function isSameRank(rankA, rankB) {
  if (!rankA || !rankB) return false;
  if (String(rankA).trim().toLowerCase() === String(rankB).trim().toLowerCase()) return true;
  const keyA = normalizeRankKey(rankA);
  const keyB = normalizeRankKey(rankB);
  return Boolean(keyA && keyB && keyA === keyB);
}

/**
 * Obtiene la clase visual de insignia de cinturón según el texto del grado
 */
export function getBeltBadgeClass(rankStr = '') {
  const key = normalizeRankKey(rankStr);
  if (key === '10-kyu') return 'bg-slate-100 text-slate-900 border border-slate-300 shadow-sm';
  if (key === '9-kyu') return 'bg-amber-400 text-slate-950 font-black shadow-sm';
  if (key === '8-kyu') return 'bg-orange-500 text-white font-black shadow-sm';
  if (key === '7-kyu') return 'bg-emerald-600 text-white font-black shadow-sm';
  if (key === '6-kyu') return 'bg-blue-600 text-white font-black shadow-sm';
  if (key === '5-kyu' || key === '4-kyu') return 'bg-purple-600 text-white font-black shadow-sm';
  if (key === '3-kyu' || key === '2-kyu' || key === '1-kyu') return 'bg-amber-900 text-amber-100 border border-amber-700/50 font-black shadow-sm';
  if (key.endsWith('-dan')) return 'bg-black text-amber-300 border border-amber-400/50 font-black shadow-sm';
  return 'bg-indigo-600 text-white font-bold';
}
