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
import fondoDojos from '../../assets/images/fondoDojos.jpg';
import fondoListoParaComenzar from '../../assets/images/fondoListoParaComenzar.jpg';

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
                    <img src={fondoDojos} alt="Background Dojos" className="w-full h-full object-cover opacity-80" />
                    {/* Light gradient for readability without obscuring the image */}
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/40 via-transparent to-zinc-900/40"></div>
                    <div className="absolute inset-0 bg-black/10"></div>
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
                        {/* UX HELPER: Map Instructions (External) */}
                        {/* HUD Header: Map */}
                        <div className="absolute -top-12 left-0 w-full z-20 flex flex-col items-center justify-center pointer-events-none">
                            <h3 className="text-white/90 font-black tracking-[0.3em] uppercase text-xl md:text-2xl drop-shadow-lg flex items-center gap-3">
                                <svg className="w-5 h-5 text-iskf-red animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                MAPA INTERACTIVO
                            </h3>
                            <div className="flex items-center gap-3 mt-1 opacity-70">
                                <span className="w-8 h-[1px] bg-iskf-red"></span>
                                <span className="text-[10px] md:text-xs text-gray-300 font-bold tracking-[0.2em] uppercase">Selecciona una Provincia</span>
                                <span className="w-8 h-[1px] bg-iskf-red"></span>
                            </div>
                        </div>



                        <div className="w-full h-full bg-transparent overflow-hidden relative group">

                            <div className="relative z-50 w-full h-full pointer-events-auto">
                                <InteractiveMap activeProvinceId={activeProvince} onProvinceClick={setActiveProvince} />
                            </div>
                        </div>
                    </div>

                    {/* Timeline Column - Holographic Cylinder */}
                    <div className="w-full xl:w-1/2 h-[45vh] xl:h-[60vh] relative p-1">
                        {/* UX HELPER: Timeline Instructions (External) */}
                        {/* HUD Header: Timeline */}
                        <div className="absolute -top-12 left-0 w-full z-20 flex flex-col items-center justify-center pointer-events-none">
                            <h3 className="text-white/90 font-black tracking-[0.3em] uppercase text-xl md:text-2xl drop-shadow-lg flex items-center gap-3">
                                <svg className="w-5 h-5 text-blue-400 animate-[spin_4s_linear_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                RED DE DOJOS
                            </h3>
                            <div className="flex items-center gap-3 mt-1 opacity-70">
                                <span className="w-8 h-[1px] bg-blue-400"></span>
                                <span className="text-[10px] md:text-xs text-gray-300 font-bold tracking-[0.2em] uppercase">Da click en los logos, para más información</span>
                                <span className="w-8 h-[1px] bg-blue-400"></span>
                            </div>
                        </div>



                        <div className="w-full h-full bg-transparent overflow-hidden md:overflow-visible relative flex items-center justify-center">

                            <div className="relative z-50 w-full h-full pointer-events-auto flex items-center justify-center">
                                <OrbitalTimeline dojos={filteredDojos} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* RESOURCES SECTION */}
            <ResourcesSection />

            {/* EVENTS SECTION (Roadmap) */}
            <EventsRoadmap />

            {/* CONTACT & FOOTER */}
            <footer id="contacto" className="min-h-screen py-24 border-t border-white/5 bg-black text-center relative z-10 overflow-hidden flex flex-col items-center justify-center">
                {/* Background Image */}
                <div className="absolute inset-0 z-0 pointer-events-none select-none">
                    <img src={fondoListoParaComenzar} alt="Background Contacto" className="w-full h-full object-cover opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60"></div>
                </div>

                <div className="max-w-4xl mx-auto text-center mb-10 relative z-10">
                    <h2 className="text-5xl md:text-6xl font-black text-white mb-8 tracking-tighter uppercase drop-shadow-2xl">¿Listo para comenzar?</h2>
                    <div className="flex justify-center gap-4 relative group">
                        {/* Radiant Background Pulse */}
                        <div className="absolute inset-0 bg-green-500/30 blur-3xl rounded-full opacity-20 group-hover:opacity-60 transition-opacity duration-700 animate-pulse"></div>

                        <a
                            href="https://wa.me/50683950741?text=Hola%20Sensei,%20quiero%20formar%20parte%20de%20la%20ISKF%20y%20conocer%20el%20camino%20del%20Karate%20Do.%20%C2%BFC%C3%B3mo%20puedo%20afiliarme%3F"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative px-14 py-6 bg-[#25D366] text-white rounded-full hover:bg-[#128C7E] transition-all shadow-[0_0_40px_rgba(37,211,102,0.5)] hover:shadow-[0_0_80px_rgba(37,211,102,0.8)] hover:scale-105 duration-300 flex items-center gap-5 overflow-hidden group-hover:tracking-widest"
                        >
                            {/* Glossy Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>

                            <svg className="w-10 h-10 fill-current relative z-10 drop-shadow-lg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            <div className="flex flex-col items-start relative z-10">
                                <span className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase drop-shadow-md leading-none">¡AFÍLIATE A LA ISKF!</span>
                                <span className="text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase opacity-90">Forma parte del legado</span>
                            </div>
                        </a>
                    </div>
                </div>
                {/* Bottom Bar Footer */}
                <div className="absolute bottom-0 w-full bg-black/60 backdrop-blur-md border-t border-white/5 py-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4 z-20">
                    <p className="text-gray-400 text-[10px] font-bold tracking-[0.2em] uppercase">
                        &copy; {new Date().getFullYear()} ISKF Costa Rica
                    </p>

                    <a href="https://kumadev.in" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity duration-300">
                        <span className="text-[9px] text-gray-500 font-light tracking-[0.2em] uppercase">Architected by</span>
                        <span
                            className="text-[11px] font-black tracking-[0.25em] uppercase transition-all duration-500"
                            style={{
                                color: '#4B3621', // Deep Coffee
                                WebkitTextStroke: '0.5px rgba(255,255,255,0.8)', // White Outline
                                textShadow: '0 0 10px rgba(206,17,38,0.5), 0 0 20px rgba(75,54,33,0.3)' // Radiant Red & Coffee Glow
                            }}
                        >
                            KumaDev.in
                        </span>
                    </a>
                </div>
            </footer>
        </div>
    );
}

export default HomePage;
