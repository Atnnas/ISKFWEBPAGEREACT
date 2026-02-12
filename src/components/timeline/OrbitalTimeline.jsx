import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import useWindowSize from '../../hooks/useWindowSize';

import iskfFondoRojo from '../../assets/images/iskfFondoRojo.jpg';
import noise from '../../assets/images/noise.png';

// Memoized individual dojo node to prevent whole timeline re-renders
const DojoNode = memo(({ dojo, index, totalDojos, rotation, RADIUS_X, RADIUS_Y, isExpanded, setExpandedId, opacity, ORBITS, setSelectedImage }) => {
    const orbitIndex = index % 3;
    const orbitAngleDeg = ORBITS[orbitIndex];
    const orbitAngleRad = orbitAngleDeg * (Math.PI / 180);
    const angleOffset = (index / totalDojos) * 2 * Math.PI;

    // Position calculated via global rotation MotionValue - bypasses React re-render cycle
    const x = useTransform(rotation, (r) => {
        const currentAngle = r + angleOffset;
        const localX = RADIUS_X * Math.cos(currentAngle);
        const localY = RADIUS_Y * Math.sin(currentAngle);
        return localX * Math.cos(orbitAngleRad) - localY * Math.sin(orbitAngleRad);
    });

    const y = useTransform(rotation, (r) => {
        const currentAngle = r + angleOffset;
        const localX = RADIUS_X * Math.cos(currentAngle);
        const localY = RADIUS_Y * Math.sin(currentAngle);
        return localX * Math.sin(orbitAngleRad) + localY * Math.cos(orbitAngleRad);
    });

    const zIndexValue = useTransform(rotation, (r) => {
        const currentAngle = r + angleOffset;
        const depth = Math.sin(currentAngle);
        return Math.round(100 + 50 * depth);
    });

    const scaleValue = useTransform(rotation, (r) => {
        const currentAngle = r + angleOffset;
        const depth = Math.sin(currentAngle);
        return 0.5 + 0.5 * ((1 + depth) / 2);
    });

    const opacityValue = useTransform(rotation, (r) => {
        const currentAngle = r + angleOffset;
        const depth = Math.sin(currentAngle);
        return 0.4 + 0.6 * ((1 + depth) / 2);
    });

    return (
        <motion.div
            className="absolute top-1/2 left-1/2 cursor-pointer"
            style={{
                x: isExpanded ? 0 : x,
                y: isExpanded ? 0 : y,
                xPercent: -50,
                yPercent: -50,
                zIndex: isExpanded ? 500 : zIndexValue,
                scale: isExpanded ? 1 : scaleValue,
                opacity: isExpanded ? 1 : opacityValue,
                willChange: "transform, opacity"
            }}
            transition={isExpanded ? { type: 'spring', stiffness: 200, damping: 20 } : { duration: 0 }}
            onClick={() => setExpandedId(isExpanded ? null : dojo.id)}
        >
            {/* Node Content (Interstellar Crystal Sphere) */}
            <motion.div
                className={`relative w-16 h-16 md:w-24 md:h-24 bg-zinc-950 border ${isExpanded ? 'border-iskf-red bg-white shadow-[0_0_50px_rgba(255,255,255,0.4)]' : 'border-white/20'} rounded-full flex items-center justify-center transition-all duration-300 group hover:border-blue-400 hover:scale-110 overflow-hidden perspective-500`}
                animate={!isExpanded ? {
                    boxShadow: [
                        "0 0 15px rgba(206,17,38,0.3), inset 0 0 10px rgba(0,0,0,0.8)",
                        "0 0 30px rgba(59,130,246,0.5), inset 0 0 10px rgba(0,0,0,0.8)",
                        "0 0 15px rgba(206,17,38,0.3), inset 0 0 10px rgba(0,0,0,0.8)"
                    ]
                } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                {/* COSMIC NEBULA BACKGROUND - GPU Accelerated */}
                <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent,rgba(206,17,38,0.15),transparent,rgba(59,130,246,0.15),transparent)] animate-spin-slow opacity-60 z-0 will-change-transform" />

                {/* TWINKLING STELLAR PARTICLES */}
                <div className="absolute inset-0 z-5 pointer-events-none opacity-30">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-0.5 h-0.5 bg-white rounded-full animate-twinkle"
                            style={{
                                top: `${(i * 17) % 100}%`,
                                left: `${(i * 23) % 100}%`,
                                animationDelay: `${i * 0.5}s`
                            }}
                        />
                    ))}
                </div>

                {/* Inner Depth Shadows */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/70 shadow-inner z-5"></div>

                {/* LOGO */}
                <img
                    src={dojo.logo}
                    alt={dojo.name}
                    className={`w-full h-full ${isExpanded ? 'p-2' : 'p-4'} object-contain relative z-10 transition-transform duration-500 group-hover:scale-110`}
                    style={{ filter: "drop-shadow(0 0 5px rgba(255,255,255,0.2))" }}
                />

                {/* GLASS EFFECTS */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-45 pointer-events-none z-20 animate-refract" />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/40 pointer-events-none z-25"></div>
                <div className="absolute top-1 left-1.5 w-[85%] h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-full opacity-50 pointer-events-none z-30"></div>
                <div className="absolute inset-0 border border-white/10 rounded-full z-35"></div>
                <div className="absolute bottom-1 w-full h-1/4 bg-gradient-to-t from-blue-400/20 to-transparent opacity-30 pointer-events-none z-30"></div>

                {!isExpanded && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[10px] md:text-xs font-black uppercase tracking-wider text-white whitespace-normal text-center leading-tight opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md bg-black/80 px-2 py-1 rounded backdrop-blur-sm pointer-events-none w-max max-w-[120px] z-50">
                        {dojo.name}
                    </div>
                )}
            </motion.div>

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
});

