"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown, Check } from 'lucide-react';

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
 * Componente limpio y amigable para registro de hora de inicio.
 * Ofrece:
 * - Flechitas arriba/abajo (+15 / -15 minutos)
 * - Botón rápido de alternancia AM / PM
 * - Menú desplegable al hacer clic con intervalos de 15 minutos
 * - Atajos de teclado (flecha arriba / abajo)
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

  // Ajuste con flechas (+15 min o -15 min)
  const handleStep = (deltaMinutes) => {
    const nextMinutes = currentMinutes + deltaMinutes;
    const formatted = minutesToFormattedTime(nextMinutes);
    if (typeof onChange === 'function') {
      onChange(formatted);
    }
  };

  // Alternar entre AM y PM
  const handleToggleMeridiem = () => {
    let nextMinutes = currentMinutes;
    if (currentMinutes < 12 * 60) {
      // De AM a PM (+12 horas)
      nextMinutes = (currentMinutes + (12 * 60)) % 1440;
    } else {
      // De PM a AM (-12 horas)
      nextMinutes = (currentMinutes - (12 * 60) + 1440) % 1440;
    }
    const formatted = minutesToFormattedTime(nextMinutes);
    if (typeof onChange === 'function') {
      onChange(formatted);
    }
  };

  // Selección directa desde el desplegable
  const handleSelectTime = (selectedTime) => {
    if (typeof onChange === 'function') {
      onChange(selectedTime);
    }
    setIsDropdownOpen(false);
  };

  // Manejo de teclado (flechas arriba/abajo)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleStep(+15);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleStep(-15);
    }
  };

  // Generar opciones para el selector desplegable (cada 15 min de 06:00 AM a 09:00 PM)
  const dropdownOptions = [];
  for (let m = 6 * 60; m <= 21 * 60; m += 15) {
    dropdownOptions.push(minutesToFormattedTime(m));
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Barra de control principal con Flechitas y Badge */}
      <div className="flex items-center gap-1.5">
        <div
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="flex-1 flex items-center bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-2xs hover:border-[#2D2E83] focus-within:border-[#2D2E83] focus-within:ring-2 focus-within:ring-[#2D2E83]/15 transition-all outline-hidden cursor-pointer"
          onClick={() => setIsDropdownOpen(prev => !prev)}
          title="Haga clic para elegir de la lista o use las flechitas para ajustar ±15 min"
        >
          <Clock className="w-4 h-4 text-[#2D2E83] shrink-0 mr-2" />
          <span className="font-mono font-black text-xs sm:text-sm text-gray-900 tracking-wide select-none">
            {formattedDisplay || placeholder}
          </span>
          <span className="ml-auto text-[10px] text-gray-400 font-semibold px-1.5 py-0.5 bg-gray-100 rounded-md">
            ±15m
          </span>
        </div>

        {/* Stepper con Flechitas Arriba / Abajo (+15 / -15 min) */}
        <div className="flex flex-col rounded-xl overflow-hidden border border-gray-300 shadow-2xs bg-white shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleStep(+15);
            }}
            className="px-2 py-1 bg-gray-50 hover:bg-[#2D2E83] hover:text-white text-gray-600 transition-colors cursor-pointer border-b border-gray-200"
            title="Adelantar 15 minutos (+15 min)"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleStep(-15);
            }}
            className="px-2 py-1 bg-gray-50 hover:bg-[#2D2E83] hover:text-white text-gray-600 transition-colors cursor-pointer"
            title="Atrasar 15 minutos (-15 min)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Botón rápido AM / PM */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleMeridiem();
          }}
          className="px-3 py-2 bg-gray-100 hover:bg-[#2D2E83] text-gray-700 hover:text-white border border-gray-300 rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0 shadow-2xs"
          title="Cambiar entre AM y PM con un clic"
        >
          {formattedDisplay.includes('PM') ? 'PM' : 'AM'}
        </button>
      </div>

      {/* Menú Desplegable con Horarios Cada 15 Minutos */}
      {isDropdownOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-gray-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto p-1.5 divide-y divide-gray-100 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 bg-gray-50 rounded-lg mb-1 flex items-center justify-between">
            <span>Seleccionar hora exacta</span>
            <span className="text-gray-400 font-normal">Paso de 15m</span>
          </div>
          <div className="grid grid-cols-2 gap-1 pt-1">
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
