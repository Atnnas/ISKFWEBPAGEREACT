/**
 * Utilidades para manejo automático de viñetas (•) en campos de Observaciones.
 * Inicia inmediatamente con viñeta al escribir el primer carácter, sin esperar Enter,
 * y continúa automáticamente en cada salto de línea.
 */

/**
 * Formatea un texto asegurando que todas las líneas con contenido comiencen con viñeta (• ).
 * Si el texto está vacío o solo contiene viñetas huérfanas, devuelve cadena vacía para mostrar el placeholder.
 */
export function formatWithBullets(text) {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (trimmed === '' || trimmed === '•' || trimmed === '-' || trimmed === '*') return '';

  const lines = text.split('\n');
  const formattedLines = lines.map((line, idx) => {
    // Si la línea está vacía y es la última (ej: recién hecho salto de línea)
    if (line === '' && idx === lines.length - 1) return line;
    // Si la línea está vacía entre renglones
    if (line.trim().length === 0) return '';
    // Si ya empieza con viñeta estándar
    if (line.startsWith('• ')) return line;
    if (line.startsWith('•')) return '• ' + line.slice(1).trimStart();
    // Si usó guion o asterisco
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return '• ' + line.slice(2).trimStart();
    }
    // Agregar viñeta
    return '• ' + line;
  });

  return formattedLines.join('\n');
}

/**
 * Maneja el evento onChange de un textarea o input de observaciones.
 * Inicia automáticamente con '• ' si el usuario escribe desde vacío.
 *
 * @param {React.ChangeEvent<HTMLTextAreaElement|HTMLInputElement>} e
 * @param {string} prevValue
 * @param {function(string): void} onTextChange
 */
export function handleBulletInputChange(e, prevValue, onTextChange) {
  let actualPrevValue = prevValue;
  let actualOnChange = onTextChange;
  if (typeof prevValue === 'function') {
    actualOnChange = prevValue;
    actualPrevValue = e?.currentTarget?.value || '';
  }

  const target = e.currentTarget;
  const rawValue = target.value;

  // Si se borró todo o solo quedó una viñeta/espacio, vaciar para que salga el placeholder
  const trimmed = rawValue.trim();
  if (!rawValue || trimmed === '' || trimmed === '•' || trimmed === '-' || trimmed === '*') {
    if (typeof actualOnChange === 'function') actualOnChange('');
    return;
  }

  const isStartingFromEmpty = !actualPrevValue || actualPrevValue.trim() === '' || actualPrevValue.trim() === '•';
  const formatted = formatWithBullets(rawValue);

  if (typeof actualOnChange === 'function') actualOnChange(formatted);

  // Si estaba vacío y el usuario acaba de escribir el primer carácter, posicionar cursor al final
  if (isStartingFromEmpty && formatted.startsWith('• ')) {
    const newPos = formatted.length;
    setTimeout(() => {
      if (target) {
        try {
          target.setSelectionRange(newPos, newPos);
        } catch {
          // input element could be unmounted
        }
      }
    }, 0);
  }
}

/**
 * Maneja el evento onKeyDown para salto de línea con viñeta automática o limpieza de viñeta vacía.
 *
 * @param {React.KeyboardEvent<HTMLTextAreaElement>} e
 * @param {string|function(string): void} currentValue
 * @param {function(string): void} [onTextChange]
 */
export function handleBulletKeyDown(e, currentValue, onTextChange) {
  let actualOnChange = onTextChange;
  if (typeof currentValue === 'function') {
    actualOnChange = currentValue;
  }
  if (typeof actualOnChange !== 'function') return;
  if (e.key === 'Enter') {
    e.preventDefault();
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;

    const textBefore = value.substring(0, selectionStart);
    const textAfter = value.substring(selectionEnd);
    const linesBefore = textBefore.split('\n');
    const currentLine = linesBefore[linesBefore.length - 1] || '';

    // Si la línea actual es solo una viñeta vacía '• ' o '•', removerla (terminar lista)
    if (currentLine.trim() === '•' || currentLine.trim() === '-' || currentLine.trim() === '*') {
      const lineStartIndex = selectionStart - currentLine.length;
      const newValue = value.substring(0, lineStartIndex) + textAfter;
      onTextChange(newValue);
      setTimeout(() => {
        if (textarea) textarea.selectionStart = textarea.selectionEnd = lineStartIndex;
      }, 0);
      return;
    }

    // Salto de línea con nueva viñeta
    const insertion = (textBefore.trim().length === 0 && !textBefore.includes('•'))
      ? '• '
      : '\n• ';

    const newValue = textBefore + insertion + textAfter;
    onTextChange(newValue);
    setTimeout(() => {
      if (textarea) {
        const nextPos = selectionStart + insertion.length;
        textarea.selectionStart = textarea.selectionEnd = nextPos;
      }
    }, 0);
  } else if (e.key === 'Backspace') {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;

    // Si el cursor está en una viñeta sola al inicio o tras salto de línea
    if (selectionStart === selectionEnd) {
      const textBefore = value.substring(0, selectionStart);
      const lines = textBefore.split('\n');
      const currentLine = lines[lines.length - 1];

      if (currentLine === '• ' && selectionStart <= 2) {
        e.preventDefault();
        onTextChange('');
      }
    }
  }
}
