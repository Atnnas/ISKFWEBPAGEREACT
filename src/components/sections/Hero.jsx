// Force reload
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import MonolithShader from '../three/MonolithShader';
import iskfFondoRojo from '../../assets/images/iskfFondoRojo.jpg';

const Hero = () => {
    const [glitchText, setGlitchText] = useState("ISKF COSTA RICA");

    const handleGlitch = () => {
        const originalText = "ISKF COSTA RICA";
        const kanji = "国際松濤館空手道連盟";
        let iterations = 0;
        const interval = setInterval(() => {
            setGlitchText(() => originalText.split("").map((letter, index) => {
                if (index < iterations) return originalText[index];
                return kanji[Math.floor(Math.random() * kanji.length)];
            }).join(""));
            if (iterations >= originalText.length) clearInterval(interval);
            iterations += 1 / 3;
        }, 30);
    };

    useEffect(() => { setTimeout(handleGlitch, 1500); }, []);

    return (
        <section id="hero" className="relative min-h-screen flex flex-col justify-center items-center text-center overflow-hidden pt-32 pb-12 md:pt-48 md:pb-24 px-6">

            {/* Background Magic */}
            <div className="absolute inset-x-0 bottom-0 top-[5.5rem] z-0">
                <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl" style={{ backgroundImage: `url('${iskfFondoRojo}')` }}></div>
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60" style={{ backgroundImage: `linear-gradient(rgba(10,10,10,0.4), rgba(10,10,10,0.4)), url('${iskfFondoRojo}')` }}></div>
                {/* Gradient Fade to Bottom for Smooth Transition */}
                <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#0a0a0a]/60 to-transparent pointer-events-none"></div>
            </div>

            {/* The Monolith */}
            <div className="relative z-10 w-full max-w-4xl min-h-[70vh] flex flex-col items-center justify-center animate__animated animate__fadeIn">
                <div className="w-full p-8 md:p-16 rounded-[2.5rem] relative overflow-visible mt-20">

                    {/* Integrated Logo corona */}
                    {/* Integrated Logo corona */}
                    <motion.div
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 md:w-56 md:h-56 z-20"
                    >
                        {/* Glow Effect only around the box */}
                        {/* Glow Effect: Born from center, recurring explosion */}
                        <motion.div
                            animate={{
                                opacity: [0, 0.4, 0],
                                scale: [0.8, 1.4, 1.5], // Expands outwards
                            }}
                            transition={{
                                duration: 2.5,
                                ease: "easeOut",
                                repeat: Infinity,
                                repeatDelay: 0.5
                            }}
                            className="absolute inset-0 bg-iskf-red/30 blur-3xl rounded-full z-0 pointer-events-none"
                        ></motion.div>

                        <div className="w-full h-full bg-black/80 backdrop-blur-3xl rounded-3xl p-4 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group flex flex-col items-center justify-center">

                            {/* 3D SHADER COMPONENT */}
                            <MonolithShader />

                            <motion.img
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8 }}
                                src={iskfFondoRojo}
                                alt="ISKF Logo"
                                className="w-full h-full object-contain relative z-10 drop-shadow-2xl rounded-2xl"
                            />

                            {/* ELEGANT REFLECTION (SHINE) EFFECT */}
                            <motion.div
                                className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
                                initial={{ x: '-150%', opacity: 0 }}
                                animate={{ x: '150%', opacity: [0, 0.8, 0] }}
                                transition={{
                                    duration: 1.2,
                                    ease: [0.4, 0, 0.2, 1], // Elegant easing
                                    repeat: Infinity,
                                    repeatDelay: 4
                                }}
                                style={{
                                    background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.4) 55%, transparent 70%)',
                                    filter: 'blur(3px)'
                                }}
                            />
                        </div>

                        {/* Outer Glow Ring (Resplandor) */}
                        {/* Outer Glow Ring (Resplandor) */}
                        {/* Rhythmic Breathing Glow Ring (Resplandor) */}
                        <motion.div
                            animate={{
                                boxShadow: [
                                    "0 0 20px rgba(220,38,38,0.2)",
                                    "0 0 60px rgba(220,38,38,0.6)",
                                    "0 0 20px rgba(220,38,38,0.2)"
                                ],
                                borderColor: [
                                    "rgba(220,38,38,0.3)",
                                    "rgba(255,255,255,0.5)",
                                    "rgba(220,38,38,0.3)"
                                ]
                            }}
                            transition={{
                                duration: 3,
                                ease: "easeInOut",
                                repeat: Infinity,
                            }}
                            className="absolute inset-0 rounded-3xl border-2"
                        ></motion.div>

                        {/* Momentary Shine Effect (The "Gold Pulse") */}
                        <motion.div
                            animate={{
                                opacity: [0, 0, 1, 0, 0],
                                scale: [0.95, 0.95, 1.05, 1.1, 1.1],
                            }}
                            transition={{
                                duration: 4,
                                ease: "easeOut",
                                repeat: Infinity,
                                repeatDelay: 1
                            }}
                            className="absolute inset-0 rounded-3xl border border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.5)] z-30"
                        ></motion.div>
                    </motion.div>

                    <div className="mt-20 md:mt-24 space-y-8">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                            <span className="text-iskf-red font-bold tracking-[0.6em] uppercase text-sm md:text-base animate__animated animate__fadeInDown block mb-4">
                                <span className="text-white drop-shadow-md text-xl">I</span>nternational <span className="text-white drop-shadow-md text-xl">S</span>hotokan <span className="text-white drop-shadow-md text-xl">K</span>arate <span className="text-white drop-shadow-md text-xl">F</span>ederation
                            </span>
                            <h1
                                className="text-5xl md:text-7xl lg:text-8xl font-black tracking-widest text-white drop-shadow-2xl leading-tight flex items-center justify-center whitespace-nowrap cursor-pointer selection:bg-iskf-red selection:text-white py-4"
                                onMouseEnter={handleGlitch}
                            >
                                {glitchText}
                            </h1>
                        </motion.div>

                        <div className="w-32 h-1.5 bg-gradient-to-r from-transparent via-iskf-red to-transparent mx-auto rounded-full shadow-[0_0_25px_rgba(220,38,38,0.8)]"></div>

                        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 md:p-10 space-y-6 text-white font-normal leading-relaxed text-lg md:text-xl tracking-wide max-w-3xl mx-auto animate__animated animate__fadeInUp animate__delay-1s border border-white/10 shadow-2xl">
                            <p className="drop-shadow-md">
                                La <strong className="text-iskf-red font-bold italic">International Shotokan Karate Federation</strong> de Costa Rica les extiende el honor de su visita. Representamos la esencia del Karate-Do tradicional como integrantes de la ISKF, organización mundial fundada por el Maestro <span className="text-iskf-red font-bold">Teruyuki Okazaki</span>.
                            </p>
                            <p className="text-base md:text-lg text-gray-200 italic font-light border-l-4 border-iskf-red pl-6 py-1">
                                &quot;Forjando el carácter a través del camino de la mano vacía bajo los principios del Dojo Kun.&quot;
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
