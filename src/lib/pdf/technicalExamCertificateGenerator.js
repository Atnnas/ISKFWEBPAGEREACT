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
  ISKF_ROY_SIGNATURE_BASE64
} from './certificateAssets.js';
import { getKataForRank, getKumiteForRank } from '../utils/shotokanCriteriaFeedback.js';

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
  isPassed = true,
  kihonText = '',
  kataText = '',
  kumiteText = '',
  positiveText = '',
  _generalComment = '',
  evaluators = []
}) {
  const jsPdfModule = await import('jspdf');
  const JsPDF = jsPdfModule.jsPDF || jsPdfModule.default?.jsPDF || jsPdfModule.default;

  // Documento A4 Vertical: 210mm x 297mm
  const doc = new JsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Paleta de Colores Institucional
  const COLOR_ORANGE_TITLE = [198, 89, 17]; // rgb(0.776, 0.349, 0.0667)
  const COLOR_ORANGE_FOOTER = [255, 102, 0]; // rgb(1, 0.4, 0)
  const COLOR_GREEN_PASS = [0, 150, 70];    // Verde formal de aprobación
  const COLOR_RED_FAIL = [200, 30, 30];     // Rojo formal de pendiente
  const COLOR_GRAY_BORDER = [200, 205, 212]; // Borde sutil
  const COLOR_GRAY_HEADER = [238, 240, 244]; // Fondo de cabeceras
  const COLOR_DARK = [30, 41, 59];          // Gris oscuro para lectura óptima
  const COLOR_MUTED = [100, 116, 139];      // Gris secundario para metadatos

  // =========================================================================
  // HOJA 1: ENCABEZADO INSTITUCIONAL, CALIFICACIONES Y PUNTOS A MEJORAR
  // =========================================================================

  // 1. Logo ISKF Centrado Superior
  try {
    doc.addImage(ISKF_CERT_LOGO_BASE64, 'JPEG', 92.5, 12, 25, 24);
  } catch (err) {
    console.warn('Error al cargar logo de encabezado:', err);
  }

  // 2. Títulos Institucionales
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(...COLOR_ORANGE_TITLE);
  doc.text('INTERNATIONAL SHOTOKAN KARATE FEDERATION', 105, 41, { align: 'center' });
  doc.setFontSize(11.5);
  doc.text('COSTA RICA', 105, 46.5, { align: 'center' });

  // Línea separadora sutil
  doc.setDrawColor(...COLOR_GRAY_BORDER);
  doc.setLineWidth(0.3);
  doc.line(15, 50, 195, 50);

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

  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR_DARK);
  doc.text(String(Math.round(kihonScore || 80)), cols[1].x + cols[1].w / 2, dataRowY + 5.2, { align: 'center' });
  doc.text(String(Math.round(kataScore || 80)), cols[2].x + cols[2].w / 2, dataRowY + 5.2, { align: 'center' });
  doc.text(String(Math.round(kumiteScore || 80)), cols[3].x + cols[3].w / 2, dataRowY + 5.2, { align: 'center' });
  doc.text(String(Math.round(writtenScore || 95)), cols[4].x + cols[4].w / 2, dataRowY + 5.2, { align: 'center' });

  doc.setFontSize(11.5);
  doc.text(String(Math.round(finalScore || 80)), cols[5].x + cols[5].w / 2, dataRowY + 5.3, { align: 'center' });

  // Resultado (Con espacio generoso de 26mm - cero colisiones)
  doc.setFontSize(8.5);
  doc.setTextColor(...(isPassed ? COLOR_GREEN_PASS : COLOR_RED_FAIL));
  doc.text(isPassed ? 'APROBADO' : 'PENDIENTE', cols[6].x + cols[6].w / 2, dataRowY + 5.1, { align: 'center' });

  // Nuevo Grado (Con espacio generoso de 26mm - cero colisiones)
  doc.setFontSize(8.0);
  doc.setTextColor(...COLOR_DARK);
  const cleanRank = String(targetRank || '9° KYU')
    .toUpperCase()
    .replace('CINTA', '')
    .replace('(', '')
    .replace(')', '')
    .trim();
  doc.text(cleanRank, cols[7].x + cols[7].w / 2, dataRowY + 5.1, { align: 'center' });

  // 6. Sección: Puntos a Mejorar por Fase (Tarjetas horizontales de ancho completo)
  const secTitleY = 108.5;
  doc.setFillColor(...COLOR_DARK);
  doc.rect(15, secTitleY, 180, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PUNTOS A MEJORAR POR FASE', 105, secTitleY + 4.5, { align: 'center' });

  // Función auxiliar para dibujar tarjetas de fase con fondo blanco garantizado
  function drawPhaseCard(yPos, height, title, badgeScore, notesText) {
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

    // Contenedor de contenido SIEMPRE BLANCO (elimina por completo el bloque negro)
    doc.setFillColor(255, 255, 255);
    doc.rect(15, yPos + 5.5, 180, height - 5.5, 'FD');

    // Parsear notas en viñetas limpias
    const rawLines = String(notesText || '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const bulletPoints = [];
    rawLines.forEach(l => {
      const sentences = l.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
      sentences.forEach(s => {
        const cleanS = s.replace(/^[•\s*-]+/, '').trim();
        if (cleanS && !bulletPoints.includes(cleanS)) {
          bulletPoints.push(cleanS);
        }
      });
    });

    if (bulletPoints.length === 0) {
      bulletPoints.push('Seguir practicando con constancia y atención en cada entrenamiento para afianzar la técnica.');
    }

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
  drawPhaseCard(117, 50, '1. TÉCNICAS BÁSICAS (KIHON) — Posiciones, desplazamientos y defensas', Math.round(kihonScore || 80), kihonText || defaultKihon);

  // Tarjeta 2: Kata (Forma)
  const defaultKata = `Durante ${beltKata}, no tocarse ni acomodarse el uniforme (karategui). Debe mantenerse firme, quieto y con la mirada atenta al frente.\nMantener la vista fija hacia adelante después de cada giro y después del grito (kiai).\nBajar bien las posiciones y no balancear el cuerpo.`;
  drawPhaseCard(169, 52, `2. FORMA (KATA) — ${beltKata}: concentración, mirada y postura`, Math.round(kataScore || 80), kataText || defaultKata);

  // Tarjeta 3: Kumite (Combate Básico)
  const defaultKumite = `En ${beltKumite}, calcular bien la distancia con su compañero para no quedar muy cerca ni muy lejos.\nNo bajar las manos de defensa después de bloquear.\nGirar la cadera y golpear con fuerza, buena dirección y un kiai fuerte.`;
  drawPhaseCard(223, 49, `3. COMBATE (KUMITE) — ${beltKumite}: distancia, bloqueos y control`, Math.round(kumiteScore || 80), kumiteText || defaultKumite);

  // Indicador de Hoja 1
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.0);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Página 1 de 2  •  Continúa en la siguiente hoja con Aspectos Positivos y Firmas Oficiales ►', 195, 276.5, { align: 'right' });

  // =========================================================================
  // HOJA 2: ASPECTOS POSITIVOS, COMENTARIO, FIRMAS Y EXAMINADORES
  // =========================================================================
  doc.addPage();

  // 1. Encabezado Hoja 2
  try {
    doc.addImage(ISKF_CERT_LOGO_BASE64, 'JPEG', 15, 11, 15, 14.5);
  } catch (err) {
    console.warn('Error al cargar logo hoja 2:', err);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR_ORANGE_TITLE);
  doc.text('INTERNATIONAL SHOTOKAN KARATE FEDERATION • COSTA RICA', 33, 16.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Boleta Oficial de Evaluación Técnica — Hoja 2: Aspectos Positivos y Firmas', 33, 21.0);

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

  // Caja de contenido con fondo blanco garantizado
  const dictamenBoxH = 116.0;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...COLOR_GRAY_BORDER);
  doc.rect(15, dictamenY + 6.5, 180, dictamenBoxH, 'FD');

  const defaultPositive = `* Corrección en Kata: Durante la forma (Heian Shodan), el estudiante debe mantenerse quieto, firme y con la mirada atenta al frente, sin tocarse ni acomodarse el uniforme en ningún momento.
* Corrección de postura básica: En la posición adelantada (Zenkutsu Dachi), estirar por completo la pierna de atrás apoyando todo el talón en el suelo, y flexionar bien la rodilla del frente sin subir la altura del cuerpo.
* Detalle para la nota máxima (10 de 10): Con una nota de ${Math.round(finalScore || 80)}%, para alcanzar la perfección faltó: cero reajustes a la vestimenta en tatami, bajar más el centro del cuerpo, y mayor sincronía de cadera en el impacto final.
* Aspectos aprobados demostrados: muy buen saludo, respeto y disciplina dentro del tatami, y buena fuerza al golpear.`;

  const contentPositive = (positiveText && positiveText.trim().length > 15) ? positiveText : defaultPositive;

  const rawBullets = contentPositive
    .split('\n')
    .map(b => b.trim())
    .map(b => b
      .replace(/^observaciones directas del [^:]+:?\s*/i, '')
      .replace(/^observaciones directas de [^:]+:?\s*/i, '')
      .replace(/\s*\([^)]*tribunal[^)]*\):?/gi, ':')
      .replace(/\s*\([^)]*profesores[^)]*\):?/gi, ':')
      .trim()
    )
    .filter(b => b.length > 5);

  let curDictY = dictamenY + 12.0;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_DARK);

  rawBullets.forEach(bullet => {
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

    if (curDictY < dictamenY + dictamenBoxH + 3) {
      doc.setFillColor(...COLOR_ORANGE_TITLE);
      doc.circle(18.5, curDictY - 1.0, 0.8, 'F');

      let xOffset = 21.5;
      if (titlePart) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLOR_DARK);
        doc.text(titlePart, xOffset, curDictY);
        xOffset += doc.getTextWidth(titlePart) + 1.0;
      }

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLOR_DARK);
      const remainingWidth = 191 - xOffset;

      const restWords = bodyPart.split(' ');
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
    }
  });

  // 3. Firmas y Examinadores Invitados
  const signSecY = 162.0;

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
    doc.addImage(ISKF_CERT_EMBLEM_BASE64, 'JPEG', 98, 240, 14, 13.5);
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
