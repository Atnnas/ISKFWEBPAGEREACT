import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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

    return (
        <section id="nosotros" className="py-24 relative overflow-hidden w-full bg-iskf-dark">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 opacity-25 pointer-events-none select-none grayscale mix-blend-luminosity">
                <img src={`${import.meta.env.BASE_URL}senseiOkazaki.jpg`} alt="Sensei Okazaki" className="w-full h-full object-cover" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-[0.2em] mb-4 uppercase inline-block relative text-white">
                        Sobre Nosotros
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gradient-to-r from-transparent via-iskf-red to-transparent rounded-full shadow-[0_0_25px_rgba(220,38,38,0.8)]"></span>
                    </h2>
                </div>

                <p className="text-center text-gray-300 max-w-4xl mx-auto mb-16 font-light leading-relaxed text-lg">
                    La <strong className="text-white font-medium">I.S.K.F. de Costa Rica</strong> es una organización sin fines de lucro, que está integrada por varios dojos, que tienen como fin la enseñanza <span className="text-iskf-red font-semibold tracking-widest">SHOTOKAN KARATE DO</span>.
                </p>

                {/* Mission/Vision Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <div className="border-l-4 border-iskf-red pl-8 py-4 bg-black/20 backdrop-blur-sm rounded-r-xl">
                        <h3 className="text-xl font-bold mb-4 text-white uppercase tracking-wider">Misión</h3>
                        <p className="text-gray-400 font-light text-sm leading-relaxed">
                            Dar a conocer el arte marcial del Karate Do como un complemento para la educación y superación personal de los individuos, mejorando así los valores éticos y morales en la sociedad.
                        </p>
                    </div>
                    <div className="border-r-4 border-iskf-red pr-8 py-4 text-right bg-black/20 backdrop-blur-sm rounded-l-xl">
                        <h3 className="text-xl font-bold mb-4 text-white uppercase tracking-wider">Visión</h3>
                        <p className="text-gray-400 font-light text-sm leading-relaxed">
                            Ser la Organización de Costa Rica con el mayor margen de trascendencia social y empresarial, comprometidos con la justa entrega de un Karate Do de alta calidad.
                        </p>
                    </div>
                </div>

                {/* Grid of Cards (Picos) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                    {cards.map((item, index) => (
                        <motion.div
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => navigate(`/about/${item.key}`)}
                            className="relative bg-white/5 border border-white/5 rounded-2xl p-10 hover:bg-black/60 transition-all duration-500 cursor-pointer overflow-hidden flex items-center justify-center min-h-[200px] group"
                        >
                            <div className="relative z-10 text-center">
                                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-widest leading-none">
                                    <span className="block text-white group-hover:scale-105 transition-transform duration-500">{item.title}</span>
                                    <span className="block text-iskf-red text-2xl md:text-3xl mt-2 group-hover:scale-110 transition-transform duration-500 delay-75 drop-shadow-md">{item.subtitle}</span>
                                </h3>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
