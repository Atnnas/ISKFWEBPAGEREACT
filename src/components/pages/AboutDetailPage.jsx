import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SocialSidebar from '../layout/SocialSidebar';
import { aboutData } from '../../data/aboutData';
import fondoSonreNosotrosTarjetas from '../../assets/images/fondoSonreNosotrosTarjetas.jpg';
import { ThreeDPhotoCarousel } from '../ui/3d-carousel';

const AboutDetailPage = () => {
    const { section } = useParams();
    const navigate = useNavigate();

    const content = aboutData[section];

    useEffect(() => {
        if (!content) {
            navigate('/');
        } else {
            window.scrollTo(0, 0);
        }
    }, [section, content, navigate]);

    if (!content) return null;

    // Animation variants
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    // Render helpers for specific sections (Migrated from AboutModal)
    const renderIdentidad = () => (
        <div className="w-full -mt-10 overflow-visible">
            <ThreeDPhotoCarousel items={content.items} />
        </div>
    );

    const renderPilares = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
            {content.map((pilar, index) => (
                <motion.div key={index} variants={itemVariants} className="space-y-6 bg-black/70 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-xl hover:border-iskf-red/30 transition-colors duration-300">
                    <div className="h-1 w-20 bg-iskf-red mb-6 shadow-neon" />
                    <h3 className="text-3xl font-bold text-white mb-4 tracking-widest uppercase drop-shadow-lg">
                        {pilar.title} <span className="text-sm block text-gray-300 font-serif italic mt-1 font-normal tracking-normal text-iskf-red">{pilar.subtitle}</span>
                    </h3>
                    <div className="text-gray-200 leading-relaxed font-normal text-justify text-sm md:text-base space-y-4 drop-shadow-md">
                        {pilar.content.map((p, i) => <p key={i}>{p}</p>)}
                        {pilar.quote && (
                            <p className="text-white font-bold border-l-2 border-iskf-red pl-4 italic mt-4 bg-white/5 p-4 rounded-r-lg">{pilar.quote}</p>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderDojoKun = () => (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-gray-200 font-normal text-lg leading-relaxed text-left md:text-justify mb-10 space-y-6 bg-black/60 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-lg">
                {content.intro.map((p, i) => <p key={i} className="drop-shadow-md">{p}</p>)}
            </div>

            <div className="space-y-6">
                {content.rules.map((rule, idx) => (
                    <motion.div
                        key={idx}
                        variants={itemVariants}
                        className="group relative bg-black/70 border border-white/10 rounded-2xl p-8 hover:bg-black/80 transition-colors shadow-lg backdrop-blur-md"
                    >
                        <div className="absolute left-0 top-8 w-1 h-12 bg-iskf-red shadow-neon group-hover:h-full group-hover:top-0 transition-all duration-500 rounded-l-2xl"></div>
                        <div className="flex flex-col gap-2 pl-4">
                            <h3 className="text-xl md:text-2xl font-bold text-white flex flex-col md:flex-row md:items-baseline gap-2">
                                <span className="text-iskf-red font-serif italic text-2xl md:text-3xl">HITOTSU</span>
                                <span className="text-gray-400 font-light tracking-widest text-sm md:text-base uppercase">{rule.japanese}</span>
                            </h3>
                            <p className="text-gray-200 text-lg font-light italic pl-0 md:pl-4 border-l-0 md:border-l border-white/30 group-hover:text-white transition-colors">
                                {rule.spanish}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="text-center opacity-70 mt-16">
                <p className="font-serif italic text-sm">{content.quote.text}</p>
                <p className="text-xs mt-2 uppercase tracking-widest text-iskf-red">— {content.quote.author}</p>
            </div>
        </div>
    );

    const renderNijuKun = () => (
        <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-gray-200 font-normal text-lg leading-relaxed text-left md:text-justify mb-10 space-y-6 max-w-4xl mx-auto bg-black/60 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-lg">
                {content.intro.map((p, i) => <p key={i} className="drop-shadow-md">{p}</p>)}

                <div className="border-l-4 border-iskf-red pl-6 py-4 my-8 bg-white/5 rounded-r-xl">
                    <p className="italic text-white font-serif mb-2">{content.quote.text}</p>
                    <span className="text-sm text-iskf-red font-bold uppercase tracking-wider">— {content.quote.author}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {content.rules.map((rule, idx) => (
                    <motion.div
                        key={idx}
                        variants={itemVariants}
                        className="bg-black/70 border border-white/10 rounded-xl p-6 hover:bg-black/80 transition-colors group flex items-start gap-4 backdrop-blur-md shadow-md"
                    >
                        <span className="text-iskf-red font-bold text-xl opacity-80 block shadow-neon">{(idx + 1).toString().padStart(2, '0')}</span>
                        <p className="text-gray-200 font-medium group-hover:text-white transition-colors text-sm md:text-base drop-shadow-sm">{rule}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderEstructura = () => (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center space-y-16">
            {/* Shihan */}
            <motion.div variants={itemVariants} className="relative group z-20 w-full max-w-2xl">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-900 to-[#2D2E83] rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl hover:border-iskf-red/50 transition-colors duration-300">
                    <div className="relative w-32 h-48 md:w-36 md:h-48 flex-shrink-0">
                        <img src={content.shihan.img} alt={content.shihan.name} className="w-full h-full object-cover object-top rounded-xl border-2 border-iskf-red shadow-lg" />
                    </div>
                    <div className="text-center md:text-left space-y-2">
                        <h4 className="text-iskf-red font-bold text-xs uppercase tracking-[0.25em]">{content.shihan.role}</h4>
                        <h3 className="text-2xl md:text-3xl font-black text-white leading-none">{content.shihan.name}</h3>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                            {content.shihan.titles.map((t, i) => (
                                <span key={i} className="bg-iskf-red text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-neon">{t}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Gerencia */}
            <motion.div variants={itemVariants} className="relative z-10 w-full max-w-sm text-center">
                <div className="bg-[#111] border border-iskf-red/30 rounded-xl p-6 shadow-[0_10px_40px_-10px_rgba(190,19,34,0.3)]">
                    <h4 className="text-iskf-red font-bold text-[10px] uppercase tracking-widest mb-2 border-b border-iskf-red/20 pb-2 inline-block">{content.gerencia.department}</h4>
                    <h3 className="text-xl font-bold text-white uppercase mb-1">{content.gerencia.title}</h3>
                    <p className="text-white/80 font-medium text-sm">{content.gerencia.name}</p>
                </div>
                {/* Decorative Line */}
                <div className="h-8 w-px bg-white/20 mx-auto mt-4 md:hidden"></div>
            </motion.div>

            {/* Distribution Branches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
                {/* Board */}
                <motion.div variants={itemVariants}>
                    <h3 className="text-center text-white font-bold uppercase tracking-widest mb-6 border-b border-white/10 pb-2">Junta Directiva</h3>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
                        {content.junta.map((member, i) => (
                            <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                <span className="text-gray-400 font-medium uppercase text-xs">{member.role}</span>
                                <span className="text-white font-semibold text-right text-xs md:text-sm">{member.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Commissions */}
                <motion.div variants={itemVariants}>
                    <h3 className="text-center text-white font-bold uppercase tracking-widest mb-6 border-b border-white/10 pb-2">Comisiones</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {content.comisiones.map((comm, i) => (
                            <div key={i} className="bg-iskf-dark border border-iskf-red/20 rounded-xl p-4 text-center hover:bg-white/5 transition-colors">
                                <h5 className="text-iskf-red font-bold text-[10px] uppercase mb-1">{comm.title}</h5>
                                <p className="text-white text-xs font-medium">{comm.name}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );

    let renderContent;
    switch (section) {
        case 'identidad': renderContent = renderIdentidad; break;
        case 'pilares': renderContent = renderPilares; break;
        case 'dojoKun': renderContent = renderDojoKun; break;
        case 'nijuKun': renderContent = renderNijuKun; break;
        case 'estructura': renderContent = renderEstructura; break;
        default: renderContent = () => null;
    }

    return (
        <div className={`bg-iskf-dark ${section === 'identidad' ? 'h-screen overflow-hidden' : 'min-h-screen'} text-white font-sans selection:bg-iskf-red selection:text-white relative`}>
            {/* Standardized Fixed Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img
                    src={fondoSonreNosotrosTarjetas}
                    alt="Background"
                    className="w-full h-full object-cover opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/60"></div>
            </div>

            {/* Floating Back Button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => navigate('/', { state: { targetId: 'nosotros' } })}
                className="fixed top-24 left-6 md:left-16 z-50 w-12 h-12 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-iskf-red hover:border-iskf-red transition-all duration-300 shadow-lg group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </motion.button>



            <div className={`min-h-[calc(100vh-80px)] px-6 ${section === 'identidad' ? 'py-0 flex items-center justify-center' : 'py-32'} flex flex-col items-center relative w-full max-w-7xl mx-auto`}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-center ${section === 'identidad' ? 'mb-4' : 'mb-16'} relative z-10 w-full`}
                >
                    <span className="text-iskf-red font-bold tracking-[0.3em] text-xs uppercase mb-2 block animate-pulse">
                        {content.subtitle || "ISKF Costa Rica"}
                    </span>
                    <h2 className={`font-black text-white tracking-widest uppercase ${section === 'identidad' ? 'text-3xl md:text-5xl mb-2' : 'text-4xl md:text-6xl mb-6'} drop-shadow-2xl`}>
                        {content.title}
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-transparent via-iskf-red to-transparent mx-auto rounded-full shadow-[0_0_15px_#be1322]"></div>
                </motion.div>

                {/* Content Body */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={`w-full relative z-10 ${section === 'identidad' ? 'h-auto' : ''}`}
                >
                    {renderContent()}
                </motion.div>
            </div>
        </div>
    );
};

export default AboutDetailPage;
