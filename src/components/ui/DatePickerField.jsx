"use client";

import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { toCostaRicaDate, toIsoDate } from '../../lib/utils/dateFormatter';

/**
 * Campo de selección de fecha garantizado en formato costarricense (DD/MM/AAAA).
 * 
 * - Muestra siempre la fecha en formato DD/MM/AAAA (día primero, mes segundo).
 * - Soporta autoguionado al escribir directamente números (ej. 15042026 -> 15/04/2026).
 * - Incluye botón interactivo de calendario que abre el selector visual del navegador.
 * - Sincroniza bidireccionalmente sin corrimiento de días ni zonas horarias.
 */
export default function DatePickerField({
  value = '',
  onChange,
  placeholder = 'DD/MM/AAAA',
  required = false,
  className = '',
  inputClassName = '',
  id,
  name
}) {
  const nativePickerRef = useRef(null);

  // El valor visual SIEMPRE se formatea a DD/MM/AAAA
  const displayValue = toCostaRicaDate(value) || '';

  const handleOpenPicker = () => {
    if (nativePickerRef.current) {
      if (typeof nativePickerRef.current.showPicker === 'function') {
        try {
          nativePickerRef.current.showPicker();
          return;
        } catch {
          // Fallback si el navegador restringe showPicker()
        }
      }
      nativePickerRef.current.focus();
    }
  };

  const handleNativeChange = (e) => {
    const isoVal = e.target.value; // YYYY-MM-DD del date picker
    if (!isoVal) {
      if (typeof onChange === 'function') onChange('');
      return;
    }
    const crDate = toCostaRicaDate(isoVal);
    if (typeof onChange === 'function') {
      onChange(crDate);
    }
  };

  const handleTextChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length > 4) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)}`;
    } else if (raw.length > 2) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    if (typeof onChange === 'function') {
      onChange(formatted);
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Campo visible para el usuario: SIEMPRE DD/MM/AAAA */}
      <input
        id={id}
        type="text"
        required={required}
        maxLength={10}
        value={displayValue}
        onChange={handleTextChange}
        placeholder={placeholder}
        className={`w-full pl-3 pr-9 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-900 focus:bg-white focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] outline-hidden shadow-2xs transition-all placeholder:text-gray-400 placeholder:font-sans ${inputClassName}`}
        title="Formato oficial: día/mes/año (DD/MM/AAAA). Puede escribir o tocar el calendario."
      />
      <button
        type="button"
        onClick={handleOpenPicker}
        className="absolute right-1.5 p-1.5 text-gray-400 hover:text-[#2D2E83] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
        title="Abrir calendario para elegir fecha"
      >
        <Calendar className="w-4 h-4 text-[#2D2E83]" />
      </button>

      {/* Input nativo date picker invisible para disparar el popup del navegador y soportar FormData */}
      <input
        ref={nativePickerRef}
        type="date"
        name={name}
        tabIndex={-1}
        value={toIsoDate(displayValue)}
        onChange={handleNativeChange}
        className="sr-only pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
