import React, { useState, useRef } from 'react';

const KanjiHoverLink = ({ text, href, onClick, className }) => {
    const [displayText, setDisplayText] = useState(text);
    const intervalRef = useRef(null);

    // Kanjis related to Karate/Martial Arts for the effect
    const kanjis = "空手道心技体礼誠実努力忍耐調和";

    const handleMouseEnter = () => {
        let iterations = 0;
        clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setDisplayText(prev =>
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
            {/* Underline effect (preserved from original CSS) */}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-iskf-red transition-all duration-300 group-hover:w-full"></span>
        </a>
    );
};

export default KanjiHoverLink;
