/**
 * Motor de Inteligencia y Síntesis Marcial Colegiada ISKF Costa Rica
 * 
 * Compara y sintetiza semánticamente los comentarios personales de los diferentes Senseis
 * evaluadores por cada rubro (Kihon, Kata, Kumite y Aspectos), detecta coincidencias
 * temáticas y biomecánicas entre varios Senseis, y unifica las observaciones junto con
 * las falencias/detalles derivados de la calificación de estrellas por técnica.
 */

import { getKataForRank, getKumiteForRank, getPrimaryStance } from './shotokanCriteriaFeedback.js';

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

// Extraer oraciones / viñetas atómicas de las notas de un evaluador
export function extractAtomicObservations(rawText = '') {
  if (!rawText || typeof rawText !== 'string') return [];
  
  // Dividir por saltos de línea, viñetas (•, -, *), o puntos seguidos de espacio/mayúscula
  const rawParts = rawText
    .split(/\r?\n|[•*]|(?<=[.!?])\s+/)
    .map(p => p.replace(/^[•*\-\s]+/, '').trim())
    .filter(p => p.length > 5);

  return rawParts;
}

// Diccionario taxonómico de temas biomecánicos del Karate Shotokan
const MARTIAL_TOPICS = [
  {
    key: 'snap_foot_kick',
    phase: 'kihon',
    keywords: ['snap', 'hikiashi', 'recoger rapido', 'recoger el pie', 'snap con la punta', 'snap con el pie'],
    title: 'Impacto y snap en el pie',
    unifiedSynthesis: 'Realizar snap definido y rápida recogida con la punta del pie al patear o golpear sin dejar la técnica lenta o descolgada.'
  },
  {
    key: 'foot_opening_anticipation',
    phase: 'kihon',
    keywords: [
      'abrir la punta', 'abrir el pie', 'abrir punta', 'movimiento previo', 
      'antes de salir', 'antes de abrir', 'pie antes de salir', 'punta del pie antes',
      'anticipar paso', 'paso en falso', 'gira el pie antes', 'desviar el pie'
    ],
    title: 'Desplazamiento y posición de los pies',
    unifiedSynthesis: 'Evitar abrir la punta del pie o realizar movimientos previos antes de iniciar el avance; desplazar en trayectoria limpia.'
  },
  {
    key: 'hair_distraction',
    phase: 'all',
    keywords: ['cabello', 'pelo', 'acomoda', 'acomodandose', 'peinar', 'distrae', 'distraerse', 'tocarse la cabeza', 'solapa', 'karategui', 'uniforme', 'vestimenta', 'ropa'],
    title: 'Concentración y disciplina marcial',
    unifiedSynthesis: 'Mantener enfoque total y evitar tocarse o acomodarse el cabello o uniforme durante la ejecución técnica; sostener inmovilidad y postura.'
  },
  {
    key: 'elbow_block_gedan',
    phase: 'kihon',
    keywords: ['codo', 'codos', 'gedan barai', 'cubrir el pecho', 'cubrirse el pecho', 'pecho', 'cargar', 'armar'],
    title: 'Bloqueo Gedan Barai',
    unifiedSynthesis: 'Cerrar los codos al armar la defensa para cubrir adecuadamente el centro del pecho antes de bloquear.'
  },
  {
    key: 'eyes_chakugan',
    phase: 'kata',
    keywords: ['mirada', 'vista', 'ojos', 'chakugan', 'adonde debe ir', 'donde debe ir', 'al frente', 'desviar la vista', 'no dirige la mirada'],
    title: 'Dirección de la mirada (Chakugan)',
    unifiedSynthesis: 'Dirigir la mirada fija hacia la dirección del ataque antes y durante cada técnica del kata; sostener la vista al frente en las pausas.'
  },
  {
    key: 'breathing_control',
    phase: 'kumite',
    keywords: ['respiracion', 'respirar', 'inadecuada', 'aire', 'contener', 'exhalar', 'inhalar', 'diafragma'],
    title: 'Control respiratorio',
    unifiedSynthesis: 'Coordinar la respiración con la exhalación en los bloqueos y ataques; evitar contener el aire o respirar a destiempo.'
  },
  {
    key: 'stance_zenkutsu_heel',
    phase: 'kihon',
    keywords: ['talon', 'talon despegado', 'pie posterior', 'pierna trasera', 'pierna de atras', 'zenkutsu', 'dachi', 'bajar cadera', 'estirar rodilla'],
    title: 'Posición adelantada (Zenkutsu Dachi)',
    unifiedSynthesis: 'Estirar por completo la pierna trasera apoyando todo el talón en el suelo al avanzar y descender adecuadamente el centro de gravedad.'
  },
  {
    key: 'hikite_placement',
    phase: 'kihon',
    keywords: ['hikite', 'cintura', 'cadera', 'mano a la cintura', 'puño pegado', 'mano suelta', 'mano descolgada'],
    title: 'Mano a la cintura (Hikite)',
    unifiedSynthesis: 'Jalar con fuerza y rapidez la mano que no golpea hasta pegarla firmemente a la cintura sobre el cinturón.'
  },
  {
    key: 'distance_maai',
    phase: 'kumite',
    keywords: ['distancia', 'ma-ai', 'maai', 'separacion', 'muy cerca', 'muy lejos', 'tercer paso', 'alcance'],
    title: 'Distancia de combate (Ma-ai)',
    unifiedSynthesis: 'Calcular con precisión la distancia de seguridad (Ma-ai) para bloquear y contraatacar sin quedar excesivamente cerca.'
  },
  {
    key: 'guard_kamae',
    phase: 'kumite',
    keywords: ['guardia', 'kamae', 'bajar la mano', 'bajar los brazos', 'desarmar', 'manos abajo'],
    title: 'Guardia defensiva (Kamae)',
    unifiedSynthesis: 'No desarmar ni bajar las manos de guardia tras bloquear; mantener la postura de combate hasta concluir el intercambio.'
  },
  {
    key: 'kata_rhythm_flow',
    phase: 'kata',
    keywords: ['ritmo', 'pausa', 'fluidez', 'dudo', 'duda', 'detenerse', 'embusen', 'giro'],
    title: 'Fluidez y ritmo del Kata',
    unifiedSynthesis: 'Mantener continuidad en las secuencias del kata sin dudas ni pausas excesivas en los giros.'
  }
];

