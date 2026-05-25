"use client";
import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useRouter } from 'next/navigation';
import useWindowSize from '../../hooks/useWindowSize';

import fondoInicioNuevo from '../../assets/images/Fondo-inicio-nuevo.jpg';
import iskfFondoRojo from '../../assets/images/iskfFondoRojo.jpg';
import iskfLogo from '../../assets/images/iskf.jpg';
import kumaLogo from '../../assets/images/kumaLogo.jpg';
import costaRicaFlag from '../../assets/images/CostaRica.jpg';
import wkfLogo from '../../assets/images/wkf.jpg';
import mexicoFlag from '../../assets/images/mexico.jpg';
import icoderLogo from '../../assets/images/icoder.jpg';
import kurobiLogo from '../../assets/images/kurobiLogo.jpeg';
import fecokaLogo from '../../assets/images/FecokaLogo.jpg';
import ccondekaLogo from '../../assets/images/LogoCcondeka.jpg';
import nicaraguaFlag from '../../assets/images/nicaragua.jpg';
import wkfPanamericaLogo from '../../assets/images/LogoWKFPanamerica.jpg';
import brazilFlag from '../../assets/images/brazil.jpg';
import polandFlag from '../../assets/images/poland.jpg';
import zanshinLogo from '../../assets/images/zanshinLogo.jpg';

const imageMap = {
    kumaLogo,
    costaRicaFlag,
    wkfLogo,
    mexicoFlag,
    icoderLogo,
    iskfLogo,
    kurobiLogo,
    iskfFondoRojo,
    fecokaLogo,
    ccondekaLogo,
    nicaraguaFlag,
    wkfPanamericaLogo,
    brazilFlag,
    polandFlag,
    zanshinLogo,
};

