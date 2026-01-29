import React from 'react';
import { motion } from 'framer-motion';
import { eventsData } from '../../data/events';
import iskfLogo from '../../assets/images/iskf.jpg';

const EventsSection = () => {
    // Sort events by date
    const sortedEvents = [...eventsData].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Helper to format date

    // Helper to format date
    const formatDate = (dateString) => {
        const options = { month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options).replace('.', '');
    };

    const getMonth = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase();
    };

    const getDay = (dateString) => {
        return new Date(dateString).getDate();
    };

    return (
        <section id="calendario" className="py-24 px-6 md:px-16 bg-zinc-900 relative border-t border-white/5 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -right-20 w-96 h-96 bg-iskf-red/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-1/4 -left-20 w-72 h-72 bg-iskf-dark/50 rounded-full blur-[80px]"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <span className="text-iskf-red font-black text-xs tracking-[0.2em] uppercase">Agenda 2026</span>
                    <h2 className="text-4xl md:text-5xl font-black text-white">Calendario de Eventos</h2>
                    <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-iskf-red to-transparent mx-auto mt-6 rounded-full shadow-[0_0_25px_rgba(220,38,38,0.8)]"></div>
                </div>

                {/* Events Grid / Timeline */}
                <div className="relative">
                    {/* Mobile Timeline Line - Centered */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-iskf-red via-white/20 to-transparent md:hidden"></div>

                    {/* Mobile Container (Zig-Zag) */}
                    <div className="md:hidden flex flex-col gap-8 pb-12">
                        {sortedEvents.map((event, index) => {
                            const isNational = event.type === 'Nacional';
                            // National -> Left, International -> Right

                            return (
                                <div
                                    key={event.id}
                                    className={`flex w-full items-center ${isNational ? 'justify-start' : 'justify-end'}`}
                                >
                                    {/* Card Container - 45% width to fit side by side with gap */}
                                    <motion.div
                                        initial={{ opacity: 0, x: isNational ? -20 : 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`relative w-[45%] bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden hover:border-iskf-red/30 transition-all duration-300 ${isNational ? 'mr-auto text-right' : 'ml-auto text-left'}`}
                                    >
                                        {/* Connector Dot */}
                                        <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-iskf-red rounded-full border-2 border-zinc-900 z-10 
                                            ${isNational ? '-right-6' : '-left-6'}
                                        `}>
                                            <div className="w-full h-full bg-white/20 rounded-full animate-pulse"></div>
                                        </div>
                                        {/* Connector Line */}
                                        <div className={`absolute top-1/2 -translate-y-1/2 h-0.5 bg-white/10 w-6
                                            ${isNational ? '-right-6' : '-left-6'}
                                        `}></div>

                                        {/* Card Content (Compact for Mobile) */}
                                        <div className="p-4">
                                            {/* Header */}
                                            <div className="mb-2 flex flex-col gap-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isNational ? 'text-green-400 self-end' : 'text-blue-400 self-start'}`}>
                                                    {event.type}
                                                </span>
                                                <div className={`text-iskf-red font-black leading-none flex flex-col ${isNational ? 'items-end' : 'items-start'}`}>
                                                    <span className="text-[10px] uppercase opacity-80">{getMonth(event.date)}</span>
                                                    <span className="text-xl">{getDay(event.date)}</span>
                                                </div>
                                            </div>

                                            {/* Image (Small) */}
                                            <div className={`h-20 w-full mb-3 rounded-lg overflow-hidden bg-black/20 relative ${isNational ? 'ml-auto' : 'mr-auto'}`}>
                                                <img
                                                    src={event.logo}
                                                    alt={event.name}
                                                    className="w-full h-full object-contain p-2"
                                                    onError={(e) => { e.target.src = iskfLogo; }}
                                                />
                                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full overflow-hidden border border-white/20">
                                                    <img src={event.flag} alt="flag" className="w-full h-full object-cover" />
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <h3 className={`text-sm font-bold text-white mb-1 leading-tight ${isNational ? 'text-right' : 'text-left'}`}>
                                                {event.name}
                                            </h3>
                                            <div className={`flex items-center text-[10px] text-gray-500 font-mono ${isNational ? 'justify-end' : 'justify-start'}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-iskf-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {event.location}
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop Grid (Original Layout Preserved) */}
                    <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-8">
                        {sortedEvents.map((event, index) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -10 }}
                                className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-iskf-red/30 transition-all duration-300"
                            >
                                {/* Card Header (Image/Logo Area) */}
                                <div className="h-40 relative overflow-hidden bg-black/40 flex items-center justify-center p-6">
                                    {/* Glossy Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                    <img
                                        src={event.logo}
                                        alt={event.name}
                                        className="h-full w-auto object-contain drop-shadow-lg transform group-hover:scale-110 transition-transform duration-500"
                                        onError={(e) => { e.target.src = iskfLogo; }} // Fallback
                                    />

                                    {/* Flag Badge */}
                                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-md">
                                        <img src={event.flag} alt="Country" className="w-full h-full object-cover" />
                                    </div>
                                </div>

                                {/* Date Badge (Floating) */}
                                <div className="absolute top-32 left-6 bg-iskf-red text-white p-3 rounded-lg shadow-lg flex flex-col items-center justify-center border border-white/10 group-hover:bg-red-700 transition-colors">
                                    <span className="text-xs font-bold uppercase">{getMonth(event.date)}</span>
                                    <span className="text-2xl font-black leading-none">{getDay(event.date)}</span>
                                </div>

                                {/* Card Body */}
                                <div className="pt-12 pb-8 px-6">
                                    <div className="mb-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest py-1 px-2 rounded bg-white/5 ${event.type === 'Internacional' ? 'text-blue-400' : 'text-green-400'}`}>
                                            {event.type}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-iskf-red transition-colors">
                                        {event.name}
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                        {event.description}
                                    </p>

                                    <div className="flex items-center text-xs text-gray-500 font-mono border-t border-white/5 pt-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-iskf-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {event.location}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default EventsSection;
