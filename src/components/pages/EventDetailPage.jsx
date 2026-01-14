import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SocialSidebar from '../layout/SocialSidebar';
import { eventsData } from '../../data/events';

const EventDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);

    useEffect(() => {
        // Find event by ID
        const foundEvent = eventsData.find(e => e.id === parseInt(id));
        if (foundEvent) {
            setEvent(foundEvent);
            window.scrollTo(0, 0);
        } else {
            // Redirect if not found
            navigate('/');
        }
    }, [id, navigate]);

    if (!event) return null;

    // Helpers
    const formatDate = (isoString) => {
        if (!isoString) return '';
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        // Create date with time to ensure correct day
        return new Date(isoString).toLocaleDateString('es-ES', options);
    };

    const getYear = (isoString) => new Date(isoString).getFullYear();

    const renderMiniCalendar = (evt) => {
        if (!evt) return null;

        const startDate = new Date(evt.date);
        const endDate = evt.endDate ? new Date(evt.endDate) : startDate;

        const year = startDate.getFullYear();
        const month = startDate.getMonth(); // 0-indexed

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOffset = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)

        const days = [];
        for (let i = 0; i < firstDayOffset; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const currentDate = new Date(year, month, d);
            // Ignore time for comparison
            const isSelected = d === startDate.getDate() && month === startDate.getMonth();
            const isInRange = endDate && currentDate >= startDate && currentDate <= endDate;

            days.push(
                <div
                    key={d}
                    className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-bold transition-all
                    ${isSelected ? 'bg-iskf-red text-white shadow-[0_0_15px_#be1322] scale-110' : isInRange ? 'bg-iskf-red/40 text-white' : 'text-gray-500 hover:text-white'}
                    `}
                >
                    {d}
                </div>
            );
        }

        return (
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 w-full max-w-sm hover:border-iskf-red/30 transition-colors duration-500">
                <div className="text-center mb-4 flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-black text-white uppercase text-lg tracking-widest">{startDate.toLocaleString('es-ES', { month: 'long' })}</span>
                    <span className="text-iskf-red font-bold">{year}</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {['D', 'L', 'K', 'M', 'J', 'V', 'S'].map(d => (
                        <div key={d} className="text-center text-xs text-iskf-red font-black mb-2">{d}</div>
                    ))}
                    {days}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-iskf-dark min-h-screen text-white font-sans selection:bg-iskf-red selection:text-white pb-24 relative overflow-x-hidden">

            {/* Standard Floating Back Button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => navigate('/', { state: { targetId: 'calendario' } })}
                className="fixed top-28 left-6 md:left-12 z-50 w-12 h-12 bg-black/50 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-iskf-red hover:border-iskf-red transition-all duration-300 shadow-lg group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </motion.button>

            <div className="max-w-7xl mx-auto px-6 pt-32">

                {/* Header Section */}
                <div className="mb-12 border-l-4 border-iskf-red pl-8">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${event.type === 'Internacional' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' : 'border-green-500/30 text-green-400 bg-green-500/10'}`}>
                            {event.type.toUpperCase()}
                        </span>
                        <span className="text-iskf-red text-sm font-bold tracking-wider uppercase">
                            {getYear(event.date)}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-2 uppercase">{event.name}</h1>
                    <p className="text-xl text-gray-400 font-light flex items-center gap-2">
                        {event.location}
                    </p>
                </div>

                {/* BENTO GRID LAYOUT - BRANDED */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* COL 1: Main Visual (4 cols) */}
                    <div className="lg:col-span-4 bg-black/40 backdrop-blur-sm rounded-[2rem] p-8 border border-white/10 flex items-center justify-center relative overflow-hidden h-fit min-h-[300px] group hover:border-iskf-red/30 transition-colors duration-500">
                        <div className="absolute inset-0 bg-gradient-to-tr from-iskf-red/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={`${import.meta.env.BASE_URL}${event.logo}`}
                            alt={event.name}
                            className="w-full h-full object-contain relative z-10 p-4 drop-shadow-2xl"
                            onError={(e) => e.target.src = `${import.meta.env.BASE_URL}iskfLogo.png`}
                        />
                    </div>

                    {/* COL 2: Info & Stats (8 cols) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">

                        {/* Top Row: Date & Context */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Date Card */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-[2rem] p-8 border border-white/10 flex flex-col justify-between h-full hover:bg-white/10 transition-colors group">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors">Fecha</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-iskf-red" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-4xl font-black text-white mb-1 tracking-tighter">{new Date(event.date).getDate()}</div>
                                    <div className="text-lg text-iskf-red font-bold uppercase tracking-wide">{new Date(event.date).toLocaleString('es-ES', { month: 'long' })}</div>
                                    {event.endDate && (
                                        <div className="mt-2 pt-2 border-t border-white/10 text-sm text-gray-500">
                                            Hasta el {new Date(event.endDate).getDate()} de {new Date(event.endDate).toLocaleString('es-ES', { month: 'long' })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Location Card */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-[2rem] p-8 border border-white/10 flex flex-col justify-between h-full hover:bg-white/10 transition-colors group">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors">Sede</span>
                                    <img src={`${import.meta.env.BASE_URL}${event.flag}`} className="w-6 h-6 rounded-full shadow-sm" alt="flag" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white leading-tight mb-2">{event.location}</div>
                                    <div className="text-sm text-gray-400 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        Ubicación Confirmada
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Row: Description */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-[2rem] p-8 border border-white/10 flex-grow hover:border-white/20 transition-colors">
                            <span className="text-iskf-red text-xs font-black uppercase tracking-widest block mb-4">Información del Evento</span>
                            <p className="text-gray-300 leading-relaxed text-lg font-light">
                                {event.description}
                            </p>
                            <div className="mt-6 flex items-center gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-gray-400 text-sm">
                                    Este evento reúne a los mejores exponentes bajo los lineamientos de la ISKF. <span className="text-white font-bold">Se ruega puntualidad.</span>
                                </p>
                            </div>
                        </div>

                        {/* Bottom Row: Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                className="bg-iskf-red text-white py-4 px-6 rounded-2xl font-bold uppercase tracking-widest hover:bg-red-700 hover:scale-[1.02] transition-all shadow-[0_10px_30px_-10px_rgba(220,38,38,0.5)] flex items-center justify-center gap-3"
                                onClick={() => {
                                    const startTime = new Date(event.date).toISOString().replace(/-|:|\.\d\d\d/g, "");
                                    const endTime = event.endDate
                                        ? new Date(event.endDate).toISOString().replace(/-|:|\.\d\d\d/g, "")
                                        : new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
                                    const text = encodeURIComponent(event.name);
                                    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startTime}/${endTime}`;
                                    window.open(url, '_blank');
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                Agregar a Calendario
                            </button>

                            <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors cursor-help">
                                Más información próximamente
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailPage;
