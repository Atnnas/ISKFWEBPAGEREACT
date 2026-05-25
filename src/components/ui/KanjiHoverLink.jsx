"use client";
import React, { useState, useRef } from 'react';

const KanjiHoverLink = ({ text, href, onClick, className, isActive }) => {
    const [displayText, setDisplayText] = useState(text);
    const intervalRef = useRef(null);

    // Kanjis related to Karate/Martial Arts for the effect
    const kanjis = "空手道心技体礼誠実努力忍耐調和";

    const handleMouseEnter = () => {
        let iterations = 0;
        clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setDisplayText(() =>
                text.split("").map((letter, index) => {
                    if (index < iterations) {
                        return text[index];
                    }
                    return kanjis[Math.floor(Math.random() * kanjis.length)];
                }).join("")
            );

            if (iterations >= text.length) {
                clearInterval(intervalRef.current);
            }

            iterations += 1 / 3; // Speed of decoding (Lower = Slower)
        }, 50);
    };

    const handleMouseLeave = () => {
        clearInterval(intervalRef.current);
        setDisplayText(text); // Reset immediately on leave
    };

    return (
        <a
            href={href}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={className}
        >
            {displayText}
            {/* Underline effect only on hover if not active */}
            {!isActive && <span className="absolute -bottom-1 left-2 right-2 h-[2px] bg-white/70 transition-all duration-300 scale-x-0 group-hover:scale-x-100"></span>}
        </a>
    );
};

export default KanjiHoverLink;
