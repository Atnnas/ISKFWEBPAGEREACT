/**
 * Utilidad Centralizada de Criterios Técnicos y Falencias Shotokan ISKF Costa Rica
 * Centraliza la resolución de Kata, Kumite, Posturas y Falencias según estrellas y temario.
 * Respeta la directiva de inmutabilidad de temarios en MongoDB (GEMINI.md).
 */

/**
 * Resuelve el Kata oficial según las técnicas del temario o el grado objetivo
 */
export function getKataForRank(rank = '', techniques = []) {
  const kataTech = (techniques || []).find(t => (t.group || t.phase || '').toLowerCase() === 'kata');
  if (kataTech?.name) return kataTech.name;

  const r = String(rank || '').toLowerCase();
  if (r.includes('10°') || r.includes('9°') || r.includes('amarill') || r.includes('blanca')) return 'Heian Shodan';
  if (r.includes('8°') || r.includes('naranja') || r.includes('azul')) return 'Heian Nidan';
  if (r.includes('7°') || r.includes('morada')) return 'Heian Sandan';
  if (r.includes('6°') || r.includes('verde')) return 'Heian Yondan';
  if (r.includes('5°') || r.includes('morada i')) return 'Heian Godan';
  if (r.includes('4°')) return 'Tekki Shodan';
  if (r.includes('3°') || r.includes('2°') || r.includes('1°')) return 'Bassai Dai';
  if (r.includes('dan') || r.includes('negra')) return 'Kata Superior Oficial';
  return 'Heian Shodan';
}

/**
 * Resuelve la modalidad de Kumite oficial según las técnicas del temario o el grado objetivo
 */
export function getKumiteForRank(rank = '', techniques = []) {
  const kumiteTech = (techniques || []).find(t => (t.group || t.phase || '').toLowerCase() === 'kumite');
  if (kumiteTech?.name) return kumiteTech.name;

  const r = String(rank || '').toLowerCase();
  if (r.includes('10°') || r.includes('9°') || r.includes('amarill') || r.includes('blanca')) return 'Gohon Kumite';
  if (r.includes('8°') || r.includes('7°') || r.includes('naranja') || r.includes('azul')) return 'Sanbon Kumite';
  if (r.includes('6°') || r.includes('5°') || r.includes('4°')) return 'Kihon Ippon Kumite';
  if (r.includes('3°') || r.includes('2°') || r.includes('1°')) return 'Jiyu Ippon Kumite';
  if (r.includes('dan') || r.includes('negra')) return 'Jiyu Kumite';
  return 'Gohon Kumite';
}

/**
 * Resuelve la postura base de Kihon del grado
 */
export function getPrimaryStance(rank = '', techniques = []) {
  const kihonTechs = (techniques || []).filter(t => (t.group || t.phase || 'kihon').toLowerCase() === 'kihon');
  const foundStance = kihonTechs.find(t => t.stance)?.stance;
  if (foundStance) return foundStance;

  const r = String(rank || '').toLowerCase();
  if (r.includes('3°') || r.includes('2°') || r.includes('1°') || r.includes('dan')) return 'Kiba Dachi / Zenkutsu Dachi';
  return 'Zenkutsu Dachi';
}

/**
 * Genera el dictamen colegiado unificado basado en las falencias y estrellas
 */
