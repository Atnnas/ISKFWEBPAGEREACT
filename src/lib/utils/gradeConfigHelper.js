import { normalizeRankKey, ALL_RANKS_DEFINITIONS } from '../constants/kyuRanks';

export const DEFAULT_MIN_PASSING_SCORE = 70;

/**
 * Obtiene la lista por defecto de notas mínimas para todos los cinturones reconocidos en ISKF.
 */
export function getDefaultRankGrades() {
  return ALL_RANKS_DEFINITIONS.map(r => ({
    rankKey: r.id,
    rankLabel: r.full,
    minScore: 70,
    active: true
  }));
}

/**
 * Resuelve la nota mínima configurada para un grado o cinturón objetivo.
 * Si no hay configuración o no se encuentra el grado, retorna el valor por defecto (70%).
 *
 * @param {string} targetRank - Grado objetivo o actual del aspirante (ej: "4° Kyu", "Cinta Amarilla")
 * @param {Object} gradeConfig - Configuración de notas (puede venir de MongoDB o estado local)
 * @returns {number} Nota mínima de aprobación (entre 0 y 100)
 */
export function getMinPassingScore(targetRank = '', gradeConfig = null) {
  if (!targetRank) {
    return Number(gradeConfig?.defaultMinScore) || DEFAULT_MIN_PASSING_SCORE;
  }

  const normKey = normalizeRankKey(targetRank);
  const ranksList = gradeConfig?.ranks;

  if (Array.isArray(ranksList) && ranksList.length > 0) {
    const match = ranksList.find(r => {
      if (r.rankKey === normKey) return true;
      if (normalizeRankKey(r.rankKey) === normKey) return true;
      if (normalizeRankKey(r.rankLabel) === normKey) return true;
      return false;
    });

    if (match && typeof match.minScore === 'number' && !isNaN(match.minScore)) {
      return match.minScore;
    }
  }

  return Number(gradeConfig?.defaultMinScore) || DEFAULT_MIN_PASSING_SCORE;
}

/**
 * Determina si una calificación alcanza la nota mínima de aprobación para el cinturón dado.
 *
 * @param {number} score - Calificación obtenida (0 a 100)
 * @param {string} targetRank - Cinturón evaluado
 * @param {Object} gradeConfig - Configuración de notas mínimas
 * @returns {boolean} true si aprobó, false si reprobó
 */
export function isStudentPassing(score = 0, targetRank = '', gradeConfig = null) {
  const numScore = Number(score) || 0;
  const minScore = getMinPassingScore(targetRank, gradeConfig);
  return numScore >= minScore;
}

/**
 * Retorna información detallada y clases visuales del estado de aprobación según la configuración.
 */
export function getGradeStatus(score = 0, targetRank = '', gradeConfig = null) {
  const numScore = Math.round(Number(score) || 0);
  const minScore = getMinPassingScore(targetRank, gradeConfig);
  const isPassed = numScore >= minScore;
  const diff = numScore - minScore;

  if (isPassed) {
    return {
      isPassed: true,
      minScore,
      score: numScore,
      diff,
      label: 'Aprobado',
      shortLabel: 'Aprobado',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
      textClass: 'text-emerald-700',
      pillClass: 'bg-emerald-500 text-white',
      borderClass: 'border-emerald-300'
    };
  }

  return {
    isPassed: false,
    minScore,
    score: numScore,
    diff,
    label: 'Reprobado',
    shortLabel: 'Reprobado',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    textClass: 'text-rose-700',
    pillClass: 'bg-rose-600 text-white',
    borderClass: 'border-rose-300'
  };
}

/**
 * Extractor seguro de texto para viñetas y observaciones.
 * Evita la aparición accidental de "[object Object]" cuando un ítem es un objeto.
 */
export function extractBulletText(item) {
  if (item === null || item === undefined) return '';
  if (typeof item === 'string') return item.trim();
  if (typeof item.text === 'string') return item.text.trim();
  if (typeof item.bullet === 'string') return item.bullet.trim();
  if (typeof item.directive === 'string') return item.directive.trim();
  if (typeof item.note === 'string') return item.note.trim();
  if (typeof item.observation === 'string') return item.observation.trim();

  // Si es un objeto genérico, buscar recursivamente o extraer valores string
  if (typeof item === 'object') {
    const stringVals = Object.values(item).filter(v => typeof v === 'string' && v.trim().length > 0);
    if (stringVals.length > 0) return stringVals.join(' — ');
  }

  return '';
}