const EventsRoadmap = ({ events = [] }) => {
    const containerRef = useRef(null);
    const wrapperRef = useRef(null);
    const desktopContentRef = useRef(null); // Added ref for desktop content
    const nodeRefs = useRef({});
    const router = useRouter(); // Changed from navigate to router for consistency
    const { width: windowWidth } = useWindowSize();
    const [width, setWidth] = useState(0);
    const xPos = useMotionValue(0); // Motion value for desktop drag X position

    // Collision Detection State & Refs
    const [activeEventId, setActiveEventId] = useState(null);
    const [hoveredEventId, setHoveredEventId] = useState(null);
    const cometRef = useRef(null);

    // Sort events by date and map DB structure to component structure
    const sortedEvents = [...events].map(e => ({
        id: e.id,
        name: e.title,
        date: e.startDate,
        endDate: e.endDate,
        type: e.type,
        locationScope: e.locationScope,
        location: e.location || 'Costa Rica',
        logo: imageMap[e.logoName] || e.logoName || iskfLogo,
        flag: imageMap[e.flagName] || e.flagName || costaRicaFlag,
        description: e.description,
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Auto-scroll robusto al próximo evento
    useEffect(() => {
        const nextEvent = sortedEvents.find(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)));
        if (!nextEvent) return;

        let attemptCount = 0;
        const tryScroll = () => {
            const node = nodeRefs.current[nextEvent.id];
            if (!node) {
                if (attemptCount < 10) {
                    attemptCount++;
                    setTimeout(tryScroll, 200);
                }
                return;
            }

            if (windowWidth <= 768) {
                if (containerRef.current) {
                    // Mobile: Scroll to position leaving some space at the top
                    containerRef.current.scrollTo({
                        top: Math.max(0, node.offsetTop - 150),
                        behavior: 'smooth'
                    });
                }
            } else {
                if (wrapperRef.current && desktopContentRef.current) {
                    // Desktop: Move horizontal timeline so the node is visible on the left
                    let targetX = -(node.offsetLeft - 300);
                    if (targetX > 0) targetX = 0;
                    
                    animate(xPos, targetX, { type: "spring", stiffness: 50, damping: 20 });
                }
            }
        };

        // Iniciar intentos de scroll poco después de renderizar
        setTimeout(tryScroll, 500);
    }, [windowWidth]);

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
                        const eventId = id; // id in sortedEvents is a string or number, we can compare directly
                        const event = sortedEvents.find(e => e.id.toString() === eventId.toString());
                        const isPast = event && new Date(event.date) < new Date();

                        // SKIP PAST EVENTS (No reaction)
                        if (isPast) return;

                        const nodeRect = nodeEl.getBoundingClientRect();

                        // Check if node is actually visible (scrolled into view)
                        // Simple boundary check relative to viewport
                        if (nodeRect.top < 0 || nodeRect.top > window.innerHeight) return;

                        const nodePos = isMobile ? (nodeRect.top + nodeRect.height / 2) : (nodeRect.left + nodeRect.width / 2);
                        const distance = Math.abs(cometPos - nodePos);

                        // Threshold: 60px desktop, 50px mobile
                        if (distance < (isMobile ? 50 : 60)) {
                            hitFound = id;
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

    const formatDate = (startDateStr, endDateStr) => {
        const start = new Date(startDateStr);
        const end = endDateStr ? new Date(endDateStr) : start;
        
        const options = { month: 'short', day: 'numeric', timeZone: 'UTC' };
        
        const startFormatted = start.toLocaleDateString('es-ES', options).replace('.', '');
        
        if (startDateStr && endDateStr) {
            const startDayOnly = startDateStr.split('T')[0];
            const endDayOnly = endDateStr.split('T')[0];
            if (startDayOnly !== endDayOnly) {
                if (start.getUTCMonth() === end.getUTCMonth()) {
                    return `${start.getUTCDate()} - ${end.getUTCDate()} de ${start.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' }).replace('.', '')}`;
                } else {
                    const endFormatted = end.toLocaleDateString('es-ES', options).replace('.', '');
                    return `${startFormatted} - ${endFormatted}`;
                }
            }
        }
        return startFormatted;
    };

    const overlapSpacingRem = 18; // Overlap factor

    return (
        <section
            id="calendario"
            className="relative min-h-screen pt-36 pb-24 md:pt-40 md:pb-24 bg-white overflow-hidden flex flex-col items-center justify-center border-t border-black/5"
            onWheel={handleWheel}
        >
            {/* BACKGROUND: Digital Horizon + Image */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url('${fondoInicioNuevo?.src || fondoInicioNuevo}')` }}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(190,19,34,0.1),transparent_80%)]"></div>

                {/* Smooth Transitions to other sections */}
                <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white via-white/50 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white via-white/50 to-transparent"></div>
            </div>

            {/* HEADER */}
            <div className="relative z-10 text-center mb-4 md:mb-8 pointer-events-none mt-12">
                <span className="text-iskf-red font-bold text-xs tracking-[0.3em] uppercase animate-pulse">Roadmap 2026</span>
                <h2 className="text-4xl md:text-6xl font-black text-[#2D2E83] uppercase tracking-tighter mt-2">
                    Calendario <span className="text-transparent bg-clip-text bg-gradient-to-r from-iskf-red to-red-600">Oficial</span>
                </h2>
            </div>

            {/* DESKTOP WRAPPER (Horizontal Infinite Scroll) */}
            <div className="hidden md:flex w-full relative z-20 flex-col md:flex-row md:items-center md:h-[75vh] md:overflow-hidden cursor-grab active:cursor-grabbing md:py-24" ref={wrapperRef}>
                {/* DESKTOP LINE (Infinite Rail) */}
                <div className="absolute top-1/2 left-0 h-[2px] bg-black/10 w-[200%] z-0 translate-y-[1px]"></div>

                {/* DESKTOP COMET - Assigned to cometRef when visible */}
                {windowWidth > 768 && (
                    <motion.div
                        ref={cometRef}
                        className="absolute top-1/2 z-30 -translate-y-1/2 pointer-events-none"
                        initial={{ left: '-10%' }}
                        animate={{ left: '110%' }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                    >
                        <div className="w-6 h-6 bg-gradient-to-r from-iskf-red via-orange-500 to-white rounded-full shadow-[0_0_20px_#be1322] relative z-10 animate-pulse flex items-center justify-center">
                            {/* Inner core glow */}
                            <div className="absolute inset-0.5 bg-white rounded-full blur-[1px] opacity-80"></div>
                        </div>
                        <div className="absolute top-1/2 right-1/2 w-48 h-2 bg-gradient-to-l from-white via-iskf-red/40 to-transparent -translate-y-1/2 blur-[4px] opacity-40"></div>
                        <div className="absolute top-1/2 right-1/2 w-32 h-0.5 bg-gradient-to-l from-white/70 to-transparent -translate-y-1/2 blur-[1px] opacity-60"></div>
                    </motion.div>
                )}

                <motion.div
                    ref={desktopContentRef}
                    style={{ x: xPos }}
                    className="relative flex items-center pl-10 pr-[50vw] h-full"
                    drag="x"
                    dragConstraints={{ right: 0, left: width > 0 ? -width : -10000 }} // Use large fallback to prevent snap-to-right on init
                    dragElastic={0.1} // Minimal bounce to stay in control
                    dragMomentum={true} // Smooth scrolling momentum
                >
                    {/* START NODE */}
                    <div className="relative flex-shrink-0 flex flex-col items-center justify-center mr-16 group">
                        <div className="w-24 h-24 rounded-full bg-white border-2 border-iskf-red/50 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(190,19,34,0.15)] group-hover:scale-110 transition-transform duration-500">
                            <img src={iskfFondoRojo?.src || iskfFondoRojo} alt="ISKF" className="w-full h-full object-cover rounded-full opacity-90 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 rounded-full border-4 border-iskf-red opacity-0 animate-[ping_1.5s_ease-out_infinite] z-0"></div>
                        </div>
                        <div className="absolute top-1/2 left-full h-[2px] bg-gradient-to-r from-iskf-red via-red-500 to-transparent z-0 translate-y-[1px] opacity-80" style={{ width: `${overlapSpacingRem}rem` }}></div>
                    </div>

                    {/* EVENT NODES - DESKTOP */}
                    {sortedEvents.map((event) => {
                        const isTopPosition = event.locationScope === 'Nacional';
                        const isPast = new Date(event.date) < new Date();
                        const isNext = !isPast && sortedEvents.find(e => new Date(e.date) >= new Date())?.id === event.id;
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
                                    className={`w-8 h-8 rounded-full border-2 relative z-20 transition-all duration-300 
                                        ${isPast ? 'bg-gray-200 border-gray-400 opacity-50 cursor-default' :
                                            isActive ? 'bg-white border-iskf-red shadow-[0_0_20px_#be1322] scale-150 cursor-default' :
                                                isNext ? 'bg-white border-iskf-blue shadow-[0_0_20px_rgba(45,46,131,0.5)] cursor-default' :
                                                    'bg-white border-iskf-red shadow-[0_0_10px_rgba(190,19,34,0.3)] cursor-default group hover:scale-125'}`}
                                    whileHover={!isPast ? { scale: 1.3 } : {}}
                                >
                                    {(isNext || isActive) && <div className={`absolute -inset-4 rounded-full border-2 ${isActive ? 'border-iskf-red' : 'border-iskf-blue'} opacity-50 animate-ping`}></div>}
                                    <div className={`absolute inset-0 rounded-full opacity-50 animate-pulse ${isNext && !isActive ? 'bg-iskf-blue' : 'bg-iskf-red'}`}></div>
                                    <div className="absolute inset-1 rounded-full bg-white/90"></div>
                                </motion.div>

                                <div className={`absolute left-1/2 w-[1px] from-iskf-red to-transparent z-10 -translate-x-1/2 transition-all duration-300 ${isActive ? 'bg-iskf-red h-20 shadow-[0_0_15px_#be1322]' : 'group-hover:h-20 group-hover:bg-iskf-red'} ${isTopPosition ? 'bottom-8 bg-gradient-to-t' : 'top-8 bg-gradient-to-b'} ${!isActive && (isTopPosition ? 'h-12' : 'h-12')}`}></div>

                                <motion.div
                                    className={`absolute left-1/2 -translate-x-1/2 w-64 ${isPast ? 'pointer-events-none' : ''} cursor-default ${isTopPosition ? 'bottom-1/2 mb-16 origin-bottom' : 'top-1/2 mt-16 origin-top'} ${isPast && !isActive && !isExpanded ? 'opacity-30 grayscale-[1]' : 'opacity-100 grayscale-0'}`}
                                    animate={isPast ? { scale: 1, y: 0 } : isActive ? { scale: 1.05, y: isTopPosition ? -5 : 5, filter: "brightness(1.1)" } : { scale: 1, y: 0, filter: "brightness(1)" }}
                                    whileHover={!isPast ? { scale: 1.03, y: isTopPosition ? -5 : 5 } : {}}
                                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                >
                                    <div className={`bg-white/60 backdrop-blur-xl border p-5 rounded-2xl relative overflow-hidden transition-all duration-500 group ${isActive || isExpanded ? 'border-iskf-red/50 shadow-[0_0_30px_rgba(190,19,34,0.15)] ring-1 ring-iskf-red/20' : isPast ? 'border-black/5 shadow-none' : 'border-black/10 hover:border-iskf-red/30 hover:shadow-[0_0_20px_rgba(190,19,34,0.1)]'}`}>
                                        <div className={`absolute inset-0 bg-gradient-to-tr from-black/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 ${!isPast && (isActive || isExpanded) ? 'opacity-100' : (!isPast ? 'group-hover:opacity-100' : '')}`}></div>
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-iskf-red/5 to-transparent h-[200%] w-full -translate-y-full group-hover:translate-y-full transition-transform duration-1000 ease-in-out"></div>
                                        <div className="relative z-10 text-center flex flex-col items-center">
                                            <div className={`inline-block text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 shadow-lg transition-transform ${isActive || isExpanded ? 'scale-110' : 'group-hover:scale-110'} ${isTopPosition ? 'bg-iskf-red' : 'bg-[#2D2E83]'}`}>
                                                {formatDate(event.date, event.endDate)}
                                            </div>
                                            <div className={`w-12 h-12 rounded-full bg-white p-0.5 shadow-lg mb-3 transition-transform duration-300 border border-gray-200 ${isActive || isExpanded ? 'scale-125' : 'group-hover:scale-110'}`}>
                                                <img src={event.logo?.src || event.logo} alt="Logo" className="w-full h-full object-contain rounded-full" onError={(e) => { e.target.onerror = null; e.target.src = iskfLogo; }} />
                                            </div>
                                            <h4 className={`font-bold text-base leading-tight mb-2 transition-colors ${isActive || isExpanded ? 'text-iskf-red' : 'text-[#2D2E83] group-hover:text-iskf-red'}`}>{event.name}</h4>
                                            <div className={`flex items-center justify-center gap-2 text-xs font-mono transition-colors ${isActive || isExpanded ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>
                                                <img src={event.flag?.src || event.flag} className="w-4 h-4 rounded-full" alt="flag" />
                                                <span>{event.location.split(',')[0]}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                                <div className="absolute top-1/2 left-full h-[2px] bg-black/10 -z-10 translate-y-[1px] transition-[width] duration-300 ease-out" style={{ width: marginWidth }}></div>
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
                        <div className="w-20 h-20 rounded-full bg-white border-2 border-iskf-red/50 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(190,19,34,0.15)]">
                            <img src={iskfFondoRojo?.src || iskfFondoRojo} alt="ISKF" className="w-full h-full object-cover rounded-full opacity-90" />
                            <div className="absolute inset-0 rounded-full border-4 border-iskf-red opacity-0 animate-[ping_1.5s_ease-out_infinite] z-0"></div>
                        </div>
                    </div>

                    {/* ZIG-ZAG LIST */}
                    <div className="relative">
                        {/* Static Center Line */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-iskf-red via-black/10 to-transparent"></div>

                        {sortedEvents.map((event) => {
                            const isNational = event.locationScope === 'Nacional';
                            const isPast = new Date(event.date) < new Date();
                            const isNext = !isPast && sortedEvents.find(e => new Date(e.date) >= new Date())?.id === event.id;
                            const isActive = activeEventId === event.id;

                            return (
                                <div key={event.id} className={`flex w-full items-center mb-8 relative z-10 ${isNational ? 'justify-start' : 'justify-end'}`}>
                                    {/* CARD */}
                                    <div
                                        className={`w-[45%] relative ${isNational ? 'mr-auto text-right pr-4' : 'ml-auto text-left pl-4'} ${isPast && !isActive ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100'} cursor-default`}
                                    >
                                        <div className={`bg-white/80 backdrop-blur-md border p-3 rounded-xl transition-all duration-300 shadow-lg relative
                                            ${isActive ? 'border-iskf-red shadow-[0_0_20px_rgba(190,19,34,0.2)] scale-105' : isPast ? 'border-black/5 cursor-default' : 'border-black/10 hover:border-iskf-red/50'}
                                        `}>
                                            {/* Subtle Active flash overlay */}
                                            {isActive && <div className="absolute inset-0 bg-iskf-red/10 rounded-xl animate-pulse z-10"></div>}

                                            <div className={`text-xs font-black uppercase tracking-widest inline-block px-2 py-0.5 rounded-full mb-1 ${isNational ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {formatDate(event.date, event.endDate)}
                                            </div>
                                            <h4 className={`font-bold text-xs leading-tight mb-1 transition-colors ${isActive ? 'text-iskf-red' : 'text-[#2D2E83]'}`}>{event.name}</h4>
                                            <div className={`flex items-center gap-1 text-xs ${isActive ? 'text-black' : 'text-gray-500'} ${isNational ? 'justify-end' : 'justify-start'}`}>
                                                {isNational ? <img src={event.flag?.src || event.flag} className="w-3 h-3 rounded-full" alt="flag" /> : null}
                                                <span>{event.location.split(',')[0]}</span>
                                                {!isNational ? <img src={event.flag?.src || event.flag} className="w-3 h-3 rounded-full" alt="flag" /> : null}
                                            </div>
                                        </div>
                                    </div>

                                    {/* CENTER NODE */}
                                    <div
                                        ref={el => { if (windowWidth <= 768) nodeRefs.current[event.id] = el }}
                                        className={`absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full border-2 z-20 transition-all duration-300
                                            ${isActive ? 'bg-iskf-red border-white shadow-[0_0_15px_#be1322] scale-150' :
                                                isNext ? 'bg-white border-iskf-blue shadow-[0_0_15px_#2d2e83]' :
                                                    isPast ? 'bg-gray-300 border-gray-400 opacity-50 grayscale' : 'bg-white border-iskf-red'}`}
                                    >
                                        {(isNext || isActive) && <div className={`absolute -inset-2 rounded-full border ${isActive ? 'border-iskf-red' : 'border-iskf-blue'} opacity-50 animate-ping`}></div>}
                                    </div>

                                    {/* CONNECTOR */}
                                    <div className={`absolute top-1/2 -translate-y-1/2 h-[1px] w-[5%] transition-colors duration-300 
                                        ${isActive ? 'bg-iskf-red shadow-[0_0_5px_#be1322]' : 'bg-black/20'}
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
                        className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-md border border-iskf-red/30 flex items-center justify-center text-iskf-red shadow-[0_0_20px_rgba(190,19,34,0.1)] active:scale-95 active:bg-iskf-red/10 active:border-iskf-red transition-all group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-iskf-red/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 relative z-10 group-hover:-translate-y-1 transition-transform duration-300 text-iskf-red group-hover:text-[#2D2E83]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => scrollMobile('down')}
                        className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-md border border-iskf-red/30 flex items-center justify-center text-iskf-red shadow-[0_0_20px_rgba(190,19,34,0.1)] active:scale-95 active:bg-iskf-red/10 active:border-iskf-red transition-all group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-iskf-red/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 relative z-10 group-hover:translate-y-1 transition-transform duration-300 text-iskf-red group-hover:text-[#2D2E83]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* INVITACIÓN A DESLIZAR & DISCLAIMER */}
            <div className="relative z-30 w-full max-w-4xl px-6 mt-8 flex flex-col items-center gap-6 text-center select-none">
                
                {/* Swipe/Drag Invitation (Desktop/Mobile responsive) */}
                <div className="flex flex-col items-center gap-2">
                    {/* Desktop swipe helper */}
                    <div className="hidden md:flex items-center gap-3 text-sm text-neutral-500 font-medium tracking-wider uppercase">
                        <motion.span 
                            animate={{ x: [-5, 5, -5] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="text-[#2D2E83]"
                        >
                            ←
                        </motion.span>
                        <span>Arrastra horizontalmente para explorar el roadmap</span>
                        <motion.span 
                            animate={{ x: [5, -5, 5] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="text-[#2D2E83]"
                        >
                            →
                        </motion.span>
                    </div>

                    {/* Mobile swipe helper */}
                    <div className="flex md:hidden items-center gap-2.5 text-xs text-neutral-500 font-medium tracking-wider uppercase animate-pulse">
                        <motion.span
                            animate={{ y: [-3, 3, -3] }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                            className="text-iskf-red text-sm"
                        >
                            ↓
                        </motion.span>
                        <span>Desliza hacia abajo para ver más eventos</span>
                        <motion.span
                            animate={{ y: [3, -3, 3] }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                            className="text-iskf-red text-sm"
                        >
                            ↑
                        </motion.span>
                    </div>
                </div>

                {/* Glassmorphic Disclaimer Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full bg-[#2D2E83]/5 backdrop-blur-xl border-l-4 border-iskf-red rounded-r-2xl p-5 md:p-6 text-left shadow-[0_10px_30px_rgba(45,46,131,0.05)] relative overflow-hidden"
                >
                    {/* Decorative glow in background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-iskf-red/5 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-2 bg-iskf-red/10 text-iskf-red rounded-lg mt-0.5">
                            <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="space-y-1.5">
                            <h4 className="font-bold text-sm md:text-base text-[#2D2E83] uppercase tracking-wider">
                                Nota del Calendario Oficial
                            </h4>
                            <p className="text-xs md:text-sm text-neutral-600 leading-relaxed font-medium">
                                Este cronograma detalla las actividades planificadas para el año en curso. Las fechas y sedes definitivas están sujetas a ajustes de organización. Los eventos de alcance <strong className="text-iskf-red">Nacional</strong> están posicionados arriba y resaltados en rojo, mientras que los eventos <strong className="text-[#2D2E83]">Internacionales</strong> están abajo en color azul.
                            </p>
                        </div>
                    </div>
                </motion.div>

            </div>
        </section>
    );
};

export default EventsRoadmap;
