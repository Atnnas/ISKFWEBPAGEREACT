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
const MARTIAL_TOPICS = [
  {
    key: 'kiai_determination',
    phase: 'all',
    keywords: ['kiai', 'grito', 'gritar', 'kiai fuerte', 'kiai potente', 'no hace kiai', 'evita hacer kiai', 'sin kiai', 'falta kiai', 'kiai timido', 'kiai debil', 'punto focal'],
    unifiedSynthesis: 'Emitir un Kiai sonoro, potente y enérgico desde el abdomen en cada punto focal reglamentario.'
  },
  {
    key: 'snap_foot_kick',
    phase: 'kihon',
    keywords: ['snap', 'hikiashi', 'recoger rapido', 'recoger el pie', 'snap con la punta', 'snap con el pie', 'recogida'],
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
    unifiedSynthesis: 'Evitar abrir la punta del pie o realizar movimientos previos antes de iniciar el avance; desplazar en trayectoria limpia.'
  },
  {
    key: 'hair_distraction',
    phase: 'all',
    keywords: ['cabello', 'pelo', 'acomoda', 'acomodandose', 'peinar', 'distrae', 'distraerse', 'tocarse la cabeza', 'solapa', 'karategui', 'uniforme', 'vestimenta', 'ropa'],
    unifiedSynthesis: 'Mantener enfoque total y disciplina corporal, evitando tocarse o acomodarse el cabello o uniforme durante la ejecución técnica.'
  },
  {
    key: 'elbow_block_gedan',
    phase: 'kihon',
    keywords: ['codo', 'codos', 'gedan barai', 'cubrir el pecho', 'cubrirse el pecho', 'pecho', 'cargar', 'armar'],
    unifiedSynthesis: 'Cerrar los codos al armar el bloqueo Gedan Barai para cubrir adecuadamente el centro del pecho antes de bloquear.'
  },
  {
    key: 'eyes_chakugan',
    phase: 'kata',
    keywords: ['mirada', 'vista', 'ojos', 'chakugan', 'adonde debe ir', 'donde debe ir', 'al frente', 'desviar la vista', 'no dirige la mirada'],
    unifiedSynthesis: 'Dirigir la mirada fija hacia la dirección del ataque antes y durante cada técnica del kata; sostener la vista al frente en las pausas.'
  },
  {
    key: 'breathing_control',
    phase: 'kumite',
    keywords: ['respiracion', 'respirar', 'inadecuada', 'aire', 'contener', 'exhalar', 'inhalar', 'diafragma'],
    unifiedSynthesis: 'Coordinar la respiración con la exhalación en los bloqueos y ataques; evitar contener el aire o respirar a destiempo.'
  },
  {
    key: 'stance_zenkutsu_heel',
    phase: 'kihon',
    keywords: ['talon', 'talon despegado', 'pie posterior', 'pierna trasera', 'pierna de atras', 'zenkutsu', 'dachi', 'bajar cadera', 'estirar rodilla'],
    unifiedSynthesis: 'Estirar por completo la pierna trasera apoyando todo el talón en el suelo al avanzar y descender adecuadamente el centro de gravedad.'
  },
  {
    key: 'hikite_placement',
    phase: 'kihon',
    keywords: ['hikite', 'cintura', 'cadera', 'mano a la cintura', 'puño pegado', 'mano suelta', 'mano descolgada'],
    unifiedSynthesis: 'Jalar con fuerza y rapidez la mano que no golpea hasta pegarla firmemente a la cintura sobre el cinturón.'
  },
  {
    key: 'distance_maai',
    phase: 'kumite',
    keywords: ['distancia', 'ma-ai', 'maai', 'separacion', 'muy cerca', 'muy lejos', 'tercer paso', 'alcance'],
    unifiedSynthesis: 'Calcular con precisión la distancia de seguridad (Ma-ai) para bloquear y contraatacar sin quedar excesivamente cerca.'
  },
  {
    key: 'guard_kamae',
    phase: 'kumite',
    keywords: ['guardia', 'kamae', 'bajar la mano', 'bajar los brazos', 'desarmar', 'manos abajo'],
    unifiedSynthesis: 'No desarmar ni bajar las manos de guardia tras bloquear; mantener la postura de combate hasta concluir el intercambio.'
  },
  {
    key: 'kata_rhythm_flow',
    phase: 'kata',
    keywords: ['ritmo', 'pausa', 'fluidez', 'dudo', 'duda', 'detenerse', 'embusen', 'giro'],
    unifiedSynthesis: 'Mantener continuidad en las secuencias del kata sin dudas ni pausas excesivas en los giros.'
  },
  {
    key: 'posture_upright_back',
    phase: 'all',
    keywords: ['espalda', 'tronco', 'inclinada', 'inclinar', 'balanceo', 'cuerpo erguido', 'postura erguida'],
    unifiedSynthesis: 'Mantener el tronco firme y erguido sin inclinar la espalda hacia adelante ni balancear el cuerpo.'
  },
  {
    key: 'shoulder_tension',
    phase: 'all',
    keywords: ['hombro', 'hombros', 'tension', 'tenso', 'relajar', 'relajado', 'subir hombros'],
    unifiedSynthesis: 'Relajar los hombros hacia abajo y evitar acumular tensión en el cuello al golpear o bloquear.'
  }
];

