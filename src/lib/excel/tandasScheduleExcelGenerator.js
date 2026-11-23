/**
 * Genera y descarga el reporte en formato Excel (.xls) compatible con Microsoft Excel, Google Sheets y LibreOffice Calc.
 * Incluye formato condicional visual, encabezados institucionales, desglose por tanda y fórmulas de totales.
 */
import { formatDateDDMMAAAA, formatDateTimeDDMMAAAA, calculateAge } from '../utils/dateFormatter.js';
import { getNextRank } from '../constants/kyuRanks.js';

export function downloadTandasScheduleXLS({ call, tandas = [], students = [], paidStudentIds = [], costConfig = null }) {
  const studentsMap = {};
  (students || []).forEach(st => {
    studentsMap[String(st._id || st.id)] = st;
  });

  const paidSet = new Set((paidStudentIds || []).map(String));

  // Arancel
  const sCost = Number(costConfig?.senseiDojo) || 0;
  const dCost = Number(costConfig?.directorGeneral) || 0;
  const iCost = Number(costConfig?.iskfCr) || 0;
  const unitCost = Number(costConfig?.total) || (sCost + dCost + iCost) || 30000;

  // Estadísticas globales
  const allAssignedIds = tandas.flatMap(t => (t.studentIds || []).map(String));
  const uniqueStudentIds = [...new Set(allAssignedIds)];
  const totalStudents = uniqueStudentIds.length;
  const paidCount = uniqueStudentIds.filter(id => paidSet.has(id)).length;
  const pendingCount = Math.max(0, totalStudents - paidCount);
  const totalCollected = paidCount * unitCost;
  const totalExpected = totalStudents * unitCost;

  const dateStr = call.isMultiDay && call.examEndDate
    ? `Día 1: ${formatDateDDMMAAAA(call.examDate)} - Día 2: ${formatDateDDMMAAAA(call.examEndDate)}`
    : formatDateDDMMAAAA(call.examDate);

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Tandas y Pagos ISKF</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; color: #1e293b; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10pt; }
        .header-main { background-color: #2D2E83; color: #ffffff; font-size: 14pt; font-weight: bold; text-align: center; }
        .header-sub { background-color: #be1322; color: #ffffff; font-size: 10pt; font-weight: bold; text-align: center; }
        .title-row { background-color: #f1f5f9; font-weight: bold; }
        .tanda-header { background-color: #1e293b; color: #ffffff; font-weight: bold; font-size: 11pt; }
        .th-col { background-color: #e2e8f0; font-weight: bold; color: #0f172a; text-align: center; }
        .paid-badge { background-color: #d1fae5; color: #065f46; font-weight: bold; text-align: center; }
        .pending-badge { background-color: #fee2e2; color: #991b1b; font-weight: bold; text-align: center; }
        .num-cell { text-align: right; }
        .center-cell { text-align: center; }
        .summary-box { background-color: #f8fafc; border: 2px solid #2D2E83; }
        .total-row { background-color: #f1f5f9; font-weight: bold; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="11" class="header-main">INTERNATIONAL SHOTOKAN KARATE FEDERATION</td>
        </tr>
        <tr>
          <td colspan="11" class="header-sub">ISKF COSTA RICA • COMISIÓN TÉCNICA NACIONAL DE GRADOS</td>
        </tr>
        <tr>
          <td colspan="11" style="text-align: center; font-size: 12pt; font-weight: bold; background-color: #ffffff; padding: 8px;">
            CRONOGRAMA OFICIAL DE TANDAS Y REGISTRO DE ARANCELES DE EXAMEN
          </td>
        </tr>
        <tr>
          <td colspan="2" class="title-row">Dojo Convocado:</td>
          <td colspan="4">${call.dojoName || 'Dojo ISKF'}</td>
          <td colspan="2" class="title-row">Fecha(s):</td>
          <td colspan="3">${dateStr}</td>
        </tr>
        <tr>
          <td colspan="2" class="title-row">Sensei a Cargo:</td>
          <td colspan="4">${call.dojoSensei || 'Sensei del Dojo'}</td>
          <td colspan="2" class="title-row">Hora de Inicio:</td>
          <td colspan="3">${call.startTime || '09:00 AM'}</td>
        </tr>
        <tr>
          <td colspan="2" class="title-row">Sede / Ubicación:</td>
          <td colspan="4">${call.location || 'Instalaciones del Dojo'}</td>
          <td colspan="2" class="title-row">Emisión:</td>
          <td colspan="3">${formatDateTimeDDMMAAAA(new Date())}</td>
        </tr>
      </table>

      <!-- Resumen Financiero de Recaudación -->
      <table class="summary-box">
        <tr style="background-color: #2D2E83; color: #ffffff; font-weight: bold;">
          <td colspan="4" style="text-align: center;">RESUMEN DE CONTROL DE ARANCELES DE EXAMEN</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Total Karatecas Convocados:</td>
          <td class="num-cell" style="font-weight: bold;">${totalStudents}</td>
          <td style="font-weight: bold;">Arancel Unitario por Alumno:</td>
          <td class="num-cell" style="font-weight: bold;">₡${unitCost.toLocaleString('es-CR')}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Karatecas con Pago Registrado:</td>
          <td class="num-cell" style="font-weight: bold; color: #065f46;">${paidCount} (${totalStudents > 0 ? Math.round((paidCount / totalStudents) * 100) : 0}%)</td>
          <td style="font-weight: bold; color: #065f46;">TOTAL DINERO RECAUDADO:</td>
          <td class="num-cell" style="font-weight: bold; font-size: 12pt; color: #065f46;">₡${totalCollected.toLocaleString('es-CR')}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Karatecas Pendientes de Pago:</td>
          <td class="num-cell" style="font-weight: bold; color: #991b1b;">${pendingCount}</td>
          <td style="font-weight: bold; color: #2D2E83;">MONTO TOTAL ESPERADO:</td>
          <td class="num-cell" style="font-weight: bold; font-size: 12pt; color: #2D2E83;">₡${totalExpected.toLocaleString('es-CR')}</td>
        </tr>
      </table>

      <!-- Listado Detallado de Tandas -->
      <table>
        <thead>
          <tr>
            <th class="th-col">Tanda</th>
            <th class="th-col">Día</th>
            <th class="th-col">Horario</th>
            <th class="th-col">N°</th>
            <th class="th-col">Karateca</th>
            <th class="th-col">Cinturón Actual</th>
            <th class="th-col">Aspira a</th>
            <th class="th-col">Edad</th>
            <th class="th-col">Condición</th>
            <th class="th-col">Arancel (₡)</th>
            <th class="th-col">Estado de Pago</th>
          </tr>
        </thead>
        <tbody>
  `;

  tandas.forEach((tanda, tIdx) => {
    const tandaName = tanda.blockName || `Tanda ${tIdx + 1}`;
    const timeLabel = tanda.startTime ? `${tanda.startTime}${tanda.endTime ? ` - ${tanda.endTime}` : ''}` : 'Por definir';
    const dayLabel = `Día ${Number(tanda.day) === 2 ? 2 : 1}`;
    const studentList = (tanda.studentIds || []).map(id => studentsMap[String(id)]).filter(Boolean);

    if (studentList.length === 0) {
      html += `
        <tr>
          <td class="center-cell" style="font-weight: bold;">${tandaName}</td>
          <td class="center-cell">${dayLabel}</td>
          <td class="center-cell">${timeLabel}</td>
          <td colspan="8" style="text-align: center; color: #64748b; font-style: italic;">Sin karatecas asignados en esta tanda</td>
        </tr>
      `;
      return;
    }

    studentList.forEach((st, sIdx) => {
      const sId = String(st._id || st.id);
      const isPaid = paidSet.has(sId);
      const studentAspirant = (call.aspirants || []).find(a => String(a.studentId) === sId);
      const currentRank = studentAspirant?.currentRank || st.currentRank || '10° Kyu (Cinta Blanca)';
      const targetRank = (studentAspirant?.targetRank && studentAspirant.targetRank !== currentRank)
        ? studentAspirant.targetRank
        : (st.targetRank && st.targetRank !== currentRank)
        ? st.targetRank
        : (getNextRank(currentRank) || currentRank || 'Por definir');
      const age = st.birthDate ? calculateAge(st.birthDate) : '';

      html += `
        <tr>
          <td class="center-cell" style="font-weight: bold;">${tandaName}</td>
          <td class="center-cell">${dayLabel}</td>
          <td class="center-cell">${timeLabel}</td>
          <td class="center-cell" style="font-weight: bold;">${sIdx + 1}</td>
          <td style="font-weight: bold;">${st.name || ''}</td>
          <td>${currentRank}</td>
          <td>${targetRank || ''}</td>
          <td class="center-cell">${age !== null && age !== '' ? `${age} años` : ''}</td>
          <td class="center-cell">${st.hasSpecialCondition ? (st.specialCondition || 'Especial') : 'Regular'}</td>
          <td class="num-cell">₡${unitCost.toLocaleString('es-CR')}</td>
          <td class="${isPaid ? 'paid-badge' : 'pending-badge'}">${isPaid ? 'PAGADO' : 'PENDIENTE'}</td>
        </tr>
      `;
    });
  });

  html += `
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="9" style="text-align: right; font-weight: bold;">TOTAL ARANCELES DE ASPIRANTES ASIGNADOS:</td>
            <td class="num-cell" style="font-weight: bold;">₡${totalExpected.toLocaleString('es-CR')}</td>
            <td class="center-cell" style="font-weight: bold; color: #065f46;">Recaudado: ₡${totalCollected.toLocaleString('es-CR')}</td>
          </tr>
        </tfoot>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeDojo = (call.dojoName || 'Dojo').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDate = (call.examDate || '').replace(/[^0-9]/g, '');
  a.href = url;
  a.download = `Tandas_Horarios_ISKF_${safeDojo}_${safeDate || 'Examen'}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { success: true };
}
