/**
 * Generador Oficial de Certificados / Boletas de Examen Técnico ISKF Costa Rica
 * Diseñado en 2 páginas oficiales con distribución limpia, lenguaje sencillo y claro
 * apto para toda la familia y karatecas de todas las edades.
 * Incluye dimensiones milimétricas exactas, colores institucionales y los 3 activos
 * fotográficos originales (Logo ISKF, firma oficial del Sensei Roy Gatjens y emblema inferior).
 */

import {
  ISKF_CERT_LOGO_BASE64,
  ISKF_CERT_EMBLEM_BASE64,
  ISKF_ROY_SIGNATURE_BASE64,
  ISKF_CERT_BACKGROUND_BASE64
} from './certificateAssets.js';
import { getKataForRank, getKumiteForRank } from '../utils/shotokanCriteriaFeedback.js';
import { isKyuExemptFromWrittenExam } from '../constants/kyuRanks.js';

export async function generateTechnicalExamCertificatePDF({
  studentName = 'Estudiante',
  dojoName = 'Kuma',
  dojoSensei = 'David Artavia Rodríguez',
  examDate = null,
  targetRank = '9° KYU',
  kihonScore = 80,
  kataScore = 80,
  kumiteScore = 80,
  writtenScore = 95,
  finalScore = 80,
  technicalScore = null,
  martialAdjustment = 0,
  martialAdjustmentReason = '',
  isPassed = true,
  kihonText = '',
  kataText = '',
  kumiteText = '',
  positiveText = '',
  generalComment = '',
  _generalComment = '',
  evaluators = []
}) {
  // El promedio colegiado técnico base debe ser estrictamente el promedio entre las tres fases finales: Kihon, Kata y Kumite
  const phaseScores = [kihonScore, kataScore, kumiteScore].filter(v => typeof v === 'number' && v > 0);
  const baseTechnicalScore = technicalScore !== null && typeof technicalScore === 'number'
    ? technicalScore
    : (phaseScores.length > 0
        ? Math.round(phaseScores.reduce((a, b) => a + b, 0) / phaseScores.length)
        : (finalScore || 80));

  const adj = Number(martialAdjustment) || 0;
  const resolvedFinalScore = Math.min(100, Math.max(0, Math.round(baseTechnicalScore + adj)));
  const resolvedIsPassed = isPassed !== null ? isPassed : (resolvedFinalScore >= 70);

  const jsPdfModule = await import('jspdf');
  const JsPDF = jsPdfModule.jsPDF || jsPdfModule.default?.jsPDF || jsPdfModule.default;

  // Documento A4 Vertical: 210mm x 297mm
  const doc = new JsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Paleta de Colores Institucional
  const COLOR_ISKF_RED = [190, 22, 34]; // Rojo oficial institucional ISKF (#BE1622)
  const COLOR_ORANGE_TITLE = COLOR_ISKF_RED;
  const COLOR_ORANGE_FOOTER = COLOR_ISKF_RED;
  const COLOR_GREEN_PASS = [0, 150, 70];    // Verde formal de aprobación
  const COLOR_RED_FAIL = [200, 30, 30];     // Rojo formal de pendiente
  const COLOR_GRAY_BORDER = [200, 205, 212]; // Borde sutil
  const COLOR_GRAY_HEADER = [238, 240, 244]; // Fondo de cabeceras
  const COLOR_DARK = [30, 41, 59];          // Gris oscuro para lectura óptima
  const COLOR_MUTED = [100, 116, 139];      // Gris secundario para metadatos

  // =========================================================================
  // HOJA 1: ENCABEZADO INSTITUCIONAL, CALIFICACIONES Y PUNTOS A MEJORAR
  // =========================================================================

  // 0. Fondo Oficial ISKF (fondoPDF.png)
  try {
    if (ISKF_CERT_BACKGROUND_BASE64) {
      doc.addImage(ISKF_CERT_BACKGROUND_BASE64, 'PNG', 0, 0, 210, 297);
    }
  } catch (err) {
    console.warn('Error al cargar fondo en hoja 1:', err);
  }

  // 1. Logo ISKF Centrado Superior
  try {
    doc.addImage(ISKF_CERT_LOGO_BASE64, 'PNG', 86, 12, 38, 18.6);
  } catch (err) {
    console.warn('Error al cargar logo de encabezado:', err);
  }

  // 2. Títulos Institucionales
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(...COLOR_ORANGE_TITLE);
  doc.text('INTERNATIONAL SHOTOKAN KARATE FEDERATION', 105, 36.5, { align: 'center' });
  doc.setFontSize(11.0);
  doc.text('COSTA RICA', 105, 42.0, { align: 'center' });

  // Línea separadora sutil
  doc.setDrawColor(...COLOR_GRAY_BORDER);
  doc.setLineWidth(0.3);
  doc.line(15, 47, 195, 47);

  // 3. Metadatos: Destinatarios, Asunto, Fecha, Sensei y Dojo
  const formattedDate = examDate || new Date().toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_DARK);

  // Columna Izquierda: Saludo y Asunto en lenguaje claro y cercano
  doc.setFont('helvetica', 'bold');
  doc.text('Sres.', 15, 56);
  doc.setFont('helvetica', 'normal');
  doc.text('Padres de Familia y Alumnos', 15, 59.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Asunto: Resultados Oficiales y Recomendaciones del Examen de Grado', 15, 65);
  doc.setFont('helvetica', 'normal');
  const asuntoText = 'Es un gusto saludarles y entregarles de forma oficial las calificaciones y recomendaciones de los profesores para apoyar el continuo crecimiento y perfeccionamiento marcial del estudiante.';
  const asuntoLines = doc.splitTextToSize(asuntoText, 95);
  doc.text(asuntoLines, 15, 69);

  // Columna Derecha: Metadata de fecha, profesor y dojo
  const rightX = 125;
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${formattedDate}`, 195, 56, { align: 'right' });

  const cleanDojoSensei = (dojoSensei || 'David Artavia Rodríguez').replace(/^sensei:?\s*/i, 'Sensei ');
  doc.text(`Profesor: ${cleanDojoSensei}`, rightX, 62);
  doc.line(rightX, 63.5, 195, 63.5);

  doc.text(`Dojo: ${dojoName || 'Kuma'}`, rightX, 69);
  doc.line(rightX, 70.5, 195, 70.5);

  // 4. Barra de Identificación del Alumno
  const studentY = 78;
  const studentH = 7.5;
  doc.setFillColor(...COLOR_GRAY_HEADER);
  doc.setDrawColor(...COLOR_GRAY_BORDER);
  doc.setLineWidth(0.35);
  doc.rect(15, studentY, 32, studentH, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR_DARK);
  doc.text('Aspirante / Alumno:', 31, studentY + 5.2, { align: 'center' });

  doc.setFillColor(255, 255, 255);
  doc.rect(47, studentY, 148, studentH, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...COLOR_DARK);
  doc.text(String(studentName || 'Estudiante').toUpperCase(), 50, studentY + 5.3);

  // 5. Tabla de Desglose de Calificaciones (Ancho ampliado a 180mm, sin colisiones)
  const tableY = 88.5;
  const headH = 8.0;
  const rowH = 7.5;

  const cols = [
    { label: 'Desglose', w: 20 },
    { label: 'Kihon', w: 22 },
    { label: 'Kata', w: 22 },
    { label: 'Kumite', w: 22 },
    { label: 'Examen\nEscrito', w: 22 },
    { label: 'Nota\nFinal', w: 20 },
    { label: 'Resultado', w: 26 },
    { label: 'Nuevo Grado', w: 26 }
  ];

  let curX = 15;
  cols.forEach(c => {
    c.x = curX;
    curX += c.w;
  });

  // Cabeceras de tabla
  doc.setDrawColor(...COLOR_GRAY_BORDER);
  doc.setLineWidth(0.3);

  cols.forEach(c => {
    doc.setFillColor(...COLOR_GRAY_HEADER);
    doc.rect(c.x, tableY, c.w, headH, 'FD');
  });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_DARK);

  cols.forEach(c => {
    const lines = c.label.split('\n');
    if (lines.length === 1) {
      doc.setFontSize(8.5);
      doc.text(lines[0], c.x + c.w / 2, tableY + 5.2, { align: 'center' });
    } else {
      doc.setFontSize(7.2);
      doc.text(lines[0], c.x + c.w / 2, tableY + 3.4, { align: 'center' });
      doc.text(lines[1], c.x + c.w / 2, tableY + 6.6, { align: 'center' });
    }
  });

  // Fila de Valores de Datos (Fondo blanco garantizado)
  const dataRowY = tableY + headH;
  cols.forEach(c => {
    doc.setFillColor(255, 255, 255);
    doc.rect(c.x, dataRowY, c.w, rowH, 'FD');
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Puntaje', cols[0].x + cols[0].w / 2, dataRowY + 5.0, { align: 'center' });

  const isWrittenExempt = isKyuExemptFromWrittenExam(targetRank);
  const writtenDisplay = isWrittenExempt ? '-' : (writtenScore !== null && writtenScore !== undefined ? String(Math.round(writtenScore)) : '-');

  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR_DARK);
  doc.text(String(Math.round(kihonScore || 80)), cols[1].x + cols[1].w / 2, dataRowY + 5.2, { align: 'center' });
  doc.text(String(Math.round(kataScore || 80)), cols[2].x + cols[2].w / 2, dataRowY + 5.2, { align: 'center' });
  doc.text(String(Math.round(kumiteScore || 80)), cols[3].x + cols[3].w / 2, dataRowY + 5.2, { align: 'center' });
  doc.text(writtenDisplay, cols[4].x + cols[4].w / 2, dataRowY + 5.2, { align: 'center' });

  doc.setFontSize(11.5);
  doc.text(String(Math.round(resolvedFinalScore)), cols[5].x + cols[5].w / 2, dataRowY + 5.3, { align: 'center' });

  // Resultado (Con espacio generoso de 26mm - cero colisiones)
  doc.setFontSize(8.5);
  doc.setTextColor(...(resolvedIsPassed ? COLOR_GREEN_PASS : COLOR_RED_FAIL));
  doc.text(resolvedIsPassed ? 'APROBADO' : 'PENDIENTE', cols[6].x + cols[6].w / 2, dataRowY + 5.1, { align: 'center' });

  // Nuevo Grado (Con espacio generoso de 26mm - cero colisiones)
  doc.setFontSize(8.0);
  doc.setTextColor(...COLOR_DARK);
  // Extraer únicamente el número y el kyu obtenido (ej: "6° KYU"), sin color de cinta
  const rawRankStr = String(targetRank || '9° KYU');
  const rankMatch = rawRankStr.match(/(\d+[\s°º]*(?:kyu|dan))/i);
  const cleanRank = rankMatch
    ? rankMatch[1].replace(/\s+/g, ' ').toUpperCase()
    : rawRankStr.split(/[\(\-\:]/)[0].trim().toUpperCase();
  doc.text(cleanRank, cols[7].x + cols[7].w / 2, dataRowY + 5.1, { align: 'center' });

  // Nota de Ajuste Marcial (si aplica)
  if (adj !== 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.8);
    doc.setTextColor(...COLOR_MUTED);
    const sign = adj > 0 ? '+' : '';
    const reasonText = martialAdjustmentReason ? ` (${martialAdjustmentReason})` : '';
    doc.text(`* Dictamen Oficial incluye Ajuste Marcial de ${sign}${adj}% por Espíritu/Actitud${reasonText}. Promedio técnico base: ${baseTechnicalScore}%.`, 15, 106.8);
  }

  // 6. Sección: Puntos a Mejorar por Fase (Tarjetas horizontales de ancho completo)
  const secTitleY = 108.5;
  doc.setFillColor(...COLOR_DARK);
  doc.rect(15, secTitleY, 180, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PUNTOS A MEJORAR POR FASE', 105, secTitleY + 4.5, { align: 'center' });

  // Parsear notas en viñetas limpias para cada fase
  function parsePhaseBullets(notesText) {
    const rawLines = String(notesText || '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const bulletPoints = [];
    rawLines.forEach(l => {
      const sentences = l.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
      sentences.forEach(s => {
        const cleanS = s.replace(/^[•\s*-]+/, '').replace(/^ajuste t[eé]cnico:?\s*/i, '').trim();
        if (cleanS && !bulletPoints.includes(cleanS)) {
          bulletPoints.push(cleanS);
        }
      });
    });

    if (bulletPoints.length === 0) {
      bulletPoints.push('Para alcanzar el 100%, debe corregir la fijación de las posturas, el anclaje del Hikite y la concentración marcial.');
    }
    return bulletPoints;
  }

  // Medir la altura requerida por las viñetas de una fase para que la tarjeta ajuste su tamaño dinámicamente
  function measurePhaseBulletsHeight(bulletPoints) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.0);
    let totalTextH = 0;
    bulletPoints.forEach(bp => {
      const bpLines = doc.splitTextToSize(`•  ${bp}`, 174);
      totalTextH += bpLines.length * 3.3 + 0.8;
    });
    return Math.max(20.0, 5.5 + 3.7 + totalTextH + 2.5);
  }

  // Función auxiliar para dibujar tarjetas de fase con fondo blanco garantizado y altura ajustada al contenido
  function drawPhaseCard(yPos, height, title, badgeScore, bulletPoints) {
    // Encabezado de la tarjeta
    doc.setFillColor(...COLOR_GRAY_HEADER);
    doc.setDrawColor(...COLOR_GRAY_BORDER);
    doc.setLineWidth(0.3);
    doc.rect(15, yPos, 180, 5.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(...COLOR_DARK);
    doc.text(title, 18, yPos + 4.0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_ORANGE_TITLE);
    doc.text(`Nota de Fase: ${badgeScore}%`, 192, yPos + 4.0, { align: 'right' });

    // Contenedor de contenido blanco ajustable al contenido exacto
    doc.setFillColor(255, 255, 255);
    doc.rect(15, yPos + 5.5, 180, height - 5.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.0);
    doc.setTextColor(...COLOR_DARK);

    let textY = yPos + 9.2;
    const maxTextY = yPos + height - 2.5;

    for (let i = 0; i < bulletPoints.length; i++) {
      if (textY >= maxTextY) break;
      const bp = bulletPoints[i];
      const bpLines = doc.splitTextToSize(`•  ${bp}`, 174);

      if (textY + (bpLines.length * 3.3) > maxTextY + 1) {
        const remainingLines = Math.floor((maxTextY - textY) / 3.3);
        if (remainingLines > 0) {
          doc.text(bpLines.slice(0, remainingLines), 18, textY);
        }
        break;
      }
      doc.text(bpLines, 18, textY);
      textY += bpLines.length * 3.3 + 0.8;
    }
  }

  // Resolver Kata y Kumite oficiales según cinturón / grado
  const beltKata = getKataForRank(targetRank);
  const beltKumite = getKumiteForRank(targetRank);

  // Tarjeta 1: Kihon (Técnicas Básicas)
  const defaultKihon = 'En la posición adelantada (Zenkutsu Dachi), estirar bien la pierna de atrás con el talón apoyado en el suelo.\nLlevar la mano que no golpea bien pegada a la cintura (Hikite).\nNo subir el cuerpo al avanzar y recoger rápido la pierna al patear.';
  const defaultKata = `Durante ${beltKata}, no tocarse ni acomodarse el uniforme (karategui). Debe mantenerse firme, quieto y con la mirada atenta al frente.\nMantener la vista fija hacia adelante después de cada giro y después del grito (kiai).\nBajar bien las posiciones y no balancear el cuerpo.`;
  const defaultKumite = `En ${beltKumite}, calcular bien la distancia con su compañero para no quedar muy cerca ni muy lejos.\nNo bajar las manos de defensa después de bloquear.\nGirar la cadera y golpear con fuerza, buena dirección y un kiai fuerte.`;

  const kihonBullets = parsePhaseBullets(kihonText || defaultKihon);
  const kataBullets = parsePhaseBullets(kataText || defaultKata);
  const kumiteBullets = parsePhaseBullets(kumiteText || defaultKumite);

  let hKihon = measurePhaseBulletsHeight(kihonBullets);
  let hKata = measurePhaseBulletsHeight(kataBullets);
  let hKumite = measurePhaseBulletsHeight(kumiteBullets);

  // Espacio vertical total disponible en Hoja 1 entre Y=117.0 y Y=272.0 (155mm)
  const maxAvailableY = 272.0;
  const startCardsY = 117.0;
  const cardGap = 4.0;
  const totalAvailableH = maxAvailableY - startCardsY - (2 * cardGap);

  const totalRequestedH = hKihon + hKata + hKumite;
  if (totalRequestedH > totalAvailableH) {
    const scale = totalAvailableH / totalRequestedH;
    hKihon = Math.max(18.0, Math.floor(hKihon * scale));
    hKata = Math.max(18.0, Math.floor(hKata * scale));
    hKumite = Math.max(18.0, totalAvailableH - hKihon - hKata);
  }

  let curCardY = startCardsY;
  drawPhaseCard(curCardY, hKihon, '1. TÉCNICAS BÁSICAS (KIHON) — Indicaciones correctivas para alcanzar el 100%', Math.round(kihonScore || 80), kihonBullets);
  curCardY += hKihon + cardGap;

  drawPhaseCard(curCardY, hKata, `2. FORMA (KATA) — ${beltKata}: correcciones de embusen y postura`, Math.round(kataScore || 80), kataBullets);
  curCardY += hKata + cardGap;

  drawPhaseCard(curCardY, hKumite, `3. COMBATE (KUMITE) — ${beltKumite}: correcciones de distancia y guardia`, Math.round(kumiteScore || 80), kumiteBullets);

  // Indicador de Hoja 1
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.0);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Página 1 de 2  •  Continúa en la siguiente hoja con Aspectos Positivos y Firmas Oficiales ►', 195, 276.5, { align: 'right' });

  // =========================================================================
  // HOJA 2: ASPECTOS POSITIVOS, COMENTARIO, FIRMAS Y EXAMINADORES
  // =========================================================================
  doc.addPage();

  // 0. Fondo Oficial ISKF en Hoja 2 (fondoPDF.png)
  try {
    if (ISKF_CERT_BACKGROUND_BASE64) {
      doc.addImage(ISKF_CERT_BACKGROUND_BASE64, 'PNG', 0, 0, 210, 297);
    }
  } catch (err) {
    console.warn('Error al cargar fondo en hoja 2:', err);
  }

  // 1. Encabezado Hoja 2
  try {
    doc.addImage(ISKF_CERT_LOGO_BASE64, 'PNG', 15, 9.5, 24, 11.8);
  } catch (err) {
    console.warn('Error al cargar logo hoja 2:', err);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.2);
  doc.setTextColor(...COLOR_ORANGE_TITLE);
  doc.text('INTERNATIONAL SHOTOKAN KARATE FEDERATION • COSTA RICA', 43, 14.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Boleta Oficial de Evaluación Técnica — Hoja 2: Aspectos Positivos y Firmas', 43, 19.5);

  // Alumno y fecha a la derecha
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(...COLOR_DARK);
  doc.text(`Aspirante: ${studentName}`, 195, 16.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.0);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Grado: ${cleanRank}  |  Fecha: ${formattedDate}`, 195, 21.0, { align: 'right' });

  doc.setDrawColor(...COLOR_GRAY_BORDER);
  doc.setLineWidth(0.3);
  doc.line(15, 27.5, 195, 27.5);

  // 2. Sección: Aspectos Positivos
  const dictamenY = 32.0;
  doc.setFillColor(...COLOR_DARK);
  doc.rect(15, dictamenY, 180, 6.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('ASPECTOS POSITIVOS', 105, dictamenY + 4.5, { align: 'center' });

  // Aspectos Positivos: Únicamente lo que el sensei colocó al agregar al atleta uno a uno
  const cleanPositiveText = (positiveText || '').trim();
  const rawBullets = cleanPositiveText
    ? cleanPositiveText
        .split('\n')
        .map(b => b.trim())
        .map(b => b
          .replace(/^[•\s*-]+/, '')
          .replace(/^observaciones directas del [^:]+:?\s*/i, '')
          .replace(/^observaciones directas de [^:]+:?\s*/i, '')
          .replace(/\s*\([^)]*tribunal[^)]*\):?/gi, ':')
          .replace(/\s*\([^)]*profesores[^)]*\):?/gi, ':')
          .trim()
        )
        .filter(b => b.length > 0)
    : [
        'Demuestra disciplina, respeto y actitud positiva constante dentro del dojo.'
      ];

  // Medir altura requerida para que el contenedor de Aspectos Positivos ajuste dinámicamente al contenido
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  const processedBullets = rawBullets.map(bullet => {
    const isBulletWithColon = bullet.includes(':');
    let titlePart = '';
    let bodyPart = bullet;

    if (isBulletWithColon) {
      const parts = bullet.split(/:\s*(.+)/);
      titlePart = parts[0].replace(/^[•\s*-]+/, '').trim() + ': ';
      bodyPart = parts[1] || '';
    } else {
      bodyPart = bullet.replace(/^[•\s*-]+/, '').trim();
    }

    const fullStr = (titlePart ? titlePart + ' ' : '') + bodyPart;
    const lines = doc.splitTextToSize(fullStr, 168);
    const itemH = lines.length * 3.8 + 2.0;
    return { titlePart, bodyPart, lines, itemH };
  });

  const totalPositiveTextH = processedBullets.reduce((sum, b) => sum + b.itemH, 0);
  // Altura autoajustable al contenido exacto (sin dejar espacios muertos ni cajas gigantes fijas)
  const dictamenBoxH = Math.max(18.0, totalPositiveTextH + 5.0);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...COLOR_GRAY_BORDER);
  doc.rect(15, dictamenY + 6.5, 180, dictamenBoxH, 'FD');

  let curDictY = dictamenY + 11.5;
  processedBullets.forEach(item => {
    doc.setFillColor(...COLOR_ORANGE_TITLE);
    doc.circle(18.5, curDictY - 1.0, 0.8, 'F');

    let xOffset = 21.5;
    if (item.titlePart) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLOR_DARK);
      doc.text(item.titlePart, xOffset, curDictY);
      xOffset += doc.getTextWidth(item.titlePart) + 1.0;
    }

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_DARK);
    const remainingWidth = 191 - xOffset;

    const restWords = item.bodyPart.split(' ');
    let lineAccum = '';

    while (restWords.length > 0 && doc.getTextWidth(lineAccum + restWords[0] + ' ') < remainingWidth) {
      lineAccum += restWords.shift() + ' ';
    }
    doc.text(lineAccum, xOffset, curDictY);

    if (restWords.length > 0) {
      const remainingText = restWords.join(' ');
      const wrappedLines = doc.splitTextToSize(remainingText, 170);
      curDictY += 3.7;
      doc.text(wrappedLines, 21.5, curDictY);
      curDictY += (wrappedLines.length - 1) * 3.7;
    }

    curDictY += 5.5;
  });

  let curPage2Y = dictamenY + 6.5 + dictamenBoxH;

  // 2b. Sección Opcional: Dictamen y Recomendaciones Generales (si existen notas adicionales del tribunal)
  const resolvedGeneralComment = String(generalComment || _generalComment || '').trim();
  if (resolvedGeneralComment && resolvedGeneralComment.length > 5) {
    const genSecY = curPage2Y + 6.0;
    doc.setFillColor(...COLOR_DARK);
    doc.rect(15, genSecY, 180, 6.0, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.0);
    doc.setTextColor(255, 255, 255);
    doc.text('DICTAMEN Y RECOMENDACIONES GENERALES DEL TRIBUNAL', 105, genSecY + 4.2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    const genLines = doc.splitTextToSize(resolvedGeneralComment, 172);
    const genBoxH = Math.max(14.0, Math.min(48.0, genLines.length * 3.5 + 5.0));

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...COLOR_GRAY_BORDER);
    doc.rect(15, genSecY + 6.0, 180, genBoxH, 'FD');

    doc.setTextColor(...COLOR_DARK);
    const maxVisibleLines = Math.floor((genBoxH - 4.0) / 3.5);
    doc.text(genLines.slice(0, maxVisibleLines), 19, genSecY + 10.0);

    curPage2Y = genSecY + 6.0 + genBoxH;
  }

  // 3. Firmas y Examinadores Invitados
  // Se posiciona de manera fluida y armónica tras el contenido, sin colisionar con el pie de página
  const signHeight = 51.5;
  const maxSignSecY = 236.0 - signHeight; // 184.5mm
  const idealSignSecY = curPage2Y + 8.0;
  const signSecY = Math.min(maxSignSecY, Math.max(idealSignSecY, 138.0));

  // Lado Izquierdo: Dirección Técnica Nacional (Firma Oficial Sensei Roy Gatjens)
  const leftSignW = 86;
  doc.setFillColor(...COLOR_GRAY_HEADER);
  doc.rect(15, signSecY, leftSignW, 5.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_DARK);
  doc.text('DIRECCIÓN TÉCNICA NACIONAL', 15 + leftSignW / 2, signSecY + 3.8, { align: 'center' });

  doc.setFillColor(255, 255, 255);
  doc.rect(15, signSecY + 5.5, leftSignW, 46, 'FD');

  try {
    doc.addImage(ISKF_ROY_SIGNATURE_BASE64, 'PNG', 32, signSecY + 8, 48, 14);
  } catch (err) {
    console.warn('Error al cargar firma oficial:', err);
  }

  doc.setDrawColor(...COLOR_DARK);
  doc.setLineWidth(0.35);
  doc.line(25, signSecY + 28, 90, signSecY + 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_DARK);
  doc.text('Sensei Roy Gatjens Barrantes', 15 + leftSignW / 2, signSecY + 33, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Director Técnico ISKF - Costa Rica', 15 + leftSignW / 2, signSecY + 37, { align: 'center' });
  doc.setFontSize(6.8);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Cinturón Negro 6° Dan ISKF', 15 + leftSignW / 2, signSecY + 41, { align: 'center' });

  // Lado Derecho: Examinadores Invitados (ÚNICAMENTE los nombres de los Senseis)
  const rightSignX = 106;
  const rightSignW = 89;

  doc.setFillColor(...COLOR_GRAY_HEADER);
  doc.setDrawColor(...COLOR_GRAY_BORDER);
  doc.rect(rightSignX, signSecY, rightSignW, 5.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_DARK);
  doc.text('Examinadores Invitados', rightSignX + rightSignW / 2, signSecY + 3.8, { align: 'center' });

  doc.setFillColor(255, 255, 255);
  doc.rect(rightSignX, signSecY + 5.5, rightSignW, 46, 'FD');

  const finalEvaluators = Array.isArray(evaluators) && evaluators.length > 0
    ? evaluators
    : [
        { name: 'Sensei Roy Gatjens' },
        { name: 'Sensei Andrea Maroto' }
      ];

  let evalTextY = signSecY + 12.0;
  finalEvaluators.slice(0, 5).forEach((ev) => {
    const rawName = ev.name || ev.evaluatorName || 'Sensei Evaluador';
    const cleanName = rawName.replace(/^sensei\s+/i, '');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(...COLOR_DARK);
    doc.text(`Sensei: ${cleanName}`, rightSignX + 6, evalTextY);

    evalTextY += 7.2;
  });

  // 4. Pie de Página Institucional (Hoja 2)
  try {
    doc.addImage(ISKF_CERT_EMBLEM_BASE64, 'PNG', 93, 241, 24, 11.8);
  } catch (err) {
    console.warn('Error al cargar emblema inferior:', err);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_ORANGE_FOOTER);
  doc.text('Asociación Internacional Shotokan Karate Do Familia — Costa Rica', 105, 257.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text('Tel: 8395-0741  /  e-mail: iskfcostarica@hotmail.com  /  web: www.iskf-cr.com', 105, 261.5, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.2);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Documento oficial emitido por el Sistema de Evaluaciones Técnicas ISKF Costa Rica  •  Página 2 de 2', 105, 266.5, { align: 'center' });

  // Guardar documento
  const cleanFileName = String(studentName).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 25);
  if (typeof window !== 'undefined') {
    doc.save(`Boleta_Examen_ISKF_${cleanFileName}.pdf`);
  } else {
    try {
      const fs = await import('fs');
      fs.writeFileSync(`scratch/Boleta_Examen_ISKF_${cleanFileName}.pdf`, Buffer.from(doc.output('arraybuffer')));
    } catch {
      doc.save(`Boleta_Examen_ISKF_${cleanFileName}.pdf`);
    }
  }

  return doc;
}