/**
 * Transforma una observación cruda en una indicación afirmativa y marcial directa.
 */
function toMartialDirectCorrection(rawText = '') {
  let clean = rawText
    .replace(/^ajuste t[eé]cnico:?\s*/i, '')
    .replace(/^correcci[oó]n:?\s*/i, '')
    .replace(/^observaci[oó]n:?\s*/i, '')
    .replace(/^falla:?\s*/i, '')
    .trim();

  // Convertir frases negativas comunes en instrucciones afirmativas y ejecutivas
  if (/^(no hace|evita hacer|falta|sin|no realiza)\s+kiai/i.test(clean)) {
    return 'Emitir un Kiai sonoro, potente y enérgico desde el abdomen en cada punto focal.';
  }
  if (/^no\s+cierra\s+los\s+codos/i.test(clean)) {
    return 'Cerrar los codos al armar el bloqueo para cubrir adecuadamente el centro del pecho.';
  }
  if (/^no\s+(hace\s+snap|recoge)/i.test(clean)) {
    return 'Ejecutar snap definido y recogida rápida con la punta del pie en el impacto.';
  }
  if (/^no\s+dirige\s+la\s+mirada/i.test(clean)) {
    return 'Dirigir la mirada fija hacia la dirección del ataque antes y durante cada técnica.';
  }
  if (/^(respiraci[oó]n\s+inadecuada|no\s+respira)/i.test(clean)) {
    return 'Coordinar la respiración con la exhalación en los bloqueos y ataques sin contener el aire.';
  }

  // Asegurar mayúscula inicial y punto final limpio
  clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  if (!clean.endsWith('.')) clean += '.';
  return clean;
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
  targetRank = '9° Kyu (Cinta Amarilla)'
}) {
  const kataName = getKataForRank(targetRank);
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

  // 3. Generar la redacción final limpia de cada cluster sin prefijos artificiales
  clusters.forEach(cluster => {
    if (cluster.topicKey) coveredTopics.add(cluster.topicKey);
    const evalList = Array.from(cluster.evaluators);
    const coincidenceCount = evalList.length;

    let lineText = '';
    if (cluster.matchedTopic && cluster.matchedTopic.unifiedSynthesis) {
      lineText = cluster.matchedTopic.unifiedSynthesis;
    } else {
      // Tomar la versión más clara y convertirla en indicación marcial directa
      const bestRaw = cluster.rawTexts.reduce((prev, curr) => curr.length > prev.length ? curr : prev, cluster.rawTexts[0]);
      lineText = toMartialDirectCorrection(bestRaw);
    }

    // Limpieza final de seguridad: NUNCA permitir prefijos genéricos
    lineText = lineText
      .replace(/^ajuste t[eé]cnico:?\s*/i, '')
      .replace(/^correcci[oó]n:?\s*/i, '')
      .trim();

    // Adaptar si la nota es de excelencia (100%)
    if (phaseAverage >= 88 && !lineText.toLowerCase().includes('100%')) {
      lineText = `Para alcanzar 100%: ${lineText.charAt(0).toLowerCase() + lineText.slice(1)}`;
    }

    synthesizedBullets.push({
      text: lineText,
      coincidenceCount,
      isCoincidence: coincidenceCount > 1,
      evaluators: evalList,
      phase
    });
  });

  // 4. Integrar con falencias derivadas de calificaciones bajas por estrellas (< 75% o 1-2★)
  (techniqueScores || []).forEach(t => {
    const tScore = typeof t.score === 'number' ? (t.score <= 10 ? t.score * 10 : t.score) : null;
    if (tScore !== null && tScore < 75) {
      const tName = t.name || t.id;
      const tNorm = normalizeText(tName);

      const alreadyCovered = Array.from(coveredTopics).some(top => top.includes(tNorm) || tNorm.includes(top));
      if (!alreadyCovered) {
        let techBullet = '';
        if (tNorm.includes('gedan barai') || tNorm.includes('age uke') || tNorm.includes('soto uke') || tNorm.includes('shuto')) {
          techBullet = `En ${tName} (${Math.round(tScore)}%): Asegurar la trayectoria a un puño del cuerpo y la rotación sincronizada de la cadera al impacto.`;
        } else if (tNorm.includes('zuki') || tNorm.includes('tsuki')) {
          techBullet = `En ${tName} (${Math.round(tScore)}%): Alinear la muñeca recta y asegurar el jalón del Hikite opuesto sobre la cintura.`;
        } else if (tNorm.includes('geri')) {
          techBullet = `En ${tName} (${Math.round(tScore)}%): Elevar la rodilla al pecho antes de patear y recoger rápido el talón (Hikiashi).`;
        } else if (tNorm.includes('kata') || tNorm.includes('shodan') || tNorm.includes('heian')) {
          techBullet = `En Kata ${kataName} (${Math.round(tScore)}%): Repasar la orientación del embusen y fijar las posturas bajas en cada parada.`;
        } else if (tNorm.includes('kumite') || tNorm.includes('gohon')) {
          techBullet = `En Combate ${kumiteName} (${Math.round(tScore)}%): Medir la distancia de seguridad (Ma-ai) y no bajar los brazos tras bloquear.`;
        }

        if (techBullet) {
          synthesizedBullets.push({
            text: techBullet,
            coincidenceCount: 1,
            isCoincidence: false,
            evaluators: ['Consenso de estrellas'],
            phase
          });
        }
      }
    }
  });

  // 5. Deduplicación secundaria estricta entre viñetas generadas
  // Elimina cualquier indicación residual que comparta más de 50% de palabras clave
  const uniqueBullets = [];
  synthesizedBullets.forEach(b => {
    const bStems = extractSemanticStems(b.text);
    const isDuplicate = uniqueBullets.some(u => {
      const uStems = extractSemanticStems(u.text);
      const sim = calculateStemSimilarity(bStems, uStems);
      const sharesPrimaryNouns = bStems.filter(s => uStems.includes(s) && (s === 'kiai' || s === 'cabell' || s === 'talon' || s === 'guardi' || s === 'hikite' || s === 'distanc')).length > 0;
      return sim >= 0.45 || sharesPrimaryNouns;
    });

    if (!isDuplicate) {
      uniqueBullets.push(b);
    }
  });

  // 6. Si no hubo ninguna nota ni técnica baja, proporcionar la recomendación Shotokan oficial según el promedio
  if (uniqueBullets.length === 0) {
    if (phase === 'kihon') {
      if (phaseAverage >= 85) {
        uniqueBullets.push({
          text: `Para alcanzar 100%: En ${primaryStance}, descender medio puño más el centro de gravedad y máxima aceleración en el tirón del Hikite.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: []
        });
      } else {
        uniqueBullets.push({
          text: `En ${primaryStance}, estirar bien la pierna de atrás sin despegar el talón del suelo y fijar el puño de Hikite en la cintura.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: []
        });
      }
    } else if (phase === 'kata') {
      if (phaseAverage >= 85) {
        uniqueBullets.push({
          text: `Para alcanzar 100% en ${kataName}: Mantener inmovilidad y concentración absoluta tras el kiai final sin acomodarse la vestimenta.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: []
        });
      } else {
        uniqueBullets.push({
          text: `Durante ${kataName}, mantener la mirada fija hacia adelante después de cada giro y evitar tocarse o acomodarse el karategui.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: []
        });
      }
    } else if (phase === 'kumite') {
      if (phaseAverage >= 85) {
        uniqueBullets.push({
          text: `Para alcanzar 100% en ${kumiteName}: Mayor velocidad explosiva y rotación de cadera en la respuesta de contraataque inmediatamente tras el bloqueo.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: []
        });
      } else {
        uniqueBullets.push({
          text: `En ${kumiteName}, mantener la distancia reglamentaria (Ma-ai) y no bajar la guardia (Kamae) tras bloquear.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: []
        });
      }
    } else {
      uniqueBullets.push({
        text: 'Saludar con energía, respeto y buena postura al entrar y salir del tatami.',
        coincidenceCount: 0,
        isCoincidence: false,
        evaluators: []
      });
    }
  }

  // Ordenar priorizando las indicaciones que tuvieron mayor consenso de evaluadores
  return uniqueBullets.sort((a, b) => b.coincidenceCount - a.coincidenceCount);
}
