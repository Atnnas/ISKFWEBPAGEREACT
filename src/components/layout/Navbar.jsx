import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom'; // Import hooks
import KanjiHoverLink from '../ui/KanjiHoverLink';
import { navLinks } from '../../data/navigation';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();



    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);



    // Smart Navigation Handler
    const handleNavClick = (e, href) => {
        e.preventDefault();
        const targetId = href.replace('#', '');

        setIsMenuOpen(false); // Always close mobile menu

        if (location.pathname === '/') {
            // If already on Home, just scroll
            const element = document.getElementById(targetId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            // If on another page, navigate to Home with target state
            navigate('/', { state: { targetId } });
        }
    };

    return (
        <>
            <nav id="navbar" className="fixed top-0 w-full px-8 py-4 flex justify-between items-center z-[120] bg-iskf-dark/90 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300">
                <div
                    className="flex items-center gap-4 relative z-50 cursor-pointer"
                    onClick={() => navigate('/')}
                >
                    <img src={`${import.meta.env.BASE_URL}iskfFondoBlanco.jpg`} alt="ISKF Logo" className="h-14 w-14 rounded-full border border-white/20 object-cover shadow-lg" />
                    <span className="font-bold text-2xl tracking-[0.2em] text-white">ISKF</span>
                </div>

                {/* Desktop Menu */}
                <ul className="hidden md:flex items-center gap-10">
                    {navLinks.map((link) => (
                        <li key={link.name} className="relative group">
                            <KanjiHoverLink
                                href={link.href}
                                text={link.name}
                                onClick={(e) => handleNavClick(e, link.href)}
                                className="text-sm font-medium tracking-widest text-white hover:text-iskf-red transition-colors duration-300 uppercase relative"
                            />
                        </li>
                    ))}
                </ul>

                {/* Mobile Button */}
                <button
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                    className={`md:hidden group flex flex-col gap-1.5 cursor-pointer z-50 p-2 focus:outline-none transition-all duration-500 ${isMenuOpen ? 'rotate-180' : ''}`}
                >
                    <span className={`w-8 h-0.5 transition-all duration-500 origin-center rounded-full ${isMenuOpen ? 'bg-iskf-red rotate-45 translate-y-2 shadow-[0_0_15px_#ce1126]' : 'bg-white shadow-[0_0_5px_rgba(255,255,255,0.5)]'}`}></span>
                    <span className={`w-8 h-0.5 transition-all duration-500 origin-center rounded-full ${isMenuOpen ? 'bg-iskf-red opacity-0 scale-0' : 'bg-white shadow-[0_0_5px_rgba(255,255,255,0.5)]'}`}></span>
                    <span className={`w-8 h-0.5 transition-all duration-500 origin-center rounded-full ${isMenuOpen ? 'bg-iskf-red -rotate-45 -translate-y-2 shadow-[0_0_15px_#ce1126]' : 'bg-white shadow-[0_0_5px_rgba(255,255,255,0.5)]'}`}></span>
                </button>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-iskf-dark/95 backdrop-blur-2xl z-40 flex flex-col items-center justify-center gap-10"
                    >
                        {navLinks.map((link, index) => (
                            <motion.a
                                key={link.name}
                                href={link.href}
                                onClick={(e) => handleNavClick(e, link.href)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="text-3xl font-light tracking-[0.2em] uppercase text-white hover:text-iskf-red transition-colors"
                            >
                                {link.name}
                            </motion.a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
