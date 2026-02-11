import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { eventsData } from '../../data/events';
import useWindowSize from '../../hooks/useWindowSize';

import fondoEventos from '../../assets/images/fondoEventos.jpg';
import iskfFondoRojo from '../../assets/images/iskfFondoRojo.jpg';
import iskfLogo from '../../assets/images/iskf.jpg';

const EventsRoadmap = () => {
    const containerRef = useRef(null);
    const wrapperRef = useRef(null);
    const desktopContentRef = useRef(null); // Added ref for desktop content
    const nodeRefs = useRef({});
    const navigate = useNavigate();
    const { width: windowWidth } = useWindowSize();
    const [width, setWidth] = useState(0);

    // Collision Detection State & Refs
    const [activeEventId, setActiveEventId] = useState(null);
    const [hoveredEventId, setHoveredEventId] = useState(null);
    const cometRef = useRef(null);

    // Sort events by date
    const sortedEvents = [...eventsData].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate drag constraints (Desktop) - Dynamic & Robust
    useEffect(() => {
        if (!desktopContentRef.current || !wrapperRef.current || windowWidth <= 768) return;

        const updateWidth = () => {
            if (desktopContentRef.current && wrapperRef.current) {
                const scrollWidth = desktopContentRef.current.scrollWidth;
                const visibleWidth = wrapperRef.current.offsetWidth;
                // Ensure width is not negative and provides just enough space
                const newWidth = scrollWidth - visibleWidth > 0 ? scrollWidth - visibleWidth : 0;
                setWidth(newWidth);
            }
        };

        // Initial calculation
        updateWidth();

        // Observer for content changes (images loading, etc.)
        const resizeObserver = new ResizeObserver(() => {
            updateWidth();
        });

        resizeObserver.observe(desktopContentRef.current);

        return () => resizeObserver.disconnect();
    }, [sortedEvents, windowWidth]);


    // Collision Loop: Check if Comet hits a Node (Desktop & Mobile)
    useEffect(() => {
        let animationFrameId;
        const checkCollision = () => {
            if (cometRef.current) {
                const cometRect = cometRef.current.getBoundingClientRect();

                // Desktop: Horizontal check
                // Mobile: Vertical check
                const isMobile = windowWidth <= 768;
                const cometPos = isMobile ? (cometRect.top + cometRect.height / 2) : (cometRect.left + cometRect.width / 2);

                let hitFound = null;

                Object.keys(nodeRefs.current).forEach((id) => {
                    const nodeEl = nodeRefs.current[id];
                    if (nodeEl) {
                        const nodeRect = nodeEl.getBoundingClientRect();

                        // Check if node is actually visible (scrolled into view)
                        // Simple boundary check relative to viewport
                        if (nodeRect.top < 0 || nodeRect.top > window.innerHeight) return;

                        const nodePos = isMobile ? (nodeRect.top + nodeRect.height / 2) : (nodeRect.left + nodeRect.width / 2);
                        const distance = Math.abs(cometPos - nodePos);

                        // Threshold: 60px desktop, 50px mobile
                        if (distance < (isMobile ? 50 : 60)) {
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
    }, [windowWidth]);

    // Handle Wheel Zoom (Desktop)
    const handleWheel = (e) => {
        if (windowWidth > 768 && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            // Zoom logic placeholder
        }
    };

    // Scroll Handlers for Mobile Buttons
    const scrollMobile = (direction) => {
        if (containerRef.current) {
            const scrollAmount = window.innerHeight * 0.4; // Scroll 40% of screen height
            containerRef.current.scrollBy({
                top: direction === 'up' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }).replace('.', '');
    };

    const overlapSpacingRem = 18; // Overlap factor

    return (
        <section
            id="calendario"
            className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center border-t border-white/5"
            onWheel={handleWheel}
        >
            {/* BACKGROUND: Digital Horizon + Image */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity" style={{ backgroundImage: `url('${fondoEventos}')` }}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(190,19,34,0.2),transparent_80%)]"></div>
            </div>

            {/* HEADER */}
            <div className="relative z-10 text-center mb-4 md:mb-8 pointer-events-none mt-12">
                <span className="text-iskf-red font-bold text-xs tracking-[0.3em] uppercase animate-pulse">Roadmap 2026</span>
                <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mt-2">
                    Calendario <span className="text-transparent bg-clip-text bg-gradient-to-r from-iskf-red to-red-600">Oficial</span>
                </h2>
                <div className="w-16 h-1 bg-iskf-red mx-auto mt-4 shadow-[0_0_10px_#be1322]"></div>
            </div>

            {/* DESKTOP WRAPPER (Horizontal Infinite Scroll) */}
            <div className="hidden md:flex w-full relative z-20 flex-col md:flex-row md:items-center md:h-[64vh] md:overflow-hidden cursor-grab active:cursor-grabbing md:py-12" ref={wrapperRef}>
                {/* DESKTOP LINE (Infinite Rail) */}
                <div className="absolute top-1/2 left-0 h-[2px] bg-white/10 w-[200%] z-0 translate-y-[1px]"></div>

                {/* DESKTOP COMET - Assigned to cometRef when visible */}
                {windowWidth > 768 && (
                    <motion.div
                        ref={cometRef}
                        className="absolute top-1/2 z-30 -translate-y-1/2 pointer-events-none"
                        initial={{ left: '-10%' }}
                        animate={{ left: '110%' }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                    >
                        <div className="w-6 h-6 bg-gradient-to-r from-iskf-red to-orange-600 rounded-full shadow-[0_0_25px_#be1322] relative z-10 animate-pulse"></div>
                        <div className="absolute top-1/2 right-1/2 w-32 h-1 bg-gradient-to-l from-iskf-red/80 to-transparent -translate-y-1/2 blur-[2px]"></div>
                    </motion.div>
                )}

                <motion.div
                    ref={desktopContentRef}
                    className="flex items-center pl-10 pr-[50vw] h-full"
                    drag="x"
                    dragConstraints={{ right: 0, left: width > 0 ? -width : -10000 }} // Use large fallback to prevent snap-to-right on init
                    dragElastic={0.1} // Minimal bounce to stay in control
                    dragMomentum={true} // Smooth scrolling momentum
                >
                    {/* START NODE */}
                    <div className="relative flex-shrink-0 flex flex-col items-center justify-center mr-16 group">
                        <div className="w-24 h-24 rounded-full bg-black border-2 border-iskf-red/50 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(190,19,34,0.3)] group-hover:scale-110 transition-transform duration-500">
                            <img src={iskfFondoRojo} alt="ISKF" className="w-full h-full object-cover rounded-full opacity-90 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 rounded-full border-4 border-iskf-red opacity-0 animate-[ping_1.5s_ease-out_infinite] z-0"></div>
                        </div>
                        <div className="absolute top-1/2 left-full h-[2px] bg-gradient-to-r from-iskf-red via-red-500 to-transparent z-0 translate-y-[1px] opacity-80" style={{ width: `${overlapSpacingRem}rem` }}></div>
                    </div>

                    {/* EVENT NODES - DESKTOP */}
                    {sortedEvents.map((event) => {
                        const isTopPosition = event.flag === 'CostaRica.jpg' || event.location.includes('Costa Rica');
                        const isNext = new Date(event.date) >= new Date() && sortedEvents.filter(e => new Date(e.date) >= new Date())[0]?.id === event.id;
                        const isActive = activeEventId === event.id;
                        const isExpanded = hoveredEventId === event.id;
                        const marginWidth = `${overlapSpacingRem}rem`;

                        return (
                            <div key={event.id}
                                className="relative flex-shrink-0 flex flex-col items-center justify-center transition-[margin] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                                style={{
                                    zIndex: isExpanded ? 50 : (isActive ? 40 : 1),
                                    position: 'relative',
                                    marginRight: marginWidth
                                }}
                                onMouseEnter={() => setHoveredEventId(event.id)}
                                onMouseLeave={() => setHoveredEventId(null)}
                            >
                                <motion.div
                                    ref={el => { if (windowWidth > 768) nodeRefs.current[event.id] = el }}
                                    className={`w-8 h-8 rounded-full border-2 relative z-20 cursor-pointer group hover:scale-125 transition-transform duration-300 ${isActive ? 'bg-white border-iskf-red shadow-[0_0_50px_#be1322] scale-150' : isNext ? 'bg-white border-iskf-blue shadow-[0_0_40px_rgba(45,46,131,0.8)]' : 'bg-iskf-dark border-iskf-red shadow-[0_0_20px_#be1322]'}`}
                                    onClick={() => navigate(`/event/${event.id}`)}
                                    whileHover={{ scale: 1.3 }}
                                >
                                    {(isNext || isActive) && <div className={`absolute -inset-4 rounded-full border-2 ${isActive ? 'border-iskf-red' : 'border-iskf-blue'} opacity-50 animate-ping`}></div>}
                                    <div className={`absolute inset-0 rounded-full opacity-50 animate-pulse ${isNext && !isActive ? 'bg-iskf-blue' : 'bg-iskf-red'}`}></div>
                                    <div className="absolute inset-1 rounded-full bg-white/90"></div>
                                </motion.div>

                                <div className={`absolute left-1/2 w-[1px] from-iskf-red to-transparent z-10 -translate-x-1/2 transition-all duration-300 ${isActive ? 'bg-iskf-red h-20 shadow-[0_0_15px_#be1322]' : 'group-hover:h-20 group-hover:bg-iskf-red'} ${isTopPosition ? 'bottom-8 bg-gradient-to-t' : 'top-8 bg-gradient-to-b'} ${!isActive && (isTopPosition ? 'h-12' : 'h-12')}`}></div>

                                <motion.div
                                    className={`absolute left-1/2 -translate-x-1/2 w-64 cursor-pointer ${isTopPosition ? 'bottom-1/2 mb-16 origin-bottom' : 'top-1/2 mt-16 origin-top'}`}
                                    style={{ perspective: 1000 }}
                                    animate={isActive ? { scale: 1.05, y: isTopPosition ? -5 : 5, filter: "brightness(1.1)", rotateX: isTopPosition ? 2 : -2 } : { scale: 1, y: 0, filter: "brightness(1)", rotateX: 0 }}
                                    onClick={() => navigate(`/event/${event.id}`)}
                                    whileHover={{ scale: 1.03, y: isTopPosition ? 5 : -5 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                >
                                    <div className={`bg-black/60 backdrop-blur-xl border p-5 rounded-2xl relative overflow-hidden transition-all duration-500 group ${isActive || isExpanded ? 'border-iskf-red/50 shadow-[0_0_30px_rgba(190,19,34,0.2)] ring-1 ring-iskf-red/20' : 'border-white/10 hover:border-iskf-red/30 hover:shadow-[0_0_20px_rgba(190,19,34,0.1)]'}`}>
                                        <div className={`absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 ${isActive || isExpanded ? 'opacity-100' : 'group-hover:opacity-100'}`}></div>
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-iskf-red/5 to-transparent h-[200%] w-full -translate-y-full group-hover:translate-y-full transition-transform duration-1000 ease-in-out"></div>
                                        <div className="relative z-10 text-center flex flex-col items-center">
                                            <div className={`inline-block text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 shadow-lg transition-transform ${isActive || isExpanded ? 'scale-110' : 'group-hover:scale-110'} ${isTopPosition ? 'bg-iskf-red' : 'bg-blue-600'}`}>
                                                {formatDate(event.date)}
                                            </div>
                                            <div className={`w-12 h-12 rounded-full bg-white p-0.5 shadow-lg mb-3 transition-transform duration-300 ${isActive || isExpanded ? 'scale-125' : 'group-hover:scale-110'}`}>
                                                <img src={event.logo} alt="Logo" className="w-full h-full object-contain rounded-full" onError={(e) => e.target.src = iskfLogo} />
                                            </div>
                                            <h4 className={`text-white font-bold text-base leading-tight mb-2 transition-colors ${isActive || isExpanded ? 'text-iskf-red' : 'group-hover:text-iskf-red'}`}>{event.name}</h4>
                                            <div className={`flex items-center justify-center gap-2 text-xs font-mono transition-colors ${isActive || isExpanded ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                                <img src={event.flag} className="w-4 h-4 rounded-full" alt="flag" />
                                                <span>{event.location.split(',')[0]}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                                <div className="absolute top-1/2 left-full h-[2px] bg-white/10 -z-10 translate-y-[1px] transition-[width] duration-300 ease-out" style={{ width: marginWidth }}></div>
                            </div>
                        )
                    })}
                </motion.div>
            </div>


            {/* MOBILE WRAPPER (Vertical Compact with Controls) */}
            <div className="relative w-full h-[55vh] md:hidden px-2 z-20">
                {/* VERTICAL COMET (Mobile) - Assigned to cometRef when visible */}
                {windowWidth <= 768 && (
                    <motion.div
                        ref={cometRef}
                        className="absolute left-1/2 transform -translate-x-1/2 z-0 w-1 pointer-events-none bg-gradient-to-b from-transparent via-iskf-red to-transparent shadow-[0_0_15px_#be1322]"
                        initial={{ top: '-20%' }}
                        animate={{ top: '120%' }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{ height: '30%' }}
                    />
                )}

                {/* SCROLLABLE CONTENT */}
                <div
                    ref={containerRef}
                    className="h-full overflow-y-auto no-scrollbar pb-24 scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {/* START NODE */}
                    <div className="flex justify-center mb-8 pt-8">
                        <div className="w-20 h-20 rounded-full bg-black border-2 border-iskf-red/50 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(190,19,34,0.3)]">
                            <img src={iskfFondoRojo} alt="ISKF" className="w-full h-full object-cover rounded-full opacity-90" />
                            <div className="absolute inset-0 rounded-full border-4 border-iskf-red opacity-0 animate-[ping_1.5s_ease-out_infinite] z-0"></div>
                        </div>
                    </div>

                    {/* ZIG-ZAG LIST */}
                    <div className="relative">
                        {/* Static Center Line */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-iskf-red via-white/10 to-transparent"></div>

                        {sortedEvents.map((event) => {
                            const isNational = event.type === 'Nacional';
                            const isNext = new Date(event.date) >= new Date() && sortedEvents.filter(e => new Date(e.date) >= new Date())[0]?.id === event.id;
                            const isActive = activeEventId === event.id;

                            return (
                                <div key={event.id} className={`flex w-full items-center mb-8 relative z-10 ${isNational ? 'justify-start' : 'justify-end'}`}>
                                    {/* CARD */}
                                    <div
                                        className={`w-[45%] relative cursor-pointer ${isNational ? 'mr-auto text-right pr-4' : 'ml-auto text-left pl-4'}`}
                                        onClick={() => navigate(`/event/${event.id}`)}
                                    >
                                        <div className={`bg-black/80 backdrop-blur-md border p-3 rounded-xl transition-all duration-300 shadow-lg
                                            ${isActive ? 'border-iskf-red shadow-[0_0_20px_#be1322] scale-105' : 'border-white/10 hover:border-iskf-red/50'}
                                        `}>
                                            {/* Subtle Active flash overlay */}
                                            {isActive && <div className="absolute inset-0 bg-iskf-red/10 rounded-xl animate-pulse"></div>}

                                            <div className={`text-[9px] font-black uppercase tracking-widest inline-block px-2 py-0.5 rounded-full mb-1 ${isNational ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}>
                                                {formatDate(event.date)}
                                            </div>
                                            <h4 className={`font-bold text-xs leading-tight mb-1 transition-colors ${isActive ? 'text-iskf-red' : 'text-white'}`}>{event.name}</h4>
                                            <div className={`flex items-center gap-1 text-[10px] text-gray-400 ${isNational ? 'justify-end' : 'justify-start'}`}>
                                                {isNational ? <img src={event.flag} className="w-3 h-3 rounded-full" alt="flag" /> : null}
                                                <span>{event.location.split(',')[0]}</span>
                                                {!isNational ? <img src={event.flag} className="w-3 h-3 rounded-full" alt="flag" /> : null}
                                            </div>
                                        </div>
                                    </div>

                                    {/* CENTER NODE */}
                                    <div
                                        ref={el => { if (windowWidth <= 768) nodeRefs.current[event.id] = el }}
                                        className={`absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full border-2 z-20 transition-all duration-300
                                            ${isActive ? 'bg-iskf-red border-white shadow-[0_0_15px_#be1322] scale-150' :
                                                isNext ? 'bg-white border-iskf-blue shadow-[0_0_15px_#2d2e83]' : 'bg-black border-iskf-red'}`}
                                    >
                                        {(isNext || isActive) && <div className={`absolute -inset-2 rounded-full border ${isActive ? 'border-iskf-red' : 'border-iskf-blue'} opacity-50 animate-ping`}></div>}
                                    </div>

                                    {/* CONNECTOR */}
                                    <div className={`absolute top-1/2 -translate-y-1/2 h-[1px] w-[5%] transition-colors duration-300 
                                        ${isActive ? 'bg-iskf-red shadow-[0_0_5px_#be1322]' : 'bg-white/20'}
                                        ${isNational ? 'right-1/2 mr-1.5' : 'left-1/2 ml-1.5'}`}></div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* CONTROLS (Floating Right - Epic Style) */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-6 z-30">
                    <button
                        onClick={() => scrollMobile('up')}
                        className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-iskf-red/30 flex items-center justify-center text-white shadow-[0_0_20px_rgba(190,19,34,0.2)] active:scale-95 active:bg-iskf-red/20 active:border-iskf-red transition-all group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-iskf-red/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 relative z-10 group-hover:-translate-y-1 transition-transform duration-300 text-iskf-red group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => scrollMobile('down')}
                        className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-iskf-red/30 flex items-center justify-center text-white shadow-[0_0_20px_rgba(190,19,34,0.2)] active:scale-95 active:bg-iskf-red/20 active:border-iskf-red transition-all group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-iskf-red/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 relative z-10 group-hover:translate-y-1 transition-transform duration-300 text-iskf-red group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>

        </section>
    );
};

export default EventsRoadmap;
