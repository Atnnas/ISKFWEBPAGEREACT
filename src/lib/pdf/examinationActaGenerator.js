import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera y descarga el Acta Oficial de Examinación de una convocatoria en formato PDF.
 * @param {Object} session - Datos de la convocatoria de examinación
 * @param {Array} submissions - Lista de entregas de aspirantes en la convocatoria
 */
export function generateExaminationActaPDF(session, submissions = []) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colores Institucionales ISKF
  const primaryBlue = [45, 46, 131];   // #2D2E83
  const primaryRed = [190, 19, 34];    // #be1322
  const darkGray = [33, 37, 41];
  const lightGray = [108, 117, 125];

  // 1. Barra superior decorativa bicolor
  doc.setFillColor(...primaryBlue);
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(...primaryRed);
  doc.rect(0, 5, pageWidth, 2, 'F');

  // 2. Encabezado Institucional
  let currentY = 17;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...primaryBlue);
  doc.text('INTERNATIONAL SHOTOKAN KARATE FEDERATION', pageWidth / 2, currentY, { align: 'center' });

  currentY += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryRed);
  doc.text('ISKF COSTA RICA • COMISIÓN TÉCNICA NACIONAL DE GRADOS', pageWidth / 2, currentY, { align: 'center' });

  currentY += 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...darkGray);
  doc.text('ACTA OFICIAL DE EVALUACIÓN TEÓRICA DE PASES DE GRADO', pageWidth / 2, currentY, { align: 'center' });

  // Línea divisoria elegante
  currentY += 4;
  doc.setDrawColor(210, 215, 225);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);

  // 3. Ficha Técnica de la Convocatoria
  currentY += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('DATOS DE LA CONVOCATORIA:', 14, currentY);

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);

  const fechaEmision = new Date().toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const dojosNombres = (session?.assignedDojos || []).map(d => d.name).join(', ') || 'Todos los afiliados';

  doc.text(`Convocatoria:`, 14, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(session?.title || 'Convocatoria Oficial', 45, currentY);

  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de Emisión:`, 120, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(fechaEmision, 153, currentY);

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Examen Base:`, 14, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(session?.writtenExamName || 'Examen Teórico', 45, currentY);

  doc.setFont('helvetica', 'normal');
  doc.text(`Código / Link:`, 120, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(session?.accessCode || session?.id || '—', 153, currentY);

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Dojos Convocados:`, 14, currentY);
  doc.setFont('helvetica', 'bold');
  const splitDojos = doc.splitTextToSize(dojosNombres, pageWidth - 60);
  doc.text(splitDojos, 45, currentY);

  currentY += (splitDojos.length * 4) + 3;

  // 4. Tabla de Aspirantes y Resultados
  const tableData = submissions.map((sub, index) => {
    const isGraded = sub.status === 'graded';
    let resultadoTexto = 'PENDIENTE';
    if (isGraded) {
      resultadoTexto = sub.passed ? 'APROBADO' : 'REPROBADO';
    } else if (sub.closedBySecurity) {
      resultadoTexto = 'ANULADO';
    }

    let seguridadTexto = 'Sin incidencias';
    if (sub.closedBySecurity) {
      seguridadTexto = `Anulado (${sub.securityViolationsCount || 1} salidas)`;
    } else if (sub.securityViolationsCount > 0) {
      seguridadTexto = `${sub.securityViolationsCount} salidas`;
    }

    return [
      (index + 1).toString(),
      sub.studentName || 'Aspirante',
      sub.studentDojo || '—',
      sub.studentRank || '—',
      `${sub.percentage || 0}%`,
      resultadoTexto,
      seguridadTexto
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Aspirante', 'Dojo', 'Grado / Kyu', 'Nota', 'Resultado', 'Protocolo Seguridad']],
    body: tableData.length > 0 ? tableData : [['—', 'Sin registros aún', '—', '—', '—', '—', '—']],
    theme: 'grid',
    headStyles: {
      fillColor: primaryBlue,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: darkGray
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { fontStyle: 'bold', cellWidth: 46 },
      2: { cellWidth: 38 },
      3: { halign: 'center', cellWidth: 26 },
      4: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 24 },
      6: { halign: 'center', cellWidth: 24 }
    },
    alternateRowStyles: {
      fillColor: [248, 249, 252]
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw;
        if (val === 'APROBADO') {
          data.cell.styles.textColor = [16, 120, 60]; // verde
        } else if (val === 'REPROBADO' || val === 'ANULADO') {
          data.cell.styles.textColor = [190, 19, 34]; // rojo
        } else {
          data.cell.styles.textColor = [180, 110, 10]; // ambar
        }
      }
    },
    margin: { left: 14, right: 14 }
  });

  let finalY = doc.lastAutoTable.finalY + 7;

  // Si queda poco espacio para el bloque de firmas y estadísticas, pasar a nueva página
  if (finalY > pageHeight - 65) {
    doc.addPage();
    finalY = 20;
  }

  // 5. Cuadro Resumen Estadístico
  const totalSubmissions = submissions.length;
  const aprobados = submissions.filter(s => s.passed === true).length;
  const reprobados = submissions.filter(s => s.status === 'graded' && s.passed === false).length;
  const pendientes = submissions.filter(s => s.status === 'submitted').length;
  const promedio = totalSubmissions > 0 
    ? Math.round(submissions.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / totalSubmissions) 
    : 0;

  doc.setFillColor(245, 247, 252);
  doc.setDrawColor(215, 220, 235);
  doc.roundedRect(14, finalY, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('RESUMEN ESTADÍSTICO DE LA CONVOCATORIA:', 18, finalY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  const statsText = `Total Aspirantes: ${totalSubmissions}   |   Aprobados: ${aprobados}   |   Reprobados: ${reprobados}   |   Pendientes: ${pendientes}   |   Promedio General: ${promedio}%`;
  doc.text(statsText, 18, finalY + 11.5);

  finalY += 25;

  // 6. Espacio Oficial para Firmas del Tribunal Examinador
  if (finalY > pageHeight - 45) {
    doc.addPage();
    finalY = 30;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryBlue);
  doc.text('TRIBUNAL EXAMINADOR OFICIAL ISKF COSTA RICA:', 14, finalY);

  finalY += 16;
  const colWidth = (pageWidth - 36) / 3;

  // Firma 1: Director Técnico
  doc.setDrawColor(...darkGray);
  doc.setLineWidth(0.4);
  doc.line(14, finalY, 14 + colWidth - 4, finalY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('Director Técnico Nacional', 14 + (colWidth / 2) - 2, finalY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightGray);
  doc.text('ISKF Costa Rica', 14 + (colWidth / 2) - 2, finalY + 7.5, { align: 'center' });

  // Firma 2: Presidente de Mesa
  const col2X = 14 + colWidth + 2;
  doc.line(col2X, finalY, col2X + colWidth - 4, finalY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('Presidente de Mesa Examinadora', col2X + (colWidth / 2) - 2, finalY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightGray);
  doc.text('Grados y Examinaciones', col2X + (colWidth / 2) - 2, finalY + 7.5, { align: 'center' });

  // Firma 3: Sensei Evaluador
  const col3X = col2X + colWidth + 2;
  doc.line(col3X, finalY, col3X + colWidth - 4, finalY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('Sensei Evaluador Responsable', col3X + (colWidth / 2) - 2, finalY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightGray);
  doc.text('Dojo Sede / Convocado', col3X + (colWidth / 2) - 2, finalY + 7.5, { align: 'center' });

  // 7. Pie de Página en todas las páginas
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...lightGray);
    doc.text(
      'Documento Oficial emitido por el Sistema de Examinaciones ISKF Costa Rica • https://iskf-cr.com',
      14,
      pageHeight - 6
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - 14,
      pageHeight - 6,
      { align: 'right' }
    );
  }

  // Descargar el archivo generado con nombre descriptivo y seguro
  const cleanTitle = (session?.title || 'Acta_Examinacion')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 40);
  doc.save(`Acta_Oficial_ISKF_${cleanTitle}.pdf`);
}
