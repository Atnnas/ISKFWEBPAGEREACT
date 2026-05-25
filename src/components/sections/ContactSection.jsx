"use client";
import React from 'react';
import fondoInicioNuevo from '../../assets/images/Fondo-inicio-nuevo.jpg';
import elementoGrafico4 from '../../assets/images/elemento_grafico_4.png';

const ContactSection = () => {
    return (
        <footer id="contacto" className="min-h-screen pt-36 pb-24 md:pt-40 md:pb-24 border-t border-black/5 bg-white text-center relative z-10 overflow-hidden flex flex-col items-center justify-center">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none select-none">
                <img src={fondoInicioNuevo?.src || fondoInicioNuevo} alt="Background Contacto" className="w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/40 to-white/60"></div>
                {/* Elegant Vector Pattern Overlay */}
                <div className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-[0.06] mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url('${elementoGrafico4}')` }}></div>
            </div>

            <div className="max-w-4xl mx-auto text-center mb-10 relative z-10">
                <h2 className="text-5xl md:text-6xl font-black text-[#2D2E83] mb-8 tracking-tighter uppercase drop-shadow-2xl">¿Listo para comenzar?</h2>
                <div className="flex justify-center gap-4 relative group">
                    {/* Radiant Background Pulse */}
                    <div className="absolute inset-0 bg-green-500/30 blur-3xl rounded-full opacity-20 group-hover:opacity-60 transition-opacity duration-700 animate-pulse"></div>

                    <a
                        href="https://wa.me/50683950741?text=Hola%20Sensei,%20quiero%20formar%20parte%20de%20la%20ISKF%20y%20conocer%20el%20camino%20del%20Karate%20Do.%20%C2%BFC%C3%B3mo%20puedo%20afiliarme%3F"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative px-14 py-6 bg-[#25D366] text-white rounded-full hover:bg-[#128C7E] transition-all shadow-[0_0_40px_rgba(37,211,102,0.5)] hover:shadow-[0_0_80px_rgba(37,211,102,0.8)] hover:scale-105 duration-300 flex items-center gap-5 overflow-hidden group-hover:tracking-widest"
                    >
                        {/* Glossy Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>

                        <svg className="w-10 h-10 fill-current relative z-10 drop-shadow-lg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        <div className="flex flex-col items-start relative z-10">
                            <span className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase drop-shadow-md leading-none">¡AFÍLIATE A LA ISKF!</span>
                            <span className="text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase opacity-90">Forma parte del legado</span>
                        </div>
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default ContactSection;
