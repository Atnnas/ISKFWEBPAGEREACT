import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SocialSidebar from '../layout/SocialSidebar';
import { kataCategories } from '../../data/kataData';
import fondoKatas from '../../assets/images/FondoKatas.jpg';

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
                {/* Fixed Background Art */}
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <img src={fondoKatas} className="w-full h-full object-cover opacity-100" alt="Kata BG" />
                    <div className="absolute inset-0 bg-gradient-to-t from-iskf-dark/90 via-iskf-dark/40 to-iskf-dark/80"></div>
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
                                            whileHover={{ y: -5 }}
                                            onClick={() => navigate(`/resources/kata/${kata.id}`)}
                                            className="group relative min-h-[16rem] h-auto rounded-none bg-transparent overflow-visible cursor-pointer transition-all duration-700 hover:shadow-[0_0_30px_rgba(206,17,38,0.3)] hover:bg-white/5 hover:backdrop-blur-md flex flex-col items-center justify-center text-center p-8 border-transparent"
                                        >
                                            {/* Animated Border Line (Minimalist) */}
                                            <div className="absolute top-0 left-0 w-full h-1 bg-iskf-red scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left z-20"></div>
                                            <div className="absolute bottom-0 right-0 w-full h-1 bg-iskf-red scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-right z-20"></div>

                                            {/* Background Image REMOVED for transparency */}
                                            <div className="absolute inset-0 z-0 bg-transparent"></div>

                                            {/* Epic Kanji Display */}
                                            <div className="mb-4 relative z-10">
                                                <span className="text-5xl md:text-6xl font-black text-white group-hover:text-iskf-red transition-colors duration-500 font-serif tracking-widest block transform group-hover:scale-110 transition-transform text-shadow-lg">
                                                    {kata.kanji}
                                                </span>
                                            </div>

                                            <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest mb-2 group-hover:tracking-[0.2em] transition-all duration-500 drop-shadow-xl text-shadow-xl relative z-10 transition-transform group-hover:scale-105">{kata.title}</h4>

                                            {/* Decorative underline on hover */}
                                            <div className="w-12 h-1 bg-white/50 group-hover:bg-iskf-red mx-auto mt-4 rounded-full transition-colors duration-500 shadow-[0_0_10px_rgba(255,255,255,0.3)] relative z-10"></div>
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
