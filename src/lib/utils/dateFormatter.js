/**
 * ISKF Costa Rica - Utilidades Universales de Formato de Fechas
 * Política institucional: Todas las fechas se presentan en formato dd/mm/yyyy.
 */

export function parseCustomDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const str = String(val).trim();

  // Formato ISO con 'T' (ej. 2026-02-20T00:00:00.000Z)
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      // Usar fecha UTC para prevenir desfases por zona horaria local (UTC-6)
      return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
  }

  // Formato DD/MM/AAAA o DD-MM-AAAA
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);

    // Si viene por error como MM/DD/AAAA (primer num <= 12 y segundo num > 12)
    if (day <= 12 && (month + 1) > 12) {
      const realDay = month + 1;
      month = day - 1;
      day = realDay;
    }

    const d = new Date(year, month, day);
    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
      return d;
    }
    return null;
  }

  // Formato YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
      return d;
    }
    return null;
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function calculateAge(birthDateInput) {
  const birthDate = parseCustomDate(birthDateInput);
  if (!birthDate) return null;

  const today = new Date();
  if (birthDate > today) return null;

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

/**
 * Convierte cualquier fecha a formato dd/mm/yyyy
 * Ej: '2026-11-15' -> '15/11/2026'
 *     '11/24/2007' -> '24/11/2007'
 */
export function formatDateDDMMAAAA(dateInput) {
  if (!dateInput || dateInput === 'No indicada' || dateInput === 'No registrada') return '';
  const str = String(dateInput).trim();

  // Si ya es DD/MM/AAAA
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const year = dmyMatch[3];
    // Invertir si vino como MM/DD/AAAA
    if (p1 <= 12 && p2 > 12) {
      return `${String(p2).padStart(2, '0')}/${String(p1).padStart(2, '0')}/${year}`;
    }
    return `${String(p1).padStart(2, '0')}/${String(p2).padStart(2, '0')}/${year}`;
  }

  // Si es YYYY-MM-DD o ISO
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = String(parseInt(ymdMatch[2], 10)).padStart(2, '0');
    const day = String(parseInt(ymdMatch[3], 10)).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  // Fallback con Date
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return str;
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formatea fecha y hora completa en formato dd/mm/yyyy hh:mm AM/PM
 * Ej: '15/11/2026 09:30 AM'
 */
export function formatDateTimeDDMMAAAA(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return formatDateDDMMAAAA(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const strHours = String(hours).padStart(2, '0');

  return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
}

export function toCostaRicaDate(val) {
  return formatDateDDMMAAAA(val);
}

export function toIsoDate(val) {
  if (!val || val === 'No registrada' || val === 'No indicada') return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (str.includes('T')) {
    return str.split('T')[0];
  }
  const match = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (match) {
    let p1 = match[1];
    let p2 = match[2];
    const year = match[3];
    // Si viene MM/DD/AAAA
    if (parseInt(p1, 10) <= 12 && parseInt(p2, 10) > 12) {
      return `${year}-${p1.padStart(2, '0')}-${p2.padStart(2, '0')}`;
    }
    return `${year}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
  }
  return '';
}