DojoNode.displayName = 'DojoNode';

const OrbitalTimeline = ({ dojos }) => {
    const [expandedId, setExpandedId] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const rotation = useMotionValue(0);
    const requestRef = useRef();
    const lastTimeRef = useRef(0);
    const { width } = useWindowSize();

    const isMobile = width < 768;
    const RADIUS_X = isMobile ? width * 0.30 : 220;
    const RADIUS_Y = isMobile ? RADIUS_X * 0.4 : 70;
    const SPEED_MS = 0.0003;
    const ORBITS = [0, 60, 120];

    const [bolts, setBolts] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setBolts([
                "M50 50 L55 35 L48 30 L60 10",
                "M50 50 L40 45 L35 55 L10 50",
                "M50 50 L60 65 L55 75 L80 90",
                "M50 50 L35 35 L40 25 L20 20"
            ].map(d => ({
                d,
                duration: 0.2 + Math.random() * 0.5,
                repeatDelay: Math.random() * 2
            })));
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const animate = (time) => {
            if (!lastTimeRef.current) lastTimeRef.current = time;
            const deltaTime = time - lastTimeRef.current;
            lastTimeRef.current = time;

            const nextRotation = (rotation.get() + (SPEED_MS * deltaTime)) % (Math.PI * 2);
            rotation.set(nextRotation);

            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [rotation]);

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
        <div className="relative w-full h-full min-h-[500px] flex items-center justify-center overflow-visible perspective-1000">
            {/* Sun Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center group cursor-pointer">
                <div className="absolute w-32 h-32 bg-iskf-red/40 rounded-full blur-[40px] animate-pulse"></div>

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

                <div className="relative w-24 h-24 rounded-full shadow-[0_0_60px_rgba(190,19,34,0.6)] flex items-center justify-center z-10 overflow-hidden border border-white/30 group-hover:scale-105 transition-transform duration-500">
                    <div className="absolute inset-0 bg-black">
                        <img src={iskfFondoRojo} alt="ISKF Core" className="w-full h-full object-cover opacity-90" />
                    </div>
                </div>
            </div>

            {/* ATOMIC RINGS */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                {ORBITS.map((deg, i) => (
                    <g key={i} style={{ transformOrigin: 'center', transform: `rotate(${deg}deg)` }}>
                        <motion.ellipse
                            cx="50%" cy="50%"
                            rx={RADIUS_X} ry={RADIUS_Y}
                            fill="none"
                            stroke="#BE1322"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: [0.2, 0.6, 0.2],
                                strokeWidth: [1, 3, 1],
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 }}
                            className="mix-blend-screen"
                        />
                    </g>
                ))}
            </svg>

            {/* DOJO NODES */}
            {dojos.map((dojo, index) => (
                <DojoNode
                    key={dojo.id}
                    dojo={dojo}
                    index={index}
                    totalDojos={dojos.length}
                    rotation={rotation}
                    RADIUS_X={RADIUS_X}
                    RADIUS_Y={RADIUS_Y}
                    isExpanded={expandedId === dojo.id}
                    setExpandedId={setExpandedId}
                    ORBITS={ORBITS}
                    setSelectedImage={setSelectedImage}
                    opacity={1}
                />
            ))}

            {/* LIGHTBOX */}
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
                            className="relative z-10 p-2 bg-gradient-to-tr from-iskf-red/20 to-transparent rounded-2xl border border-white/10"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                        >
                            <img src={selectedImage} alt="Sensei" className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

OrbitalTimeline.displayName = 'OrbitalTimeline';
export default memo(OrbitalTimeline);
