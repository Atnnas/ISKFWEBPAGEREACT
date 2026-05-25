"use client";
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SocialSidebar from '../layout/SocialSidebar';
import fondoEstructura from '../../assets/images/fondo-estructura.png';

const KataListPage = ({ initialData }) => {
    const router = useRouter();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-white min-h-screen text-iskf-dark font-sans ">
            {/* Floating Back Button (Top-Left) */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => router.push('/', { state: { targetId: 'recursos' } })}
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

                <div className="relative z-10 w-full max-w-6xl">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <span className="text-iskf-red font-bold tracking-[0.3em] text-xs uppercase mb-4 block drop-shadow-sm">Biblioteca Técnica</span>
                        <h1 className="text-5xl md:text-6xl font-black text-iskf-red tracking-widest uppercase mb-6 drop-shadow-xl" style={{ textShadow: '0px 10px 20px rgba(0,0,0,0.1), 0px 4px 8px rgba(0,0,0,0.05)' }}>KATA</h1>
                        <p className="text-gray-800 font-medium text-lg leading-relaxed mt-8 max-w-2xl mx-auto">
                            Seleccione el Kata que desea estudiar de nuestra biblioteca completa.
                        </p>
                    </div>

                    {/* Kata Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-16"
                    >
                        {initialData?.map((category, idx) => (
                            <div key={idx} className="space-y-8">
                                <div className="relative flex items-center gap-6">
                                    <div className="h-10 w-1.5 bg-iskf-red shadow-[0_0_15px_rgba(190,22,34,0.8)] rounded-full"></div>
                                    <h3 className="text-3xl md:text-4xl font-bold text-iskf-dark tracking-wider uppercase drop-shadow-sm">
                                        {category.title}
                                    </h3>
                                    <div className="flex-grow h-[1px] bg-gradient-to-r from-iskf-red/50 to-transparent"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {category.katas.map((kata) => (
                                        <motion.div
                                            key={kata.id}
                                            whileHover={{ y: -5 }}
                                            onClick={() => router.push(`/resources/kata/${kata.id}`)}
                                            className="group relative min-h-[16rem] h-auto rounded-3xl bg-white/40 backdrop-blur-xl overflow-hidden cursor-pointer transition-all duration-500 hover:bg-white/50 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center text-center p-8 z-20"
                                        >
                                            <div className="absolute inset-0 overflow-hidden rounded-3xl"><div className="absolute -inset-4 bg-gradient-to-r from-iskf-dark/40 to-iskf-red/40 blur-2xl opacity-0 group-hover:opacity-30 transition duration-500"></div></div>

                                            {/* Epic Kanji Display */}
                                            <div className="mb-4 relative z-10">
                                                <span className="text-5xl md:text-6xl font-black text-iskf-dark group-hover:text-iskf-red transition-colors duration-500 font-serif tracking-widest block transform group-hover:scale-110 transition-transform drop-shadow-sm">
                                                    {kata.kanji}
                                                </span>
                                            </div>

                                            <h4 className="text-xl md:text-2xl font-black text-iskf-dark uppercase tracking-widest mb-2 group-hover:tracking-[0.2em] transition-all duration-500 drop-shadow-sm relative z-10 transform group-hover:scale-105">{kata.title}</h4>

                                            {/* Decorative underline on hover */}
                                            <div className="w-12 h-1 bg-iskf-red/50 group-hover:bg-iskf-red mx-auto mt-4 rounded-full transition-colors duration-500 shadow-sm relative z-10"></div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default KataListPage;