export function generateShotokanFeedbackBullets({
  percentage = 0,
  targetRank = '',
  techniques = [],
  validNotes = []
}) {
  const pct = Number(percentage) || 0;
  const kataName = getKataForRank(targetRank, techniques);
  const kumiteName = getKumiteForRank(targetRank, techniques);
  const primaryStance = getPrimaryStance(targetRank, techniques);

  const allNotesText = (validNotes || []).map(n => n.observation).join(' ');
  const lower = allNotesText.toLowerCase();

  const hasKarategui = lower.includes('karategui') || lower.includes('dogi') || lower.includes('uniforme') || lower.includes('acomoda') || lower.includes('arregla') || lower.includes('olvida') || pct < 70;
  const hasKime = lower.includes('kime') || lower.includes('fuerza') || lower.includes('potencia') || lower.includes('impacto') || pct < 70;
  const hasHikite = lower.includes('hikite') || lower.includes('puño') || lower.includes('cadera') || pct < 70;
  const hasStance = lower.includes('zenkutsu') || lower.includes('dachi') || lower.includes('postura') || lower.includes('pierna') || lower.includes('base') || lower.includes('talón') || pct < 70;
  const hasGuard = lower.includes('guardia') || lower.includes('hombro') || lower.includes('espalda') || lower.includes('tronco') || lower.includes('vista') || lower.includes('distancia') || pct < 70;

  const listItems = [];

  if (pct < 70) {
    // Caso bajo (< 70% o 1-2 estrellas): Tono severo y falencias biomecánicas críticas
    listItems.push(
      `* Falla grave en Kata (${kataName}): Pérdida del embusen y secuencia oficial con pausas indebidas por duda. Es inaceptable en examen de grado realizar reajustes a la vestimenta (karategui) o romper la inmovilidad en tatami.`
    );
    listItems.push(
      `* Deficiencia crítica en postura (${primaryStance}): No estira la pierna posterior y despega el talón del suelo al avanzar. Desplazamientos con paso en falso que dejan la base inestable y sin la profundidad reglamentaria.`
    );
    listItems.push(
      `* Falta grave en golpes y defensas de Kihon: La mano de Hikite queda suelta y descolgada sin anclarse con fuerza en la cintura sobre el cinturón, anulando por completo el Kime y el punto focal de impacto.`
    );
    listItems.push(
      `* Falla defensiva en combate (${kumiteName}): Pérdida de la distancia reglamentaria de seguridad (Ma-ai), retroceder con anticipación antes del ataque y desarmar o bajar la guardia (Kamae) tras bloquear.`
    );
    listItems.push(
      `* Motivo de no aprobación (Calificación obtenida: ${pct}%): El desempeño técnico demostrado no cumple el estándar mínimo para ${targetRank}. Para optar por una nueva examinación debe corregir de inmediato la fijación biomecánica de las posturas, memorizar con total solidez el kata ${kataName} y mantener disciplina corporal absoluta en tatami.`
    );
  } else if (pct >= 85) {
    // Caso alto (>= 85% o 4-5 estrellas): Tono de excelencia y detalle fino para 100%
    listItems.push(
      `* Detalle en Kata (${kataName}) para ganar 100%: Mantener inmovilidad y concentración absoluta tras el kiai final sin realizar el más mínimo reajuste a la vestimenta hasta la orden oficial de descanso.`
    );
    listItems.push(
      `* Corrección postural para ganar 100%: En ${primaryStance}, descender medio puño más el centro de gravedad sin subir la altura del cuerpo durante los avances en media luna.`
    );
    listItems.push(
      `* Detalle de impacto para ganar 100%: Máxima aceleración y sincronía en el tirón del Hikite hacia la cintura en el instante exacto del impacto final.`
    );
    listItems.push(
      `* Detalle en Combate (${kumiteName}) para ganar 100%: Mayor velocidad explosiva y rotación de cadera en la respuesta de contraataque inmediatamente tras el bloqueo.`
    );

    const missingFor100 = [];
    if (hasKarategui) missingFor100.push('cero ajustes al karategui hasta la voz de descanso');
    if (hasStance) missingFor100.push(`mayor descenso milimétrico en ${primaryStance}`);
    if (hasHikite) missingFor100.push('fijación instantánea del Hikite en el Kime');
    if (hasGuard) missingFor100.push('mayor velocidad de cadera en la respuesta tras el bloqueo');
    if (missingFor100.length === 0) missingFor100.push('máxima sincronía de cadera en el impacto final');

    listItems.push(
      `* Detalle para alcanzar la nota máxima (100%): Con una nota destacada de ${pct}%, para la calificación perfecta faltó: ${missingFor100.join(', ')}.`
    );
  } else {
    // Caso medio (70% - 84% o 3 estrellas): Correcciones constructivas directas
    listItems.push(
      `* Corrección en Kata (${kataName}): Mantener la mirada fija al frente tras cada giro, bajar bien las posiciones y evitar tocarse o acomodarse el uniforme durante la ejecución.`
    );
    listItems.push(
      `* Corrección de postura básica (${primaryStance}): Estirar por completo la pierna trasera apoyando todo el talón en el suelo y flexionar bien la rodilla del frente.`
    );
    listItems.push(
      `* Mano a la cintura (Hikite): Jalar con fuerza y rapidez la mano que no golpea hasta pegarla firmemente a la cintura sobre el cinturón.`
    );
    listItems.push(
      `* Corrección en Combate (${kumiteName}): Mantener la distancia de seguridad con el compañero y no bajar las manos de defensa tras bloquear.`
    );

    const missingPoints = [];
    if (hasKarategui) missingPoints.push('no tocarse ni acomodarse el uniforme en tatami');
    if (hasStance) missingPoints.push('bajar más el centro del cuerpo y asentar los pies');
    if (hasKime) missingPoints.push('poner más fuerza y concentración en el golpe final (Kime)');
    if (hasHikite) missingPoints.push('fijar firmemente la mano a la cintura');
    if (missingPoints.length === 0) missingPoints.push('hacer los bloqueos con movimientos más limpios');

    listItems.push(
      `* ¿Qué faltó para alcanzar la nota máxima (10 de 10)?: Con una nota de ${pct}%, para sacar un 10 perfecto faltó: ${missingPoints.join(', ')}.`
    );
  }

  // Aspectos positivos demostrados
  const positiveMentions = [];
  if (lower.includes('buen impacto') || lower.includes('fuerte')) positiveMentions.push('buena fuerza al golpear');
  if (lower.includes('trayectoria limpia') || lower.includes('limpio')) positiveMentions.push('movimientos limpios en los bloqueos');
  if (lower.includes('control adecuado') || lower.includes('distancia (ma-ai) adecuada') || lower.includes('buen control')) positiveMentions.push('buen control de la distancia con su compañero');
  if (lower.includes('buen saludo') || lower.includes('respeto') || lower.includes('actitud respetuosa') || pct >= 80) positiveMentions.push('muy buen saludo, respeto y disciplina dentro del tatami');

  if (positiveMentions.length > 0) {
    listItems.push(
      `* Aspectos aprobados demostrados: ${positiveMentions.join(', ')}.`
    );
  }

  return listItems;
}
