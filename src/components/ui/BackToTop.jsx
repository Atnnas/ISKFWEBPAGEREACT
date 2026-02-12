import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

const BackToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    // Show button when page is scrolled up to given distance
    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    // Set the top cordinate to 0
    // make scrolling smooth
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5, x: 50 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.5, x: 50 }}
                    className="fixed bottom-8 right-8 z-[999] flex items-center gap-4 group"
                >
                    {/* Tooltip label */}
                    <span className="hidden md:block opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/80 backdrop-blur-md border border-iskf-red/50 text-iskf-red text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-lg whitespace-nowrap shadow-neon pointer-events-none">
                        Volver al inicio
                    </span>

                    <div className="relative cursor-pointer" onClick={scrollToTop}>
                        {/* Intensive Neon Glow Effect */}
                        <div className="absolute -inset-2 bg-iskf-red rounded-full blur-md opacity-40 group-hover:opacity-100 group-hover:scale-110 transition duration-500 animate-pulse"></div>

                        {/* Main Button (Larger) */}
                        <button className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-black via-zinc-900 to-black border-2 border-iskf-red text-white rounded-full hover:shadow-[0_0_20px_rgba(190,19,34,0.6)] transition-all duration-300">
                            <ArrowUp size={32} className="group-hover:-translate-y-1 transition-transform duration-300" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BackToTop;
