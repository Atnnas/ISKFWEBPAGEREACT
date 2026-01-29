import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useWindowSize from '../../hooks/useWindowSize';

import iskfFondoRojo from '../../assets/images/iskfFondoRojo.jpg';
import noise from '../../assets/images/noise.png';

const OrbitalTimeline = ({ dojos }) => {
    const [expandedId, setExpandedId] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null); // Lightbox State
    const [rotation, setRotation] = useState(0);
    const requestRef = useRef();
    const startTimeRef = useRef();
    const containerRef = useRef();
    const { width } = useWindowSize();

    // ... (Configuration & Animation Loop - Same as before) ...
    // Dynamic Configuration
    const isMobile = width < 768;
    const RADIUS_X = isMobile ? width * 0.30 : 220;
    const RADIUS_Y = isMobile ? RADIUS_X * 0.4 : 70;
    const SPEED = 0.005;
    const ORBITS = [0, 60, 120];

    const bolts = React.useMemo(() => [
        "M50 50 L55 35 L48 30 L60 10",
        "M50 50 L40 45 L35 55 L10 50",
        "M50 50 L60 65 L55 75 L80 90",
        "M50 50 L35 35 L40 25 L20 20"
    ].map(d => ({
        d,
        duration: 0.2 + Math.random() * 0.5,
        repeatDelay: Math.random() * 2
    })), []);

    useEffect(() => {
        const animate = (time) => {
            if (!startTimeRef.current) startTimeRef.current = time;
            setRotation(prev => (prev + SPEED) % (Math.PI * 2));
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    // Close on Scroll
    useEffect(() => {
        const handleScroll = () => {
            if (expandedId) {
                setExpandedId(null);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [expandedId]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full min-h-[500px] flex items-center justify-center overflow-visible perspective-1000"
        >
            {/* ... (Sun Center & BackgroundRings - Same as before) ... */}
            {/* Sun Center (ISKF) - Gyroscope Core */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center group cursor-pointer">
                <div className="absolute w-32 h-32 bg-iskf-red/40 rounded-full blur-[40px] animate-pulse group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute w-20 h-20 bg-blue-500/20 rounded-full blur-[20px] animate-pulse delay-75"></div>

                {/* ELECTRIC SPARKS */}
                <svg className="absolute inset-[-100%] w-[300%] h-[300%] pointer-events-none z-30 overflow-visible" viewBox="0 0 100 100">
                    <defs>
                        <filter id="bolt-glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="0.5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {bolts.map((bolt, i) => (
                        <motion.path
                            key={i}
                            d={bolt.d}
                            stroke="white"
                            strokeWidth="0.2"
                            fill="none"
                            filter="url(#bolt-glow)"
                            initial={{ opacity: 0, pathLength: 0 }}
                            animate={{
                                opacity: [0, 0.8, 0, 0, 0.6, 0],
                                pathLength: [0, 1, 1],
                                strokeWidth: [0.1, 0.8, 0.1]
                            }}
                            transition={{
                                duration: bolt.duration,
                                repeat: Infinity,
                                repeatType: "mirror",
                                repeatDelay: bolt.repeatDelay,
                                ease: "linear"
                            }}
                        />
                    ))}
                    <motion.circle
                        cx="50" cy="50" r="15"
                        stroke="#BE1322" strokeWidth="1" fill="none"
                        initial={{ r: 15, opacity: 0.5 }}
                        animate={{ r: [15, 25], opacity: [0.5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                </svg>

                <div className="relative w-24 h-24 rounded-full shadow-[0_0_60px_rgba(190,19,34,0.6)] flex items-center justify-center z-10 overflow-hidden border border-white/30 group-hover:scale-105 transition-transform duration-500 group-hover:shadow-[0_0_80px_rgba(190,19,34,0.9)]">
                    <div className="absolute inset-0 bg-black">
                        <img src={iskfFondoRojo} alt="ISKF Core" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/80"></div>
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent opacity-60 rounded-t-full"></div>
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: `url('${noise}')` }}></div>
                </div>

                <div className="absolute w-36 h-36 rounded-full border border-white/20 border-t-iskf-red border-b-transparent animate-[spin_6s_linear_infinite] pointer-events-none mix-blend-screen shadow-[0_0_15px_rgba(190,19,34,0.4)]"></div>
                <div className="absolute w-44 h-44 rounded-full border-[1px] border-white/10 border-l-white/60 border-r-transparent animate-[spin_4s_linear_infinite_reverse] pointer-events-none" style={{ transform: 'rotateX(60deg) rotateY(15deg)' }}></div>
                <div className="absolute w-52 h-52 rounded-full border-[1px] border-iskf-red/30 border-r-iskf-red animate-[spin_9s_linear_infinite]" style={{ transform: 'rotateX(75deg) rotateY(-15deg)' }}></div>
                <div className="absolute w-60 h-60 border border-dotted border-white/10 rounded-full animate-[spin_20s_linear_infinite] opacity-30"></div>
            </div>

            {/* ATOMIC RINGS BACKGROUND */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                <defs>
                    <filter id="glow-resonance" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {ORBITS.map((deg, i) => (
                    <g key={i} style={{ transformOrigin: 'center', transform: `rotate(${deg}deg)` }}>
                        <motion.ellipse
                            cx="50%" cy="50%"
                            rx={RADIUS_X} ry={RADIUS_Y}
                            fill="none"
                            stroke="#BE1322"
                            initial={{ opacity: 0, rx: RADIUS_X, ry: RADIUS_Y }}
                            animate={{
                                opacity: [0.2, 0.6, 0.2],
                                strokeWidth: [4, 12, 4],
                                rx: [RADIUS_X, RADIUS_X + 10, RADIUS_X],
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 }}
                            className="blur-md mix-blend-screen"
                        />
                        <ellipse cx="50%" cy="50%" rx={RADIUS_X} ry={RADIUS_Y} fill="none" stroke="rgba(190, 19, 34, 0.4)" strokeWidth="2" filter="url(#glow-resonance)" className="opacity-40 animate-pulse" style={{ animationDuration: `${2 + i}s` }} />
                        <ellipse cx="50%" cy="50%" rx={RADIUS_X} ry={RADIUS_Y} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="10 20" className="opacity-50" />
                        <ellipse cx="50%" cy="50%" rx={RADIUS_X} ry={RADIUS_Y} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                    </g>
                ))}
            </svg>

            {/* Nodes */}
            {dojos.map((dojo, index) => {
                const total = dojos.length;
                const orbitIndex = index % 3;
                const orbitAngleDeg = ORBITS[orbitIndex];
                const orbitAngleRad = orbitAngleDeg * (Math.PI / 180);
                const angleOffset = (index / total) * 2 * Math.PI;
                const currentAngle = rotation + angleOffset;
                const localX = RADIUS_X * Math.cos(currentAngle);
                const localY = RADIUS_Y * Math.sin(currentAngle);
                const x = localX * Math.cos(orbitAngleRad) - localY * Math.sin(orbitAngleRad);
                const y = localX * Math.sin(orbitAngleRad) + localY * Math.cos(orbitAngleRad);
                const depth = Math.sin(currentAngle);
                const scale = 0.5 + 0.5 * ((1 + depth) / 2);
                const opacity = 0.4 + 0.6 * ((1 + depth) / 2);
                const zIndex = Math.round(100 + 50 * depth);
                const isExpanded = expandedId === dojo.id;

                return (
                    <motion.div
                        key={dojo.id}
                        className="absolute top-1/2 left-1/2 cursor-pointer"
                        style={{
                            x: isExpanded ? 0 : x,
                            y: isExpanded ? 0 : y,
                            xPercent: -50,
                            yPercent: -50,
                            zIndex: isExpanded ? 200 : zIndex,
                            scale: isExpanded ? 1 : scale,
                            opacity: isExpanded ? 1 : opacity,
                        }}
                        transition={isExpanded ? { type: 'spring', stiffness: 200, damping: 20 } : { duration: 0 }}
                        onClick={() => setExpandedId(isExpanded ? null : dojo.id)}
                    >
                        {/* Node Content */}
                        <div className={`relative w-16 h-16 md:w-24 md:h-24 bg-black border ${isExpanded ? 'border-iskf-red bg-white' : 'border-white/30'} rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 group hover:border-iskf-red hover:shadow-[0_0_20px_#ce1126] hover:scale-110`}>
                            <img src={dojo.logo} alt={dojo.name} className="w-[85%] h-[85%] object-contain" />
                            {!isExpanded && opacity > 0.8 && (
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] font-black uppercase tracking-wider text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md bg-black/50 px-2 py-1 rounded backdrop-blur-sm pointer-events-none">{dojo.name}</div>
                            )}
                        </div>

                        {/* Expanded Card */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    className="fixed inset-0 z-[500] flex items-center justify-center p-4 pointer-events-none"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                                >
                                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"></div>

                                    <motion.div
                                        layoutId={`card-${dojo.id}-content`}
                                        className="relative bg-zinc-900/90 border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-[0_0_50px_rgba(190,19,34,0.3)] pointer-events-auto text-center backdrop-blur-xl"
                                        initial={{ scale: 0.8, y: 50, opacity: 0 }}
                                        animate={{ scale: 1, y: 0, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors" onClick={() => setExpandedId(null)}>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        </button>
                                        <div
                                            className={`w-40 h-40 bg-white rounded-2xl mx-auto mb-6 p-1 shadow-inner flex items-center justify-center relative overflow-hidden ring-4 ring-white/10 ${dojo.senseiImage ? 'cursor-zoom-in' : ''}`}
                                            onClick={(e) => {
                                                if (dojo.senseiImage) {
                                                    e.stopPropagation();
                                                    setSelectedImage(dojo.senseiImage);
                                                }
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white"></div>
                                            {dojo.senseiImage ? (
                                                <img
                                                    src={dojo.senseiImage}
                                                    alt={dojo.name}
                                                    className="w-full h-full relative z-10 object-cover object-top rounded-xl"
                                                />
                                            ) : (
                                                <div className="relative z-10 w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
                                                    {/* Generic User Icon/Placeholder */}
                                                    <svg className="w-12 h-12 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <span className="inline-block px-3 py-1 rounded-full bg-iskf-red/10 text-iskf-red text-[10px] font-black uppercase tracking-widest mb-4 border border-iskf-red/20">{dojo.province}</span>
                                        <h3 className="text-2xl font-black text-white uppercase mb-2 leading-none">{dojo.name}</h3>
                                        <div className="w-12 h-1 bg-iskf-red mx-auto mb-6 rounded-full"></div>

                                        <div className="space-y-4 text-left bg-black/20 p-6 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-iskf-red/10 flex items-center justify-center text-iskf-red text-xl">🥋</div>
                                                <div>
                                                    <span className="block text-[10px] uppercase text-gray-500 font-bold tracking-wider">Sensei</span>
                                                    <span className="text-lg font-bold text-gray-200 block leading-tight">{dojo.sensei}</span>
                                                    {dojo.rank && (
                                                        <span className="text-sm font-bold text-iskf-red italic block">{dojo.rank}</span>
                                                    )}
                                                    {dojo.profession && (
                                                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest block mt-1 border-t border-white/10 pt-1 w-fit">
                                                            <span className="text-gray-600">Profesión: </span>{dojo.profession}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl">📍</div>
                                                <div>
                                                    <span className="block text-[10px] uppercase text-gray-500 font-bold tracking-wider">Ubicación</span>
                                                    <a
                                                        href={dojo.detailsUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium text-gray-300 hover:text-blue-400 cursor-pointer transition-colors"
                                                    >
                                                        Ver Ubicación
                                                    </a>
                                                </div>
                                            </div>
                                            {dojo.website && (
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 text-xl">🌐</div>
                                                    <div>
                                                        <span className="block text-[10px] uppercase text-gray-500 font-bold tracking-wider">Sitio Web</span>
                                                        <a
                                                            href={dojo.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm font-medium text-gray-300 hover:text-purple-400 cursor-pointer transition-colors"
                                                        >
                                                            Visitar Web
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}

            {/* LIGHTBOX OVERLAY - Epic Full Screen View */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                    >
                        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl"></div>
                        <motion.div
                            className="relative z-10 p-2 bg-gradient-to-tr from-iskf-red/20 to-transparent rounded-2xl border border-white/10 shadow-[0_0_100px_rgba(190,19,34,0.3)]"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                        >
                            <img
                                src={selectedImage}
                                alt="Sensei Full View"
                                className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
                            />
                            <button className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors">
                                <span className="uppercase text-xs font-bold tracking-widest">Cerrar [ESC]</span>
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrbitalTimeline;
