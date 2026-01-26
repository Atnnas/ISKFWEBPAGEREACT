import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SpiritKanji from '../ui/SpiritKanji';
import fondoRecursosTecnicos from '../../assets/images/fondoRecursosTecnicos.jpg';

const ResourcesSection = () => {
    const navigate = useNavigate();

    return (
        <section id="recursos" className="py-24 px-6 md:px-16 bg-iskf-dark relative z-20 border-t border-white/5 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 pointer-events-none select-none">
                <img src={fondoRecursosTecnicos} alt="Background" className="w-full h-full object-cover object-center opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-b from-iskf-dark/50 via-transparent to-iskf-dark/50"></div>
                <div className="absolute inset-0 bg-black/10"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <span className="text-iskf-red font-black text-xs tracking-[0.2em] uppercase">Documentación</span>
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase">Recursos Técnicos</h2>
                    <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-iskf-red to-transparent mx-auto mt-6 rounded-full shadow-[0_0_25px_rgba(220,38,38,0.8)]"></div>
                </div>

                <div className="flex justify-center max-w-5xl mx-auto">

                    {/* Card 1: KATA */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        onClick={() => navigate('/resources/kata')}
                        className="group relative h-[500px] w-full max-w-md rounded-none bg-transparent overflow-visible cursor-pointer transition-all duration-700 hover:shadow-[0_0_50px_rgba(206,17,38,0.4)] hover:bg-white/5 hover:backdrop-blur-md"
                    >
                        {/* Animated Border Line (Minimalist) */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-iskf-red scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left z-20"></div>
                        <div className="absolute bottom-0 right-0 w-full h-1 bg-iskf-red scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-right z-20"></div>

                        {/* Background Image REMOVED for transparency */}
                        <div className="absolute inset-0 z-0 bg-transparent"></div>

                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">

                            {/* Spirit Kanji - Larger and bolder */}
                            <div className="text-white group-hover:text-iskf-red transition-colors duration-500 scale-110 group-hover:scale-125 transition-transform origin-center mb-4 text-shadow-lg">
                                <SpiritKanji kanji="型" label="KATA" />
                            </div>

                            <h3 className="text-6xl md:text-7xl font-black text-white uppercase tracking-widest mb-6 mt-2 group-hover:tracking-[0.2em] transition-all duration-500 drop-shadow-xl text-shadow-xl">
                                Kata
                            </h3>

                            <div className="w-16 h-1.5 bg-white/50 group-hover:bg-iskf-red mb-8 transition-colors duration-500 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>

                            <p className="text-gray-100 font-bold max-w-xs mx-auto mb-12 text-base md:text-lg leading-relaxed transition-colors duration-500 drop-shadow-md text-shadow-sm">
                                Biblioteca técnica completa de los 26 Katas de Shotokan y el kihon que las compone.
                            </p>

                            <span className="inline-block px-12 py-5 bg-white/10 border-2 border-white/40 group-hover:bg-iskf-red group-hover:border-iskf-red text-white text-sm md:text-base font-black uppercase tracking-[0.25em] transition-all duration-500 backdrop-blur-md group-hover:shadow-[0_0_20px_rgba(206,17,38,0.6)]">
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

