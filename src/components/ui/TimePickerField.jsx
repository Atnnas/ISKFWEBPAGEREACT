"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, Check } from 'lucide-react';

/**
 * Convierte un string de hora en minutos desde medianoche (0 - 1439).
 * Soporta formatos "09:00 AM", "9:00", "14:30", etc.
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 9 * 60; // 09:00 AM por defecto
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return 9 * 60;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3];

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return Math.max(0, Math.min(1439, (hours * 60) + minutes));
}

function minutesToFormattedTime(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${meridiem}`;
}

/**
 * Selector desplegable limpio y directo de hora de inicio.
 * Al hacer clic despliega la lista completa de horarios (cada 15 min).
 */
export default function TimePickerField({
  value = '09:00 AM',
  onChange,
  placeholder = '09:00 AM',
  className = ''
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef(null);

  const safeValue = value || '09:00 AM';
  const currentMinutes = parseTimeToMinutes(safeValue);
  const formattedDisplay = minutesToFormattedTime(currentMinutes);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Selección directa desde el desplegable
  const handleSelectTime = (selectedTime) => {
    if (typeof onChange === 'function') {
      onChange(selectedTime);
    }
    setIsDropdownOpen(false);
  };

  // Generar opciones para el selector desplegable (cada 15 min de 06:00 AM a 09:00 PM)
  const dropdownOptions = [];
  for (let m = 6 * 60; m <= 21 * 60; m += 15) {
    dropdownOptions.push(minutesToFormattedTime(m));
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Botón principal que abre el desplegable al hacer clic */}
      <button
        type="button"
        onClick={() => setIsDropdownOpen(prev => !prev)}
        className="w-full flex items-center justify-between bg-gray-50 hover:bg-white border border-gray-300 focus:border-[#2D2E83] focus:bg-white focus:ring-1 focus:ring-[#2D2E83] rounded-xl px-3 py-2 text-xs font-bold text-gray-900 transition-all outline-hidden shadow-2xs cursor-pointer select-none"
        title="Haga clic para seleccionar la hora de inicio"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#2D2E83] shrink-0" />
          <span className="font-mono text-xs font-bold text-gray-900">
            {formattedDisplay || placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180 text-[#2D2E83]' : ''
          }`}
        />
      </button>

      {/* Menú Desplegable con Horarios Cada 15 Minutos */}
      {isDropdownOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-gray-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-50 rounded-lg mb-1 flex items-center justify-between">
            <span>Seleccionar hora</span>
            <span className="text-gray-400 font-normal">Paso de 15m</span>
          </div>
          <div className="grid grid-cols-2 gap-1 pt-0.5">
            {dropdownOptions.map((opt) => {
              const isSelected = parseTimeToMinutes(opt) === currentMinutes;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectTime(opt)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#2D2E83] text-white font-bold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
