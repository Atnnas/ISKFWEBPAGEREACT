/**
 * Motor de Inteligencia y Síntesis Marcial Colegiada ISKF Costa Rica
 * 
 * Compara y sintetiza semánticamente los comentarios personales de los diferentes Senseis
 * evaluadores por cada rubro (Kihon, Kata, Kumite y Aspectos), detecta coincidencias
 * temáticas y biomecánicas entre varios Senseis, y unifica las observaciones junto con
 * las falencias/detalles derivados de la calificación de estrellas por técnica.
 * 
 * Reglas de oro:
 * 1. NUNCA emitir prefijos genéricos como "Ajuste técnico: ", "Nota: ", etc. Solo la indicación marcial directa.
 * 2. Deduplicación semántica estricta: si dos o más evaluadores expresan ideas similares
 *    (ej: "No hace Kiai" vs "Evita hacer kiai"), se fusionan en UNA SOLA indicación concisa.
 */

import { getKataForRank, getKumiteForRank, getPrimaryStance } from './shotokanCriteriaFeedback.js';
import { normalizeRankKey } from '../constants/kyuRanks.js';

// Normalizar texto para comparación semántica (sin acentos, minúsculas, sin puntuación)
function normalizeText(str = '') {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Resuelve el texto exacto del criterio a partir de technicalAspects o del key
export function resolveAspectTextFromKey(criterionKey = '', technicalAspects = [], techniques = []) {
  if (!criterionKey) return '';

  let pureKey = criterionKey;
  if (pureKey.startsWith('aspect_')) {
    pureKey = pureKey.replace(/^aspect_/, '');
  }

  // Si tiene técnica prefijada (ej: tech-01_tsuki_0 o kiba_dachi_1)
  const parts = pureKey.split('_');
  const lastPart = parts[parts.length - 1]; // e.g. "0", "1", "kiai", etc.
  const prefixPart = parts.length > 1 ? parts[parts.length - 2] : parts[0];

  let matchedText = '';

  (technicalAspects || []).forEach(asp => {
    const cat = (asp.category || asp.id || asp.title || '').toLowerCase();
    (asp.points || []).forEach((p, pIdx) => {
      const pText = typeof p === 'object' && p !== null ? (p.text || p.point || p.rawText || '') : String(p || '');
      // Coincidencia por índice y categoría
      if (String(pIdx) === lastPart && (cat.includes(prefixPart) || prefixPart.includes(cat))) {
        matchedText = pText;
      }
      // Coincidencia si el key incluye la categoría
      if (!matchedText && pureKey.toLowerCase().includes(cat) && String(pIdx) === lastPart) {
        matchedText = pText;
      }
    });
  });

  // Si no se encontró por índice estricto, buscar en técnicas si es tech_crit
  if (!matchedText) {
    (techniques || []).forEach(t => {
      (t.criteria || []).forEach((c, cIdx) => {
        const cText = typeof c === 'object' && c !== null ? (c.text || c.point || c.label || '') : String(c || '');
        if (pureKey.includes(t.id) && String(cIdx) === lastPart) {
          matchedText = cText;
        }
      });
    });
  }

  return matchedText;
}

// Extraer tokens semánticos significativos aplicando stemming ligero en español
export function extractAspectScoresFromEvaluations({
  evaluations = [],
  phase = null,
  techniques = [],
  technicalAspects = []
}) {
  const aspectScores = [];
  const seenKeys = new Set();

  evaluations.forEach(ev => {
    const rawScores = ev?.scores || ev?.evalRecord?.scores || {};
    if (!rawScores || typeof rawScores !== 'object') return;

    Object.entries(rawScores).forEach(([key, val]) => {
      const scoreNum = Number(val);
      // Solo aspectos evaluados con menos de 10 (1 a 9)
      if (!scoreNum || scoreNum <= 0 || scoreNum >= 10) return;

      const dedupeKey = `${key}_${scoreNum}`;
      if (seenKeys.has(dedupeKey)) return;
      seenKeys.add(dedupeKey);

      const lk = key.toLowerCase();
      const isKataKey = lk.includes('-ka') || lk.includes('kata') || lk.includes('heian') || lk.includes('tekki') || lk.includes('bassai') || lk.includes('kanku') || lk.includes('jion') || lk.includes('empi');
      const isKumiteKey = lk.includes('-ku') || lk.includes('kumite') || lk.includes('sambon') || lk.includes('gohon') || lk.includes('ippon') || lk.includes('jiyu');
      const isAspectKey = lk.startsWith('aspect_');

      if (phase === 'kata' && !isKataKey) return;
      if (phase === 'kumite' && !isKumiteKey) return;
      if (phase === 'aspectos' && !isAspectKey) return;
      if (phase === 'kihon' && (isKataKey || isKumiteKey || isAspectKey)) return;

      // Técnica
      const techId = key.split('_')[0];
      const matchedTech = (techniques || []).find(t => t.id === techId || key.startsWith(t.id));
      const techniqueName = matchedTech?.name || '';

      // Criterio
      const criterionText = resolveAspectTextFromKey(key, technicalAspects, techniques);
      if (!criterionText) return;

      aspectScores.push({
        key,
        techniqueId: techId,
        techniqueName,
        criterion: criterionText,
        stars: scoreNum,
        score: scoreNum * 10,
        evaluatorName: ev.evaluatorName || ev.evaluator?.name || 'Sensei'
      });
    });
  });

  return aspectScores;
}

// Extraer tokens semánticos significativos aplicando stemming ligero en español
function extractSemanticStems(str = '') {
  const norm = normalizeText(str);
  const stopWords = new Set([
    'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'en', 'para', 'por', 'con', 'sin', 'sobre', 'hacia', 'desde',
    'que', 'se', 'no', 'si', 'muy', 'mas', 'al', 'del', 'su', 'sus',
    'hace', 'hacen', 'hacer', 'haciendo', 'hizo', 'debe', 'deben',
    'evita', 'evitan', 'evitar', 'evitando', 'falta', 'faltan',
    'poco', 'mucho', 'bien', 'mal', 'tener', 'tiene', 'tienen',
    'esta', 'estan', 'queda', 'quedan', 'cada', 'todo', 'toda',
    'todos', 'todas', 'antes', 'despues', 'durante', 'nota', 'noto'
  ]);

  return norm
    .split(' ')
    .map(w => w.trim())
    .filter(w => w.length > 2 && !stopWords.has(w))
    .map(w => {
      // Reducir terminaciones verbales y plurales comunes en español
      return w
        .replace(/(ando|iendo|ar|er|ir|ado|ido)$/, '')
        .replace(/(os|as|es|s)$/, '')
        .replace(/(mente)$/, '');
    });
}

// Calcular coeficiente de similitud de Jaccard entre dos conjuntos de stems
function calculateStemSimilarity(stemsA = [], stemsB = []) {
  if (!stemsA.length || !stemsB.length) return 0;
  const setA = new Set(stemsA);
  const setB = new Set(stemsB);
  let intersection = 0;
  setA.forEach(item => {
    if (setB.has(item)) intersection++;
  });
  const union = new Set([...stemsA, ...stemsB]).size;
  return union > 0 ? intersection / union : 0;
}

// Extraer oraciones / viñetas atómicas de las notas de un evaluador
export function extractAtomicObservations(rawText = '') {
  if (!rawText || typeof rawText !== 'string') return [];
  
  return rawText
    .split(/\r?\n|[•*]|(?<=[.!?])\s+/)
    .map(p => p.replace(/^[•*\-\s]+/, '').replace(/^ajuste t[eé]cnico:?\s*/i, '').trim())
    .filter(p => p.length > 4);
}

// Diccionario taxonómico de temas biomecánicos del Karate Shotokan
// Cada tema mapea a los Aspectos Técnicos configurados oficiales de la ISKF
const MARTIAL_TOPICS = [
  {
    key: 'kiai_determination',
    aspect: 'Aspecto Técnico - Kiai (Capacidades Mentales)',
    phase: 'all',
    keywords: ['kiai', 'grito', 'gritar', 'kiai fuerte', 'kiai potente', 'no hace kiai', 'evita hacer kiai', 'sin kiai', 'falta kiai', 'kiai timido', 'kiai debil', 'punto focal'],
    unifiedSynthesis: 'Aspecto Técnico - Kiai (Capacidades Mentales): No hace Kiai, debe mejorar la forma en que hace Kiai.'
  },
  {
    key: 'snap_foot_kick',
    aspect: 'Aspecto Técnico - Patadas (Geri Waza)',
    phase: 'kihon',
    keywords: ['snap', 'hikiashi', 'recoger rapido', 'recoger el pie', 'snap con la punta', 'snap con el pie', 'recogida'],
    unifiedSynthesis: 'Aspecto Técnico - Patadas (Geri Waza): No realiza snap ni recoge el pie, debe elevar la rodilla y recoger rápido con Hikiashi.'
  },
  {
    key: 'foot_opening_anticipation',
    aspect: 'Aspecto Técnico - Desplazamientos (Dachi Waza)',
    phase: 'kihon',
    keywords: [
      'abrir la punta', 'abrir el pie', 'abrir punta', 'movimiento previo', 
      'antes de salir', 'antes de abrir', 'pie antes de salir', 'punta del pie antes',
      'anticipar paso', 'paso en falso', 'gira el pie antes', 'desviar el pie'
    ],
    unifiedSynthesis: 'Aspecto Técnico - Desplazamientos (Dachi Waza): Abre la punta del pie antes de salir y da pasos en falso, debe avanzar en trayectoria limpia sin reajustar los pies.'
  },
  {
    key: 'hair_distraction',
    aspect: 'Aspecto Técnico - Etiqueta y DO',
    phase: 'all',
    keywords: ['cabello', 'pelo', 'acomoda', 'acomodandose', 'peinar', 'distrae', 'distraerse', 'tocarse la cabeza', 'solapa', 'karategui', 'uniforme', 'vestimenta', 'ropa'],
    unifiedSynthesis: 'Aspecto Técnico - Etiqueta y DO: Se acomoda el cabello o el uniforme durante la ejecución, debe mantener inmovilidad corporal, etiqueta y disciplina marcial en tatami.'
  },
  {
    key: 'elbow_block_gedan',
    aspect: 'Aspecto Técnico - Defensas (Uke Waza)',
    phase: 'kihon',
    keywords: ['codo', 'codos', 'gedan barai', 'cubrir el pecho', 'cubrirse el pecho', 'pecho', 'cargar', 'armar'],
    unifiedSynthesis: 'Aspecto Técnico - Defensas (Uke Waza): No cierra los codos al armar el bloqueo, debe cubrir adecuadamente el centro del pecho a un puño de distancia.'
  },
  {
    key: 'eyes_chakugan',
    aspect: 'Aspecto Técnico - Kata (Chakugan y Enfoque)',
    phase: 'kata',
    keywords: ['mirada', 'vista', 'ojos', 'chakugan', 'adonde debe ir', 'donde debe ir', 'al frente', 'desviar la vista', 'no dirige la mirada'],
    unifiedSynthesis: 'Aspecto Técnico - Kata (Chakugan y Enfoque): No fija la mirada hacia la dirección del ataque antes de girar, debe dirigir la vista al frente y sostenerla en cada pausa.'
  },
  {
    key: 'breathing_control',
    aspect: 'Aspecto Técnico - Capacidades Físicas (Respiración)',
    phase: 'all',
    keywords: ['respiracion', 'respirar', 'inadecuada', 'aire', 'contener', 'exhalar', 'inhalar', 'diafragma'],
    unifiedSynthesis: 'Aspecto Técnico - Capacidades Físicas (Respiración): No coordina la respiración o contiene el aire, debe sincronizar la exhalación potente en cada técnica.'
  },
  {
    key: 'stance_zenkutsu_heel',
    aspect: 'Aspecto Técnico - Posturas (Dachi Waza)',
    phase: 'kihon',
    keywords: ['talon', 'talon despegado', 'pie posterior', 'pierna trasera', 'pierna de atras', 'zenkutsu', 'dachi', 'bajar cadera', 'estirar rodilla'],
    unifiedSynthesis: 'Aspecto Técnico - Posturas (Dachi Waza): Despega el talón y flexiona la pierna posterior en Zenkutsu Dachi, debe mantener la pierna estirada y asentar el talón firme en el suelo.'
  },
  {
    key: 'hikite_placement',
    aspect: 'Aspecto Técnico - Puño y Hikite (Tsuki Waza)',
    phase: 'kihon',
    keywords: ['hikite', 'cintura', 'cadera', 'mano a la cintura', 'puño pegado', 'mano suelta', 'mano descolgada'],
    unifiedSynthesis: 'Aspecto Técnico - Puño y Hikite (Tsuki Waza): No ancla la mano de Hikite a la cintura, debe jalar con fuerza el puño pegado sobre el cinturón.'
  },
  {
    key: 'distance_maai',
    aspect: 'Aspecto Técnico - Combate (Distancia Ma-ai)',
    phase: 'kumite',
    keywords: ['distancia', 'ma-ai', 'maai', 'separacion', 'muy cerca', 'muy lejos', 'tercer paso', 'alcance'],
    unifiedSynthesis: 'Aspecto Técnico - Combate (Distancia Ma-ai): No controla la distancia reglamentaria de seguridad, debe calcular el Ma-ai sin quedar excesivamente cerca ni lejos.'
  },
  {
    key: 'guard_kamae',
    aspect: 'Aspecto Técnico - Combate (Guardia Kamae)',
    phase: 'kumite',
    keywords: ['guardia', 'kamae', 'bajar la mano', 'bajar los brazos', 'desarmar', 'manos abajo'],
    unifiedSynthesis: 'Aspecto Técnico - Combate (Guardia Kamae): Baja los brazos y desarma la guardia tras bloquear, debe sostener la postura de combate (Kamae) y el espíritu alerta (Zanshin).'
  },
  {
    key: 'kata_rhythm_flow',
    aspect: 'Aspecto Técnico - Kata (Ritmo y Sincronización)',
    phase: 'kata',
    keywords: ['ritmo', 'pausa', 'fluidez', 'dudo', 'duda', 'detenerse', 'embusen', 'giro'],
    unifiedSynthesis: 'Aspecto Técnico - Kata (Ritmo y Sincronización): Duda en las secuencias del kata y realiza pausas a destiempo, debe mantener el ritmo marcial constante y fluidez en el embusen.'
  },
  {
    key: 'posture_upright_back',
    aspect: 'Aspecto Técnico - Posturas (Dachi Waza)',
    phase: 'all',
    keywords: ['espalda', 'tronco', 'inclinada', 'inclinar', 'balanceo', 'cuerpo erguido', 'postura erguida'],
    unifiedSynthesis: 'Aspecto Técnico - Posturas (Dachi Waza): Inclina la espalda y balancea el tronco hacia adelante, debe mantener el cuerpo erguido y el centro de gravedad estable.'
  },
  {
    key: 'shoulder_tension',
    aspect: 'Aspecto Técnico - Coordinación',
    phase: 'all',
    keywords: ['hombro', 'hombros', 'tension', 'tenso', 'relajar', 'relajado', 'subir hombros'],
    unifiedSynthesis: 'Aspecto Técnico - Coordinación: Tensa y eleva los hombros al golpear o bloquear, debe relajar los hombros hacia abajo y evitar rigidez.'
  }
];

/**
 * Transforma una observación cruda en una indicación directa
 * estructurada en: [Aspecto Técnico]: [Qué NO hace], debe [cómo corregirlo / mejorarlo].
 */
function toMartialDirectCorrection(rawText = '', phase = 'kihon') {
  let clean = rawText
    .replace(/^ajuste t[eé]cnico:?\s*/i, '')
    .replace(/^correcci[oó]n:?\s*/i, '')
    .replace(/^observaci[oó]n:?\s*/i, '')
    .replace(/^falla:?\s*/i, '')
    .trim();

  // Si ya tiene el formato de Aspecto Técnico, conservarlo
  if (/^aspecto t[eé]cnico/i.test(clean)) {
    return clean;
  }

  // Detectar aspecto según palabras clave y fase
  const lower = clean.toLowerCase();
  let aspectLabel = 'Aspecto Técnico';
  if (lower.includes('kiai') || lower.includes('grito')) {
    aspectLabel = 'Aspecto Técnico - Kiai (Capacidades Mentales)';
  } else if (lower.includes('dachi') || lower.includes('postura') || lower.includes('talon') || lower.includes('paso') || lower.includes('zenkutsu') || lower.includes('kokutsu') || lower.includes('kiba')) {
    aspectLabel = 'Aspecto Técnico - Posturas (Dachi Waza)';
  } else if (lower.includes('hikite') || lower.includes('zuki') || lower.includes('tsuki') || lower.includes('puño') || lower.includes('golpe')) {
    aspectLabel = 'Aspecto Técnico - Puño y Hikite (Tsuki Waza)';
  } else if (lower.includes('uke') || lower.includes('bloqueo') || lower.includes('codo') || lower.includes('defensa') || lower.includes('barai')) {
    aspectLabel = 'Aspecto Técnico - Defensas (Uke Waza)';
  } else if (lower.includes('geri') || lower.includes('patada') || lower.includes('snap') || lower.includes('hikiashi')) {
    aspectLabel = 'Aspecto Técnico - Patadas (Geri Waza)';
  } else if (lower.includes('kata') || lower.includes('embusen') || lower.includes('mirada') || lower.includes('chakugan') || phase === 'kata') {
    aspectLabel = 'Aspecto Técnico - Kata (Forma y Enfoque)';
  } else if (lower.includes('kumite') || lower.includes('combate') || lower.includes('distancia') || lower.includes('maai') || lower.includes('guardia') || lower.includes('kamae') || phase === 'kumite') {
    aspectLabel = 'Aspecto Técnico - Combate (Kumite)';
  } else if (lower.includes('cabello') || lower.includes('karategui') || lower.includes('uniforme') || phase === 'aspectos') {
    aspectLabel = 'Aspecto Técnico - Etiqueta y DO';
  }

  // Formulación precisa: Lo que NO hace + debe mejorar
  if (/^(no hace|evita hacer|falta|sin|no realiza)\s+kiai/i.test(clean)) {
    return `${aspectLabel}: No hace Kiai, debe mejorar la forma en que hace Kiai.`;
  }
  if (/^no\s+cierra\s+los\s+codos/i.test(clean)) {
    return `${aspectLabel}: No cierra los codos al armar el bloqueo, debe cubrir adecuadamente el centro del pecho a un puño de distancia.`;
  }
  if (/^no\s+(hace\s+snap|recoge)/i.test(clean)) {
    return `${aspectLabel}: No realiza snap ni recoge el pie, debe elevar la rodilla y recoger rápido con Hikiashi.`;
  }
  if (/^no\s+dirige\s+la\s+mirada/i.test(clean)) {
    return `${aspectLabel}: No fija la mirada hacia la dirección del ataque, debe dirigir la vista al frente y sostenerla en cada pausa.`;
  }
  if (/^(respiraci[oó]n\s+inadecuada|no\s+respira)/i.test(clean)) {
    return `${aspectLabel}: No coordina la respiración o contiene el aire, debe sincronizar la exhalación potente en cada técnica.`;
  }

  // Si empieza con "no...", asegurar que tenga su directiva "debe ..."
  if (/^no\s+/i.test(clean) && !clean.toLowerCase().includes('debe')) {
    clean = `${clean.trim().replace(/\.$/, '')}, debe coordinar la técnica con mayor precisión y enfoque.`;
  }

  clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  if (!clean.endsWith('.')) clean += '.';

  return `${aspectLabel}: ${clean}`;
}

/**
 * Compara y sintetiza las observaciones de múltiples evaluadores para una fase técnica.
 * 
 * @param {Object} params
 * @param {string} params.phase - 'kihon' | 'kata' | 'kumite' | 'aspectos'
 * @param {Array} params.notesList - Array de { evaluatorName, note, evaluatorRole }
 * @param {Array} params.techniqueScores - Array de técnicas evaluadas en esta fase con promedios
 * @param {number} params.phaseAverage - Nota promedio de la fase (0-100)
 * @param {string} params.targetRank - Rango objetivo (ej: '9° Kyu (Cinta Amarilla)')
 * @returns {Array<Object>} Lista de viñetas sintetizadas
 */
export function synthesizePhaseBulletsWithAI({
  phase = 'kihon',
  notesList = [],
  techniqueScores = [],
  phaseAverage = 75,
  targetRank = '9° Kyu (Cinta Amarilla)',
  specificKataName = '',
  aspectScores = [] // Array of { techniqueName, criterion, stars, score, key }
}) {
  // 1. Detectar si alguna nota de evaluador menciona un Kata conocido explícitamente
  const KNOWN_KATAS = [
    'Heian Shodan', 'Heian Nidan', 'Heian Sandan', 'Heian Yondan', 'Heian Godan',
    'Tekki Shodan', 'Tekki Nidan', 'Tekki Sandan',
    'Bassai Dai', 'Bassai Sho', 'Kanku Dai', 'Kanku Sho',
    'Jion', 'Jiin', 'Jitte', 'Enpi', 'Empi', 'Hangetsu',
    'Gankaku', 'Sochin', 'Nijushiho', 'Meikyo', 'Unsu', 'Wankan',
    'Gojushiho Dai', 'Gojushiho Sho', 'Chinte'
  ];

  let detectedKataFromNotes = '';
  if (phase === 'kata') {
    const combinedNotes = (notesList || []).map(nItem => (typeof nItem === 'string' ? nItem : (nItem.note || ''))).join(' ');
    for (const k of KNOWN_KATAS) {
      const regex = new RegExp(`\\b${k.replace(' ', '\\s+')}\\b`, 'i');
      if (regex.test(combinedNotes)) {
        detectedKataFromNotes = k;
        break;
      }
    }
  }

  const expectedKataForRank = getKataForRank(targetRank);
  const katasFromTech = (techniqueScores || [])
    .filter(t => (t.group || t.phase || '').toLowerCase() === 'kata' || t.name)
    .map(t => t.name)
    .filter(Boolean);
  const resolvedKataFromTech = katasFromTech.length > 0 ? katasFromTech.join(' y ') : '';

  // Determinar kataName evitando cruce indebido de temarios incompatibles
  let kataName = specificKataName || detectedKataFromNotes;
  if (!kataName) {
    if (resolvedKataFromTech) {
      const rankKey = normalizeRankKey(targetRank);
      const isMismatch = (rankKey === '5-kyu' && resolvedKataFromTech.toLowerCase().includes('tekki'))
        || (rankKey === '6-kyu' && !resolvedKataFromTech.toLowerCase().includes('yondan'))
        || (rankKey === '7-kyu' && !resolvedKataFromTech.toLowerCase().includes('sandan'))
        || (rankKey === '8-kyu' && !resolvedKataFromTech.toLowerCase().includes('nidan'))
        || (rankKey === '9-kyu' && !resolvedKataFromTech.toLowerCase().includes('shodan'));

      kataName = isMismatch ? expectedKataForRank : resolvedKataFromTech;
    } else {
      kataName = expectedKataForRank;
    }
  }
  const kumiteName = getKumiteForRank(targetRank);
  const primaryStance = getPrimaryStance(targetRank);

  // 1. Extraer todas las observaciones atómicas con evaluador y sus stems semánticos
  const allAtomicObs = [];
  (notesList || []).forEach(nItem => {
    const evalName = nItem.evaluatorName || nItem.evaluator?.name || 'Sensei';
    const rawNote = typeof nItem === 'string' ? nItem : (nItem.note || '');
    const sentences = extractAtomicObservations(rawNote);

    sentences.forEach(sentence => {
      const cleanSentence = sentence.replace(/^ajuste t[eé]cnico:?\s*/i, '').trim();
      const norm = normalizeText(cleanSentence);
      const stems = extractSemanticStems(cleanSentence);

      // Intentar coincidir con tema predefinido
      let matchedTopic = null;
      for (const topic of MARTIAL_TOPICS) {
        if (topic.phase !== 'all' && topic.phase !== phase) continue;
        const matchesKeyword = topic.keywords.some(kw => {
          const normKw = normalizeText(kw);
          return norm.includes(normKw);
        });
        if (matchesKeyword) {
          matchedTopic = topic;
          break;
        }
      }

      allAtomicObs.push({
        evaluatorName: evalName,
        text: cleanSentence,
        norm,
        stems,
        matchedTopic
      });
    });
  });

  // 2. Agrupamiento y Deduplicación Semántica Inteligente
  // Si dos frases coinciden con el mismo tema O comparten stems clave (ej: 'kiai'), se unifican
  const clusters = [];

  allAtomicObs.forEach(obs => {
    let foundCluster = null;

    // Buscar si ya existe un cluster con el mismo tema o alta similitud de stems
    for (const cl of clusters) {
      if (obs.matchedTopic && cl.topicKey === obs.matchedTopic.key) {
        foundCluster = cl;
        break;
      }
      
      // Comprobar coincidencia directa por stems marciales
      const sim = calculateStemSimilarity(obs.stems, cl.allStems);
      const sharesKeyRoot = obs.stems.some(s => cl.allStems.includes(s) && s.length >= 4);

      if (sim >= 0.35 || sharesKeyRoot) {
        foundCluster = cl;
        break;
      }
    }

    if (foundCluster) {
      foundCluster.evaluators.add(obs.evaluatorName);
      foundCluster.rawTexts.push(obs.text);
      obs.stems.forEach(s => {
        if (!foundCluster.allStems.includes(s)) foundCluster.allStems.push(s);
      });
    } else {
      clusters.push({
        topicKey: obs.matchedTopic?.key || obs.stems.slice(0, 3).sort().join('_') || 'general',
        matchedTopic: obs.matchedTopic,
        evaluators: new Set([obs.evaluatorName]),
        rawTexts: [obs.text],
        allStems: [...obs.stems]
      });
    }
  });

  const synthesizedBullets = [];
  const coveredTopics = new Set();

  // 3. Generar la redacción final limpia de cada cluster identificando el aspecto técnico configurado
  clusters.forEach(cluster => {
    if (cluster.topicKey) coveredTopics.add(cluster.topicKey);
    const evalList = Array.from(cluster.evaluators);
    const coincidenceCount = evalList.length;

    let lineText = '';
    if (cluster.matchedTopic && cluster.matchedTopic.unifiedSynthesis) {
      lineText = cluster.matchedTopic.unifiedSynthesis;
    } else {
      // Tomar la versión más clara y estructurarla en Aspecto Técnico: [Lo que NO hace], debe [cómo mejorar]
      const bestRaw = cluster.rawTexts.reduce((prev, curr) => curr.length > prev.length ? curr : prev, cluster.rawTexts[0]);
      lineText = toMartialDirectCorrection(bestRaw, phase);
    }

    // Limpieza final de seguridad: NUNCA permitir prefijos genéricos residuales
    lineText = lineText
      .replace(/^ajuste t[eé]cnico:?\s*/i, '')
      .replace(/^correcci[oó]n:?\s*/i, '')
      .trim();

    // Determinar si este comentario de Sensei coincide con una técnica puntuada < 100% (Origen Híbrido ⭐👤 vs 👤)
    const rawCombined = cluster.rawTexts.join(' ').toLowerCase();
    const hasLowStarsCoincidence = (techniqueScores || []).some(t => {
      const rawScore = typeof t.score === 'number' ? t.score : null;
      const tScore = rawScore !== null ? (rawScore <= 5 ? rawScore * 20 : (rawScore <= 10 ? rawScore * 10 : rawScore)) : null;
      if (tScore === null || tScore >= 100) return false;
      const tNorm = normalizeText(t.name || t.id);
      const firstWord = tNorm.split(' ')[0];
      return rawCombined.includes(tNorm) || 
             (cluster.topicKey && normalizeText(cluster.topicKey).includes(tNorm)) ||
             (firstWord && firstWord.length > 3 && rawCombined.includes(firstWord));
    });

    const isMultiSensei = coincidenceCount >= 2;
    let sourceType = 'sensei_only';
    let sourceIcon = '👤';
    let sourceLabel = `Comentario Directo de Sensei (${evalList.join(', ')})`;

    if (hasLowStarsCoincidence && isMultiSensei) {
      sourceType = 'hybrid_consensus';
      sourceIcon = '⭐👤👤';
      sourceLabel = `Consenso de ${coincidenceCount} Senseis (${evalList.join(', ')}) + Métrica de Estrellas`;
    } else if (isMultiSensei) {
      sourceType = 'sensei_consensus';
      sourceIcon = '👤👤';
      sourceLabel = `Coincidencia de ${coincidenceCount} Senseis (${evalList.join(', ')})`;
    } else if (hasLowStarsCoincidence) {
      sourceType = 'hybrid';
      sourceIcon = '⭐👤';
      sourceLabel = `Estrellas + Comentario de Sensei (${evalList[0] || 'Sensei'})`;
    }

    synthesizedBullets.push({
      text: lineText,
      coincidenceCount,
      isCoincidence: coincidenceCount > 1,
      evaluators: evalList,
      phase,
      sourceType,
      sourceIcon,
      sourceLabel
    });
  });

  // 4. Integrar con falencias e indicaciones correctivas derivadas de calificaciones por estrellas (técnicas y aspectos específicos < 10)
  // Filosofía Marcial ISKF: Siempre correctivo explicando qué debe corregir según el criterio evaluado
  // Si coincide temáticamente con una observación previa de Sensei, se FUSIONA armónicamente
  (aspectScores || []).forEach(asp => {
    const rawVal = typeof asp.stars === 'number' ? asp.stars : (typeof asp.score === 'number' ? asp.score / 10 : null);
    if (rawVal === null || rawVal >= 10) return; // Un 10/10 es perfecto, NO genera comentario de corrección

    const stars = Math.round(rawVal);
    const rawCritText = (asp.criterion || '').trim();
    if (!rawCritText) return;

    const cleanCrit = rawCritText
      .replace(/[?¿]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const tName = asp.techniqueName || 'Técnica de examen';
    const aspStems = extractSemanticStems(`${cleanCrit} ${tName}`);

    // Resolver encabezado técnico formal
    const normCrit = cleanCrit.toLowerCase();
    let aspectHeader = 'Aspecto Técnico';
    let aspectKey = 'general';

    if (normCrit.includes('dachi') || normCrit.includes('zenkutsu') || normCrit.includes('kokutsu') || normCrit.includes('kiba') || normCrit.includes('talon') || normCrit.includes('suri ashi') || normCrit.includes('mawatte')) {
      aspectHeader = 'Aspecto Técnico - Posturas (Dachi Waza)';
      aspectKey = 'dachi';
    } else if (normCrit.includes('tsuki') || normCrit.includes('puno') || normCrit.includes('puño') || normCrit.includes('hikite') || normCrit.includes('chudan') || normCrit.includes('jodan')) {
      aspectHeader = 'Aspecto Técnico - Puño y Hikite (Tsuki Waza)';
      aspectKey = 'tsuki';
    } else if (normCrit.includes('uke') || normCrit.includes('defensa') || normCrit.includes('bloqueo') || normCrit.includes('barai')) {
      aspectHeader = 'Aspecto Técnico - Defensas (Uke Waza)';
      aspectKey = 'uke';
    } else if (normCrit.includes('geri') || normCrit.includes('patada') || normCrit.includes('snap') || normCrit.includes('rodilla') || normCrit.includes('hikiashi')) {
      aspectHeader = 'Aspecto Técnico - Patadas (Geri Waza)';
      aspectKey = 'geri';
    } else if (normCrit.includes('kiai') || normCrit.includes('respiracion') || normCrit.includes('grito') || normCrit.includes('tanden')) {
      aspectHeader = 'Aspecto Técnico - Kiai y Respiración (Capacidades Mentales)';
      aspectKey = 'mental';
    } else if (normCrit.includes('chakugan') || normCrit.includes('mirada') || normCrit.includes('ojos') || normCrit.includes('embusen') || normCrit.includes('ritmo')) {
      aspectHeader = 'Aspecto Técnico - Kata (Chakugan y Embusen)';
      aspectKey = 'chakugan';
    } else if (normCrit.includes('distancia') || normCrit.includes('ma-ai') || normCrit.includes('maai') || normCrit.includes('guardia') || normCrit.includes('kamae') || normCrit.includes('zanshin')) {
      aspectHeader = 'Aspecto Técnico - Combate (Kumite)';
      aspectKey = 'maai';
    } else if (normCrit.includes('saludo') || normCrit.includes('etiqueta') || normCrit.includes('rei') || normCrit.includes('karategui') || normCrit.includes('disciplina')) {
      aspectHeader = 'Aspecto Técnico - Protocolo y Disciplina (DO)';
      aspectKey = 'disciplina';
    }

    // Comprobar si ya existe una viñeta previa (de un Sensei) que aborde este mismo tema
    let matchingBullet = null;
    for (const b of synthesizedBullets) {
      const bStems = extractSemanticStems(b.text);
      const sim = calculateStemSimilarity(aspStems, bStems);
      const sharesKey = (aspectKey && b.aspectKey === aspectKey) || aspStems.some(s => bStems.includes(s) && s.length >= 4);
      if (sim >= 0.35 || sharesKey) {
        matchingBullet = b;
        break;
      }
    }

    if (matchingBullet) {
      // FUSIÓN HÍBRIDA: Unificar la observación del Sensei con la directiva biomecánica del criterio evaluado
      if (!matchingBullet.text.includes(cleanCrit) && !matchingBullet.text.includes(tName)) {
        matchingBullet.text += ` Para alcanzar el 100% en ${tName}, debe corregir: ${cleanCrit}.`;
      }
      matchingBullet.sourceType = 'hybrid';
      matchingBullet.sourceIcon = '⭐👤';
      matchingBullet.sourceLabel = `Estrellas (${stars}/10) + Comentario de Sensei`;
      matchingBullet.aspectKey = aspectKey;
    } else {
      // Directiva 100% técnica individual
      let directiveText = '';
      if (stars <= 6) {
        directiveText = `${aspectHeader}: En ${tName} (${stars}/10), no cumple plenamente con "${cleanCrit}". Debe corregir la mecánica, trayectoria y fijar el punto focal con solidez.`;
      } else {
        directiveText = `${aspectHeader}: Para alcanzar el 100% en ${tName} (${stars}/10), debe corregir "${cleanCrit}" con mayor Kime y firmeza.`;
      }

      synthesizedBullets.push({
        text: directiveText,
        coincidenceCount: 1,
        isCoincidence: false,
        evaluators: ['Consenso de estrellas'],
        phase,
        sourceType: 'stars_only',
        sourceIcon: '⭐',
        sourceLabel: `Criterio Evaluado (${stars}/10)`,
        aspectKey
      });
    }
  });

  // Integrar técnicas generales con < 100% que no hayan sido cubiertas
  (techniqueScores || []).forEach(t => {
    const rawScore = typeof t.score === 'number' ? t.score : null;
    const tScore = rawScore !== null ? (rawScore <= 5 ? rawScore * 20 : (rawScore <= 10 ? rawScore * 10 : rawScore)) : null;

    if (tScore !== null && tScore < 100) {
      const tName = t.name || t.id;
      const tNorm = normalizeText(tName);

      // Verificar si ya fue cubierta por las notas de los Senseis
      const alreadyCovered = Array.from(coveredTopics).some(top => top.includes(tNorm) || tNorm.includes(top));
      if (!alreadyCovered) {
        let aspectHeader = 'Aspecto Técnico';
        let flawDirective = '';

        if (tNorm.includes('gedan barai') || tNorm.includes('age uke') || tNorm.includes('soto uke') || tNorm.includes('uchi uke') || tNorm.includes('shuto')) {
          aspectHeader = 'Aspecto Técnico - Defensas (Uke Waza)';
          if (tScore < 75) {
            flawDirective = `En ${tName} (${Math.round(tScore)}%): No cierra los codos ni rota el antebrazo al armar, debe cubrir el centro del pecho a un puño del cuerpo y no desviar la trayectoria de bloqueo.`;
          } else {
            flawDirective = `En ${tName} (${Math.round(tScore)}%): Para alcanzar el 100%, falta mayor rotación de antebrazo al final del bloqueo y evitar separar el codo del cuerpo al armar la defensa.`;
          }
        } else if (tNorm.includes('zuki') || tNorm.includes('tsuki') || tNorm.includes('gyaku')) {
          aspectHeader = 'Aspecto Técnico - Puño y Hikite (Tsuki Waza)';
          if (tScore < 75) {
            flawDirective = `En ${tName} (${Math.round(tScore)}%): No ancla el puño de Hikite y desvía la trayectoria, debe jalar con fuerza a la cintura sobre el cinturón y alinear la muñeca recta.`;
          } else {
            flawDirective = `En ${tName} (${Math.round(tScore)}%): Para alcanzar el 100%, falta aceleración en el tirón del Hikite y fijar el puño con mayor Kime sin elevar los hombros.`;
          }
        } else if (tNorm.includes('geri')) {
          aspectHeader = 'Aspecto Técnico - Patadas (Geri Waza)';
          if (tScore < 75) {
            flawDirective = `En ${tName} (${Math.round(tScore)}%): No eleva la rodilla ni recoge rápido el pie (Hikiashi), debe asentar la base y ejecutar snap controlado sin balancear el torso.`;
          } else {
            flawDirective = `En ${tName} (${Math.round(tScore)}%): Para alcanzar el 100%, falta mayor velocidad al recoger la pierna (Hikiashi) y mantener la rodilla de apoyo flexionada.`;
          }
        } else if (tNorm.includes('kata') || tNorm.includes('shodan') || tNorm.includes('heian') || tNorm.includes('bassai') || tNorm.includes('kanku') || tNorm.includes('jion') || tNorm.includes('empi')) {
          aspectHeader = 'Aspecto Técnico - Kata (Forma y Embusen)';
          const activeKataTitle = kataName || tName;
          if (tScore < 75) {
            flawDirective = `En Kata ${activeKataTitle} (${Math.round(tScore)}%): No fija las posturas bajas ni mantiene el ritmo continuo, debe repasar el embusen y sostener la vista al frente sin tocarse la vestimenta.`;
          } else {
            flawDirective = `En Kata ${activeKataTitle} (${Math.round(tScore)}%): Para alcanzar el 100%, falta sostener la mirada fija (Chakugan) al frente tras cada giro y no realizar el más mínimo micro-reajuste al karategui.`;
          }
        } else if (tNorm.includes('kumite') || tNorm.includes('gohon') || tNorm.includes('sanbon') || tNorm.includes('ippon')) {
          aspectHeader = 'Aspecto Técnico - Combate (Kumite)';
          if (tScore < 75) {
            flawDirective = `En Combate ${kumiteName} (${Math.round(tScore)}%): No mantiene la distancia (Ma-ai) ni sostiene la guardia, debe calcular el alcance y no desarmar el Kamae tras bloquear.`;
          } else {
            flawDirective = `En Combate ${kumiteName} (${Math.round(tScore)}%): Para alcanzar el 100%, falta mayor velocidad y rotación de cadera en el contraataque inmediato tras la defensa.`;
          }
        } else if (tNorm.includes('dachi') || tNorm.includes('zenkutsu') || tNorm.includes('kokutsu') || tNorm.includes('kiba')) {
          aspectHeader = 'Aspecto Técnico - Posturas (Dachi Waza)';
          if (tScore < 75) {
            flawDirective = `En ${tName} (${Math.round(tScore)}%): No estira la pierna posterior ni asienta el talón, debe fijar la postura baja antes de iniciar el impacto.`;
          } else {
            flawDirective = `En ${tName} (${Math.round(tScore)}%): Para alcanzar el 100%, falta descender medio puño más el centro de gravedad sin oscilar la altura durante el avance.`;
          }
        } else {
          aspectHeader = `Aspecto Técnico en ${tName}`;
          if (tScore < 75) {
            flawDirective = `En ${tName} (${Math.round(tScore)}%): No ejecuta correctamente la trayectoria ni el punto focal, debe coordinar la cadera y la postura al impacto.`;
          } else {
            flawDirective = `En ${tName} (${Math.round(tScore)}%): Para alcanzar el 100%, falta mayor precisión biomecánica en el punto focal y sincronización con la respiración.`;
          }
        }

        const fullLine = `${aspectHeader}: ${flawDirective}`;
        synthesizedBullets.push({
          text: fullLine,
          coincidenceCount: 1,
          isCoincidence: false,
          evaluators: ['Consenso de estrellas'],
          phase,
          sourceType: 'stars_only',
          sourceIcon: '⭐',
          sourceLabel: 'Métrica de Estrellas (Técnica < 100%)'
        });
      }
    }
  });

  // 5. Deduplicación secundaria inteligente entre viñetas generadas
  // Elimina duplicados directos si comparten más del 65% de similitud semántica en el mismo aspecto
  const uniqueBullets = [];
  synthesizedBullets.forEach(b => {
    const bStems = extractSemanticStems(b.text);
    const isDuplicate = uniqueBullets.some(u => {
      const uStems = extractSemanticStems(u.text);
      const sim = calculateStemSimilarity(bStems, uStems);
      return sim >= 0.65;
    });

    if (!isDuplicate) {
      uniqueBullets.push(b);
    }
  });

  // Catálogo oficial de aspectos técnicos por fase según estándares ISKF Shotokan
  const ASPECT_CATALOG = {
    kihon: [
      {
        key: 'dachi',
        label: 'Aspecto Técnico - Posturas (Dachi Waza)',
        keywords: ['dachi', 'postura', 'base', 'zenkutsu', 'kiba', 'kokutsu', 'talon', 'desplazamiento'],
        lowText: `Aspecto Técnico - Posturas (Dachi Waza): En ${primaryStance}, flexiona la pierna de atrás y despega el talón del suelo al avanzar. Debe corregir estirando completamente la pierna posterior y fijar la base sólida antes de iniciar el impacto.`,
        highText: `Aspecto Técnico - Posturas (Dachi Waza): Para alcanzar el 100%, en ${primaryStance} falta descender medio puño más el centro de gravedad sin oscilar la altura durante los avances en media luna y anclar firmemente el canto externo del pie de apoyo.`
      },
      {
        key: 'tsuki',
        label: 'Aspecto Técnico - Puño y Hikite (Tsuki Waza)',
        keywords: ['tsuki', 'zuki', 'golpe', 'puño', 'hikite', 'kime'],
        lowText: `Aspecto Técnico - Puño y Hikite (Tsuki Waza): Desvía la trayectoria recta en los golpes y deja el puño de Hikite flojo sin anclar. Debe corregir jalando el puño con fuerza a la cintura sobre el cinturón y alinear la muñeca totalmente recta.`,
        highText: `Aspecto Técnico - Puño y Hikite (Tsuki Waza): Para alcanzar el 100%, falta aceleración explosiva en el tirón del Hikite en el instante exacto del impacto final y fijar el Kime con máxima contracción sin elevar los hombros.`
      },
      {
        key: 'uke',
        label: 'Aspecto Técnico - Defensas (Uke Waza)',
        keywords: ['uke', 'defensa', 'bloqueo', 'codo', 'antebrazo', 'barai'],
        lowText: `Aspecto Técnico - Defensas (Uke Waza): Abre los codos al armar y no rota el antebrazo en las defensas. Debe corregir cubriendo el centro del pecho a un puño de distancia del cuerpo y rotar con potencia al final del bloqueo.`,
        highText: `Aspecto Técnico - Defensas (Uke Waza): Para alcanzar el 100%, falta mayor rotación de antebrazo en el instante final del bloqueo y mantener el codo a la distancia reglamentaria de un puño sin despegarlo del tronco al armar.`
      },
      {
        key: 'geri',
        label: 'Aspecto Técnico - Patadas (Geri Waza)',
        keywords: ['geri', 'patada', 'rodilla', 'snap', 'hikiashi'],
        lowText: `Aspecto Técnico - Patadas (Geri Waza): No eleva adecuadamente la rodilla antes de patear y deja caer la pierna sin recoger. Debe elevar la rodilla al pecho, golpear con la parte correcta del pie y recoger velozmente con Hikiashi antes de apoyar.`,
        highText: `Aspecto Técnico - Patadas (Geri Waza): Para alcanzar el 100%, falta mayor velocidad al recoger la pierna con Hikiashi tras el impacto y sostener la flexión y equilibrio de la rodilla de apoyo.`
      },
      {
        key: 'mental',
        label: 'Aspecto Técnico - Kiai y Respiración (Capacidades Mentales)',
        keywords: ['kiai', 'respiracion', 'grito', 'tanden', 'mental', 'aire'],
        lowText: `Aspecto Técnico - Kiai y Respiración (Capacidades Mentales): No realiza Kiai sonoro en las técnicas reglamentarias o contiene el aire. Debe proyectar la voz con potencia desde el bajo vientre (Tanden) y sincronizar la exhalación enérgica con el Kime.`,
        highText: `Aspecto Técnico - Kiai y Respiración (Capacidades Mentales): Para alcanzar el 100%, falta mayor explosividad sonora en el Kiai de remate y sincronizar la contracción abdominal instantánea al término de la exhalación.`
      }
    ],
    kata: [
      {
        key: 'chakugan',
        label: 'Aspecto Técnico - Kata (Chakugan y Mirada)',
        keywords: ['chakugan', 'mirada', 'ojos', 'vista', 'enfoque'],
        lowText: `Aspecto Técnico - Kata (Chakugan y Mirada): En ${kataName}, desvía los ojos del objetivo y no fija la mirada antes de girar. Debe corregir dirigiendo primero la vista en dirección al objetivo antes del desplazamiento y sostenerla fijamente en cada pausa.`,
        highText: `Aspecto Técnico - Kata (Chakugan y Enfoque): Para alcanzar el 100%, en ${kataName} falta fijar la mirada (Chakugan) al frente en cada pausa sin desviar los ojos en las transiciones.`
      },
      {
        key: 'embusen',
        label: 'Aspecto Técnico - Kata (Ritmo y Embusen)',
        keywords: ['embusen', 'ritmo', 'cadencia', 'secuencia', 'pausa', 'tiempo'],
        lowText: `Aspecto Técnico - Kata (Ritmo y Embusen): En ${kataName}, duda en la secuencia oficial y apresura las técnicas sin respetar los tiempos marciales. Debe repasar el diagrama (Embusen) y marcar con claridad las pausas reglamentarias.`,
        highText: `Aspecto Técnico - Kata (Ritmo y Embusen): Para alcanzar el 100%, en ${kataName} falta diferenciar con mayor precisión los cambios de velocidad: técnicas continuas rápidas versus pausas marcadas de dos segundos.`
      },
      {
        key: 'dachi',
        label: 'Aspecto Técnico - Kata (Posturas y Transiciones)',
        keywords: ['postura', 'dachi', 'giro', 'profundidad', 'transicion', 'centro'],
        lowText: `Aspecto Técnico - Kata (Posturas y Transiciones): En ${kataName}, pierde la estabilidad en los giros y sube la cadera en los desplazamientos. Debe descender el centro de gravedad, sostener la profundidad en giros y no oscilar la altura.`,
        highText: `Aspecto Técnico - Kata (Posturas y Transiciones): Para alcanzar el 100%, en ${kataName} falta mayor descenso milimétrico en las posturas bajas y mantener el eje vertical del tronco perfectamente alineado en los cambios de dirección.`
      },
      {
        key: 'kime',
        label: 'Aspecto Técnico - Kata (Kime, Kiai e Inmovilidad)',
        keywords: ['kime', 'kiai', 'inmovilidad', 'zanshin', 'karategui', 'vestimenta', 'descanso'],
        lowText: `Aspecto Técnico - Kata (Kime, Kiai e Inmovilidad): En ${kataName}, Kime débil en los movimientos finales y rompe la postura tras el saludo o realiza ajustes a la vestimenta. Debe clavar el Kime, proyectar un Kiai explosivo y mantener inmovilidad total en tatami.`,
        highText: `Aspecto Técnico - Kata (Kime, Kiai e Inmovilidad): Para alcanzar el 100%, en ${kataName} falta sostener la inmovilidad absoluta y estado de alerta (Zanshin) tras el Kiai final, sin realizar el más mínimo reajuste al karategui hasta la orden oficial de descanso.`
      }
    ],
    kumite: [
      {
        key: 'maai',
        label: 'Aspecto Técnico - Combate (Distancia y Ma-ai)',
        keywords: ['ma-ai', 'maai', 'distancia', 'alcance', 'espacio'],
        lowText: `Aspecto Técnico - Combate (Distancia y Ma-ai): En ${kumiteName}, pierde la distancia reglamentaria de seguridad retrocediendo antes de tiempo o quedando expuesto. Debe calcular con exactitud el alcance de los ataques y mantener el Ma-ai.`,
        highText: `Aspecto Técnico - Combate (Distancia y Ma-ai): Para alcanzar el 100%, en ${kumiteName} falta calibrar la distancia milimétrica en el contraataque final para quedar exactamente a la distancia de impacto efectivo con control.`
      },
      {
        key: 'kamae',
        label: 'Aspecto Técnico - Combate (Guardia y Kamae)',
        keywords: ['kamae', 'guardia', 'brazos', 'manos', 'desarmar'],
        lowText: `Aspecto Técnico - Combate (Guardia y Kamae): En ${kumiteName}, desarma o baja los brazos tras bloquear y deja desprotegido el centro del cuerpo. Debe sostener la guardia alta de Kamae firme en todo momento antes, durante y después del intercambio.`,
        highText: `Aspecto Técnico - Combate (Guardia y Kamae): Para alcanzar el 100%, en ${kumiteName} falta recuperar la guardia (Kamae) de manera instantánea tras el contraataque sin descuidar la protección del rostro y el plexo solar.`
      },
      {
        key: 'cadera',
        label: 'Aspecto Técnico - Combate (Velocidad y Rotación de Cadera)',
        keywords: ['cadera', 'velocidad', 'reaccion', 'contraataque', 'respuesta', 'rotacion'],
        lowText: `Aspecto Técnico - Combate (Velocidad y Rotación de Cadera): En ${kumiteName}, respuesta tardía tras la defensa y bloqueo sin impulso de cadera. Debe reaccionar con velocidad explosiva e imprimir rotación de cadera para que el contraataque tenga potencia real de impacto.`,
        highText: `Aspecto Técnico - Combate (Velocidad y Rotación de Cadera): Para alcanzar el 100%, en ${kumiteName} falta mayor velocidad explosiva y rotación instantánea de cadera en la respuesta de contraataque inmediatamente al término del bloqueo.`
      },
      {
        key: 'zanshin',
        label: 'Aspecto Técnico - Combate (Control y Zanshin)',
        keywords: ['control', 'zanshin', 'contacto', 'sun-dome', 'alerta', 'separacion'],
        lowText: `Aspecto Técnico - Combate (Control y Zanshin): En ${kumiteName}, falta de control en la distancia de impacto o relajación prematura de la atención. Debe aplicar control absoluto sin contacto excesivo (Sun-dome) y sostener la vista fija en el oponente.`,
        highText: `Aspecto Técnico - Combate (Control y Zanshin): Para alcanzar el 100%, en ${kumiteName} falta sostener la actitud alerta de Zanshin tras el contraataque, fijando la mirada en el adversario hasta la orden oficial de separación.`
      }
    ],
    aspectos: [
      {
        key: 'etiqueta',
        label: 'Aspecto Técnico - Etiqueta y Saludo (Reigi)',
        keywords: ['saludo', 'etiqueta', 'rei', 'reigi', 'respeto', 'inclinacion'],
        lowText: `Aspecto Técnico - Etiqueta y Saludo (Reigi): Saludo formal incompleto. Debe ejecutar la inclinación reglamentaria a 30 grados, vista respetuosa y máxima marcialidad en la entrada y salida de tatami.`,
        highText: `Aspecto Técnico - Etiqueta y Saludo (Reigi): Para alcanzar el 100%, formalizar el saludo con postura firme, inclinación marcial reglamentaria y etiqueta intachable en tatami.`
      },
      {
        key: 'disciplina',
        label: 'Aspecto Técnico - Disciplina y Uniforme (Karategui)',
        keywords: ['karategui', 'uniforme', 'cinturon', 'presencia', 'disciplina', 'acomoda'],
        lowText: `Aspecto Técnico - Disciplina y Uniforme (Karategui): Pérdida de disciplina marcial al acomodarse el uniforme o tocarse el rostro. Debe mantener disciplina corporal absoluta: cero movimientos innecesarios o ajustes al karategui durante el examen.`,
        highText: `Aspecto Técnico - Disciplina y Uniforme (Karategui): Para alcanzar el 100%, mantener compostura y disciplina corporal absoluta sin tocar la vestimenta hasta la orden oficial de descanso.`
      }
    ]
  };

  // Helper para clasificar semánticamente a qué aspecto técnico pertenece una viñeta
  function detectAspectKey(text = '', targetPhase = 'kihon') {
    const norm = (text || '').toLowerCase();
    if (targetPhase === 'kihon') {
      // 1. Prioridad por encabezado formal o término técnico marcial principal
      if (norm.includes('uke waza') || norm.includes('defensa') || norm.includes('bloqueo')) return 'uke';
      if (norm.includes('geri waza') || norm.includes('patada') || norm.includes('hikiashi') || norm.includes('snap')) return 'geri';
      if (norm.includes('tsuki waza') || norm.includes('puño y hikite') || norm.includes('tsuki') || norm.includes('zuki') || norm.includes('hikite')) return 'tsuki';
      if (norm.includes('dachi waza') || norm.includes('posturas') || norm.includes('zenkutsu') || norm.includes('kokutsu') || norm.includes('kiba') || norm.includes('talon')) return 'dachi';
      if (norm.includes('kiai') || norm.includes('respiracion') || norm.includes('grito') || norm.includes('tanden') || norm.includes('mental')) return 'mental';
      if (norm.includes('puño') || norm.includes('golpe')) return 'tsuki';
      if (norm.includes('postura') || norm.includes('base')) return 'dachi';
      return null;
    }
    if (targetPhase === 'kata') {
      if (norm.includes('chakugan') || norm.includes('mirada') || norm.includes('ojos')) return 'chakugan';
      if (norm.includes('embusen') || norm.includes('ritmo') || norm.includes('cadencia') || norm.includes('secuencia')) return 'embusen';
      if (norm.includes('dachi waza') || norm.includes('posturas y transiciones') || norm.includes('postura') || norm.includes('giro') || norm.includes('profundidad')) return 'dachi';
      if (norm.includes('kime') || norm.includes('kiai') || norm.includes('inmovilidad') || norm.includes('karategui') || norm.includes('vestimenta') || norm.includes('zanshin')) return 'kime';
      return null;
    }
    if (targetPhase === 'kumite') {
      if (norm.includes('ma-ai') || norm.includes('maai') || norm.includes('distancia') || norm.includes('alcance')) return 'maai';
      if (norm.includes('kamae') || norm.includes('guardia') || norm.includes('brazos')) return 'kamae';
      if (norm.includes('cadera') || norm.includes('velocidad') || norm.includes('reaccion') || norm.includes('contraataque')) return 'cadera';
      if (norm.includes('zanshin') || norm.includes('control') || norm.includes('sun-dome') || norm.includes('contacto')) return 'zanshin';
      return null;
    }
    if (targetPhase === 'aspectos') {
      if (norm.includes('saludo') || norm.includes('etiqueta') || norm.includes('rei')) return 'etiqueta';
      if (norm.includes('karategui') || norm.includes('uniforme') || norm.includes('disciplina')) return 'disciplina';
      return null;
    }
    return null;
  }

  const phaseCatalog = ASPECT_CATALOG[phase] || [];

  // Asignar aspectKey a las viñetas existentes derivadas de notas de evaluadores o estrellas
  uniqueBullets.forEach(b => {
    if (!b.aspectKey) {
      b.aspectKey = detectAspectKey(b.text, phase);
    }
  });

  // 6. Asegurar cobertura COMPLETA de cada aspecto técnico oficial de la fase
  // Si un aspecto técnico no fue cubierto por notas de evaluadores o técnicas flags,
  // se incorpora la indicación oficial correspondiente al nivel obtenido (>= 75% detalle fino para 100%, < 75% corrección de base)
  phaseCatalog.forEach(aspectDef => {
    const isAlreadyCovered = uniqueBullets.some(b => b.aspectKey === aspectDef.key);

    if (!isAlreadyCovered) {
      const text = phaseAverage < 75 ? aspectDef.lowText : aspectDef.highText;
      uniqueBullets.push({
        text,
        aspectKey: aspectDef.key,
        coincidenceCount: 0,
        isCoincidence: false,
        evaluators: [],
        phase,
        sourceType: 'stars_only',
        sourceIcon: '⭐',
        sourceLabel: 'Rúbrica Oficial ISKF'
      });
    }
  });

  // Ordenar priorizando las indicaciones que tuvieron mayor consenso de evaluadores
  return uniqueBullets.sort((a, b) => b.coincidenceCount - a.coincidenceCount);
}
