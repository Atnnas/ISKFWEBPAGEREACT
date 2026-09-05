import jsPDF from 'jspdf';

/**
 * Dibuja un diploma individual en la página activa de jsPDF.
 */
function drawDiplomaPage(doc, submission, session) {
  const pageWidth = doc.internal.pageSize.getWidth();   // 297 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm

  // Paleta Marcial Institucional ISKF
  const primaryBlue = [45, 46, 131];  // #2D2E83
  const primaryRed = [190, 19, 34];   // #be1322
  const gold = [197, 155, 39];        // #c59b27
  const darkGray = [25, 28, 31];
  const mutedGray = [110, 115, 125];

  // 1. Fondo crema ceremonial muy sutil
  doc.setFillColor(254, 253, 250);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. Marcos Marciales Tradicionales
  // Marco Exterior (Azul Marino ISKF)
  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(1.8);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  // Marco Intermedio (Dorado Ceremonial)
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.8);
  doc.rect(11, 11, pageWidth - 22, pageHeight - 22);

  // Marco Interior Fino (Rojo Karate)
  doc.setDrawColor(...primaryRed);
  doc.setLineWidth(0.4);
  doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

  // Detalles ornamentales en las 4 esquinas
  const corners = [
    [13, 13],
    [pageWidth - 13, 13],
    [13, pageHeight - 13],
    [pageWidth - 13, pageHeight - 13]
  ];
  doc.setFillColor(...gold);
  corners.forEach(([cx, cy]) => {
    doc.circle(cx, cy, 1.8, 'F');
  });

  // 3. Encabezado del Diploma
  let currentY = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryRed);
  doc.text('ISKF COSTA RICA • 空手道 • SHOTOKAN KARATE-DO', pageWidth / 2, currentY, { align: 'center' });

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...primaryBlue);
  doc.text('INTERNATIONAL SHOTOKAN KARATE FEDERATION', pageWidth / 2, currentY, { align: 'center' });

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...mutedGray);
  doc.text('AFILIADA A ISKF PANAMERICA & ISKF WORLD FEDERATION', pageWidth / 2, currentY, { align: 'center' });

  // Línea ornamental dorada central
  currentY += 4.5;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.8);
  doc.line((pageWidth / 2) - 35, currentY, (pageWidth / 2) + 35, currentY);

  currentY += 7.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryRed);
  doc.text('DIPLOMA DE ACREDITACIÓN TEÓRICA', pageWidth / 2, currentY, { align: 'center' });

  currentY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...darkGray);
  doc.text('El Tribunal Examinador y la Comisión Técnica Nacional hacen constar que:', pageWidth / 2, currentY, { align: 'center' });

  // 4. Nombre del Aspirante (Destacado y Grande)
  currentY += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...primaryBlue);
  const studentName = (submission?.studentName || 'Aspirante').toUpperCase();
  doc.text(studentName, pageWidth / 2, currentY, { align: 'center' });

  // Subrayado estilizado bajo el nombre
  currentY += 2;
  const textWidth = doc.getTextWidth(studentName);
  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(0.6);
  doc.line((pageWidth / 2) - (textWidth / 2) - 4, currentY, (pageWidth / 2) + (textWidth / 2) + 4, currentY);

  // 5. Dojo y Mérito Marcial
  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...darkGray);
  const dojoName = submission?.studentDojo || 'Dojo Afiliado';
  doc.text(`Perteneciente al Dojo:  ${dojoName}`, pageWidth / 2, currentY, { align: 'center' });

  currentY += 7.5;
  const targetRank = submission?.studentRank || session?.writtenExamName || 'Pase de Grado';
  const percentage = submission?.percentage || 100;
  doc.text(
    `Ha aprobado satisfactoriamente la evaluación teórica oficial correspondiente al grado de:`,
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );

  currentY += 7.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryRed);
  doc.text(`${targetRank}  •  Calificación Obtenida: ${percentage}%`, pageWidth / 2, currentY, { align: 'center' });

  currentY += 6.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...mutedGray);
  doc.text(`Convocatoria Oficial: "${session?.title || 'Convocatoria Nacional ISKF'}"`, pageWidth / 2, currentY, { align: 'center' });

  // 6. Fecha y Lugar Oficial
  currentY += 8;
  const dateObj = submission?.submittedAt ? new Date(submission.submittedAt) : new Date();
  const fechaTexto = dateObj.toLocaleDateString('es-CR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text(`Dado en San José, Costa Rica, el ${fechaTexto}.`, pageWidth / 2, currentY, { align: 'center' });

  // 7. Firmas de Autoridades Marciales
  const signY = pageHeight - 32;
  const signWidth = 65;

  // Firma Izquierda: Director Técnico Nacional
  const leftX = (pageWidth / 4) - (signWidth / 2) + 10;
  doc.setDrawColor(...darkGray);
  doc.setLineWidth(0.4);
  doc.line(leftX, signY, leftX + signWidth, signY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkGray);
  doc.text('Director Técnico Nacional', leftX + (signWidth / 2), signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedGray);
  doc.text('ISKF Costa Rica', leftX + (signWidth / 2), signY + 7.5, { align: 'center' });

  // Firma Derecha: Sensei Examinador
  const rightX = (3 * pageWidth / 4) - (signWidth / 2) - 10;
  doc.setDrawColor(...darkGray);
  doc.setLineWidth(0.4);
  doc.line(rightX, signY, rightX + signWidth, signY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...darkGray);
  doc.text('Sensei Evaluador / Mesa Examinadora', rightX + (signWidth / 2), signY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedGray);
  doc.text('Comisión de Grados ISKF', rightX + (signWidth / 2), signY + 7.5, { align: 'center' });

  // Sello de Verificación Digital Central
  const code = (submission?.id || submission?._id || 'ISKF-CERT').substring(0, 12).toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...gold);
  doc.text(`CERTIFICADO AUTÉNTICO ISKF: #${code}`, pageWidth / 2, pageHeight - 17, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedGray);
  doc.text('Verificable en el Registro Oficial de Examinaciones • https://iskf-cr.com', pageWidth / 2, pageHeight - 14, { align: 'center' });
}

/**
 * Genera y descarga el diploma de acreditación teórica de un alumno aprobado individual.
 */
export function generateSingleDiplomaPDF(submission, session) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  drawDiplomaPage(doc, submission, session);

  const cleanName = (submission?.studentName || 'Aspirante')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 30);
  doc.save(`Diploma_ISKF_${cleanName}.pdf`);
}

/**
 * Genera un PDF de múltiples páginas con los diplomas de TODOS los alumnos aprobados en lote.
 */
export function generateBatchDiplomasPDF(submissions = [], session) {
  const aprobados = submissions.filter(s => s.passed === true);
  if (aprobados.length === 0) {
    throw new Error("No hay aspirantes aprobados en esta convocatoria para generar diplomas.");
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  aprobados.forEach((sub, index) => {
    if (index > 0) {
      doc.addPage();
    }
    drawDiplomaPage(doc, sub, session);
  });

  const cleanTitle = (session?.title || 'Convocatoria')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 30);
  doc.save(`Diplomas_Lote_ISKF_${cleanTitle}.pdf`);
}
