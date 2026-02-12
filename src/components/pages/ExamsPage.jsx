import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SocialSidebar from '../layout/SocialSidebar';

const ExamsPage = () => {
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
                    <img src="/libroTecnica.jpg" className="w-full h-full object-cover opacity-20 scale-105 blur-sm" alt="Exams BG" />
                    <div className="absolute inset-0 bg-gradient-to-t from-iskf-dark via-iskf-dark/80 to-iskf-dark/50"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-10 w-full max-w-4xl text-center"
                >
                    {/* Header */}
                    <div className="text-center mb-16">
                        <span className="text-iskf-red font-bold tracking-[0.3em] text-xs uppercase mb-4 block">Requisitos de Grado</span>
                        <h1 className="text-5xl md:text-6xl font-black text-white tracking-widest uppercase mb-6 drop-shadow-2xl">EXÁMENES</h1>
                        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-iskf-red to-transparent mx-auto rounded-full shadow-[0_0_15px_#be1322]"></div>
                    </div>

                    {/* Placeholder Content */}
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 text-iskf-red border border-white/10 shadow-neon"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </motion.div>

                        <h3 className="text-2xl font-bold text-white mb-4">Documentación en Proceso</h3>
                        <p className="text-gray-300 font-light max-w-lg leading-relaxed mb-8">
                            Estamos actualizando los requisitos oficiales de grado y los manuales de examen para el periodo 2026. Por favor consulte con su Sensei o regrese pronto para descargar los documentos actualizados.
                        </p>

                        <button
                            onClick={() => navigate('/')}
                            className="px-8 py-3 bg-white/5 border border-white/20 rounded-full text-white font-bold uppercase tracking-widest hover:bg-iskf-red hover:border-iskf-red transition-all duration-300"
                        >
                            Volver al Inicio
                        </button>
                    </div>

                </motion.div>
            </div>
        </div>
    );
};

export default ExamsPage;
