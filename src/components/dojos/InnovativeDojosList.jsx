"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const InnovativeDojosList = ({ dojos = [] }) => {
    const [selectedDojo, setSelectedDojo] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Helper function to format Costa Rican phone numbers to ####-####
    const formatPhone = (phoneStr) => {
        if (!phoneStr) return "";
        const digits = phoneStr.replace(/\D/g, '');
        const last8 = digits.slice(-8); // Get the last 8 digits (ignores country code 506 if present)
        if (last8.length === 8) {
            return `${last8.slice(0, 4)}-${last8.slice(4)}`;
        }
        return phoneStr;
    };

    return (
        <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar-premium">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <AnimatePresence mode="popLayout">
                    {dojos.map((dojo, index) => (
                        <motion.div
                            key={dojo.id}
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                                delay: index * 0.05
                            }}
                            className="group relative flex items-center p-4 bg-white border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] rounded-3xl hover:shadow-[0_20px_60px_rgba(190,19,34,0.15)] transition-all duration-500 overflow-hidden cursor-pointer"
                            onClick={() => setSelectedDojo(dojo)}
                        >
                            {/* Animated Background Gradient on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                            
                            {/* Elegant Side Border */}
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#BE1322] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top"></div>

                            {/* Logo Wrapper - Crystal Sphere */}
                            <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-full mr-4 group-hover:animate-bounce shadow-[0_10px_20px_rgba(0,0,0,0.1)] flex items-center justify-center p-2.5 overflow-hidden bg-white/40">
                                
                                {/* 1. The Logo (Inside the sphere) */}
                                {dojo.logo ? (
                                    <img 
                                        src={dojo.logo?.src || dojo.logo} 
                                        alt={`Logo ${dojo.name}`}
                                        className="relative w-full h-full object-contain filter drop-shadow-md z-0 scale-95"
                                    />
                                ) : (
                                    <span className="relative text-xl font-black text-gray-400 drop-shadow-sm z-0">?</span>
                                )}

                                {/* 2. The Glass Sphere Overlay (Sits ON TOP of the logo) */}
                                <div className="absolute inset-0 rounded-full pointer-events-none z-10 bg-gradient-to-tr from-[#2D2E83]/10 via-transparent to-white/60 shadow-[inset_0_-8px_15px_rgba(0,0,0,0.1),_inset_0_8px_20px_rgba(255,255,255,1)] border border-white/50">
                                    {/* Curved Specular Highlight (Reflection) */}
                                    <div className="absolute top-[5%] left-[15%] w-[70%] h-[35%] bg-gradient-to-b from-white/90 to-transparent rounded-[100%] opacity-80 blur-[0.5px]"></div>
                                    {/* Bottom ambient reflection */}
                                    <div className="absolute bottom-[2%] left-[20%] w-[60%] h-[15%] bg-gradient-to-t from-white/40 to-transparent rounded-[100%] opacity-50 blur-[2px]"></div>
                                </div>
                            </div>

                            {/* Info Container */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-lg md:text-xl font-black text-[#2D2E83] tracking-tighter uppercase truncate mb-1.5 group-hover:text-[#BE1322] transition-colors duration-300">
                                    {dojo.name}
                                </h4>
                                
                                {dojo.phone ? (
                                    <div className="flex items-center gap-1.5 text-gray-600 font-medium bg-gray-50/80 rounded-full px-3 py-1 w-fit border border-gray-100/50 group-hover:bg-red-50 transition-colors duration-300">
                                        <svg className="w-3.5 h-3.5 text-[#BE1322]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span className="tracking-widest text-[11px] md:text-xs">{formatPhone(dojo.phone)}</span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] text-gray-400 italic font-medium tracking-widest uppercase">Sin teléfono listado</span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            {dojos.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No se encontraron dojos en esta provincia</p>
                </div>
            )}

            {/* Modal Portal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {selectedDojo && (
                        <motion.div
                            key="dojo-modal-overlay"
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDojo(null)}
                        >
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-md"></div>
                            
                            <motion.div
                                key="dojo-modal-content"
                                className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-[0_30px_100px_rgba(45,46,131,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
                                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Close Button */}
                                <button 
                                    onClick={() => setSelectedDojo(null)}
                                    className="absolute top-4 right-4 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all z-[100] shadow-lg"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                {/* Content Body */}
                                <div className="relative flex-1 overflow-y-auto custom-scrollbar-premium">
                                    {/* Sensei Hero Banner */}
                                    {selectedDojo.senseiImage ? (
                                        <div className="w-full h-[45vh] relative bg-gray-900 overflow-hidden shrink-0">
                                            <img 
                                                src={selectedDojo.senseiImage?.src || selectedDojo.senseiImage} 
                                                alt={selectedDojo.sensei} 
                                                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-1000" 
                                            />
                                            {/* Gradient overlay for text readability */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>
                                            
                                            <div className="absolute bottom-0 left-0 w-full p-8 pb-8">
                                                <span className="text-[#BE1322] font-black tracking-[0.3em] text-[10px] md:text-xs uppercase mb-2 block drop-shadow-md">Instructor Jefe</span>
                                                <h3 className="text-white text-3xl md:text-4xl font-black italic mb-1 drop-shadow-lg leading-none">{selectedDojo.sensei}</h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    {selectedDojo.rank && <p className="text-gray-300 font-bold uppercase tracking-widest text-sm drop-shadow-md">{selectedDojo.rank}</p>}
                                                    {selectedDojo.rank && selectedDojo.profession && <span className="text-gray-400 font-bold text-xs">•</span>}
                                                    {selectedDojo.profession && <p className="text-gray-300 font-medium text-sm drop-shadow-md">{selectedDojo.profession}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Fallback if no Sensei image */
                                        <div className="pt-10 px-8 pb-4">
                                            {(selectedDojo.sensei || selectedDojo.rank) && (
                                                <div className="text-left border-l-[4px] border-[#BE1322] pl-4">
                                                    <span className="block text-[10px] uppercase text-[#BE1322] font-black tracking-[0.3em] mb-1">Instructor Jefe</span>
                                                    <h3 className="text-3xl md:text-4xl font-black text-[#2D2E83] italic mb-1 leading-none">{selectedDojo.sensei}</h3>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        {selectedDojo.rank && <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{selectedDojo.rank}</p>}
                                                        {selectedDojo.rank && selectedDojo.profession && <span className="text-gray-400 font-bold text-xs">•</span>}
                                                        {selectedDojo.profession && <p className="text-sm font-medium text-gray-500">{selectedDojo.profession}</p>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Dojo Information Section */}
                                    <div className="p-8 pt-6 relative">
                                        {/* Dojo Identification Card */}
                                        <div className="flex items-center gap-5 mb-8 bg-gray-50 rounded-3xl p-4 md:p-5 border border-gray-100 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
                                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] bg-white shadow-md p-3 shrink-0 flex items-center justify-center relative overflow-hidden group">
                                                {selectedDojo.logo ? (
                                                    <img src={selectedDojo.logo?.src || selectedDojo.logo} alt={selectedDojo.name} className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-110" />
                                                ) : (
                                                    <span className="text-4xl font-black text-gray-300 relative z-10">?</span>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-tr from-[#2D2E83]/5 to-transparent z-0 pointer-events-none"></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h2 className="text-xl md:text-2xl font-black text-[#2D2E83] uppercase tracking-tighter leading-tight mb-2 truncate">
                                                    {selectedDojo.name}
                                                </h2>
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm">
                                                    <div className="w-2 h-2 rounded-full bg-[#BE1322] shadow-[0_0_5px_#BE1322] animate-pulse"></div>
                                                    <span className="text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-widest">{selectedDojo.province}</span>
                                                </div>
                                            </div>
                                        </div>


                                    {/* Contact Info Grid */}
                                    <div className="space-y-3">
                                        {selectedDojo.phone && (
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-white border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all group">
                                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-0.5">Teléfono</span>
                                                    <a href={`tel:${selectedDojo.phone.replace(/\D/g, '')}`} className="text-[#2D2E83] font-black">{formatPhone(selectedDojo.phone)}</a>
                                                </div>
                                            </div>
                                        )}
                                                                               {selectedDojo.email && (
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-white border border-gray-100 hover:border-red-100 hover:shadow-md transition-all group">
                                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-0.5">Correo</span>
                                                    <a href={`mailto:${selectedDojo.email}`} className="text-[#BE1322] font-black text-sm truncate block max-w-[200px] md:max-w-xs">{selectedDojo.email}</a>
                                                </div>
                                            </div>
                                        )}

                                        {selectedDojo.fax && (
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-white border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all group">
                                                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-0.5">Fax</span>
                                                    <a href={`tel:${selectedDojo.fax.replace(/\D/g, '')}`} className="text-[#2D2E83] font-black text-sm">{selectedDojo.fax}</a>
                                                </div>
                                            </div>
                                        )}

                                        {selectedDojo.address && (
                                            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-gray-50 hover:bg-white border border-gray-100 hover:border-emerald-100 hover:shadow-md transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-0.5">Direccin</span>
                                                        <span className="text-gray-700 font-medium text-sm leading-tight block">{selectedDojo.address}</span>
                                                    </div>
                                                </div>
                                                {selectedDojo.detailsUrl && selectedDojo.detailsUrl !== '#' && (
                                                    <a href={selectedDojo.detailsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg text-sm font-bold transition-colors">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                                        Ver en Mapa
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {!selectedDojo.address && selectedDojo.detailsUrl && selectedDojo.detailsUrl !== '#' && (
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-white border border-gray-100 hover:border-emerald-100 hover:shadow-md transition-all group">
                                                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-0.5">Ubicacin</span>
                                                    <a href={selectedDojo.detailsUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline">Abrir Mapa</a>
                                                </div>
                                            </div>
                                        )}

                                        {selectedDojo.website && (
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-white border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all group">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#2D2E83] to-[#BE1322] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-0.5">Sitio Web</span>
                                                    <a href={selectedDojo.website} target="_blank" rel="noopener noreferrer" className="text-gray-900 font-black text-sm hover:text-blue-600 transition-colors">Visitar Enlace Externo</a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default InnovativeDojosList;
