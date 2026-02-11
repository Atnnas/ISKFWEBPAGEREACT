import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import senseiOkazaki from '../../assets/images/senseiOkazaki.jpg';

const AboutSection = () => {
    const navigate = useNavigate();

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
                    // Only update if distinct to avoid fighting with auto-play state too much, 
                    // though auto-play depends on activeIndex so it syncs up.
                    // We might need to pause auto-play on interaction but user asked for "auto pass".
                    // For now, let's keep simple sync.
                    setActiveIndex(index);
                }
            }
        }
    };

    return (
        <section id="nosotros" className="py-24 relative overflow-hidden w-full bg-iskf-dark">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 opacity-80 pointer-events-none select-none">
                <img src={senseiOkazaki} alt="Sensei Okazaki" className="w-full h-full object-cover" />
                {/* Gradient overlay to ensure text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-iskf-dark/40 to-transparent"></div>
            </div>

            <div className="relative z-10 max-w-[95%] xl:max-w-[1600px] mx-auto px-4 md:px-12">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-[0.2em] mb-4 uppercase inline-block relative text-white">
                        Sobre Nosotros
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gradient-to-r from-transparent via-iskf-red to-transparent rounded-full shadow-[0_0_25px_rgba(220,38,38,0.8)]"></span>
                    </h2>
                </div>

                <p className="text-center text-gray-300 max-w-4xl mx-auto mb-16 font-light leading-relaxed text-lg">
                    La <strong className="text-white font-medium">I.S.K.F. de Costa Rica</strong> es una organización sin fines de lucro, que está integrada por varios dojos, que tienen como fin la enseñanza del <span className="text-iskf-red font-semibold tracking-widest">SHOTOKAN KARATE DO</span>.
                </p>

                {/* Mission/Vision Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mb-24 max-w-6xl mx-auto">
                    <div className="border-l-4 border-iskf-red pl-8 py-6 bg-black/60 backdrop-blur-md rounded-r-xl shadow-lg hover:bg-black/70 transition-colors duration-300">
                        <h3 className="text-xl md:text-2xl font-black mb-4 text-white uppercase tracking-wider drop-shadow-md">Misión</h3>
                        <p className="text-gray-200 font-medium text-base leading-relaxed tracking-wide">
                            Dar a conocer el arte marcial del Karate Do como un complemento para la educación y superación personal de los individuos, mejorando así los valores éticos y morales en la sociedad.
                        </p>
                    </div>
                    <div className="border-r-4 border-iskf-red pr-8 py-6 text-right bg-black/60 backdrop-blur-md rounded-l-xl shadow-lg hover:bg-black/70 transition-colors duration-300">
                        <h3 className="text-xl md:text-2xl font-black mb-4 text-white uppercase tracking-wider drop-shadow-md">Visión</h3>
                        <p className="text-gray-200 font-medium text-base leading-relaxed tracking-wide">
                            Ser la Organización de Costa Rica con el mayor margen de trascendencia social y empresarial, comprometidos con la justa entrega de un Karate Do de alta calidad.
                        </p>
                    </div>
                </div>

                {/* Grid of Cards (Picos) - Mobile Carousel / Desktop Grid */}
                <div
                    ref={carouselRef}
                    onScroll={handleScroll}
                    className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-12 lg:gap-16 xl:gap-20 scrollbar-hide"
                >
                    {cards.map((item, index) => {
                        // Active state check for mobile (desktop always shows hover effect)
                        const isActive = index === activeIndex;

                        return (
                            <motion.div
                                key={index}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => navigate(`/about/${item.key}`)}
                                className={`relative bg-transparent rounded-2xl p-6 sm:p-8 cursor-pointer overflow-visible flex items-center justify-center min-h-[300px] sm:min-h-[320px] group transition-all duration-700 
                            md:border-transparent md:shadow-none md:hover:shadow-[0_0_30px_rgba(206,17,38,0.3)]
                            min-w-[85vw] md:min-w-0 snap-center shrink-0
                            md:scale-100 md:opacity-100 md:z-auto
                            ${isActive ? 'border border-iskf-red/60 shadow-[0_0_25px_rgba(206,17,38,0.6)] scale-100 z-10' : 'border border-white/5 shadow-none scale-90 opacity-60 z-0'}`}
                            >
                                {/* Animated Border Line (Minimalist - Desktop Only) */}
                                <div className="hidden md:block absolute top-0 left-0 w-full h-1 bg-iskf-red scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left z-20"></div>
                                <div className="hidden md:block absolute bottom-0 right-0 w-full h-1 bg-iskf-red scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-right z-20"></div>

                                {/* Mobile Border Glow - Conditional on Active */}
                                {isActive && <div className="md:hidden absolute inset-0 rounded-2xl border border-iskf-red/20 shadow-[0_0_15px_rgba(190,19,34,0.1)] animate-pulse"></div>}

                                <div className="relative z-10 text-center w-full break-normal">
                                    <h3 className="text-2xl sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black uppercase tracking-widest leading-none drop-shadow-xl text-shadow-xl w-full">
                                        <span className={`block transition-colors duration-500 whitespace-nowrap ${isActive ? 'text-white' : 'text-gray-400 md:text-white'} group-hover:text-gray-100 group-hover:scale-105`}>{item.title}</span>
                                        <span className={`block text-3xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl mt-4 transition-transform duration-500 delay-75 drop-shadow-lg whitespace-nowrap ${isActive ? 'text-iskf-red scale-110' : 'text-iskf-red/50 scale-90 md:text-iskf-red md:scale-100'} group-hover:text-iskf-red group-hover:scale-110`}>{item.subtitle}</span>
                                    </h3>
                                    {/* Decorative underline on hover */}
                                    <div className="w-12 h-1 bg-white/50 group-hover:bg-iskf-red mx-auto mt-6 rounded-full transition-colors duration-500 shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
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
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === activeIndex ? 'bg-iskf-red w-6 shadow-[0_0_10px_#ce1126]' : 'bg-white/20'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
