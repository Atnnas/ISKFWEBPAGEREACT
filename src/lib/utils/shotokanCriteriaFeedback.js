/**
 * Utilidad Centralizada de Criterios Técnicos y Falencias Shotokan ISKF Costa Rica
 * Centraliza la resolución de Kata, Kumite, Posturas y Falencias según estrellas y temario.
 * Respeta la directiva de inmutabilidad de temarios en MongoDB (GEMINI.md).
 */

import { normalizeRankKey } from '../constants/kyuRanks.js';

/**
 * Resuelve el Kata oficial según las técnicas del temario o el grado objetivo
 */
export function getKataForRank(rank = '', techniques = []) {
  const kataTechs = (techniques || []).filter(t => (t.group || t.phase || '').toLowerCase() === 'kata');
  if (kataTechs.length === 1) return kataTechs[0].name;
  if (kataTechs.length > 1) return kataTechs.map(k => k.name).join(' y ');

  const key = normalizeRankKey(rank);
  if (key === '10-kyu' || key === '9-kyu') return 'Heian Shodan';
  if (key === '8-kyu') return 'Heian Shodan y Heian Nidan';
  if (key === '7-kyu') return 'Heian Sandan';
  if (key === '6-kyu') return 'Heian Yondan';
  if (key === '5-kyu') return 'Heian Godan';
  if (key === '4-kyu') return 'Tekki Shodan';
  if (key === '3-kyu') return 'Bassai Dai y Kanku Dai';
  if (key === '2-kyu') return 'Empi y Tekki Nidan';
  if (key === '1-kyu') return 'Jion y Hangetsu';
  if (key.endsWith('-dan')) return 'Kata Superior Oficial';

  const r = String(rank || '').toLowerCase();
  if (r.includes('10°') || r.includes('9°') || r.includes('amarill') || r.includes('blanca')) return 'Heian Shodan';
  if (r.includes('8°') || r.includes('naranja')) return 'Heian Shodan y Heian Nidan';
  if (r.includes('7°') || r.includes('verde')) return 'Heian Sandan';
  if (r.includes('6°') || r.includes('azul')) return 'Heian Yondan';
  if (r.includes('5°') || (r.includes('morada') && !r.includes('linea') && !r.includes('línea') && !r.includes('blanca'))) return 'Heian Godan';
  if (r.includes('4°') || (r.includes('morada') && (r.includes('linea') || r.includes('línea') || r.includes('blanca')))) return 'Tekki Shodan';
  if (r.includes('3°') || r.includes('marrón 3') || r.includes('marron 3')) return 'Bassai Dai y Kanku Dai';
  if (r.includes('2°') || r.includes('marrón 2') || r.includes('marron 2')) return 'Empi y Tekki Nidan';
  if (r.includes('1°') || r.includes('marrón 1') || r.includes('marron 1')) return 'Jion y Hangetsu';
  if (r.includes('dan') || r.includes('negra')) return 'Kata Superior Oficial';
  return 'Heian Shodan';
}

/**
 * Resuelve la lista de Katas oficiales (1 o múltiples) según las técnicas del temario o el grado objetivo
 */
export function getKatasForRank(rank = '', techniques = []) {
  const kataTechs = (techniques || []).filter(t => (t.group || t.phase || '').toLowerCase() === 'kata');
  if (kataTechs.length > 0) return kataTechs.map(t => ({ id: t.id, name: t.name }));

  const key = normalizeRankKey(rank);
  if (key === '8-kyu') {
    return [
      { id: 'kata-1', name: 'Heian Shodan' },
      { id: 'kata-2', name: 'Heian Nidan' }
    ];
  }
  if (key === '3-kyu') {
    return [
      { id: 'kata-1', name: 'Bassai Dai' },
      { id: 'kata-2', name: 'Kanku Dai' }
    ];
  }
  if (key === '2-kyu') {
    return [
      { id: 'kata-1', name: 'Empi' },
      { id: 'kata-2', name: 'Tekki Nidan' }
    ];
  }
  if (key === '1-kyu') {
    return [
      { id: 'kata-1', name: 'Jion' },
      { id: 'kata-2', name: 'Hangetsu' }
    ];
  }
  return [{ id: 'kata-1', name: getKataForRank(rank, techniques) }];
}

