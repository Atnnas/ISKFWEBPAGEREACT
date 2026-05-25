"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SpiritKanji from '../ui/SpiritKanji';
import fondoInicioNuevo from '../../assets/images/Fondo-inicio-nuevo.jpg';

const ResourcesSection = () => {
    const router = useRouter();

    return (
        <section id="recursos" className="pt-36 pb-24 md:pt-40 md:pb-24 px-6 md:px-16 relative z-20 border-t border-white/5 overflow-visible">
            {/* Background Image */}
            <div className="fixed inset-0 z-0 pointer-events-none select-none bg-white">
                <img src={fondoInicioNuevo?.src || fondoInicioNuevo} alt="Background ISKF" className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.25]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <span className="text-iskf-red font-black text-xs tracking-[0.2em] uppercase">Documentación</span>
                    <h2 className="text-4xl md:text-5xl font-black text-[#2D2E83] tracking-[0.2em] uppercase">Recursos Técnicos</h2>
                </div>

                <div className="flex justify-center max-w-5xl mx-auto">

                    {/* Card 1: KATA */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        onClick={() => router.push('/resources/kata')}
                        className="group relative min-h-[550px] md:min-h-[600px] w-full max-w-md rounded-3xl bg-white/40 backdrop-blur-xl border border-white/60 overflow-visible cursor-pointer transition-all duration-700 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:bg-white/60 hover:-translate-y-2"
                    >
                        {/* Background Glow */}
                        <div className="absolute inset-0 overflow-hidden rounded-3xl"><div className="absolute -inset-4 bg-gradient-to-r from-iskf-dark/20 to-iskf-red/30 blur-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div></div>

                        {/* Animated Border Line (Arrows - Desktop Only) */}
                        <div className="hidden md:block absolute top-0 left-0 h-4 bg-[url('/images/borde-superior-nuevo.png')] bg-[length:auto_100%] bg-repeat-x w-0 group-hover:w-full transition-all duration-700 ease-out z-20 rounded-t-3xl"></div>
                        <div className="hidden md:block absolute bottom-0 right-0 h-4 bg-[url('/images/borde-inferior-nuevo.png')] bg-[length:auto_100%] bg-repeat-x w-0 group-hover:w-full transition-all duration-700 ease-out z-20 rounded-b-3xl"></div>

                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-6 md:p-10">

                            {/* Spirit Kanji - Larger and bolder */}
                            <div className="text-[#2D2E83] group-hover:text-iskf-red transition-all duration-500 transform group-hover:scale-110 origin-center mb-2 drop-shadow-sm">
                                <SpiritKanji kanji="型" label="KATA" />
                            </div>

                            <h3 className="text-5xl md:text-6xl font-black text-[#2D2E83] uppercase tracking-widest mb-4 group-hover:tracking-[0.2em] transition-all duration-500 drop-shadow-sm group-hover:text-black">
                                Kata
                            </h3>

                            <div className="w-16 h-1 bg-black/10 group-hover:bg-iskf-red mb-6 transition-colors duration-500 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.1)]"></div>

                            <p className="text-gray-700 font-medium max-w-xs mx-auto mb-10 text-base md:text-lg leading-relaxed transition-colors duration-500 tracking-wide">
                                Biblioteca técnica completa de los 26 Katas de Shotokan y el kihon que los compone.
                            </p>

                            <span className="inline-block px-10 py-4 bg-white border border-gray-200 group-hover:bg-iskf-red group-hover:border-iskf-red text-[#2D2E83] group-hover:text-white text-xs md:text-sm font-black uppercase tracking-[0.25em] transition-all duration-500 backdrop-blur-md rounded-xl shadow-sm">
                                Acceder
                            </span>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default ResourcesSection;
