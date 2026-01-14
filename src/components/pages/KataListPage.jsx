import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SocialSidebar from '../layout/SocialSidebar';
import { kataCategories } from '../../data/kataData';

const KataListPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-iskf-dark min-h-screen text-white font-sans selection:bg-iskf-red selection:text-white">
            {/* Floating Back Button (Top-Left) */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => navigate('/', { state: { targetId: 'recursos' } })}
                className="fixed top-24 left-6 md:left-16 z-50 w-12 h-12 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-iskf-red hover:border-iskf-red transition-all duration-300 shadow-lg group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </motion.button>

            <SocialSidebar />

            <div className="pt-32 pb-24 px-6 md:px-16 min-h-screen flex flex-col items-center relative overflow-hidden">
                {/* Background Art */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <img src="/kataImagen.jpg" className="w-full h-full object-cover opacity-20 scale-105 blur-sm" alt="Kata BG" />
                    <div className="absolute inset-0 bg-gradient-to-t from-iskf-dark via-iskf-dark/80 to-iskf-dark/50"></div>
                </div>

                <div className="relative z-10 w-full max-w-6xl">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <span className="text-iskf-red font-bold tracking-[0.3em] text-xs uppercase mb-4 block">Biblioteca Técnica</span>
                        <h1 className="text-5xl md:text-6xl font-black text-white tracking-widest uppercase mb-6 drop-shadow-2xl">KATA</h1>
                        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-iskf-red to-transparent mx-auto rounded-full shadow-[0_0_15px_#be1322]"></div>
                        <p className="text-gray-300 font-light text-lg leading-relaxed mt-8 max-w-2xl mx-auto">
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
                        {kataCategories.map((category, idx) => (
                            <div key={idx} className="space-y-8">
                                <div className="relative flex items-center gap-6">
                                    <div className="h-10 w-1.5 bg-iskf-red shadow-[0_0_15px_rgba(220,38,38,0.8)] rounded-full"></div>
                                    <h3 className="text-3xl md:text-4xl font-bold text-white tracking-wider uppercase">
                                        {category.title}
                                    </h3>
                                    <div className="flex-grow h-[1px] bg-gradient-to-r from-iskf-red/50 to-transparent"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {category.katas.map((kata) => (
                                        <motion.div
                                            key={kata.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => navigate(`/resources/kata/${kata.id}`)}
                                            className="bg-zinc-900 border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-800 transition-colors group relative overflow-hidden h-48"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-iskf-red/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                            {/* Epic Kanji Display */}
                                            <div className="mb-2 relative z-10">
                                                <span className="text-5xl font-black text-white/20 group-hover:text-iskf-red/30 transition-colors duration-500 font-serif tracking-widest block scale-110 group-hover:scale-125 transform">
                                                    {kata.kanji}
                                                </span>
                                            </div>

                                            <h4 className="text-xl font-bold text-white group-hover:text-iskf-red transition-colors tracking-wide uppercase relative z-10 mt-auto">{kata.title}</h4>
                                            <div className="w-12 h-1 bg-iskf-red rounded-full mt-4 group-hover:w-24 transition-all duration-300 relative z-10"></div>
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
