import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { eventsData } from '../../data/events';
import useWindowSize from '../../hooks/useWindowSize';

const EventsRoadmap = () => {
    const containerRef = useRef(null);
    const wrapperRef = useRef(null);
    const nodeRefs = useRef({});
    const navigate = useNavigate();
    const { width: windowWidth } = useWindowSize();

    // Zoom/Pinch Logic
    const [zoomLevel, setZoomLevel] = useState(1);
    const [width, setWidth] = useState(0);

    // Collision Detection State & Refs
    const [activeEventId, setActiveEventId] = useState(null);
    const [hoveredEventId, setHoveredEventId] = useState(null);
    const cometRef = useRef(null);

    // Sort events by date
    const sortedEvents = [...eventsData].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate drag constraints
    useEffect(() => {
        if (containerRef.current && wrapperRef.current) {
            const scrollWidth = containerRef.current.scrollWidth;
            const visibleWidth = wrapperRef.current.offsetWidth;
            setWidth(scrollWidth - visibleWidth);
        }
    }, [sortedEvents, zoomLevel, hoveredEventId, windowWidth]);

    // Collision Loop: Check if Comet hits a Node
    useEffect(() => {
        let animationFrameId;

        const checkCollision = () => {
            if (cometRef.current) {
                const cometRect = cometRef.current.getBoundingClientRect();
                const cometX = cometRect.left + (cometRect.width / 2);

                let hitFound = null;

                Object.keys(nodeRefs.current).forEach((id) => {
                    const nodeEl = nodeRefs.current[id];
                    if (nodeEl) {
                        const nodeRect = nodeEl.getBoundingClientRect();
                        const nodeX = nodeRect.left + (nodeRect.width / 2);
                        const distance = Math.abs(cometX - nodeX);

                        if (distance < 60) {
                            hitFound = parseInt(id);
                        }
                    }
                });

                setActiveEventId(hitFound);
            }
            animationFrameId = requestAnimationFrame(checkCollision);
        };

        checkCollision();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // Scroll progress
    useScroll({ container: wrapperRef });

    // Handle Wheel Zoom
    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.5), 2));
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }).replace('.', '');
    };



    // Calculate total width based on nodes * gap
    // Use a fixed spacing unit that scales with zoom
    const overlapSpacingRem = 18; // Overlap factor


    return (
        <section
            id="calendario"
            className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center border-t border-white/5"
            onWheel={handleWheel}
        >
            {/* BACKGROUND: Digital Horizon + Image */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity" style={{ backgroundImage: `url('${import.meta.env.BASE_URL}fondoEventos.jpg')` }}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(190,19,34,0.2),transparent_80%)]"></div>
            </div>

            {/* HEADER */}
            <div className="relative z-10 text-center mb-8 pointer-events-none mt-12">
                <span className="text-iskf-red font-bold text-xs tracking-[0.3em] uppercase animate-pulse">Roadmap 2026</span>
                <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mt-2">
                    Calendario <span className="text-transparent bg-clip-text bg-gradient-to-r from-iskf-red to-red-600">Oficial</span>
                </h2>
                <div className="w-16 h-1 bg-iskf-red mx-auto mt-4 shadow-[0_0_10px_#be1322]"></div>
            </div>

            {/* SCROLLABLE CONTAINER */}
            <div
                ref={wrapperRef}
                className="w-full h-[64vh] overflow-hidden relative z-20 flex items-center cursor-grab active:cursor-grabbing py-12"
            >
                {/* THE LINE (Infinite Rail) */}
                <div className="absolute top-1/2 left-0 h-[2px] bg-white/10 w-[200%] z-0 translate-y-[1px]"></div>

                {/* TRACKER PARTICLE (Progress Indicator) */}
                {/* TRACKER PARTICLE (The Comet - Animated Patrol) */}
                <motion.div
                    ref={cometRef}
                    className="absolute top-1/2 z-30 -translate-y-1/2 pointer-events-none"
                    initial={{ left: '-10%' }}
                    animate={{ left: '110%' }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "linear",
                        repeatDelay: 1
                    }}
                >
                    {/* Head */}
                    <div className="w-6 h-6 bg-gradient-to-r from-iskf-red to-orange-600 rounded-full shadow-[0_0_25px_#be1322] relative z-10 animate-pulse"></div>
                    {/* Tail (Speed effect) */}
                    <div className="absolute top-1/2 right-1/2 w-32 h-1 bg-gradient-to-l from-iskf-red/80 to-transparent -translate-y-1/2 blur-[2px]"></div>
                    <div className="absolute top-1/2 right-1/2 w-48 h-8 bg-gradient-to-l from-iskf-red/20 to-transparent -translate-y-1/2 blur-md rounded-full"></div>
                </motion.div>

                <motion.div
                    ref={containerRef}
                    className="flex items-center pl-10 pr-[50vw] h-full"
                    drag="x"
                    dragConstraints={{ right: 0, left: -width }}
                >

                    {/* START NODE */}
                    <div className="relative flex-shrink-0 flex flex-col items-center justify-center mr-16 group">
                        <div className="w-24 h-24 rounded-full bg-black border-2 border-iskf-red/50 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(190,19,34,0.3)] group-hover:scale-110 transition-transform duration-500">
                            {/* Inner Logo */}
                            <img src={`${import.meta.env.BASE_URL}iskfFondoRojo.jpg`} alt="ISKF" className="w-full h-full object-cover rounded-full opacity-90 group-hover:opacity-100 transition-opacity" />

                            {/* Pulse Rings */}
                            <div className="absolute inset-0 rounded-full border-4 border-iskf-red opacity-0 animate-[ping_1.5s_ease-out_infinite] z-0"></div>
                            <div className="absolute inset-[-10px] rounded-full border border-red-500/50 opacity-0 animate-[ping_1.5s_ease-out_infinite_300ms] z-0"></div>
                        </div>

                        {/* Connection to first event */}
                        <div
                            className="absolute top-1/2 left-full h-[2px] bg-gradient-to-r from-iskf-red via-red-500 to-transparent z-0 translate-y-[1px] opacity-80 transition-[width] duration-300 ease-out"
                            style={{ width: `${overlapSpacingRem}rem` }}
                        ></div>
                    </div>

                    {/* 2. EVENT NODES */}
                    {sortedEvents.map((event) => {
                        // Position Logic: STRICTLY check for Costa Rica Flag (or location)
                        const isTopPosition = event.flag === 'CostaRica.jpg' || event.location.includes('Costa Rica');

                        const isNext = new Date(event.date) >= new Date() &&
                            sortedEvents.filter(e => new Date(e.date) >= new Date())[0]?.id === event.id;

                        const isActive = activeEventId === event.id; // PARTICLE HIT CHECK
                        const isExpanded = hoveredEventId === event.id; // HOVER CHECK

                        // STATIC MARGIN - No movement on hover
                        const marginWidth = `${overlapSpacingRem}rem`;

                        return (
                            <div
                                key={event.id}
                                className="relative flex-shrink-0 flex flex-col items-center justify-center transition-[margin] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                                style={{
                                    zIndex: isExpanded ? 50 : (isActive ? 40 : 1), // Only Z-Index changes
                                    position: 'relative',
                                    marginRight: marginWidth
                                }}
                                onMouseEnter={() => setHoveredEventId(event.id)}
                                onMouseLeave={() => setHoveredEventId(null)}
                            >
                                {/* The Node Dot */}
                                <motion.div
                                    ref={el => nodeRefs.current[event.id] = el}
                                    className={`w-8 h-8 rounded-full border-2 relative z-20 cursor-pointer group hover:scale-125 transition-transform duration-300
                                    ${isActive ? 'bg-white border-iskf-red shadow-[0_0_50px_#be1322] scale-150' : // ACTIVE (HIT) STYLE
                                            isNext ? 'bg-white border-iskf-blue shadow-[0_0_40px_rgba(45,46,131,0.8)]' :
                                                'bg-iskf-dark border-iskf-red shadow-[0_0_20px_#be1322]'}
                                    `}
                                    onClick={() => navigate(`/event/${event.id}`)}
                                    whileHover={{ scale: 1.3 }}
                                >
                                    {(isNext || isActive) && <div className={`absolute -inset-4 rounded-full border-2 ${isActive ? 'border-iskf-red' : 'border-iskf-blue'} opacity-50 animate-ping`}></div>}
                                    <div className={`absolute inset-0 rounded-full opacity-50 animate-pulse ${isNext && !isActive ? 'bg-iskf-blue' : 'bg-iskf-red'}`}></div>
                                    <div className="absolute inset-1 rounded-full bg-white/90"></div>
                                </motion.div>

                                {/* VERTICAL CONNECTOR */}
                                <div className={`absolute left-1/2 w-[1px] from-iskf-red to-transparent z-10 -translate-x-1/2 transition-all duration-300
                                ${isActive ? 'bg-iskf-red h-20 shadow-[0_0_15px_#be1322]' : 'group-hover:h-20 group-hover:bg-iskf-red'} 
                                ${isTopPosition ? 'bottom-8 bg-gradient-to-t' : 'top-8 bg-gradient-to-b'}
                                ${!isActive && (isTopPosition ? 'h-12' : 'h-12')}
                            `}></div>

                                {/* THE CARD */}
                                <motion.div
                                    className={`absolute left-1/2 -translate-x-1/2 w-64 cursor-pointer
                                    ${isTopPosition ? 'bottom-1/2 mb-16 origin-bottom' : 'top-1/2 mt-16 origin-top'}
                                `}
                                    style={{
                                        perspective: 1000
                                    }}
                                    animate={isActive ? {
                                        scale: 1.05, // Subtle scale
                                        y: isTopPosition ? -5 : 5, // Gentle lift
                                        filter: "brightness(1.1)", // Slight brighten
                                        rotateX: isTopPosition ? 2 : -2 // Micro-pivot for elegance
                                    } : {
                                        scale: 1,
                                        y: 0,
                                        filter: "brightness(1)",
                                        rotateX: 0
                                    }}
                                    onClick={() => navigate(`/event/${event.id}`)}
                                    whileHover={{ scale: 1.03, y: isTopPosition ? 5 : -5 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 25 }} // Softer spring
                                >
                                    <div className={`bg-black/60 backdrop-blur-xl border p-5 rounded-2xl relative overflow-hidden transition-all duration-500 group
                                        ${isActive || isExpanded ? 'border-iskf-red/50 shadow-[0_0_30px_rgba(190,19,34,0.2)] ring-1 ring-iskf-red/20' : 'border-white/10 hover:border-iskf-red/30 hover:shadow-[0_0_20px_rgba(190,19,34,0.1)]'}
                                    `}>
                                        {/* Gloss Shine */}
                                        <div className={`absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 ${isActive || isExpanded ? 'opacity-100' : 'group-hover:opacity-100'}`}></div>

                                        {/* Scanline Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-iskf-red/5 to-transparent h-[200%] w-full -translate-y-full group-hover:translate-y-full transition-transform duration-1000 ease-in-out"></div>

                                        {/* Content */}
                                        <div className="relative z-10 text-center flex flex-col items-center">
                                            <div className={`inline-block text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 shadow-lg transition-transform ${isActive || isExpanded ? 'scale-110' : 'group-hover:scale-110'} ${isTopPosition ? 'bg-iskf-red' : 'bg-blue-600'}`}>
                                                {formatDate(event.date)}
                                            </div>

                                            {/* Organizer Logo */}
                                            <div className={`w-12 h-12 rounded-full bg-white p-0.5 shadow-lg mb-3 transition-transform duration-300 ${isActive || isExpanded ? 'scale-125' : 'group-hover:scale-110'}`}>
                                                <img
                                                    src={`${import.meta.env.BASE_URL}${event.logo}`}
                                                    alt="Logo"
                                                    className="w-full h-full object-contain rounded-full"
                                                    onError={(e) => e.target.src = `${import.meta.env.BASE_URL}iskf.jpg`}
                                                />
                                            </div>

                                            <h4 className={`text-white font-bold text-base leading-tight mb-2 transition-colors ${isActive || isExpanded ? 'text-iskf-red' : 'group-hover:text-iskf-red'}`}>{event.name}</h4>
                                            <div className={`flex items-center justify-center gap-2 text-xs font-mono transition-colors ${isActive || isExpanded ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                                <img src={`${import.meta.env.BASE_URL}${event.flag}`} className="w-4 h-4 rounded-full" alt="flag" />
                                                <span>{event.location.split(',')[0]}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Line connecting to next node (Visual only, fills gap if main line isn't enough) */}
                                <div
                                    className="absolute top-1/2 left-full h-[2px] bg-white/10 -z-10 translate-y-[1px] transition-[width] duration-300 ease-out"
                                    style={{ width: marginWidth }} // STRETCHED CONNECTION
                                ></div>

                            </div>
                        )
                    })}

                    {/* Padding Right */}
                    <div className="w-48"></div>
                </motion.div>
            </div>
        </section>
    );
};

export default EventsRoadmap;
