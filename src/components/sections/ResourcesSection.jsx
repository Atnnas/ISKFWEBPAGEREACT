import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SpiritKanji from '../ui/SpiritKanji';

const ResourcesSection = () => {
    const navigate = useNavigate();

    return (
        <section id="recursos" className="py-24 px-6 md:px-16 bg-iskf-dark relative z-20 border-t border-white/5">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <span className="text-iskf-red font-black text-xs tracking-[0.2em] uppercase">Documentación</span>
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase">Recursos Técnicos</h2>
                    <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-iskf-red to-transparent mx-auto mt-6 rounded-full shadow-[0_0_25px_rgba(220,38,38,0.8)]"></div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

                    {/* Card 1: KATA */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        onClick={() => navigate('/resources/kata')}
                        className="group relative h-[500px] rounded-3xl overflow-hidden border border-white/10 cursor-pointer shadow-lg hover:shadow-[0_0_50px_rgba(206,17,38,0.4)] transition-all duration-500"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src={`${import.meta.env.BASE_URL}kataImagen.jpg`}
                                alt="Kata Background"
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 blur-[2px] group-hover:blur-0"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">

                            {/* NEW: Spirit Kanji Emblem */}
                            <SpiritKanji kanji="型" label="KATA" />

                            <h3 className="text-4xl font-black text-white uppercase tracking-widest mb-4 group-hover:text-iskf-red transition-colors duration-300 drop-shadow-lg">
                                Kata
                            </h3>

                            <p className="text-gray-300 font-light max-w-xs mx-auto mb-8 text-sm leading-relaxed">
                                Biblioteca técnica completa de los 26 Katas de Shotokan y el kihon que las compone.
                            </p>

                            <span className="inline-block px-8 py-3 rounded-full border border-white/30 text-xs font-bold uppercase tracking-[0.2em] text-white/80 group-hover:bg-iskf-red group-hover:border-iskf-red group-hover:text-white transition-all duration-300 backdrop-blur-sm">
                                Acceder
                            </span>
                        </div>
                    </motion.div>

                    {/* Card 2: TEMARIO DE EXAMENES */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        onClick={() => navigate('/resources/exams')}
                        className="group relative h-[500px] rounded-3xl overflow-hidden border border-white/10 cursor-pointer shadow-lg hover:shadow-[0_0_50px_rgba(255,255,255,0.15)] transition-all duration-500"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src={`${import.meta.env.BASE_URL}libroTecnica.jpg`}
                                alt="Exams Background"
                                className="w-full h-full object-cover opacity-40 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 blur-[2px] group-hover:blur-0"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">

                            {/* NEW: Spirit Kanji Emblem for Exams (Writing/Book) */}
                            <SpiritKanji kanji="書" label="EXAMENES" delay={0.2} />

                            <h3 className="text-4xl font-black text-white uppercase tracking-widest mb-4 group-hover:text-gray-200 transition-colors duration-300 drop-shadow-lg">
                                Exámenes
                            </h3>

                            <p className="text-gray-300 font-light max-w-xs mx-auto mb-8 text-sm leading-relaxed">
                                Requisitos oficiales de grado, guías de estudio, manuales y formularios de afiliación.
                            </p>

                            <span className="inline-block px-8 py-3 rounded-full border border-white/30 text-xs font-bold uppercase tracking-[0.2em] text-white/80 group-hover:bg-white group-hover:text-black transition-all duration-300 backdrop-blur-sm">
                                Ver Documentos
                            </span>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default ResourcesSection;

