"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import fondoInicioNuevo from '../../assets/images/Fondo-inicio-nuevo.jpg';
import elementoGrafico4 from '../../assets/images/elemento_grafico_4.png';

const AboutSection = () => {
    const router = useRouter();

    const cards = [
        { title: "Identidad", subtitle: "ISKF-CR", key: "identidad" },
        { title: "Estructura", subtitle: "Administrativa", key: "estructura" },
        { title: "Pilares", subtitle: "Del Karate Do", key: "pilares" },
        { title: "Dojo", subtitle: "Kun", key: "dojoKun" },
        { title: "Niju", subtitle: "Kun", key: "nijuKun" },
        { title: "Documentos", subtitle: "Oficiales", key: "identidad" } // Maps to Identidad as it contains documents
    ];

    const [activeIndex, setActiveIndex] = React.useState(0);
    const carouselRef = React.useRef(null);

    React.useEffect(() => {
        const interval = setInterval(() => {
            if (carouselRef.current) {
                const newIndex = (activeIndex + 1) % cards.length;
                setActiveIndex(newIndex);

                // Calculate scroll position based on card width (85vw) + gap (1rem/16px)
                // Appx width logic or simple child query
                const card = carouselRef.current.children[0];
                if (card) {
                    const scrollAmount = card.offsetWidth + 16; // 16px is gap-4
                    carouselRef.current.scrollTo({
                        left: newIndex * scrollAmount,
                        behavior: 'smooth'
                    });
                }
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [activeIndex, cards.length]);

    // Update active index on manual scroll
    const handleScroll = () => {
        if (carouselRef.current) {
            const scrollLeft = carouselRef.current.scrollLeft;
            const card = carouselRef.current.children[0];
            if (card) {
                const cardWidth = card.offsetWidth + 16;
                const index = Math.round(scrollLeft / cardWidth);
                if (index !== activeIndex) {
                    setActiveIndex(index);
                }
            }
        }
    };

    return (
        <section id="nosotros" className="pt-36 pb-24 md:pt-40 md:pb-32 relative w-full overflow-visible">
            {/* Background Image (Fixed, matching Home standard size) */}
            <div className="fixed inset-0 z-0 bg-white pointer-events-none select-none">
                <img src={fondoInicioNuevo?.src || fondoInicioNuevo} alt="ISKF Background" className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.25]" />
            </div>

            <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 md:px-8 lg:px-16 xl:px-24">
                {/* Modern Header Section */}
                <div className="text-center mb-16 relative">
                    <h2 className="text-3xl md:text-5xl font-black tracking-[0.2em] mb-4 uppercase inline-block relative text-[#2D2E83]">
                        Sobre Nosotros
                    </h2>
                </div>

                <p className="text-center text-gray-700 max-w-5xl mx-auto mb-16 font-normal leading-relaxed text-lg md:text-xl drop-shadow-sm">
                    La <strong className="text-black font-bold">I.S.K.F. de Costa Rica</strong> es una organización sin fines de lucro, que está integrada por varios dojos, que tienen como fin la enseñanza del <span className="text-iskf-red font-bold tracking-widest">SHOTOKAN KARATE DO</span>.
                </p>

                {/* Mission/Vision Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 xl:gap-24 mb-24 w-full mx-auto">
                    <div className="group relative z-20 flex flex-col h-full">
                        <div className="absolute inset-0 overflow-hidden rounded-3xl"><div className="absolute -inset-4 bg-gradient-to-r from-iskf-dark/20 to-iskf-red/30 blur-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div></div>
                        <div className="relative bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-8 hover:bg-white/60 hover:-translate-y-2 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.1)] h-full flex flex-col justify-center text-center">
                            <h3 className="text-xl md:text-2xl font-black mb-4 text-[#2D2E83] uppercase tracking-wider drop-shadow-sm">Misión</h3>
                            <p className="text-gray-700 font-medium text-base md:text-lg leading-relaxed tracking-wide">
                                Dar a conocer el arte marcial del Karate Do como un complemento para la educación y superación personal de los individuos, mejorando así los valores éticos y morales en la sociedad.
                            </p>
                        </div>
                    </div>
                    <div className="group relative z-20 flex flex-col h-full">
                        <div className="absolute inset-0 overflow-hidden rounded-3xl"><div className="absolute -inset-4 bg-gradient-to-r from-iskf-dark/20 to-iskf-red/30 blur-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div></div>
                        <div className="relative bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-8 hover:bg-white/60 hover:-translate-y-2 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.1)] h-full flex flex-col justify-center text-center">
                            <h3 className="text-xl md:text-2xl font-black mb-4 text-[#2D2E83] uppercase tracking-wider drop-shadow-sm">Visión</h3>
                            <p className="text-gray-700 font-medium text-base md:text-lg leading-relaxed tracking-wide">
                                Ser la Organización de Costa Rica con el mayor margen de trascendencia social y empresarial, comprometidos con la justa entrega de un Karate Do de alta calidad.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Grid of Cards (Picos) - Mobile Carousel / Desktop Grid */}
                <div
                    ref={carouselRef}
                    onScroll={handleScroll}
                    className="flex overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-4 pb-8 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-12 lg:gap-16 xl:gap-20 scrollbar-hide"
                >
                    {cards.map((item, index) => {
                        // Active state check for mobile (desktop always shows hover effect)
                        const isActive = index === activeIndex;

                        return (
                            <motion.div
                                key={index}
                                whileHover={{ y: -8 }}
                                onClick={() => router.push(`/nosotros/${item.key}`)}
                                className={`relative group transition-all duration-700 cursor-pointer min-w-[85vw] md:min-w-0 snap-center shrink-0 ${isActive ? 'scale-100 z-10' : 'scale-90 opacity-80 z-0 md:scale-100 md:opacity-100'}`}
                            >
                                <div className="absolute inset-0 overflow-hidden rounded-3xl"><div className="absolute -inset-4 bg-gradient-to-r from-iskf-dark/20 to-iskf-red/30 blur-2xl opacity-50 group-hover:opacity-100 transition duration-500"></div></div>
                                <div className={`relative bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[320px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:bg-white/60 transition-all duration-500 h-full ${isActive ? 'ring-2 ring-iskf-red/40 shadow-[0_12px_40px_rgba(206,17,38,0.2)]' : ''}`}>
                                    {/* Animated Border Line (Arrows - Desktop Only) */}
                                    <div className="hidden md:block absolute top-0 left-0 h-4 bg-[url('/images/borde-superior-nuevo.png')] bg-[length:auto_100%] bg-repeat-x w-0 group-hover:w-full transition-all duration-700 ease-out z-20 rounded-t-3xl"></div>
                                    <div className="hidden md:block absolute bottom-0 right-0 h-4 bg-[url('/images/borde-inferior-nuevo.png')] bg-[length:auto_100%] bg-repeat-x w-0 group-hover:w-full transition-all duration-700 ease-out z-20 rounded-b-3xl"></div>

                                    {/* Mobile Border Glow - Conditional on Active */}
                                    {isActive && <div className="md:hidden absolute inset-0 rounded-3xl border border-iskf-red/20 shadow-[0_0_15px_rgba(190,19,34,0.1)] animate-pulse"></div>}

                                    <div className="relative z-10 text-center w-full break-normal">
                                        <h3 className="text-xl sm:text-xl md:text-lg lg:text-xl xl:text-3xl font-black uppercase tracking-widest leading-none drop-shadow-sm text-shadow-sm w-full break-words">
                                            <span className={`block transition-colors duration-500 whitespace-normal xl:whitespace-nowrap ${isActive ? 'text-[#2D2E83]' : 'text-gray-500 md:text-[#2D2E83]'} group-hover:text-black group-hover:scale-105`}>{item.title}</span>
                                            <span className={`block text-2xl sm:text-2xl md:text-xl lg:text-2xl xl:text-4xl mt-4 transition-transform duration-500 delay-75 drop-shadow-sm whitespace-normal xl:whitespace-nowrap ${isActive ? 'text-iskf-red scale-110' : 'text-iskf-red/70 scale-90 md:text-iskf-red md:scale-100'} group-hover:text-iskf-red group-hover:scale-110`}>{item.subtitle}</span>
                                        </h3>
                                        {/* Decorative underline on hover */}
                                        <div className="w-12 h-1 bg-black/10 group-hover:bg-iskf-red mx-auto mt-6 rounded-full transition-colors duration-500 shadow-[0_2px_5px_rgba(0,0,0,0.1)]"></div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Mobile Pagination Dots */}
                <div className="flex justify-center gap-2 mt-4 md:hidden">
                    {cards.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === activeIndex ? 'bg-iskf-red w-6 shadow-[0_2px_5px_rgba(206,17,38,0.5)]' : 'bg-black/20'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
