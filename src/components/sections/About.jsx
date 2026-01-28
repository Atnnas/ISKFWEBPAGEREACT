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

    return (
        <section id="nosotros" className="py-24 relative overflow-hidden w-full bg-iskf-dark">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 opacity-80 pointer-events-none select-none">
                <img src={senseiOkazaki} alt="Sensei Okazaki" className="w-full h-full object-cover" />
                {/* Gradient overlay to ensure text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-iskf-dark/40 to-transparent"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
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
                            className="relative bg-transparent hover:bg-white/5 hover:backdrop-blur-md rounded-none p-10 cursor-pointer overflow-visible flex items-center justify-center min-h-[250px] group transition-all duration-700 hover:shadow-[0_0_30px_rgba(206,17,38,0.3)] border-transparent"
                        >
                            {/* Animated Border Line (Minimalist) */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-iskf-red scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left z-20"></div>
                            <div className="absolute bottom-0 right-0 w-full h-1 bg-iskf-red scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-right z-20"></div>

                            <div className="relative z-10 text-center w-full break-words">
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-widest leading-none drop-shadow-xl text-shadow-xl break-words whitespace-normal">
                                    <span className="block text-white group-hover:text-gray-100 group-hover:scale-105 transition-transform duration-500">{item.title}</span>
                                    <span className="block text-iskf-red text-2xl sm:text-3xl md:text-4xl mt-3 group-hover:text-iskf-red group-hover:scale-110 transition-transform duration-500 delay-75 drop-shadow-lg">{item.subtitle}</span>
                                </h3>
                                {/* Decorative underline on hover */}
                                <div className="w-12 h-1 bg-white/50 group-hover:bg-iskf-red mx-auto mt-6 rounded-full transition-colors duration-500 shadow-[0_0_10px_rgba(255,255,255,0.3)]"></div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AboutSection;
