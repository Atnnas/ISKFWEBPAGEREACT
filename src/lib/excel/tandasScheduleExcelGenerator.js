/**
 * Genera y descarga el reporte en formato Excel (.xls) compatible con Microsoft Excel, Google Sheets y LibreOffice Calc.
 * Lista de estudiantes por tanda con hora de inicio, hora final y datos de aspirante.
 */
import { formatDateDDMMAAAA } from '../utils/dateFormatter.js';
import { getNextRank } from '../constants/kyuRanks.js';

export function downloadTandasScheduleXLS({ call, tandas = [], students = [] }) {
  const studentsMap = {};
  (students || []).forEach(st => {
    studentsMap[String(st._id || st.id)] = st;
  });

  const allAssignedIds = tandas.flatMap(t => (t.studentIds || []).map(String));
  const uniqueStudentIds = [...new Set(allAssignedIds)];
  const totalStudents = uniqueStudentIds.length;

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
              <x:Name>Tandas y Horarios ISKF</x:Name>
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
        .th-col { background-color: #2D2E83; color: #ffffff; font-weight: bold; text-align: center; font-size: 9.5pt; }
        .center-cell { text-align: center; }
      </style>
    </head>
    <body>
      <!-- Membrete Oficial -->
      <table>
        <tr>
          <td colspan="7" class="header-main">ISKF COSTA RICA • FEDERACIÓN INTERNACIONAL DE SHOTOKAN KARATE</td>
        </tr>
        <tr>
          <td colspan="7" class="header-sub">CRONOGRAMA OFICIAL DE TANDAS Y ESTUDIANTES CON HORARIOS</td>
        </tr>
      </table>

      <!-- Datos del Evento -->
      <table>
        <tr>
          <td colspan="2" class="title-row">Convocatoria:</td>
          <td colspan="5">${call.title || 'Examen Técnico de Promoción'}</td>
        </tr>
        <tr>
          <td colspan="2" class="title-row">Dojo / Escuela:</td>
          <td colspan="5">${call.dojoName || 'Dojo Afiliado'}</td>
        </tr>
        <tr>
          <td colspan="2" class="title-row">Sensei a Cargo:</td>
          <td colspan="2">${call.dojoSensei || 'Sensei del Dojo'}</td>
          <td class="title-row">Fecha:</td>
          <td colspan="2">${dateStr}</td>
        </tr>
        <tr>
          <td colspan="2" class="title-row">Total Tandas:</td>
          <td colspan="2">${tandas.length} tandas</td>
          <td class="title-row">Total Estudiantes:</td>
          <td colspan="2">${totalStudents} estudiantes</td>
        </tr>
      </table>

      <!-- Listado Detallado de Tandas -->
      <table>
        <thead>
          <tr>
            <th class="th-col">Tanda</th>
            <th class="th-col">Día</th>
            <th class="th-col">Hora Inicio</th>
            <th class="th-col">Hora Final</th>
            <th class="th-col">N°</th>
            <th class="th-col">Estudiante</th>
            <th class="th-col">Grado Actual</th>
            <th class="th-col">Aspira a</th>
          </tr>
        </thead>
        <tbody>
  `;

  tandas.forEach((tanda, tIdx) => {
    const tandaName = tanda.blockName || `Tanda ${tIdx + 1}`;
    const startTime = tanda.startTime || 'Por definir';
    const endTime = tanda.endTime || 'Por definir';
    const dayLabel = `Día ${Number(tanda.day) === 2 ? 2 : 1}`;
    const studentList = (tanda.studentIds || []).map(id => studentsMap[String(id)]).filter(Boolean);

    if (studentList.length === 0) {
      html += `
        <tr>
          <td class="center-cell" style="font-weight: bold;">${tandaName}</td>
          <td class="center-cell">${dayLabel}</td>
          <td class="center-cell">${startTime}</td>
          <td class="center-cell">${endTime}</td>
          <td colspan="4" style="text-align: center; color: #64748b; font-style: italic;">Sin estudiantes asignados en esta tanda</td>
        </tr>
      `;
    } else {
      studentList.forEach((st, sIdx) => {
        const sId = String(st._id || st.id);
        const studentAspirant = (call.aspirants || []).find(a => String(a.studentId) === sId);
        const currentRank = studentAspirant?.currentRank || st.currentRank || '10° Kyu (Cinta Blanca)';
        const targetRank = (studentAspirant?.targetRank && studentAspirant.targetRank !== currentRank)
          ? studentAspirant.targetRank
          : (st.targetRank && st.targetRank !== currentRank)
          ? st.targetRank
          : (getNextRank(currentRank) || currentRank || 'Por definir');

        html += `
          <tr>
            ${sIdx === 0 ? `<td rowspan="${studentList.length}" class="center-cell" style="font-weight: bold; background-color: #f8fafc;">${tandaName}</td>` : ''}
            ${sIdx === 0 ? `<td rowspan="${studentList.length}" class="center-cell" style="background-color: #f8fafc;">${dayLabel}</td>` : ''}
            ${sIdx === 0 ? `<td rowspan="${studentList.length}" class="center-cell" style="font-weight: bold; background-color: #f8fafc;">${startTime}</td>` : ''}
            ${sIdx === 0 ? `<td rowspan="${studentList.length}" class="center-cell" style="font-weight: bold; background-color: #f8fafc; color: #b45309;">${endTime}</td>` : ''}
            <td class="center-cell" style="color: #64748b;">${sIdx + 1}</td>
            <td style="font-weight: bold;">${st.name || 'Estudiante'}</td>
            <td>${currentRank}</td>
            <td style="font-weight: bold; color: #2D2E83;">➔ ${targetRank}</td>
          </tr>
        `;
      });
    }
  });

  html += `
        </tbody>
      </table>

      <!-- Pie Informativo -->
      <table style="margin-top: 15px;">
        <tr>
          <td colspan="7" style="text-align: center; font-size: 8.5pt; color: #64748b;">
            Documento Oficial generado automáticamente por el Sistema de Exámenes Técnicos de ISKF Costa Rica.
            Horarios estimados sujetos al desarrollo técnico en el tatami.
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanTitle = (call.title || 'Horario_Tandas').replace(/[^a-zA-Z0-9_-]+/g, '_');
  a.download = `${cleanTitle}_Horario_Tandas.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
