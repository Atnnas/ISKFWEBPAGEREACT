"use client";
import React, { useState } from 'react';
import InteractiveMap from '../map/InteractiveMap';
import InnovativeDojosList from '../dojos/InnovativeDojosList';
import { crMapFeatures } from '../../data/mapData';
import fondoInicioNuevo from '../../assets/images/Fondo-inicio-nuevo.jpg';

import Image from 'next/image';

const DojosSection = ({ dojos = [] }) => {
    const [activeProvince, setActiveProvince] = useState(null);

    // Filter Dojos
    const filteredDojos = React.useMemo(() => {
        if (!activeProvince) {
            // Randomize if no active province
            return [...dojos].sort(() => Math.random() - 0.5);
        }
        const provName = crMapFeatures.find(f => f.id === activeProvince)?.name;
        return dojos.filter(d => d.province.toLowerCase() === provName?.toLowerCase());
    }, [activeProvince, dojos]);

    return (
        <section id="dojos" className="relative min-h-[68vh] pt-36 pb-16 md:pt-40 md:pb-24 px-4 md:px-16 overflow-hidden border-t border-black/10 flex flex-col items-center bg-white/50">
            {/* Background Image with Themed Overlay */}
            <div className="fixed inset-0 z-0 pointer-events-none select-none bg-white">
                <Image 
                    src={fondoInicioNuevo} 
                    alt="Background ISKF" 
                    placeholder="blur"
                    quality={80}
                    className="absolute inset-0 object-cover object-center w-full h-full opacity-[0.25]" 
                />
                {/* Light gradient for readability without obscuring the image */}
            </div>

            {/* Section Header */}
            <div className="relative z-10 w-full text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-black tracking-[0.2em] mb-4 uppercase inline-block relative text-[#2D2E83]">
                    Nuestros Dojos
                </h2>
                <span className="text-iskf-red font-bold text-xs tracking-[0.3em] uppercase mt-6 block">Explora Nuestros Dojos en Todo el País</span>
            </div>

            <div className="w-full flex flex-col xl:flex-row gap-8 items-center relative z-10 max-w-8xl mx-auto">
                {/* Map Column */}
                <div className="w-full xl:w-1/2 h-[45vh] xl:h-[60vh] relative p-1">
                    {/* HUD Header: Map */}
                    <div className="absolute -top-12 left-0 w-full z-20 flex flex-col items-center justify-center pointer-events-none">
                        <h3 className="text-[#2D2E83] font-black tracking-[0.3em] uppercase text-xl md:text-2xl drop-shadow-md flex items-center gap-3">
                            <svg className="w-5 h-5 text-iskf-red animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            MAPA INTERACTIVO
                        </h3>
                        <div className="flex items-center gap-3 mt-1 opacity-100 animate-bounce">
                            <span className="w-8 h-[2px] bg-iskf-red shadow-[0_0_10px_rgba(190,19,34,0.5)]"></span>
                            <span className="text-xs md:text-sm text-[#BE1322] font-black tracking-[0.3em] uppercase drop-shadow-md">👉 Toca una Provincia 👈</span>
                            <span className="w-8 h-[2px] bg-iskf-red shadow-[0_0_10px_rgba(190,19,34,0.5)]"></span>
                        </div>
                    </div>

                    <div className="w-full h-full bg-transparent overflow-hidden relative group">
                        <div className="relative z-50 w-full h-full pointer-events-auto">
                            <InteractiveMap activeProvinceId={activeProvince} onProvinceClick={setActiveProvince} />
                        </div>
                    </div>
                </div>

                {/* Timeline Column */}
                <div className="w-full xl:w-1/2 h-[45vh] xl:h-[60vh] relative p-1">
                    {/* HUD Header: Dojos List */}
                    <div className="absolute -top-12 left-0 w-full z-20 flex flex-col items-center justify-center pointer-events-none">
                        <h3 className="text-[#2D2E83] font-black tracking-[0.3em] uppercase text-xl md:text-2xl drop-shadow-md flex items-center gap-3">
                            <svg className="w-5 h-5 text-[#BE1322] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                            CONOCE NUESTROS DOJOS
                        </h3>
                    </div>

                    <div className="w-full h-full bg-transparent overflow-hidden md:overflow-visible relative flex items-center justify-center">
                        <div className="relative z-50 w-full h-full pointer-events-auto flex items-center justify-center">
                            <InnovativeDojosList dojos={filteredDojos} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DojosSection;