/**
 * Resuelve la modalidad de Kumite oficial según las técnicas del temario o el grado objetivo
 */
export function getKumiteForRank(rank = '', techniques = []) {
  const kumiteTech = (techniques || []).find(t => (t.group || t.phase || '').toLowerCase() === 'kumite');
  if (kumiteTech?.name) return kumiteTech.name;

  const key = normalizeRankKey(rank);
  if (key === '10-kyu' || key === '9-kyu') return 'Gohon Kumite';
  if (key === '8-kyu' || key === '7-kyu') return 'Sanbon Kumite';
  if (key === '6-kyu' || key === '5-kyu' || key === '4-kyu') return 'Kihon Ippon Kumite';
  if (key === '3-kyu' || key === '2-kyu' || key === '1-kyu') return 'Jiyu Ippon Kumite';
  if (key.endsWith('-dan')) return 'Jiyu Kumite';

  const r = String(rank || '').toLowerCase();
  if (r.includes('10°') || r.includes('9°') || r.includes('amarill') || r.includes('blanca')) return 'Gohon Kumite';
  if (r.includes('8°') || r.includes('7°') || r.includes('naranja') || r.includes('verde')) return 'Sanbon Kumite';
  if (r.includes('6°') || r.includes('5°') || r.includes('4°') || r.includes('azul') || r.includes('morad')) return 'Kihon Ippon Kumite';
  if (r.includes('3°') || r.includes('2°') || r.includes('1°') || r.includes('marr')) return 'Jiyu Ippon Kumite';
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
    // Caso alto (>= 85% o 4-5 estrellas): Tono de excelencia y detalle fino para 100% (estrictamente correctivo)
    listItems.push(
      `* Detalle correctivo en Kata (${kataName}) para alcanzar 100%: Mantener inmovilidad y concentración absoluta tras el kiai final sin realizar reajustes a la vestimenta hasta la orden oficial de descanso.`
    );
    listItems.push(
      `* Corrección postural para alcanzar 100%: En ${primaryStance}, descender medio puño más el centro de gravedad sin subir la altura del cuerpo durante los avances en media luna.`
    );
    listItems.push(
      `* Detalle de impacto para alcanzar 100%: Máxima aceleración y sincronía en el tirón del Hikite hacia la cintura en el instante exacto del impacto final.`
    );
    listItems.push(
      `* Detalle en Combate (${kumiteName}) para alcanzar 100%: Mayor velocidad explosiva y rotación de cadera en la respuesta de contraataque inmediatamente tras el bloqueo.`
    );

    const missingFor100 = [];
    if (hasKarategui) missingFor100.push('cero ajustes al karategui hasta la voz de descanso');
    if (hasStance) missingFor100.push(`mayor descenso milimétrico en ${primaryStance}`);
    if (hasHikite) missingFor100.push('fijación instantánea del Hikite en el Kime');
    if (hasGuard) missingFor100.push('mayor velocidad de cadera en la respuesta tras el bloqueo');
    if (missingFor100.length === 0) missingFor100.push('máxima sincronía de cadera en el impacto final');

    listItems.push(
      `* Detalle para alcanzar la nota máxima (100%): Con una nota de ${pct}%, para la calificación perfecta faltó: ${missingFor100.join(', ')}.`
    );
  } else {
    // Caso intermedio (70% - 84% o 3-4 estrellas): Correcciones biomecánicas constructivas
    listItems.push(
      `* Ajuste técnico en Kihon: En ${primaryStance}, afianzar el anclaje del talón posterior y asegurar el cierre de codos al armar las defensas antes de iniciar el impacto.`
    );
    listItems.push(
      `* Ajuste en Kata (${kataName}): Fijar la mirada (Chakugan) al frente en cada pausa sin desviar los ojos y sostener la profundidad de las posturas en los giros.`
    );
    listItems.push(
      `* Ajuste en Combate (${kumiteName}): Mantener la distancia reglamentaria (Ma-ai) y sostener la guardia (Kamae) sin desarmar los brazos tras defender.`
    );
    listItems.push(
      `* Ajuste en Kime y Respiración: Sincronizar la exhalación potente en el impacto con un tirón enérgico del Hikite sobre el cinturón.`
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

  return listItems;
}
