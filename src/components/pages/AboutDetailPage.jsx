"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import SocialSidebar from '../layout/SocialSidebar';
import { aboutData } from '../../data/aboutData';
import fondoSonreNosotrosTarjetas from '../../assets/images/fondoSonreNosotrosTarjetas.jpg';
import fondoEstructura from '../../assets/images/fondo-estructura.png';
import { ThreeDPhotoCarousel } from '../ui/3d-carousel';

const DojoKunAudioPlayer = ({ src }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration;
        setCurrentTime(current);
        if (total > 0) {
            setProgress((current / total) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e) => {
        if (!audioRef.current || duration === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = x / width;
        audioRef.current.currentTime = percentage * duration;
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 backdrop-blur-md z-30 p-6 flex flex-col gap-4">
            <audio
                ref={audioRef}
                src={src?.src || src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
            />

            <div className="flex items-center justify-between pointer-events-none mb-2">
                <span className="text-xs font-bold tracking-[0.3em] uppercase text-gray-400 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full bg-iskf-red ${isPlaying ? 'animate-pulse' : ''}`}></span>
                    Pronunciación Original
                </span>
                <span className="text-[10px] text-gray-500 font-serif italic">Audio Oficial Dojo Kun</span>
            </div>

            <div className="flex items-center gap-6">
                <button
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-iskf-red/90 hover:bg-iskf-red flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(190,19,34,0.3)] hover:scale-105 active:scale-95"
                >
                    {isPlaying ? (
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>

                <div className="flex-1 flex flex-col gap-2">
                    <div
                        className="h-2 bg-white/10 rounded-full cursor-pointer relative overflow-hidden"
                        onClick={handleSeek}
                    >
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-iskf-red to-blue-500 shadow-[0_0_10px_rgba(190,19,34,0.5)]"
                            style={{ width: `${progress}%` }}
                            transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                        />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-gray-500 tabular-nums">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>

            {isPlaying && (
                <div className="flex items-end gap-1 h-3 absolute bottom-2 right-6 opacity-30 pointer-events-none">
                    {[1, 2, 3, 4, 5].map(i => (
                        <motion.div
                            key={i}
                            animate={{ height: [4, 12, 6, 10, 4] }}
                            transition={{ duration: 0.8 + (i * 0.1), repeat: Infinity, ease: "easeInOut" }}
                            className="w-1 bg-iskf-red rounded-full"
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const AboutDetailPage = () => {
    const { section } = useParams();
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const content = aboutData[section];

    useEffect(() => {
        if (!content) {
            router.push('/nosotros');
        } else {
            window.scrollTo(0, 0);
        }
    }, [section, content, router]);

    if (!content) return null;

    const itemVariants = {
        hidden: { 
            opacity: 0, 
            y: 100, 
            scale: 0.3, 
            rotateY: 90, 
            rotateZ: -15,
            filter: 'blur(10px)'
        },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            rotateY: 0, 
            rotateZ: 0,
            filter: 'blur(0px)',
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 15,
                mass: 1.2
            }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { 
                staggerChildren: 0.12,
                delayChildren: 0.1
            }
        }
    };

    const [forceCloseToggle, setForceCloseToggle] = useState(0);

    const renderIdentidad = () => (
        <div className="w-full max-w-[1900px] mx-auto pb-4 [@media(max-height:800px)]:pb-2 xl:pb-10 px-2 sm:px-4 md:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 [@media(max-height:800px)]:gap-2 xl:gap-6 2xl:gap-8">
                {content.items.map((item, index) => (
                    <motion.div 
                        key={index}
                        variants={itemVariants}
                        className="group relative z-20 flex flex-col cursor-pointer"
                        onClick={() => {
                            setIsModalOpen({
                                id: index,
                                title: item.title,
                                description: item.desc,
                                image: item.img
                            });
                        }}
                    >
                        <div className="absolute inset-0 overflow-hidden rounded-3xl"><div className="absolute -inset-4 bg-gradient-to-r from-iskf-dark/40 to-iskf-red/40 blur-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div></div>
                        <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:bg-white/50 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full">
                            <div className="aspect-[4/3] w-full overflow-hidden flex items-center justify-center p-2 [@media(max-height:800px)]:p-1 xl:p-4">
                                <img 
                                    src={item.img?.src || item.img} 
                                    alt={item.title} 
                                    className="w-[90%] h-[90%] object-contain group-hover:scale-110 transition-transform duration-700 drop-shadow-lg rounded-xl"
                                />
                            </div>
                            <div className="mx-2 [@media(max-height:800px)]:mx-1 xl:mx-4 py-2 [@media(max-height:800px)]:py-1 xl:py-4 border-t border-iskf-red/50 flex-grow bg-transparent flex flex-col justify-center">
                                <h3 className="text-iskf-dark font-black text-sm [@media(max-height:800px)]:text-xs xl:text-lg 2xl:text-xl mb-1 group-hover:text-iskf-blue transition-colors tracking-tight uppercase leading-none">{item.title}</h3>
                                <p className="text-gray-800 text-xs [@media(max-height:800px)]:text-[10px] xl:text-base 2xl:text-lg font-semibold leading-snug xl:leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderPilares = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xl:gap-8 2xl:gap-12 w-full">
            {content.map((pilar, index) => (
                <motion.div key={index} variants={itemVariants} className="relative group z-20">
                    <div className="absolute inset-0 overflow-hidden rounded-3xl"><div className="absolute -inset-4 bg-gradient-to-r from-iskf-dark/40 to-iskf-red/40 blur-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div></div>
                    <div className="relative h-full space-y-3 [@media(max-height:800px)]:space-y-2 xl:space-y-6 bg-white/40 backdrop-blur-xl p-4 [@media(max-height:800px)]:p-3 xl:p-8 rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:bg-white/50 transition-all duration-300">
                        <div className="h-1 w-12 [@media(max-height:800px)]:w-8 xl:w-20 bg-iskf-red mb-3 [@media(max-height:800px)]:mb-2 xl:mb-6 shadow-sm" />
                        <h3 className="text-lg [@media(max-height:800px)]:text-base xl:text-3xl font-black text-iskf-dark mb-2 xl:mb-4 tracking-widest uppercase drop-shadow-sm">
                            {pilar.title} <span className="text-[10px] xl:text-sm block text-gray-600 font-serif italic mt-1 font-normal tracking-normal text-iskf-red">{pilar.subtitle}</span>
                        </h3>
                        <div className="text-gray-800 leading-snug xl:leading-relaxed font-medium text-justify text-xs [@media(max-height:800px)]:text-[10px] xl:text-base 2xl:text-lg space-y-2 xl:space-y-4">
                            {pilar.content.map((p, i) => <p key={i}>{p}</p>)}
                            {pilar.quote && (
                                <p className="text-iskf-dark font-bold border-l-2 border-iskf-red pl-3 xl:pl-4 italic mt-2 xl:mt-4 bg-white/40 p-2 xl:p-4 rounded-r-lg">{pilar.quote}</p>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderDojoKun = () => (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="relative group z-20 mb-10">
                <div className="absolute inset-0 overflow-hidden rounded-3xl"><div className="absolute -inset-4 bg-gradient-to-r from-iskf-dark/40 to-iskf-red/40 blur-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div></div>
                <div className="relative text-gray-800 font-medium text-lg leading-relaxed text-left md:text-justify space-y-6 bg-white/40 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:bg-white/50 transition-all duration-300">
                    {content.intro.map((p, i) => <p key={i}>{p}</p>)}
                </div>
            </div>

            {content.audio && <DojoKunAudioPlayer src={content.audio?.src || content.audio} />}

            <div className="space-y-6">
                {content.rules.map((rule, idx) => (
                    <motion.div
                        key={idx}
                        variants={itemVariants}
                        className="group relative bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-8 hover:bg-white/50 hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)] transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
                    >
                        <div className="absolute left-0 top-8 w-1 h-12 bg-iskf-red shadow-[0_0_10px_rgba(190,19,34,0.5)] group-hover:h-full group-hover:top-0 transition-all duration-500 rounded-l-3xl"></div>
                        <div className="flex flex-col gap-2 pl-4">
                            <h3 className="text-xl md:text-2xl font-black text-iskf-dark flex flex-col md:flex-row md:items-baseline gap-2">
                                <span className="text-iskf-red font-serif italic text-2xl md:text-3xl">HITOTSU</span>
                                <span className="text-gray-600 font-light tracking-widest text-sm md:text-base uppercase">{rule.japanese}</span>
                            </h3>
                            <p className="text-gray-800 text-lg font-medium italic pl-0 md:pl-4 border-l-0 md:border-l border-white/60 transition-colors">
                                {rule.spanish}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="text-center opacity-100 mt-20 max-w-3xl mx-auto px-6 relative">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-8xl text-iskf-red/20 font-serif leading-none select-none">"</div>
                <p className="font-serif italic text-xl md:text-2xl lg:text-3xl text-iskf-dark leading-relaxed drop-shadow-sm">{content.quote.text}</p>
                <p className="text-sm md:text-base mt-6 font-bold uppercase tracking-[0.2em] text-iskf-red drop-shadow-sm">— {content.quote.author}</p>
                <div className="w-16 h-1 bg-iskf-red mx-auto mt-8 shadow-sm"></div>
            </div>
        </div>
    );

    const renderNijuKun = () => (
        <div className="max-w-6xl mx-auto space-y-12">
            <div className="relative group z-20 mb-10 max-w-4xl mx-auto">
                <div className="absolute inset-0 overflow-hidden rounded-3xl"><div className="absolute -inset-4 bg-gradient-to-r from-iskf-dark/40 to-iskf-red/40 blur-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div></div>
                <div className="relative text-gray-800 font-medium text-lg leading-relaxed text-left md:text-justify space-y-6 bg-white/40 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:bg-white/50 transition-all duration-300">
                    {content.intro.map((p, i) => <p key={i}>{p}</p>)}
                    <div className="border-l-4 border-iskf-red pl-6 py-4 my-8 bg-white/40 rounded-r-xl">
                        <p className="italic text-iskf-dark font-serif mb-2">{content.quote.text}</p>
                        <span className="text-sm text-iskf-red font-bold uppercase tracking-wider">— {content.quote.author}</span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {content.rules.map((rule, idx) => (
                    <motion.div
                        key={idx}
                        variants={itemVariants}
                        className="relative group z-20"
                    >
                        <div className="absolute inset-0 overflow-hidden rounded-3xl"><div className="absolute -inset-4 bg-gradient-to-r from-iskf-dark/40 to-iskf-red/40 blur-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div></div>
                        <div className="relative bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-6 hover:bg-white/50 transition-all duration-300 flex items-start gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.1)] h-full">
                            <span className="text-iskf-red font-black text-xl opacity-80 block drop-shadow-sm">{(idx + 1).toString().padStart(2, '0')}</span>
                            <p className="text-gray-800 font-medium text-sm md:text-base">{rule}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderEstructura = () => (
        <div className="w-full h-full max-w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 items-stretch pb-4 px-4 md:px-12 2xl:px-24">
            
            {/* LEFT COLUMN: Shihan (33%) */}
            <motion.div variants={itemVariants} className="relative group z-20 h-full flex flex-col">
                <div className="absolute inset-0 overflow-hidden rounded-3xl"><div className="absolute -inset-4 bg-gradient-to-r from-iskf-dark/40 to-iskf-red/40 blur-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div></div>
                <div className="relative bg-white/40 backdrop-blur-xl h-full border border-white/60 rounded-3xl p-6 flex flex-col items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:bg-white/50 transition-colors duration-300 flex-grow text-center">
                    <div className="relative w-32 h-44 xl:w-40 xl:h-56 flex-shrink-0">
                        <img src={content.shihan.img?.src || content.shihan.img} alt={content.shihan.name} className="w-full h-full object-cover object-top rounded-2xl border-4 border-iskf-red shadow-xl" />
                    </div>
                    <div className="space-y-2 flex-1 flex flex-col justify-center">
                        <div>
                            <h4 className="text-iskf-red font-bold text-base uppercase tracking-[0.2em] mb-1">{content.shihan.role}</h4>
                            <h3 className="text-4xl xl:text-5xl font-black text-iskf-dark leading-none">{content.shihan.name}</h3>
                        </div>
                        <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                            {content.shihan.titles.map((t, i) => (
                                <span key={i} className="bg-iskf-dark text-white px-3 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase shadow-md">{t}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* MIDDLE COLUMN: Junta Directiva (33%) */}
            <motion.div variants={itemVariants} className="relative group z-20 h-full flex flex-col">
                <div className="absolute inset-0 overflow-hidden rounded-3xl"><div className="absolute -inset-4 bg-gradient-to-r from-iskf-dark/40 to-iskf-red/40 blur-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div></div>
                <div className="relative bg-white/40 backdrop-blur-xl h-full border border-white/60 rounded-3xl p-6 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:bg-white/50 transition-colors duration-300">
                    <h3 className="text-iskf-dark font-black text-2xl xl:text-3xl uppercase tracking-widest mb-4 border-b-2 border-iskf-red/50 pb-2 drop-shadow-sm">Junta Directiva</h3>
                    <div className="grid grid-cols-1 gap-y-3 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                        {content.junta.map((member, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-iskf-dark/5 pb-1 group/item hover:border-iskf-red/30 transition-colors">
                                <span className="text-iskf-red font-bold text-sm uppercase tracking-widest">{member.role}</span>
                                <span className="text-iskf-dark font-black text-lg xl:text-xl text-right">{member.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
            {/* RIGHT COLUMN: Comisiones (33%) */}
            <motion.div variants={itemVariants} className="relative group z-20 h-full flex flex-col">
                <div className="absolute inset-0 overflow-hidden rounded-3xl"><div className="absolute -inset-4 bg-gradient-to-r from-iskf-dark/40 to-iskf-red/40 blur-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div></div>
                <div className="relative bg-white/40 backdrop-blur-xl h-full border border-white/60 rounded-3xl p-6 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:bg-white/50 transition-colors duration-300">
                    <h3 className="text-iskf-dark font-black text-2xl xl:text-3xl uppercase tracking-widest mb-5 border-b-2 border-iskf-red/50 pb-2 drop-shadow-sm">Comisiones Especiales</h3>
                    <div className="grid grid-cols-2 gap-4 flex-grow overflow-y-auto pr-2 custom-scrollbar content-start">
                        {content.comisiones.map((comm, i) => (
                            <div key={i} className="bg-white/30 backdrop-blur-md border border-white/50 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:border-iskf-red hover:bg-white/60 transition-all duration-300 group/item h-full min-h-[90px] shadow-sm">
                                <h5 className="text-iskf-red font-bold text-xs xl:text-sm uppercase tracking-wider mb-2 leading-tight">{comm.title}</h5>
                                <p className="text-iskf-dark text-base xl:text-lg font-black leading-tight">{comm.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
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

    const isEstructura = section === 'estructura';
    const isNoScrollSection = isEstructura || section === 'identidad' || section === 'pilares';

    return (
        <div className={`bg-white ${isNoScrollSection ? 'h-screen overflow-y-auto' : 'min-h-screen'} text-iskf-dark font-sans  relative transition-colors duration-500`}>
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img src={fondoEstructura?.src || fondoEstructura} alt="Background" className="w-full h-full object-cover object-bottom opacity-100 brightness-110" />
            </div>

            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => {
                    if (isModalOpen) {
                        setIsModalOpen(false);
                    } else {
                        router.push('/nosotros');
                    }
                }}
                className="fixed top-24 left-6 md:left-16 z-50 w-12 h-12 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-iskf-red hover:border-iskf-red transition-all duration-300 shadow-lg group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </motion.button>

            <div className={`min-h-[calc(100vh-80px)] ${isEstructura ? 'px-0' : 'px-4 lg:px-8 2xl:px-12'} ${isNoScrollSection ? 'pt-24 [@media(max-height:800px)]:pt-16 xl:pt-36 2xl:pt-44 pb-4 2xl:pb-8' : 'pt-28 xl:pt-36 2xl:pt-44 pb-20 2xl:pb-32'} flex flex-col items-center relative w-full max-w-full mx-auto`}>
                {content.title && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-center ${isNoScrollSection ? 'mb-4' : 'mb-16'} relative z-10 w-full pt-16 md:pt-0 ${isEstructura ? 'opacity-0 pointer-events-none select-none' : ''}`}
                    >
                        <span className={`text-iskf-red font-bold tracking-[0.3em] ${isEstructura ? 'text-lg md:text-xl drop-shadow-md' : 'text-xs drop-shadow-sm'} uppercase mb-2 block`}>
                            {content.subtitle || "ISKF Costa Rica"}
                        </span>
                        <h2 
                            className={`font-black tracking-widest uppercase text-iskf-red ${isNoScrollSection ? 'text-5xl md:text-6xl mb-4' : 'text-6xl mb-6'} drop-shadow-xl transition-all duration-300`}
                            style={{ textShadow: '0px 10px 20px rgba(0,0,0,0.1), 0px 4px 8px rgba(0,0,0,0.05)' }}
                        >
                            {content.title}
                        </h2>
                    </motion.div>
                )}

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={`w-full relative z-10 ${isNoScrollSection ? 'h-auto max-h-full' : ''}`}
                >
                    {renderContent()}
                </motion.div>
            </div>
            
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-12 cursor-pointer"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.5, y: 100, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.8, y: -50, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="relative max-w-5xl w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row cursor-default"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 z-10 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-iskf-red transition-colors"
                            >
                                ✕
                            </button>
                            <div className="w-full md:w-1/2 bg-black/20 p-8 flex items-center justify-center aspect-square md:aspect-auto">
                                <img src={isModalOpen.image?.src || isModalOpen.image} alt={isModalOpen.title} className="w-full h-full object-contain drop-shadow-2xl" />
                            </div>
                            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                                <h3 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase leading-none drop-shadow-md">{isModalOpen.title}</h3>
                                <div className="w-20 h-1 bg-iskf-red mb-6" />
                                <p className="text-white/90 text-lg md:text-xl font-medium leading-relaxed">{isModalOpen.description}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <SocialSidebar />
        </div>
    );
};

export default AboutDetailPage;
