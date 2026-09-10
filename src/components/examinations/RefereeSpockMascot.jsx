"use client";

import React, { useState } from 'react';
import { Volume2, Sparkles } from 'lucide-react';

const MASCOT_QUOTES = [
  {
    exclamation: "¡¡CHUI!!",
    text: "¡La lógica dicta concentración total en tu examen!",
    sub: "Sin distracciones fuera del tatami."
  },
  {
    exclamation: "¡¡CHUI!!",
    text: "¡Prohibido salir de la ventana o pestaña de evaluación!",
    sub: "Reglamento estricto WKF activo."
  },
  {
    exclamation: "¡OSU!",
    text: "¡Un verdadero karateka responde con calma y precisión!",
    sub: "Confía en tu entrenamiento diario."
  },
  {
    exclamation: "¡¡CHUI!!",
    text: "¡Cuidado con el tiempo límite, aspirante!",
    sub: "Revisa cada término y asocie antes de enviar."
  },
  {
    exclamation: "¡FASCINANTE!",
    text: "Demuestra tu espíritu marcial y el Dojo Kun.",
    sub: "Larga vida y prosperidad a tu cinta. 🖖"
  }
];

export default function RefereeSpockMascot({ mode = 'rotulo' }) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isWiggling, setIsWiggling] = useState(false);
  const [bubbleKey, setBubbleKey] = useState(0);

  const handleClick = () => {
    setIsWiggling(true);
    setQuoteIndex((prev) => (prev + 1) % MASCOT_QUOTES.length);
    setBubbleKey((prev) => prev + 1);
    setTimeout(() => setIsWiggling(false), 500);
  };

  const currentQuote = MASCOT_QUOTES[quoteIndex];

  if (mode === 'modal') {
    return (
      <div className="flex flex-col items-center justify-center select-none py-2">
        <div className="relative group cursor-pointer" onClick={handleClick}>
          {/* Globo de Diálogo Estilo Duolingo */}
          <div 
            key={bubbleKey}
            className="mb-2 bg-gradient-to-r from-red-600 via-[#BE1622] to-amber-500 text-white px-3.5 py-1.5 rounded-2xl shadow-lg border-2 border-white text-center animate-duolingo-pop relative"
          >
            <span className="font-black text-xs tracking-wider uppercase font-mono block drop-shadow-sm">
              {currentQuote.exclamation}
            </span>
            <span className="text-[11px] font-medium leading-tight block text-red-50">
              {currentQuote.text}
            </span>
            {/* Flechita del globo */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#BE1622] rotate-45 border-r border-b border-white" />
          </div>

          {/* Mascota con animación */}
          <div className={`${isWiggling ? 'animate-duolingo-wiggle' : 'animate-duolingo-bounce'}`}>
            <img
              src="/images/exams/mascot-spock-chui.png"
              alt="Mascota Árbitro WKF Spock"
              className="w-28 h-28 object-contain drop-shadow-xl"
              onError={(e) => {
                e.currentTarget.src = '/images/exams/mascot-spock-chui.jpg';
              }}
            />
          </div>

          {/* Sombra en el suelo estilo Duolingo */}
          <div className="w-20 h-2.5 bg-black/15 rounded-full mx-auto -mt-1.5 blur-[1px] animate-duolingo-shadow" />
        </div>
      </div>
    );
  }

  // Modo estándar para el Rótulo
  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Globo de diálogo interactivo estilo Duolingo */}
      <div 
        key={bubbleKey}
        onClick={handleClick}
        className="mb-1.5 max-w-[210px] sm:max-w-[230px] bg-white border-2 border-[#2D2E83]/30 rounded-2xl p-2.5 shadow-[0_8px_20px_rgba(45,46,131,0.12)] text-center animate-duolingo-pop relative cursor-pointer hover:border-[#BE1622] transition-colors group/bubble"
        title="Haz clic en la mascota para escuchar consejos de arbitraje"
      >
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-[#BE1622] text-white text-[10px] font-black tracking-widest font-mono shadow-xs uppercase">
            {currentQuote.exclamation}
          </span>
          <span className="text-[10px] font-bold text-gray-500 font-mono flex items-center gap-0.5">
            <Volume2 className="w-3 h-3 text-[#2D2E83] group-hover/bubble:scale-110 transition-transform" />
            Sensei
          </span>
        </div>
        <p className="text-[11px] font-bold text-gray-800 leading-tight">
          {currentQuote.text}
        </p>
        <p className="text-[10px] text-gray-500 mt-0.5 font-medium leading-tight">
          {currentQuote.sub}
        </p>

        {/* Flechita del globo apuntando hacia la mascota */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rotate-45 border-r-2 border-b-2 border-[#2D2E83]/30 group-hover/bubble:border-[#BE1622]" />
      </div>

      {/* Contenedor de Mascota con Animaciones Duolingo */}
      <div 
        onClick={handleClick}
        className="relative cursor-pointer group flex flex-col items-center"
        title="¡Haz clic en el Árbitro Shihan Spock!"
      >
        {/* Cuerpo de la mascota */}
        <div className={`transition-transform duration-200 ${isWiggling ? 'animate-duolingo-wiggle' : 'animate-duolingo-bounce'}`}>
          <img
            src="/images/exams/mascot-spock-chui.png"
            alt="Mascota Árbitro WKF Spock - ¡¡CHUI!!"
            className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = '/images/exams/mascot-spock-chui.jpg';
            }}
          />
        </div>

        {/* Sombra dinámica Duolingo en el suelo */}
        <div className="w-24 sm:w-28 h-3 bg-black/15 rounded-full -mt-2 blur-[1.5px] animate-duolingo-shadow" />

        {/* Placa identificadora estilo mascota de Duolingo */}
        <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1 bg-white/95 border border-blue-200 rounded-full shadow-sm group-hover:border-[#BE1622] transition-colors">
          <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider text-[#2D2E83] font-mono group-hover:text-[#BE1622] transition-colors">
            Árbitro WKF • Shihan Spock
          </span>
          <Sparkles className="w-3 h-3 text-amber-500 opacity-80" />
        </div>
      </div>
    </div>
  );
}
