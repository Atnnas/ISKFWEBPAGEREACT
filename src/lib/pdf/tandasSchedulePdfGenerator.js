/**
 * Genera y descarga el Cronograma Oficial de Tandas y Estudiantes de Examen en formato PDF.
 * Incluye membrete oficial ISKF Costa Rica, datos del dojo, hora de inicio y fin, y estudiantes por tanda.
 */
import { formatDateTimeDDMMAAAA, formatDateDDMMAAAA } from '../utils/dateFormatter.js';
import { getNextRank } from '../constants/kyuRanks.js';

export async function generateTandasSchedulePDF({ call, tandas = [], students = [] }) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colores Institucionales ISKF
  const primaryBlue = [45, 46, 131];   // #2D2E83
  const primaryRed = [190, 19, 34];    // #BE1322
  const darkGray = [33, 37, 41];
  const lightGray = [108, 117, 125];

  // Helper para mapa de estudiantes por ID
  const studentsMap = {};
  (students || []).forEach(st => {
    studentsMap[String(st._id || st.id)] = st;
  });

  // Cálculo de totales
  const allAssignedIds = tandas.flatMap(t => (t.studentIds || []).map(String));
  const uniqueStudentIds = [...new Set(allAssignedIds)];
  const totalStudents = uniqueStudentIds.length;

  // 1. Barra superior decorativa bicolor
  doc.setFillColor(...primaryBlue);
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(...primaryRed);
  doc.rect(0, 5, pageWidth, 2, 'F');

  // 2. Encabezado Institucional
  let currentY = 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryBlue);
  doc.text('ISKF COSTA RICA', 14, currentY);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...primaryRed);
  doc.text('FEDERACIÓN INTERNACIONAL DE SHOTOKAN KARATE', 14, currentY + 4.5);

  doc.setFontSize(7.5);
  doc.setTextColor(...lightGray);
  doc.text('COMISIÓN TÉCNICA NACIONAL • CRONOGRAMA DE TANDAS Y HORARIOS', 14, currentY + 8.5);

  doc.setFontSize(7.5);
  doc.text(`Impreso: ${formatDateTimeDDMMAAAA(new Date())}`, pageWidth - 14, currentY, { align: 'right' });

  // Línea divisoria
  currentY += 12;
  doc.setDrawColor(220, 224, 230);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);

  // 3. Ficha Informativa del Examen
  currentY += 5;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'F');
  doc.setDrawColor(222, 226, 230);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('Dojo Convocado:', 18, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text(String(call.dojoName || 'Dojo Afiliado ISKF'), 44, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('Sensei a Cargo:', 18, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text(String(call.dojoSensei || 'Sensei del Dojo'), 44, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('Convocatoria:', 18, currentY + 17.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text(String(call.title || 'Examen Técnico de Promoción de Grado'), 44, currentY + 17.5);

  // Columna Derecha de Ficha Técnica
  const rightColX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('Fecha:', rightColX, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  const dateStr = call.isMultiDay && call.examEndDate
    ? `Día 1: ${formatDateDDMMAAAA(call.examDate)} • Día 2: ${formatDateDDMMAAAA(call.examEndDate)}`
    : formatDateDDMMAAAA(call.examDate);
  doc.text(dateStr, rightColX + 16, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('Hora Inicio:', rightColX, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text(String(call.startTime || '09:00 AM'), rightColX + 22, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('Tandas / Total:', rightColX, currentY + 17.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text(`${tandas.length} tandas • ${totalStudents} estudiantes`, rightColX + 26, currentY + 17.5);

  currentY += 27;

  // 4. Tablas de Tandas de Examen
  tandas.forEach((tanda, tIdx) => {
    // Si queda poco espacio para la siguiente tanda, crear nueva página
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 20;
    }

    const tandaName = tanda.blockName || `Tanda ${tIdx + 1}`;
    const startTime = tanda.startTime || 'Por definir';
    const endTime = tanda.endTime || 'Por definir';
    const dayLabel = call.isMultiDay ? `Día ${Number(tanda.day) === 2 ? 2 : 1} • ` : '';
    const studentList = (tanda.studentIds || []).map(id => studentsMap[String(id)]).filter(Boolean);

    // Banner de la Tanda
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(14, currentY, pageWidth - 28, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`🥋 ${tandaName.toUpperCase()}`, 18, currentY + 4.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 158, 11); // amber
    doc.text(`🕒 ${dayLabel}Inicio: ${startTime}  |  Fin: ${endTime}`, 65, currentY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(`${studentList.length} estudiantes`, pageWidth - 40, currentY + 4.8);

    currentY += 8;

    // Filas de la Tanda: #, Estudiante, Grado Actual, Aspira a, Horario Tanda
    const tableBody = studentList.map((st, idx) => {
      const sId = String(st._id || st.id);
      const studentAspirant = (call.aspirants || []).find(a => String(a.studentId) === sId);
      const currentRank = studentAspirant?.currentRank || st.currentRank || '10° Kyu (Cinta Blanca)';
      const targetRank = (studentAspirant?.targetRank && studentAspirant.targetRank !== currentRank)
        ? studentAspirant.targetRank
        : (st.targetRank && st.targetRank !== currentRank)
        ? st.targetRank
        : (getNextRank(currentRank) || currentRank || 'Por definir');

      return [
        String(idx + 1),
        st.name || 'Estudiante',
        currentRank,
        targetRank,
        `${startTime} - ${endTime}`
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: 14, right: 14 },
      head: [['#', 'Estudiante', 'Grado Actual', 'Aspira a', 'Horario de Tanda']],
      body: tableBody.length > 0 ? tableBody : [['-', 'No hay estudiantes asignados a esta tanda', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: primaryBlue,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 2
      },
      styles: {
        fontSize: 8,
        cellPadding: 1.8,
        textColor: darkGray,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 65, fontStyle: 'bold' },
        2: { cellWidth: 45 },
        3: { cellWidth: 45 },
        4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }
      }
    });

    currentY = doc.lastAutoTable.finalY + 7;
  });

  // Pie de página institucional en todas las páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...lightGray);
    doc.text(
      'ISKF Costa Rica • International Shotokan Karate Federation • Documento Oficial de Convocatoria',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  // Descargar archivo PDF
  const cleanTitle = (call.title || 'Cronograma_Tandas').replace(/[^a-zA-Z0-9_-]+/g, '_');
  doc.save(`${cleanTitle}_ISKF_Horario.pdf`);
}
