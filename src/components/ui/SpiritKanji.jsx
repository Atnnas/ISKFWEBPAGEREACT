import React from 'react';
import { motion } from 'framer-motion';

const SpiritKanji = ({ kanji, delay = 0 }) => {
    return (
        <div className="relative flex flex-col items-center justify-center mb-6">
            <motion.div
                className="relative text-[120px] leading-none font-black select-none z-10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay, ease: "easeOut" }}
            >
                {/* Main Kanji - Solid White */}
                <motion.span
                    className="relative block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-400 drop-shadow-2xl z-20"
                    whileHover={{ scale: 1.1, textShadow: "0 0 40px rgba(220,38,38,0.8)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                    {kanji}
                </motion.span>

                {/* Ghost Kanji - Echo Effect */}
                <motion.span
                    className="absolute inset-0 text-iskf-red blur-sm z-10 opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                    animate={{
                        scale: [1, 1.1, 1],
                        filter: ["blur(4px)", "blur(8px)", "blur(4px)"],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    {kanji}
                </motion.span>

                {/* Spirit Mist / Aura underneath */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-iskf-red/20 blur-[50px] rounded-full group-hover:bg-iskf-red/40 group-hover:blur-[60px] transition-all duration-700 pointer-events-none"></div>
            </motion.div>

            {/* Animated Underline/Separator */}
            <motion.div
                className="w-0 h-[2px] bg-gradient-to-r from-transparent via-iskf-red to-transparent mt-4 opacity-50 group-hover:w-full group-hover:opacity-100 transition-all duration-700"
            ></motion.div>
        </div>
    );
};

export default SpiritKanji;
