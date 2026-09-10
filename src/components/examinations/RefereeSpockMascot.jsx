"use client";

import React, { useState } from 'react';

export default function RefereeSpockMascot({ 
  isOpen = false, 
  onClose, 
  attempt = 1, 
  securityMode = 'audit',
  customMessage = ''
}) {
  const [isWiggling, setIsWiggling] = useState(false);

  if (!isOpen) return null;

  const handleMascotClick = () => {
    setIsWiggling(true);
    setTimeout(() => setIsWiggling(false), 500);
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl border-2 border-red-300 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-[0_20px_60px_rgba(190,22,34,0.3)] animate-duolingo-pop relative overflow-hidden select-none">
        
        {/* Resplandor decorativo */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Mascota Estilo Duolingo con Animación Independiente */}
        <div 
          onClick={handleMascotClick}
          className="relative cursor-pointer flex flex-col items-center justify-center pt-2 mb-2 group"
          title="¡Toca al árbitro!"
        >
          {/* Cuerpo del Árbitro WKF */}
          <div className={`${isWiggling ? 'animate-duolingo-wiggle' : 'animate-duolingo-bounce'}`}>
            <img
              src="/images/exams/mascot-spock-chui.png"
              alt="Árbitro WKF - ¡¡CHUI!!"
              className="w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-2xl transition-transform duration-200 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = '/images/exams/mascot-spock-chui.jpg';
              }}
            />
          </div>

          {/* Sombra interactiva en el suelo estilo Duolingo */}
          <div className="w-24 sm:w-28 h-3 bg-black/15 rounded-full -mt-2 blur-[1px] animate-duolingo-shadow" />
        </div>

        {/* Mensaje de Advertencia por Cambio de Pantalla */}
        <div className="space-y-2 mt-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 text-red-700 rounded-full text-xs font-black font-mono uppercase tracking-wider">
            <span>⚠️</span>
            <span>
              {securityMode === 'warnings' ? `Falta ${attempt} de 3` : 'Cambio de Pantalla Detectado'}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
            ¡¡CHUI!!
          </h3>

          <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
            {customMessage || (
              securityMode === 'warnings' 
                ? `Has salido de la pantalla de evaluación. Esta es una falta (${attempt} de 3). Al acumular 3 faltas el examen se cerrará automáticamente.`
                : 'Has salido de la pantalla o pestaña de evaluación. Por disciplina y concentración marcial, mantén la vista en tu examen.'
            )}
          </p>
        </div>

        {/* Botón para volver al examen */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-6 bg-gradient-to-r from-[#BE1622] via-red-600 to-[#9c0f1b] hover:from-[#9c0f1b] hover:to-red-800 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-red-600/25 active:scale-95 cursor-pointer"
          >
            Volver al Tatami / Continuar Examen
          </button>
        </div>

      </div>
    </div>
  );
}
