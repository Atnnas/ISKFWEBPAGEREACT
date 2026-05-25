"use client";
// Force reload
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Image from 'next/image';


import elementoGrafico4 from '../../assets/images/elemento_grafico_4.png';
import fondoInicioNuevo from '../../assets/images/Fondo-inicio-nuevo.jpg';

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
        <section id="hero" className="relative h-screen max-h-screen flex flex-col justify-center items-center text-center overflow-hidden pt-[5rem] md:pt-[6rem] pb-2 px-6">

            {/* Background Magic */}
            <div className="absolute inset-x-0 bottom-0 top-0 z-0 bg-white">
                {/* Fondo-inicio-nuevo.jpg centered and stretched */}
                <Image 
                    src={fondoInicioNuevo}
                    alt="ISKF Background"
                    priority
                    quality={80}
                    placeholder="blur"
                    className="absolute inset-0 object-cover object-center w-full h-full opacity-[0.25] pointer-events-none" 
                />
            </div>

            {/* The Monolith */}
            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center justify-center animate__animated animate__fadeIn">
                <div className="w-full px-2 md:px-4 relative overflow-visible">



                    <div className="space-y-4 md:space-y-5">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 md:space-y-4">
                            <span className="text-iskf-red font-bold tracking-[0.4em] md:tracking-[0.5em] uppercase text-xs md:text-sm block mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                                <span className="text-[#2D2E83] text-lg md:text-xl font-black">I</span>nternational <span className="text-[#2D2E83] text-lg md:text-xl font-black">S</span>hotokan <span className="text-[#2D2E83] text-lg md:text-xl font-black">K</span>arate <span className="text-[#2D2E83] text-lg md:text-xl font-black">F</span>ederation
                            </span>
                            <h1
                                className="w-full text-[clamp(2rem,1.5rem+3.5vw,5rem)] font-black tracking-widest text-[#2D2E83] leading-[1.1] md:leading-tight text-center md:flex md:items-center md:justify-center md:whitespace-nowrap cursor-pointer py-2 px-2 drop-shadow-[0_4px_8px_rgba(45,46,131,0.15)]"
                                onMouseEnter={handleGlitch}
                                onMouseLeave={() => setGlitchText("ISKF COSTA RICA")}
                            >
                                <span className="text-iskf-red drop-shadow-[0_2px_4px_rgba(190,22,34,0.15)]">{glitchText.split(" ")[0]}</span>
                                <span className="hidden md:inline">&nbsp;</span>
                                <span className="block md:inline">{glitchText.split(" ").slice(1).join(" ")}</span>
                            </h1>
                        </motion.div>


                        <div className="max-w-3xl mx-auto space-y-4 animate__animated animate__fadeInUp animate__delay-1s">
                            <p 
                                className="text-xl md:text-2xl text-iskf-dark/90 font-medium leading-relaxed font-serif italic drop-shadow-sm text-center text-[#2D2E83]"
                            >
                                La <strong className="text-[#BE1622] font-black italic">International Shotokan Karate Federation</strong> de Costa Rica les extiende el honor de su visita. Representamos la esencia del Karate-Do tradicional como integrantes de la ISKF, organización mundial fundada por el Maestro <span className="text-[#BE1622] font-black">Teruyuki Okazaki</span>.
                            </p>
                            <p 
                                className="text-xl italic font-bold border-l-4 border-[#BE1622] pl-6 py-1 text-left text-[#2D2E83]"
                            >
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
