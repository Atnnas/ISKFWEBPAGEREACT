/**
 * Genera y descarga el Cronograma Oficial de Tandas y Control de Pagos de Examen en formato PDF.
 * Incluye membrete oficial ISKF Costa Rica, datos del dojo, horarios, aspirantes por tanda y balance de recaudación.
 */
import { formatDateTimeDDMMAAAA, formatDateDDMMAAAA } from '../utils/dateFormatter.js';
import { getNextRank } from '../constants/kyuRanks.js';

export async function generateTandasSchedulePDF({ call, tandas = [], students = [], paidStudentIds = [], costConfig = null }) {
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
  const emeraldGreen = [16, 185, 129];

  // Helper para mapa de estudiantes por ID
  const studentsMap = {};
  (students || []).forEach(st => {
    studentsMap[String(st._id || st.id)] = st;
  });

  // Costo por alumno
  const sCost = Number(costConfig?.senseiDojo) || 0;
  const dCost = Number(costConfig?.directorGeneral) || 0;
  const iCost = Number(costConfig?.iskfCr) || 0;
  const unitCost = Number(costConfig?.total) || (sCost + dCost + iCost) || 30000;

  // Cálculo de totales
  const allAssignedIds = tandas.flatMap(t => (t.studentIds || []).map(String));
  const uniqueStudentIds = [...new Set(allAssignedIds)];
  const totalStudents = uniqueStudentIds.length;
  const paidSet = new Set((paidStudentIds || []).map(String));
  const paidCount = uniqueStudentIds.filter(id => paidSet.has(id)).length;
  const pendingCount = Math.max(0, totalStudents - paidCount);
  const totalCollected = paidCount * unitCost;
  const totalExpected = totalStudents * unitCost;

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
  doc.text('INTERNATIONAL SHOTOKAN KARATE FEDERATION', pageWidth / 2, currentY, { align: 'center' });

  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryRed);
  doc.text('ISKF COSTA RICA • COMISIÓN TÉCNICA NACIONAL DE GRADOS', pageWidth / 2, currentY, { align: 'center' });

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkGray);
  doc.text('CRONOGRAMA OFICIAL DE TANDAS Y CONTROL DE ARANCELES', pageWidth / 2, currentY, { align: 'center' });

  // Línea divisoria elegante
  currentY += 3.5;
  doc.setDrawColor(210, 215, 225);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);

  // 3. Ficha Técnica de la Convocatoria
  currentY += 5;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 24, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryBlue);
  doc.text('Dojo:', 18, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text(String(call.dojoName || 'Dojo ISKF'), 35, currentY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('Sensei a Cargo:', 18, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text(String(call.dojoSensei || 'Sensei del Dojo'), 46, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryBlue);
  doc.text('Sede / Lugar:', 18, currentY + 17.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text(String(call.location || 'Instalaciones del Dojo'), 42, currentY + 17.5);

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
  doc.text(`${tandas.length} tandas • ${totalStudents} karatecas convocados`, rightColX + 26, currentY + 17.5);

  currentY += 28;

  // 4. Panel Resumen de Recaudación Financiera
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, 'F');
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(14, currentY, pageWidth - 28, 14, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryBlue);
  doc.text('BALANCE DE ARANCELES DE EXAMEN:', 18, currentY + 5);

  doc.setFontSize(8);
  doc.setTextColor(...darkGray);
  doc.text(`Arancel Unitario: ₡${unitCost.toLocaleString('es-CR')}`, 18, currentY + 10);

  const finCol2 = pageWidth / 2 - 15;
  doc.text(`Pagados: ${paidCount} de ${totalStudents} (${totalStudents > 0 ? Math.round((paidCount / totalStudents) * 100) : 0}%)`, finCol2, currentY + 5);
  doc.text(`Pendientes: ${pendingCount} karatecas`, finCol2, currentY + 10);

  const finCol3 = pageWidth - 65;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...emeraldGreen);
  doc.text(`Recaudado: ₡${totalCollected.toLocaleString('es-CR')}`, finCol3, currentY + 5);
  doc.setTextColor(...primaryBlue);
  doc.text(`Total Esperado: ₡${totalExpected.toLocaleString('es-CR')}`, finCol3, currentY + 10);

  currentY += 18;

  // 5. Tablas de Tandas de Examen
  tandas.forEach((tanda, tIdx) => {
    // Si queda poco espacio para la siguiente tanda, crear nueva página
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }

    const tandaName = tanda.blockName || `Tanda ${tIdx + 1}`;
    const timeLabel = tanda.startTime ? `${tanda.startTime}${tanda.endTime ? ` - ${tanda.endTime}` : ''}` : 'Horario a Definir';
    const dayLabel = call.isMultiDay ? `Día ${Number(tanda.day) === 2 ? 2 : 1} • ` : '';
    const studentList = (tanda.studentIds || []).map(id => studentsMap[String(id)]).filter(Boolean);
    const tandaStatus = tanda.status === 'evaluada' ? '✓ Evaluada' : tanda.status === 'en_tatami' ? '⚡ En Tatami' : 'Pendiente';

    // Banner de la Tanda
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(14, currentY, pageWidth - 28, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`🥋 ${tandaName.toUpperCase()} (${tandaStatus})`, 18, currentY + 4.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 158, 11); // amber
    doc.text(`🕒 ${dayLabel}${timeLabel}`, 70, currentY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(`${studentList.length} aspirantes`, pageWidth - 45, currentY + 4.8);

    currentY += 8;

    // Filas de la Tanda
    const tableBody = studentList.map((st, idx) => {
      const sId = String(st._id || st.id);
      const isPaid = paidSet.has(sId);
      const studentAspirant = (call.aspirants || []).find(a => String(a.studentId) === sId);
      const targetRank = (studentAspirant?.targetRank && studentAspirant.targetRank !== st.currentRank)
        ? studentAspirant.targetRank
        : (st.targetRank && st.targetRank !== st.currentRank)
        ? st.targetRank
        : (getNextRank(st.currentRank) || st.currentRank || 'Por definir');

      return [
        String(idx + 1),
        st.name || 'Karateca',
        st.currentRank || '10° Kyu',
        targetRank || '9° Kyu',
        st.hasSpecialCondition ? `Cond. Especial` : 'Regular',
        `₡${unitCost.toLocaleString('es-CR')}`,
        isPaid ? '✓ PAGADO' : '○ PENDIENTE'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: 14, right: 14 },
      head: [['#', 'Karateca', 'Grado Actual', 'Aspira a', 'Tipo', 'Arancel', 'Estado Pago']],
      body: tableBody.length > 0 ? tableBody : [['-', 'No hay alumnos asignados a esta tanda', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: primaryBlue,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 1.8
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.5,
        textColor: darkGray,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 50, fontStyle: 'bold' },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 6) {
          if (data.cell.raw === '✓ PAGADO') {
            data.cell.styles.textColor = [16, 185, 129]; // emerald
          } else if (data.cell.raw === '○ PENDIENTE') {
            data.cell.styles.textColor = [220, 38, 38]; // red
          }
        }
      }
    });

    currentY = doc.lastAutoTable.finalY + 6;
  });

  // 6. Pie de Página y Firmas de Control
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 25;
  }

  currentY += 6;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...lightGray);
  doc.text(`Documento emitido el ${formatDateTimeDDMMAAAA(new Date())} por la plataforma oficial de ISKF Costa Rica.`, pageWidth / 2, currentY, { align: 'center' });

  currentY += 12;
  const sigLineY = currentY;
  const sig1X = 35;
  const sig2X = pageWidth - 75;

  doc.setDrawColor(180, 185, 195);
  doc.setLineWidth(0.4);
  doc.line(sig1X, sigLineY, sig1X + 45, sigLineY);
  doc.line(sig2X, sigLineY, sig2X + 45, sigLineY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryBlue);
  doc.text('Firma y Sello del Dojo', sig1X + 22.5, sigLineY + 4, { align: 'center' });
  doc.text('Tribunal Examinador ISKF', sig2X + 22.5, sigLineY + 4, { align: 'center' });

  // Guardar y descargar
  const safeDojo = (call.dojoName || 'Dojo').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDate = (call.examDate || '').replace(/[^0-9]/g, '');
  const fileName = `Cronograma_Tandas_ISKF_${safeDojo}_${safeDate || 'Examen'}.pdf`;

  doc.save(fileName);
  return { success: true, fileName };
}
