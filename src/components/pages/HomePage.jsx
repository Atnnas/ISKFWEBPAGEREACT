import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SocialSidebar from '../layout/SocialSidebar';
import Hero from '../sections/Hero';
import AboutSection from '../sections/About';
import InteractiveMap from '../map/InteractiveMap';
import OrbitalTimeline from '../timeline/OrbitalTimeline';
import EventsRoadmap from '../sections/EventsRoadmap';
import ResourcesSection from '../sections/ResourcesSection';
import { dojosData } from '../../data/dojos';
import { crMapFeatures } from '../../data/mapData';

function HomePage() {
    const [activeProvince, setActiveProvince] = useState(null);
    const location = useLocation();

    // Scroll to section on return
    useEffect(() => {
        if (location.state?.targetId) {
            const element = document.getElementById(location.state.targetId);
            if (element) {
                // Short delay to allow layout to settle
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'auto', block: 'start' });
                }, 100);
            }
        }
    }, [location]);

    // Filter Dojos
    const filteredDojos = activeProvince
        ? dojosData.filter(d => {
            const provName = crMapFeatures.find(f => f.id === activeProvince)?.name;
            return d.province.toLowerCase() === provName?.toLowerCase();
        })
        : dojosData;

    return (
        <div className="bg-iskf-dark text-white font-sans antialiased selection:bg-iskf-red selection:text-white overflow-x-hidden">


            <Hero />
            <AboutSection />

            {/* DOJOS SECTION (Map + Timeline) */}
            <section id="dojos" className="relative min-h-[68vh] py-16 md:py-24 px-4 md:px-16 bg-zinc-900 overflow-hidden border-t border-white/5 flex flex-col items-center">
                {/* Background Image with Themed Overlay */}
                <div className="absolute inset-0 z-0 pointer-events-none select-none">
                    <img src={`${import.meta.env.BASE_URL}dojosFondo.jpg`} alt="Background Dojos" className="w-full h-full object-cover opacity-20 mix-blend-luminosity" />
                    <div className="absolute inset-0 bg-gradient-to-b from-iskf-dark via-iskf-red/5 to-iskf-dark opacity-90"></div>
                </div>

                {/* Section Header (Matches About.jsx) */}
                <div className="relative z-10 w-full text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-[0.2em] mb-4 uppercase inline-block relative text-white">
                        Nuestros Dojos
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gradient-to-r from-transparent via-iskf-red to-transparent rounded-full shadow-[0_0_25px_rgba(220,38,38,0.8)]"></span>
                    </h2>
                    <span className="text-iskf-red font-bold text-xs tracking-[0.3em] uppercase mt-6 block">Explora Nuestros Dojos en Todo el País</span>
                </div>

                <div className="w-full flex flex-col xl:flex-row gap-8 items-center relative z-10 max-w-8xl mx-auto">
                    {/* Map Column - Holographic Console */}
                    <div className="w-full xl:w-1/2 h-[45vh] xl:h-[60vh] relative p-1">
                        {/* Decorative Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-br from-iskf-red/20 to-transparent rounded-[2.5rem] blur-xl opacity-30 pointer-events-none"></div>

                        <div className="w-full h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative group">
                            <div className="relative z-50 w-full h-full pointer-events-auto">
                                <InteractiveMap activeProvinceId={activeProvince} onProvinceClick={setActiveProvince} />
                            </div>

                            {/* Corner Accents */}
                            <div className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-white/10 rounded-bl-2xl pointer-events-none z-0"></div>
                            <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-white/10 rounded-br-2xl pointer-events-none z-0"></div>
                        </div>
                    </div>

                    {/* Timeline Column - Holographic Cylinder */}
                    <div className="w-full xl:w-1/2 h-[45vh] xl:h-[60vh] p-1">
                        {/* Decorative Glow */}
                        <div className="absolute -inset-1 bg-gradient-to-tl from-iskf-red/20 to-transparent rounded-[2.5rem] blur-xl opacity-30 pointer-events-none"></div>

                        <div className="w-full h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative flex items-center justify-center">
                            <div className="relative z-50 w-full h-full pointer-events-auto flex items-center justify-center">
                                <OrbitalTimeline dojos={filteredDojos} />
                            </div>

                            {/* Corner Accents */}
                            <div className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-white/10 rounded-bl-2xl pointer-events-none z-0"></div>
                            <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-white/10 rounded-br-2xl pointer-events-none z-0"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* RESOURCES SECTION */}
            <ResourcesSection />

            {/* EVENTS SECTION (Roadmap) */}
            <EventsRoadmap />

            {/* CONTACT & FOOTER */}
            <footer id="contacto" className="min-h-screen py-24 border-t border-white/5 bg-black text-center relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-10">
                    <h2 className="text-4xl font-black text-white mb-8">¿Listo para comenzar?</h2>
                    <div className="flex justify-center gap-4">
                        <button className="px-8 py-3 bg-iskf-red text-white uppercase font-bold tracking-widest rounded-full hover:bg-red-700 transition">Encontrar Dojo</button>
                    </div>
                </div>
                <p className="text-gray-600 text-sm">
                    &copy; 2026 ISKF Costa Rica. Todos los derechos reservados.
                </p>
            </footer>
        </div>
    );
}

export default HomePage;