/**
 * Clasifica una observación en uno de los temas conocidos o extrae su núcleo técnico
 */
function classifyObservation(obsText, phase) {
  const norm = normalizeText(obsText);
  
  for (const topic of MARTIAL_TOPICS) {
    if (topic.phase !== 'all' && topic.phase !== phase) continue;
    
    // Verificar si contiene alguna de las palabras clave principales
    const matchesKeyword = topic.keywords.some(kw => {
      const normKw = normalizeText(kw);
      return norm.includes(normKw);
    });

    if (matchesKeyword) {
      return { topicKey: topic.key, topicInfo: topic, confidence: 1 };
    }
  }

  // Si no coincide con un tema predefinido, crear un tema ad-hoc basado en tokens significativos
  const stopWords = new Set(['de', 'la', 'el', 'los', 'las', 'un', 'una', 'en', 'para', 'por', 'con', 'sin', 'que', 'se', 'no', 'muy', 'mas', 'al', 'del', 'su', 'sus', 'hace', 'debe', 'evitar']);
  const tokens = norm.split(' ').filter(t => t.length > 3 && !stopWords.has(t));
  const adHocKey = tokens.slice(0, 3).sort().join('_') || 'observacion_general';

  return {
    topicKey: adHocKey,
    topicInfo: {
      key: adHocKey,
      phase,
      title: 'Ajuste técnico',
      unifiedSynthesis: obsText.charAt(0).toUpperCase() + obsText.slice(1)
    },
    confidence: 0.5
  };
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
 * @returns {Array<Object>} Lista de viñetas sintetizadas con indicador de coincidencias
 */
export function synthesizePhaseBulletsWithAI({
  phase = 'kihon',
  notesList = [],
  techniqueScores = [],
  phaseAverage = 75,
  targetRank = '9° Kyu (Cinta Amarilla)'
}) {
  const kataName = getKataForRank(targetRank);
  const kumiteName = getKumiteForRank(targetRank);
  const primaryStance = getPrimaryStance(targetRank);

  // 1. Extraer todas las observaciones atómicas con su evaluador correspondiente
  const allAtomicObs = [];
  (notesList || []).forEach(nItem => {
    const evalName = nItem.evaluatorName || nItem.evaluator?.name || 'Sensei';
    const rawNote = typeof nItem === 'string' ? nItem : (nItem.note || '');
    const sentences = extractAtomicObservations(rawNote);

    sentences.forEach(sentence => {
      allAtomicObs.push({
        evaluatorName: evalName,
        text: sentence,
        classification: classifyObservation(sentence, phase)
      });
    });
  });

  // 2. Agrupar observaciones por similitud semántica (topicKey)
  const clustersByTopic = {};
  allAtomicObs.forEach(item => {
    const k = item.classification.topicKey;
    if (!clustersByTopic[k]) {
      clustersByTopic[k] = {
        topicInfo: item.classification.topicInfo,
        evaluators: new Set(),
        rawTexts: []
      };
    }
    clustersByTopic[k].evaluators.add(item.evaluatorName);
    clustersByTopic[k].rawTexts.push(item.text);
  });

  const synthesizedBullets = [];
  const coveredTopics = new Set();

  // 3. Generar viñetas sintetizadas
  Object.entries(clustersByTopic).forEach(([topicKey, cluster]) => {
    coveredTopics.add(topicKey);
    const evalList = Array.from(cluster.evaluators);
    const coincidenceCount = evalList.length;
    const isCoincidence = coincidenceCount > 1;

    let lineText = '';
    if (cluster.topicInfo && cluster.topicInfo.unifiedSynthesis) {
      const prefix = cluster.topicInfo.title ? `${cluster.topicInfo.title}: ` : '';
      lineText = `${prefix}${cluster.topicInfo.unifiedSynthesis}`;
    } else {
      // Usar el texto más completo
      const bestText = cluster.rawTexts.reduce((prev, curr) => curr.length > prev.length ? curr : prev, cluster.rawTexts[0]);
      lineText = bestText.charAt(0).toUpperCase() + bestText.slice(1);
    }

    // Adaptar severidad según el promedio de la fase
    if (phaseAverage >= 88 && !lineText.toLowerCase().includes('para ganar 100%')) {
      lineText = `Detalle para perfección (100%): ${lineText.replace(/^[^:]+:\s*/, '')}`;
    }

    synthesizedBullets.push({
      text: lineText,
      coincidenceCount,
      isCoincidence,
      evaluators: evalList,
      topicKey,
      phase
    });
  });

  // 4. Integrar con falencias derivadas de calificaciones bajas por estrellas (< 75% o 1-2★)
  (techniqueScores || []).forEach(t => {
    const tScore = typeof t.score === 'number' ? (t.score <= 10 ? t.score * 10 : t.score) : null;
    if (tScore !== null && tScore < 75) {
      const tName = t.name || t.id;
      const tNorm = normalizeText(tName);

      // Verificar si ya fue cubierto por los comentarios de los Senseis
      const alreadyCovered = Array.from(coveredTopics).some(top => top.includes(tNorm) || tNorm.includes(top));
      if (!alreadyCovered) {
        let techBullet = '';
        if (tNorm.includes('gedan barai') || tNorm.includes('age uke') || tNorm.includes('soto uke') || tNorm.includes('shuto')) {
          techBullet = `Bloqueo ${tName} (${Math.round(tScore)}%): Asegurar la trayectoria a un puño del cuerpo y la rotación sincronizada de la cadera al impacto.`;
        } else if (tNorm.includes('zuki') || tNorm.includes('tsuki')) {
          techBullet = `Golpe ${tName} (${Math.round(tScore)}%): Alinear la muñeca recta y asegurar el jalón del Hikite opuesto sobre la cintura.`;
        } else if (tNorm.includes('geri')) {
          techBullet = `Patada ${tName} (${Math.round(tScore)}%): Elevar la rodilla al pecho antes de patear y recoger rápido el talón (Hikiashi).`;
        } else if (tNorm.includes('kata') || tNorm.includes('shodan') || tNorm.includes('heian')) {
          techBullet = `Kata ${kataName} (${Math.round(tScore)}%): Repasar la orientación del embusen y fijar las posturas bajas en cada parada.`;
        } else if (tNorm.includes('kumite') || tNorm.includes('gohon')) {
          techBullet = `Combate ${kumiteName} (${Math.round(tScore)}%): Medir la distancia de seguridad (Ma-ai) y no bajar los brazos tras bloquear.`;
        }

        if (techBullet) {
          synthesizedBullets.push({
            text: techBullet,
            coincidenceCount: 1,
            isCoincidence: false,
            evaluators: ['Consenso de estrellas'],
            topicKey: `star_${tNorm}`,
            phase
          });
        }
      }
    }
  });

  // 5. Si no hubo ninguna nota ni técnica baja, proporcionar la recomendación Shotokan oficial según el promedio
  if (synthesizedBullets.length === 0) {
    if (phase === 'kihon') {
      if (phaseAverage >= 85) {
        synthesizedBullets.push({
          text: `Para alcanzar 100%: En ${primaryStance}, descender medio puño más el centro de gravedad y máxima aceleración en el tirón del Hikite.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: []
        });
      } else {
        synthesizedBullets.push({
          text: `Posición básica (${primaryStance}): Estirar bien la pierna de atrás sin despegar el talón del suelo y fijar el puño de Hikite en la cintura.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: []
        });
      }
    } else if (phase === 'kata') {
      if (phaseAverage >= 85) {
        synthesizedBullets.push({
          text: `Para alcanzar 100% en ${kataName}: Mantener inmovilidad y concentración absoluta tras el kiai final sin acomodarse la vestimenta.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: []
        });
      } else {
        synthesizedBullets.push({
          text: `Forma (${kataName}): Mantener la mirada fija hacia adelante después de cada giro y evitar tocarse o acomodarse el karategui.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: []
        });
      }
    } else if (phase === 'kumite') {
      if (phaseAverage >= 85) {
        synthesizedBullets.push({
          text: `Para alcanzar 100% en ${kumiteName}: Mayor velocidad explosiva y rotación de cadera en la respuesta de contraataque inmediatamente tras el bloqueo.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: []
        });
      } else {
        synthesizedBullets.push({
          text: `Combate (${kumiteName}): Mantener la distancia reglamentaria (Ma-ai) y no bajar la guardia (Kamae) tras bloquear.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: []
        });
      }
    } else {
      synthesizedBullets.push({
        text: 'Saludo y respeto: Saludar con energía, respeto y buena postura al entrar y salir del tatami.',
        coincidenceCount: 0,
        isCoincidence: false,
        evaluators: []
      });
    }
  }

  // Ordenar poniendo primero las coincidencias de múltiples evaluadores
  return synthesizedBullets.sort((a, b) => b.coincidenceCount - a.coincidenceCount);
}
