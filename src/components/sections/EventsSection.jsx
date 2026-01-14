import React from 'react';
import { motion } from 'framer-motion';
import { eventsData } from '../../data/events';

const EventsSection = () => {
    // Sort events by date
    const sortedEvents = [...eventsData].sort((a, b) => new Date(a.date) - new Date(b.date));

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

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                    src={`/${event.logo}`}
                                    alt={event.name}
                                    className="h-full w-auto object-contain drop-shadow-lg transform group-hover:scale-110 transition-transform duration-500"
                                    onError={(e) => { e.target.src = '/iskfLogo.png'; }} // Fallback
                                />

                                {/* Flag Badge */}
                                <div className="absolute top-4 right-4 w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-md">
                                    <img src={`/${event.flag}`} alt="Country" className="w-full h-full object-cover" />
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
        </section>
    );
};

export default EventsSection;
