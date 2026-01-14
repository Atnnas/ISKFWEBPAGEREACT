import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { crMapFeatures } from '../../data/mapData';

// PARTICLE SYSTEM COMPONENT (Externalized to prevent re-renders)
const MapParticles = () => {
    const pathRef = React.useRef(null);
    const particleRef = React.useRef(null);
    const requestRef = React.useRef();
    const stateRef = React.useRef({
        currentPath: null,
        progress: 0,
        pathLength: 0,
        lastTime: 0,
        history: []
    });

    const TRAIL_LENGTH = 100; // Increased from 50 for longer tail
    const SPEED_PX_PER_SEC = 120;

    React.useEffect(() => {
        const animate = (time) => {
            if (!stateRef.current.lastTime) stateRef.current.lastTime = time;
            const dt = (time - stateRef.current.lastTime) / 1000;
            stateRef.current.lastTime = time;

            let { currentPath, progress, pathLength, history } = stateRef.current;

            if (!currentPath) {
                const paths = document.querySelectorAll('.province-path');
                if (paths.length > 0) {
                    const nextPath = paths[Math.floor(Math.random() * paths.length)];
                    stateRef.current.currentPath = nextPath;
                    stateRef.current.pathLength = nextPath.getTotalLength();
                    stateRef.current.progress = 0;
                    stateRef.current.history = []; // Clear history
                    if (pathRef.current) pathRef.current.setAttribute('d', ''); // VISUAL RESET
                    if (pathRef.currentCore) pathRef.currentCore.setAttribute('d', ''); // VISUAL RESET CORE
                }
                requestRef.current = requestAnimationFrame(animate);
                return;
            }

            progress += SPEED_PX_PER_SEC * dt;
            if (progress >= pathLength) {
                stateRef.current.currentPath = null;
                requestRef.current = requestAnimationFrame(animate);
                return;
            }
            stateRef.current.progress = progress;

            const pt = currentPath.getPointAtLength(progress);

            // Update Head
            if (particleRef.current) {
                particleRef.current.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
            }

            // Update History for Path
            history.unshift({ x: pt.x, y: pt.y });
            if (history.length > TRAIL_LENGTH) history.pop();

            // Draw Continuous HD Path
            if (pathRef.current && history.length > 1) {
                const d = `M ${history.map(p => `${p.x},${p.y}`).join(' L ')}`;
                pathRef.current.setAttribute('d', d);
                if (pathRef.currentCore) pathRef.currentCore.setAttribute('d', d); // Sync Core Path
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    return (
        <g className="pointer-events-none">
            <defs>
                {/* HD Trail Gradient - Strict ISKF Colors */}
                <linearGradient id="trail-gradient" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="30%" stopColor="#BE1322" />
                    <stop offset="100%" stopColor="#BE1322" stopOpacity="0" />
                </linearGradient>
                {/* Glow Filter */}
                <filter id="hd-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* 1. OUTER GLOW TRAIL (Thick Red) */}
            <path
                ref={pathRef}
                fill="none"
                stroke="#BE1322"
                strokeWidth="24"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-80 transition-all duration-75"
                filter="url(#hd-glow)"
            />

            {/* 2. INNER CORE TRAIL (Thin White Hot) */}
            <path
                ref={el => pathRef.currentCore = el} // Valid Ref assignment
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-100"
            />

            {/* THE PHOTON SPIRIT HEAD */}
            <g ref={particleRef}>
                {/* Outer Aura - MASSIVE - BIGGER */}
                <circle r="60" fill="#BE1322" fillOpacity="0.5">
                    <animate attributeName="r" values="55;70;55" dur="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0.7;0.4" dur="1s" repeatCount="indefinite" />
                </circle>
                {/* Inner Halo */}
                <circle r="35" fill="#BE1322" fillOpacity="0.8" />
                {/* Core - White Hot */}
                <circle r="22" fill="#FFFFFF" filter="drop-shadow(0 0 25px #FFFFFF)" />
            </g>
        </g>
    );
};

// Helper for Color Interpolation (Linear)
const interpolateColor = (color1, color2, factor) => {
    // Simple RGB interp for performance or just use predefined stops based on index?
    // Let's use thresholds for performance: 
    // 0-10% White->Gold
    // 10-50% Gold->Red
    // 50-100% Red Fade
    return color1; // Placeholder, logic will be in useLayoutEffect/requestAnimationFrame
};

const InteractiveMap = ({ activeProvinceId, onProvinceClick }) => {

    // Bounds Calculation
    const { viewBox, bounds } = useMemo(() => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        crMapFeatures.forEach(feature => {
            const calculateBounds = (ring) => {
                ring.forEach(([x, y]) => {
                    // FLIP Y as per original script
                    y = -y;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                });
            };

            if (feature.geometry.type === 'Polygon') feature.geometry.coordinates.forEach(calculateBounds);
            if (feature.geometry.type === 'MultiPolygon') feature.geometry.coordinates.flat().forEach(calculateBounds);
        });

        const width = maxX - minX;
        const height = maxY - minY;
        const padding = width * 0.05;

        // Return both the string and the numerical bounds for calculations
        return {
            viewBox: `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`,
            bounds: { minX: minX - padding, minY: minY - padding, width: width + padding * 2, height: height + padding * 2 }
        };
    }, []);

    const getFeatureCenter = (feature) => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const calculateBounds = (ring) => {
            ring.forEach(([x, y]) => {
                y = -y;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            });
        };

        if (feature.geometry.type === 'Polygon') feature.geometry.coordinates.forEach(calculateBounds);
        if (feature.geometry.type === 'MultiPolygon') feature.geometry.coordinates.flat().forEach(calculateBounds);

        return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    };

    // Calculate position for active label
    const activeLabelPos = useMemo(() => {
        if (!activeProvinceId) return null;
        const feature = crMapFeatures.find(f => f.id === activeProvinceId);
        if (!feature) return null;

        const center = getFeatureCenter(feature);
        return {
            left: `${((center.x - bounds.minX) / bounds.width) * 100}%`,
            top: `${((center.y - bounds.minY) / bounds.height) * 100}%`
        };
    }, [activeProvinceId, bounds]);


    // Path Generation
    const getPath = (feature) => {
        let d = '';
        const processRing = (ring) => {
            return ring.map((pt, i) => {
                const x = pt[0];
                const y = -pt[1];
                return (i === 0 ? 'M' : 'L') + x + ',' + y;
            }).join(' ') + 'Z';
        };

        if (feature.geometry.type === 'Polygon') {
            d = feature.geometry.coordinates.map(processRing).join(' ');
        } else {
            d = feature.geometry.coordinates.flat().map(processRing).join(' ');
        }
        return d;
    };

    // State for Hover Tooltip
    const [hoveredProvince, setHoveredProvince] = React.useState(null);
    const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        // Get coordinates relative to the container
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    return (
        <div
            className="w-full h-full relative group flex items-center justify-center p-8 cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredProvince(null)}
            onClick={() => onProvinceClick(null)}
        >
            {/* Elegant Floating Tooltip (Hover) */}
            <AnimatePresence>
                {hoveredProvince && hoveredProvince !== activeProvinceId && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-[100] pointer-events-none"
                        style={{
                            left: mousePos.x,
                            top: mousePos.y,
                            transform: 'translate(-50%, -150%)' // Center above cursor
                        }}
                    >
                        <div className="bg-black/80 backdrop-blur-md text-white border border-iskf-red/50 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-iskf-red animate-pulse"></span>
                            <span className="font-bold tracking-[0.2em] uppercase text-sm whitespace-nowrap">
                                {crMapFeatures.find(f => f.id === hoveredProvince)?.name}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Persistent Active Label */}
            <AnimatePresence>
                {activeProvinceId && activeLabelPos && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        transition={{ duration: 0.4, type: "spring" }}
                        className="absolute z-[40] pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: activeLabelPos.left,
                            top: activeLabelPos.top,
                        }}
                    >
                        <div className="bg-black/80 backdrop-blur-md text-white border border-iskf-red/50 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-iskf-red animate-pulse"></span>
                            <span className="font-bold tracking-[0.2em] uppercase text-sm whitespace-nowrap">
                                {crMapFeatures.find(f => f.id === activeProvinceId)?.name}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative w-full h-full max-w-4xl opacity-100 transition-opacity duration-500">
                <svg viewBox={viewBox} className="w-full h-full overflow-visible">
                    <defs>
                        {/* Enhanced Glow Filter for Particle */}
                        <filter id="energy-glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                            <feGaussianBlur stdDeviation="6" result="outerGlow" />
                            <feMerge>
                                <feMergeNode in="outerGlow" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* Particle Bloom Filter (White Hot) */}
                        <filter id="particle-bloom" x="-100%" y="-100%" width="300%" height="300%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                            <feColorMatrix in="blur" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" result="whiteBlur" />
                            <feMerge>
                                <feMergeNode in="whiteBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* Drop Shadow for Provinces */}
                        <filter id="province-lift" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur" />
                            <feOffset in="blur" dx="0" dy="10" result="offsetBlur" />
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.5" />
                            </feComponentTransfer>
                            <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* Holographic Scan Gradient */}
                        <linearGradient id="holo-scan" x1="0%" y1="0%" x2="200%" y2="0%">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="50%" stopColor="#BE1322" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="transparent" />
                            <animate attributeName="x1" from="-100%" to="100%" dur="4s" repeatCount="indefinite" />
                            <animate attributeName="x2" from="0%" to="200%" dur="4s" repeatCount="indefinite" />
                        </linearGradient>

                        {/* Atmospheric Background Glow */}
                        <radialGradient id="map-atmosphere" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" stopColor="#BE1322" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* Atmospheric Glow Background */}
                    <rect x={viewBox.split(' ')[0]} y={viewBox.split(' ')[1]} width={viewBox.split(' ')[2]} height={viewBox.split(' ')[3]} fill="url(#map-atmosphere)" className="pointer-events-none" />

                    {/* RADIOACTIVE AURA LAYER (New Background) */}
                    <g className="map-radioactive-aura pointer-events-none">
                        {crMapFeatures.map((feature, i) => (
                            <motion.path
                                key={`aura-${feature.id}`}
                                d={getPath(feature)}
                                fill="none"
                                stroke="#BE1322"
                                initial={{ opacity: 0 }}
                                animate={{
                                    opacity: [0.3, 0.6, 0.3],
                                    strokeWidth: [6, 14, 6] // Expanding radioactive pulse
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: i * 0.05 // Tiny stagger for organic feel
                                }}
                                className="blur-md mix-blend-screen"
                            />
                        ))}
                    </g>

                    {/* Holographic Wireframe Scan Layer (Backend) */}
                    <g className="map-wireframe pointer-events-none opacity-50 mix-blend-screen">
                        {crMapFeatures.map(feature => (
                            <path
                                key={`wire-${feature.id}`}
                                d={getPath(feature)}
                                fill="none"
                                stroke="url(#holo-scan)"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        ))}
                    </g>

                    <g className="map-paths">
                        {crMapFeatures.map(feature => {
                            const isActive = activeProvinceId === feature.id; // Corrected ID check
                            return (
                                <motion.path
                                    key={feature.id}
                                    d={getPath(feature)}
                                    className={`province-path cursor-pointer transition-all duration-300 outline-none`}
                                    initial="idle"
                                    animate={isActive ? "active" : "idle"}
                                    whileHover="hover"
                                    onMouseEnter={() => setHoveredProvince(feature.id)}
                                    onMouseLeave={() => setHoveredProvince(null)}
                                    variants={{
                                        idle: {
                                            scale: 1,
                                            fill: 'rgba(255,255,255,0.1)',
                                            stroke: 'rgba(255,255,255,0.3)',
                                            strokeWidth: 2,
                                            filter: 'none',
                                            opacity: [0.8, 1, 0.8], // Breathing effect
                                            transition: {
                                                opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                                            }
                                        },
                                        hover: {
                                            scale: 1.05,
                                            fill: 'rgba(190, 19, 34, 0.4)',
                                            stroke: '#ffffff',
                                            strokeWidth: 3,
                                            filter: 'url(#province-lift)',
                                            zIndex: 10,
                                            transition: { duration: 0.3, type: "spring", stiffness: 300 }
                                        },
                                        active: {
                                            scale: 1.02,
                                            fill: '#BE1322',
                                            stroke: '#ffffff',
                                            strokeWidth: 4,
                                            filter: 'drop-shadow(0 0 20px rgba(190,19,34,0.8))', // Strong neon glow
                                            opacity: 1,
                                            zIndex: 50
                                        }
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Mobile/Touch: Tap to hover/select
                                        if (!isActive && hoveredProvince !== feature.id) {
                                            setHoveredProvince(feature.id);
                                        } else {
                                            onProvinceClick(isActive ? null : feature.id);
                                        }
                                    }}
                                    style={{ transformOrigin: 'center' }}
                                />
                            );
                        })}
                    </g>

                    <MapParticles />
                </svg>
            </div>
        </div>
    );
};

export default InteractiveMap;
