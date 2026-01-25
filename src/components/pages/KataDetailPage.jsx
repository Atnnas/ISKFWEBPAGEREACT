import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SocialSidebar from '../layout/SocialSidebar';
import { kataCategories, kataDetails } from '../../data/kataData';

const KataDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const kata = React.useMemo(() => {
        for (const category of kataCategories) {
            const match = category.katas.find(k => k.id === id);
            if (match) return match;
        }
        return null;
    }, [id]);

    useEffect(() => {
        if (!kata) {
            navigate('/resources/kata');
        } else {
            window.scrollTo(0, 0);
        }
    }, [kata, navigate]);

    if (!kata) return null;

    return (
        <div className="bg-iskf-dark min-h-screen text-white font-sans selection:bg-iskf-red selection:text-white">
            {/* Floating Back Button (Top-Left) */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => navigate('/resources/kata')}
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

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-10 w-full max-w-5xl"
                >
                    {/* Header */}
                    <div className="text-center mb-16">
                        <span className="text-iskf-red font-bold tracking-[0.3em] text-xs uppercase mb-4 block">Detalle Técnico</span>
                        <h1 className="text-5xl md:text-6xl font-black text-white tracking-widest uppercase mb-6 drop-shadow-2xl">{kata.title}</h1>

                        {/* Furigana Display */}
                        {kata.kanjiParts && (
                            <div className="flex justify-center gap-4 md:gap-8 mb-8">
                                {kata.kanjiParts.map((part, idx) => (
                                    <div key={idx} className="flex flex-col items-center group cursor-default">
                                        <span className="text-iskf-red text-[10px] md:text-xs uppercase font-black tracking-widest mb-1 opacity-70 group-hover:opacity-100 transition-opacity">({part.romaji})</span>
                                        <span className="text-4xl md:text-5xl font-serif text-white opacity-90 group-hover:text-iskf-red transition-colors duration-300 mb-1">{part.char}</span>
                                        <span className="text-gray-400 text-[10px] md:text-xs font-light italic tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">({part.meaning})</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-iskf-red to-transparent mx-auto rounded-full shadow-[0_0_15px_#be1322]"></div>
                    </div>

                    {/* Content Box */}
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <span className="text-9xl font-black font-serif">{kata.kanji || '型'}</span>
                        </div>

                        {kataDetails[kata.id] ? (
                            <div className="space-y-12">
                                {/* Elegant Back Button (Top) */}
                                <div className="flex justify-center pb-8 border-b border-white/10">
                                    <button
                                        onClick={() => navigate('/resources/kata')}
                                        className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-full transition-all duration-300"
                                    >
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-iskf-red to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute inset-0 w-full h-full border border-iskf-red/50 rounded-full group-hover:border-transparent transition-colors duration-300"></div>
                                        <span className="relative flex items-center gap-3 text-white font-bold tracking-[0.2em] uppercase text-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                            </svg>
                                            Volver a la Lista
                                        </span>
                                    </button>
                                </div>

                                <div
                                    className="prose prose-invert prose-lg max-w-none 
                                    prose-headings:text-white prose-headings:uppercase prose-headings:tracking-widest prose-headings:font-bold
                                    prose-strong:text-iskf-red
                                    prose-table:border-collapse prose-table:w-full
                                    prose-th:bg-white/10 prose-th:p-4 prose-th:text-left prose-th:uppercase prose-th:text-sm prose-th:tracking-wider prose-th:border prose-th:border-white/10
                                    prose-td:p-4 prose-td:border prose-td:border-white/10 prose-td:text-gray-300
                                    "
                                    dangerouslySetInnerHTML={{ __html: kataDetails[kata.id] }}
                                />

                                {/* Elegant Back Button */}
                                <div className="flex justify-center pt-8 border-t border-white/10">
                                    <button
                                        onClick={() => navigate('/resources/kata')}
                                        className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-full transition-all duration-300"
                                    >
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-iskf-red to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute inset-0 w-full h-full border border-iskf-red/50 rounded-full group-hover:border-transparent transition-colors duration-300"></div>
                                        <span className="relative flex items-center gap-3 text-white font-bold tracking-[0.2em] uppercase text-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                            </svg>
                                            Volver a la Lista
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                                <span className="text-6xl mb-6">🥋</span>
                                <h3 className="text-2xl font-bold text-white mb-3">Contenido Próximamente</h3>
                                <p className="text-gray-400 max-w-md mb-8">La tabla técnica y los detalles para este Kata se están digitalizando y estarán disponibles pronto.</p>

                                <button
                                    onClick={() => navigate('/resources/kata')}
                                    className="px-8 py-3 bg-white/5 border border-white/20 rounded-full text-white font-bold uppercase tracking-widest hover:bg-iskf-red hover:border-iskf-red transition-all duration-300"
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
