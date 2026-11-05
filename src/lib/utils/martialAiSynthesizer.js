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
  specificKataName = ''
}) {
  const resolvedKataFromTech = (phase === 'kata' && techniqueScores.length === 1 && techniqueScores[0]?.name)
    ? techniqueScores[0].name
    : '';
  const kataName = specificKataName || resolvedKataFromTech || getKataForRank(targetRank);
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

  // 4. Integrar con falencias e indicaciones correctivas derivadas de calificaciones por estrellas (técnicas < 100%)
  // Filosofía Marcial ISKF: Siempre correctivo explicando qué está haciendo mal para no alcanzar el 100
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
          const activeKataTitle = tName || kataName;
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

  // 6. Si no hubo notas manuales ni técnicas específicas flagged, proporcionar la indicación correctiva Shotokan oficial para alcanzar el 100%
  if (uniqueBullets.length === 0) {
    if (phase === 'kihon') {
      if (phaseAverage < 75) {
        uniqueBullets.push({
          text: `Aspecto Técnico - Posturas (Dachi Waza): En ${primaryStance}, flexiona la pierna de atrás y despega el talón del suelo al avanzar. Debe corregir estirando completamente la pierna posterior y anclar el Hikite firme sobre el cinturón para no anular el Kime.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: [],
          phase,
          sourceType: 'stars_only',
          sourceIcon: '⭐',
          sourceLabel: 'Rúbrica Oficial ISKF'
        });
      } else {
        uniqueBullets.push({
          text: `Aspecto Técnico - Posturas y Kime (Dachi Waza): Para alcanzar el 100%, en ${primaryStance} falta descender medio puño más el centro de gravedad sin oscilar la cadera, y sincronizar el tirón máximo del Hikite en el instante exacto del impacto.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: [],
          phase,
          sourceType: 'stars_only',
          sourceIcon: '⭐',
          sourceLabel: 'Rúbrica Oficial ISKF'
        });
      }
    } else if (phase === 'kata') {
      if (phaseAverage < 75) {
        uniqueBullets.push({
          text: `Aspecto Técnico - Kata (Forma y Embusen): Duda en las secuencias del kata ${kataName} y pierde la dirección de la mirada al girar. Debe corregir repasando el embusen oficial y sostener la vista al frente (Chakugan) sin tocarse la vestimenta.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: [],
          phase,
          sourceType: 'stars_only',
          sourceIcon: '⭐',
          sourceLabel: 'Rúbrica Oficial ISKF'
        });
      } else {
        uniqueBullets.push({
          text: `Aspecto Técnico - Kata (Chakugan y Enfoque): Para alcanzar el 100%, en ${kataName} falta fijar la mirada (Chakugan) al frente en cada pausa sin desviar los ojos, sostener la profundidad de las posturas y mantener absoluta inmovilidad tras el Kiai.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: [],
          phase,
          sourceType: 'stars_only',
          sourceIcon: '⭐',
          sourceLabel: 'Rúbrica Oficial ISKF'
        });
      }
    } else if (phase === 'kumite') {
      if (phaseAverage < 75) {
        uniqueBullets.push({
          text: `Aspecto Técnico - Combate (Distancia y Guardia): En ${kumiteName}, pierde la distancia reglamentaria (Ma-ai) y desarma la guardia (Kamae) tras bloquear. Debe corregir calculando el alcance y no bajar los brazos tras la defensa.`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: [],
          phase,
          sourceType: 'stars_only',
          sourceIcon: '⭐',
          sourceLabel: 'Rúbrica Oficial ISKF'
        });
      } else {
        uniqueBullets.push({
          text: `Aspecto Técnico - Combate (Kumite): Para alcanzar el 100%, en ${kumiteName} falta mayor rotación explosiva de cadera en la respuesta de contraataque inmediatamente tras el bloqueo y sostener el espíritu alerta (Zanshin).`,
          coincidenceCount: 0,
          isCoincidence: false,
          evaluators: [],
          phase,
          sourceType: 'stars_only',
          sourceIcon: '⭐',
          sourceLabel: 'Rúbrica Oficial ISKF'
        });
      }
    } else {
      uniqueBullets.push({
        text: 'Aspecto Técnico - Etiqueta y DO: Falta mayor energía y marcialidad en el saludo; para alcanzar el 100% debe mantener la postura firme, concentración y etiqueta intachable en tatami.',
        coincidenceCount: 0,
        isCoincidence: false,
        evaluators: [],
        phase,
        sourceType: 'stars_only',
        sourceIcon: '⭐',
        sourceLabel: 'Rúbrica Oficial ISKF'
      });
    }
  }

  // Ordenar priorizando las indicaciones que tuvieron mayor consenso de evaluadores
  return uniqueBullets.sort((a, b) => b.coincidenceCount - a.coincidenceCount);
}
