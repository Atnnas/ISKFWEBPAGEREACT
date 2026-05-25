"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import SocialSidebar from '../layout/SocialSidebar';
import fondoEstructura from '../../assets/images/fondo-estructura.png';

const KataDetailPage = ({ initialData }) => {
    const router = useRouter();
    const kata = initialData;

    useEffect(() => {
        if (!kata) {
            router.push('/resources/kata');
        } else {
            window.scrollTo(0, 0);
        }
    }, [kata, router]);

    if (!kata) return null;

    return (
        <div className="bg-white min-h-screen text-iskf-dark font-sans ">
            {/* Floating Back Button (Top-Left) */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => router.push('/resources/kata')}
                className="fixed top-24 left-6 md:left-16 z-50 w-12 h-12 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-iskf-red hover:border-iskf-red transition-all duration-300 shadow-lg group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </motion.button>

            <SocialSidebar />

            <div className="pt-32 pb-24 px-6 md:px-16 min-h-screen flex flex-col items-center relative overflow-hidden">
                {/* Fixed Background Art */}
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <img src={fondoEstructura?.src || fondoEstructura} alt="Background" className="w-full h-full object-cover object-bottom opacity-100 brightness-110" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-10 w-full max-w-5xl"
                >
                    {/* Header */}
                    <div className="text-center mb-16">
                        <span className="text-iskf-red font-bold tracking-[0.3em] text-xs uppercase mb-4 block drop-shadow-sm">Detalle Técnico</span>
                        <h1 className="text-5xl md:text-6xl font-black text-iskf-red tracking-widest uppercase mb-6 drop-shadow-xl" style={{ textShadow: '0px 10px 20px rgba(0,0,0,0.1), 0px 4px 8px rgba(0,0,0,0.05)' }}>{kata.title}</h1>

                        {/* Furigana Display */}
                        {kata.kanjiParts && (
                            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-8 px-4">
                                {kata.kanjiParts.map((part, idx) => (
                                    <div key={idx} className="flex flex-col items-center group cursor-default min-w-[60px]">
                                        <span className="text-iskf-red text-[10px] md:text-xs uppercase font-black tracking-widest mb-1 opacity-70 group-hover:opacity-100 transition-opacity">({part.romaji})</span>
                                        <span className="text-4xl md:text-5xl font-serif text-iskf-dark opacity-90 group-hover:text-iskf-red transition-colors duration-300 mb-1 drop-shadow-sm">{part.char}</span>
                                        <span className="text-gray-500 text-[10px] md:text-xs font-medium italic tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">({part.meaning})</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Box */}
                    <div className="bg-white/85 backdrop-blur-3xl border border-white rounded-[2rem] p-6 md:p-12 lg:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.08)] relative overflow-hidden z-20">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
                            <span className="text-[15rem] font-black font-serif text-iskf-dark leading-none">{kata.kanji || '型'}</span>
                        </div>

                        {kata.detailsHtml ? (
                            <div className="space-y-12 relative z-10">
                                {/* Elegant Back Button (Top) */}
                                <div className="flex justify-center pb-10 border-b border-gray-200">
                                    <button
                                        onClick={() => router.push('/resources/kata')}
                                        className="group relative px-10 py-4 bg-transparent overflow-hidden rounded-full transition-all duration-500"
                                    >
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-iskf-red to-red-800 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                                        <div className="absolute inset-0 w-full h-full border-2 border-gray-200 rounded-full group-hover:border-iskf-red transition-colors duration-500"></div>
                                        <span className="relative flex items-center gap-4 text-gray-500 font-bold tracking-[0.2em] uppercase text-sm group-hover:text-iskf-red transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-2 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                            </svg>
                                            Volver a la Lista
                                        </span>
                                    </button>
                                </div>

                                <div
                                    className="w-full overflow-x-auto
                                    [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-2xl [&_table]:shadow-[0_10px_40px_rgba(45,46,131,0.1)] [&_table]:bg-white [&_table]:border [&_table]:border-gray-100
                                    [&_thead]:bg-iskf-blue [&_thead]:text-white [&_thead]:uppercase [&_thead]:tracking-[0.2em] [&_thead]:font-black [&_thead]:text-xs md:[&_thead]:text-sm
                                    [&_th]:p-5 md:[&_th]:p-6 [&_th]:text-left
                                    [&_tbody]:divide-y [&_tbody]:divide-gray-200/80 [&_tbody]:text-gray-900 [&_tbody]:font-bold [&_tbody]:text-base md:[&_tbody]:text-lg
                                    [&_td]:p-5 md:[&_td]:p-6
                                    [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-300 hover:[&_tbody_tr]:bg-blue-50/50
                                    [&_strong]:text-iskf-red [&_strong]:font-black
                                    [&_.text-iskf-red]:text-iskf-red [&_.text-iskf-red]:font-black [&_.text-iskf-red]:text-xl
                                    "
                                    dangerouslySetInnerHTML={{ 
                                        __html: kata.detailsHtml
                                            .replace(/text-white/g, '') 
                                            .replace(/bg-iskf-red\/20/g, '') 
                                            .replace(/divide-white\/10/g, '') 
                                            .replace(/hover:bg-white\/5/g, '') 
                                            .replace(/text-gray-400/g, '')
                                            .replace(/text-gray-300/g, '')
                                    }}
                                />

                                {/* Elegant Back Button */}
                                <div className="flex justify-center pt-10 border-t border-gray-200">
                                    <button
                                        onClick={() => router.push('/resources/kata')}
                                        className="group relative px-10 py-4 bg-transparent overflow-hidden rounded-full transition-all duration-500"
                                    >
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-iskf-red to-red-800 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                                        <div className="absolute inset-0 w-full h-full border-2 border-gray-200 rounded-full group-hover:border-iskf-red transition-colors duration-500"></div>
                                        <span className="relative flex items-center gap-4 text-gray-500 font-bold tracking-[0.2em] uppercase text-sm group-hover:text-iskf-red transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-2 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                            </svg>
                                            Volver a la Lista
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-300 rounded-[2rem] bg-gray-50/50 relative z-10">
                                <span className="text-8xl md:text-9xl mb-8 drop-shadow-md">🥋</span>
                                <h3 className="text-3xl md:text-5xl font-black text-iskf-dark mb-4 drop-shadow-sm tracking-tight">Contenido Próximamente</h3>
                                <p className="text-gray-500 text-lg md:text-xl font-medium max-w-xl mb-12 leading-relaxed">La tabla técnica y los detalles para este Kata se están digitalizando y estarán disponibles pronto.</p>

                                <button
                                    onClick={() => router.push('/resources/kata')}
                                    className="px-10 py-4 bg-iskf-dark shadow-xl shadow-iskf-dark/20 rounded-full text-white font-black uppercase tracking-[0.2em] hover:bg-iskf-red hover:shadow-iskf-red/30 transition-all duration-300 hover:-translate-y-1"
                                >
                                    Volver a la Lista
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default KataDetailPage;
