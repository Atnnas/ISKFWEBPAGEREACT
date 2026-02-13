import React, { useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import useWindowSize from '../../hooks/useWindowSize';

import iskfFondoRojo from '../../assets/images/iskfFondoRojo.jpg';

// Dedicated Card Component for better AnimatePresence tracking
const ExpandedDojoCard = ({ dojo, onClose }) => {
    return createPortal(
        <motion.div
            key="dojo-card-portal"
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            {/* Deep Cosmic Backdrop with subtle motion */}
            <motion.div
                className="absolute inset-0 bg-black/98 backdrop-blur-md pointer-events-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            ></motion.div>

            <motion.div
                key="dojo-card-content"
                className="relative bg-zinc-950 border border-white/10 rounded-[3rem] w-full max-w-md max-h-[92vh] flex flex-col pointer-events-auto shadow-[0_0_100px_rgba(190,19,34,0.2),_0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/10 overflow-hidden"
                initial={{ scale: 0.9, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 35 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Visual Premium Accents - Top Beam */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent z-50"></div>

                {/* Close Button - More Integrated */}
                <button
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all hover:bg-white/10 active:scale-90 z-[70] group"
                    onClick={onClose}
                >
                    <svg className="w-5 h-5 transform group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>

                {/* SCROLLABLE CONTAINER WITH CUSTOM STYLED SCROLLBAR */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 md:p-12 custom-scrollbar-premium">
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        .custom-scrollbar-premium::-webkit-scrollbar {
                            width: 5px;
                        }
                        .custom-scrollbar-premium::-webkit-scrollbar-track {
                            background: rgba(255, 255, 255, 0.02);
                            margin: 20px 0;
                            border-radius: 10px;
                        }
                        .custom-scrollbar-premium::-webkit-scrollbar-thumb {
                            background: rgba(190, 19, 34, 0.3);
                            border-radius: 10px;
                            transition: all 0.3s;
                        }
                        .custom-scrollbar-premium::-webkit-scrollbar-thumb:hover {
                            background: rgba(190, 19, 34, 0.6);
                        }
                    `}} />

                    {/* Sensei Priority Header */}
                    <div className="mb-10 mt-2 text-center">
                        <motion.span
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 0.6, y: 0 }}
                            className="block text-[10px] uppercase text-iskf-red font-black tracking-[0.5em] mb-4"
                        >
                            Chief Instructor
                        </motion.span>
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight italic mb-3 text-balance">
                            {dojo.sensei}
                        </h2>
                        {dojo.rank && (
                            <div className="flex items-center justify-center gap-4">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/20"></div>
                                <span className="text-base font-bold text-gray-400 italic tracking-[0.1em] whitespace-nowrap">{dojo.rank}</span>
                                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/20"></div>
                            </div>
                        )}
                    </div>

                    {/* Subheader: Dojo Identity with Glass Pill */}
                    <div className="flex justify-center mb-12">
                        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 shadow-lg backdrop-blur-md">
                            <div className="w-1.5 h-1.5 rounded-full bg-iskf-red shadow-[0_0_8px_#BE1322]"></div>
                            <span className="text-[11px] font-black text-gray-200 uppercase tracking-[0.25em]">{dojo.name}</span>
                        </div>
                    </div>

                    {/* Sensei Portrait Frame - High Fashion Look */}
                    <div className="relative w-full aspect-square bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-[3rem] mb-12 p-1 overflow-hidden group/image shadow-2xl ring-1 ring-white/5">
                        {/* Decorative Corner Accents (Inside) */}
                        <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-white/10 rounded-tl-xl z-20 transition-all group-hover/image:scale-110 group-hover/image:border-white/30"></div>
                        <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-white/10 rounded-br-xl z-20 transition-all group-hover/image:scale-110 group-hover/image:border-white/30"></div>

                        {/* Background subtle glow */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(190,19,34,0.05)_0%,_transparent_70%)] z-0"></div>

                        {dojo.senseiImage ? (
                            <img
                                src={dojo.senseiImage}
                                alt={dojo.sensei}
                                className="w-full h-full relative z-10 object-contain p-8 group-hover/image:scale-[1.03] transition-transform duration-[1.2s] ease-out drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                            />
                        ) : (
                            <div className="relative z-10 w-full h-full flex items-center justify-center">
                                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-sm">
                                    <svg className="w-10 h-10 text-zinc-700" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Details Info Section */}
                    <div className="space-y-4 mb-2">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative group/info hover:border-white/20 transition-colors shadow-inner">
                            <div className="flex items-center justify-between">
                                <div className="text-left">
                                    <span className="block text-[10px] uppercase text-gray-500 font-bold tracking-[0.2em] mb-1">Province</span>
                                    <span className="text-xl font-black text-white italic">{dojo.province}, Costa Rica</span>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-2xl border border-white/10 group-hover/info:bg-iskf-red/20 group-hover/info:text-iskf-red transition-all shadow-lg">
                                    🌍
                                </div>
                            </div>
                        </div>

                        {/* Actions Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <a
                                href={dojo.detailsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative flex flex-col items-center justify-center gap-3 py-6 rounded-3xl bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 hover:scale-[1.02] active:scale-95 transition-all group/btn group-hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
                                <span className="text-2xl group-hover/btn:scale-125 transition-transform duration-500">📍</span>
                                <span className="text-[10px] font-black uppercase text-blue-400 tracking-[0.3em] relative z-10">Location</span>
                            </a>

                            {dojo.website ? (
                                <a
                                    href={dojo.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative flex flex-col items-center justify-center gap-3 py-6 rounded-3xl bg-purple-500/5 border border-purple-500/20 hover:bg-purple-500/10 hover:scale-[1.02] active:scale-95 transition-all group/btn group-hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
                                    <span className="text-2xl group-hover/btn:scale-125 transition-transform duration-500">🌐</span>
                                    <span className="text-[10px] font-black uppercase text-purple-400 tracking-[0.3em] relative z-10">Website</span>
                                </a>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 py-6 rounded-3xl bg-zinc-900 border border-white/5 opacity-40 grayscale">
                                    <span className="text-2xl">🚫</span>
                                    <span className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em]">Privacy</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom luxury taper */}
                <div className="h-6 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none sticky bottom-0 left-0 right-0"></div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

// Memoized individual dojo node to prevent whole timeline re-renders
const DojoNode = memo(({ dojo, index, totalDojos, rotation, RADIUS_X, RADIUS_Y, isExpanded, setExpandedId, ORBITS }) => {
    const orbitIndex = index % 3;
    const orbitAngleDeg = ORBITS[orbitIndex];
    const orbitAngleRad = orbitAngleDeg * (Math.PI / 180);
    const angleOffset = (index / totalDojos) * 2 * Math.PI;

    // Position calculated via global rotation MotionValue
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
            className="absolute top-1/2 left-1/2"
            style={{
                x: isExpanded ? 0 : x,
                y: isExpanded ? 0 : y,
                xPercent: -50,
                yPercent: -50,
                zIndex: isExpanded ? 500 : zIndexValue,
                scale: isExpanded ? 1 : scaleValue,
                opacity: isExpanded ? 1 : opacityValue,
            }}
            transition={isExpanded ? { type: 'spring', stiffness: 200, damping: 20 } : { duration: 0 }}
        >
            <motion.div
                className={`relative w-[60px] h-[60px] md:w-24 md:h-24 cursor-pointer bg-zinc-950 border ${isExpanded ? 'border-iskf-red bg-white shadow-[0_0_20px_rgba(190,19,34,0.3)]' : 'border-white/10'} rounded-full flex items-center justify-center transition-all duration-500 group hover:border-blue-400 hover:scale-110 overflow-hidden pointer-events-auto shadow-[0_10px_40px_rgba(0,0,0,0.8)] ring-1 ring-white/10`}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(isExpanded ? null : dojo.id);
                }}
            >
                {/* Inner Depth Gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.15)_0%,_transparent_70%)] z-10"></div>

                <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent,rgba(206,17,38,0.2),transparent,rgba(59,130,246,0.2),transparent)] animate-spin-slow opacity-60 z-0" />

                <img
                    src={dojo.logo}
                    alt={dojo.name}
                    className={`w-full h-full ${isExpanded ? 'p-2' : 'p-6'} object-contain relative z-20 transition-transform duration-700 group-hover:scale-110`}
                />

                {/* Crystal Flare/Shine Layer */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/60 pointer-events-none z-30 opacity-60 group-hover:opacity-100 transition-opacity"></div>

                {/* Lens Flare Spot */}
                <div className="absolute top-2 left-4 w-4 h-2 bg-white/30 blur-[2px] rounded-full rotate-[-30deg] z-40 pointer-events-none"></div>

                {/* Rim Light */}
                <div className="absolute inset-0 border-b-2 border-r-2 border-white/5 rounded-full z-40 pointer-events-none"></div>

                {!isExpanded && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[10px] md:text-xs font-black uppercase tracking-wider text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded backdrop-blur-sm pointer-events-none z-50 ring-1 ring-white/10 shadow-xl">
                        {dojo.name}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
});





DojoNode.displayName = 'DojoNode';

const OrbitalTimeline = ({ dojos }) => {
    const [expandedId, setExpandedId] = useState(null);
    const rotation = useMotionValue(0);
    const requestRef = useRef();
    const lastTimeRef = useRef(0);
    const { width } = useWindowSize();

    const isMobile = width < 768;
    const RADIUS_X = isMobile ? width * 0.35 : 220;
    const RADIUS_Y = isMobile ? RADIUS_X * 0.4 : 70;
    const SPEED_MS = 0.0003;
    const ORBITS = [0, 60, 120];

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

    return (
        <div className="relative w-full h-full min-h-[500px] flex items-center justify-center overflow-visible perspective-1000">
            {/* Sun Center - Nuclear Core Restored */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center">
                {/* Main Glow Aura */}
                <div className="absolute w-40 h-40 bg-iskf-red/40 rounded-full blur-[50px] animate-pulse"></div>

                {/* Core Vessel */}
                <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full shadow-[0_0_80px_rgba(190,19,34,0.8)] flex items-center justify-center z-10 overflow-hidden border-2 border-white/40">
                    <img src={iskfFondoRojo} alt="ISKF Core" className="w-full h-full object-cover scale-110 opacity-90" />

                    {/* Interior Energy Flow */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-transparent to-iskf-red/20 animate-pulse"></div>
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
                            initial={{ opacity: 0.15 }}
                            animate={{ opacity: [0.15, 0.3, 0.15] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 }}
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
                />
            ))}

            {/* EXPANDED DOJO CARD PORTAL */}
            <AnimatePresence>
                {expandedId && (
                    <ExpandedDojoCard
                        key="dojo-portal-wrapper"
                        dojo={dojos.find(d => d.id === expandedId)}
                        onClose={() => setExpandedId(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

OrbitalTimeline.displayName = 'OrbitalTimeline';
export default memo(OrbitalTimeline);
