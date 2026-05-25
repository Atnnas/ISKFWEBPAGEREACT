"use client";
import React from 'react';
import { motion } from 'framer-motion';

const SocialSidebar = () => {
    // Container: Staggers entrance of children
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 1.5
            }
        }
    };

    // Item Entrance: Simple slide in
    const itemVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { type: "spring", stiffness: 100, damping: 20 }
        }
    };

    const socialLinks = [
        {
            label: "Facebook",
            href: "https://www.facebook.com/IskfCostaRica",
            color: "group-hover:text-[#1877F2]", // Facebook Blue
            path: "M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"
        },
        {
            label: "Instagram",
            href: "https://www.instagram.com/iskf_costarica/",
            color: "group-hover:text-[#E4405F]", // Insta Pink
            path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
        }
    ];

    return (
        <motion.div
            className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 flex-col gap-4 z-[110] pointer-events-none items-end"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {socialLinks.map((link, index) => (
                <motion.a
                    key={index}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={itemVariants}
                    initial="initial"
                    whileHover="hover"
                    animate="initial"
                    aria-label={link.label}
                    className="group relative flex items-center justify-end p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full cursor-pointer pointer-events-auto overflow-hidden shadow-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-colors duration-300"
                    style={{ height: '48px' }} // Fixed height for consistency
                >
                    {/* Background Smooth Darken on Hover */}
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>

                    {/* Text Label - Revealed smoothly */}
                    <motion.span
                        variants={{
                            initial: { width: 0, opacity: 0, paddingRight: 0 },
                            hover: {
                                width: 'auto',
                                opacity: 1,
                                paddingRight: 10,
                                transition: { type: "spring", stiffness: 300, damping: 30 }
                            }
                        }}
                        className="text-white text-sm font-bold tracking-widest uppercase whitespace-nowrap overflow-hidden z-10"
                    >
                        {link.label}
                    </motion.span>

                    {/* Icon - Stays stationary relative to container but looks good */}
                    <div className={`relative z-10 w-6 h-6 flex items-center justify-center text-white ${link.color} transition-colors duration-300`}>
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d={link.path} />
                        </svg>
                    </div>
                </motion.a>
            ))}
        </motion.div>
    );
};

export default SocialSidebar;
