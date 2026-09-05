"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import KanjiHoverLink from '../ui/KanjiHoverLink';
import { navLinks } from '../../data/navigation';
import iskfFondoBlanco from '../../assets/images/iskfFondoBlanco.jpg';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();
    const location = { pathname: usePathname() };
    const { data: session } = useSession();

    if (location.pathname?.startsWith('/examinations/take')) {
        return null;
    }

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    // Smart Navigation Handler
    const handleNavClick = (e, href) => {
        e.preventDefault();
        setIsMenuOpen(false); // Always close mobile menu

        if (href.startsWith('#')) {
            const targetId = href.replace('#', '');
            if (location.pathname === '/') {
                // If already on Home, just scroll
                const element = document.getElementById(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                // If on another page, navigate to Home with target state
                router.push('/', { state: { targetId } });
            }
        } else {
            // Standard route navigation
            router.push(href);
        }
    };

    return (
        <>
        <nav id="navbar" className="fixed top-0 left-0 w-full px-6 md:px-12 py-3 md:py-4 flex justify-between items-center bg-gradient-to-b from-[#ff4d5a]/90 via-[#be1322]/95 to-[#7a000d]/95 backdrop-blur-2xl border-t-[1px] border-white/60 border-b-[3px] border-[#4a0005]/80 shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-4px_10px_rgba(0,0,0,0.2)] transition-all duration-300 z-[120]">
                <div
                    className="flex items-center gap-4 relative z-50 cursor-pointer"
                    onClick={() => router.push('/')}
                >
                    <img src={iskfFondoBlanco?.src || iskfFondoBlanco} alt="ISKF Logo" className="h-14 w-14 rounded-full border border-white/20 object-cover shadow-lg" />
                    <span className="font-bold text-2xl tracking-[0.2em] text-white">ISKF</span>
                </div>

                {/* Desktop Menu */}
                <ul className="hidden md:flex items-center gap-10">
                    {navLinks.map((link) => {
                        const isActive = link.href === '/' ? location.pathname === '/' : location.pathname.startsWith(link.href);
                        return (
                        <li key={link.name} className="relative group">
                            <KanjiHoverLink
                                href={link.href}
                                text={link.name}
                                isActive={isActive}
                                onClick={(e) => handleNavClick(e, link.href)}
                                className={`text-sm font-bold tracking-widest transition-all duration-300 uppercase relative px-6 py-3 rounded-full flex items-center justify-center ${isActive ? 'bg-iskf-blue/40 text-white shadow-[0_0_15px_rgba(45,46,131,0.6)] border border-iskf-blue/60' : 'text-white/90 hover:text-white hover:bg-iskf-blue/30'}`}
                            />
                        </li>
                    )})}
                    {/* User Profile / Login */}
                    <li className="pl-6">
                        {session ? (
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-4">
                                    <img src={session.user.image?.src || session.user.image} alt="Perfil" className="w-8 h-8 rounded-full border border-white/20" />
                                    <button onClick={() => signOut()} className="text-xs text-white/70 hover:text-white uppercase tracking-widest transition-colors">Salir</button>
                                </div>
                                {session?.user?.role === 'admin' && (
                                    <button
                                        onClick={() => router.push('/admin')}
                                        className="bg-iskf-blue text-white text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full hover:bg-[#1a1b4d] shadow-[0_0_10px_rgba(45,46,131,0.5)] transition-all duration-300 uppercase"
                                    >
                                        Panel Admin
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => signIn('google')}
                                className="bg-iskf-blue text-white text-xs font-bold tracking-widest px-5 py-2.5 rounded-full hover:bg-[#1a1b4d] shadow-[0_0_10px_rgba(45,46,131,0.5)] transition-all duration-300 uppercase"
                            >
                                Ingresar
                            </button>
                        )}
                    </li>
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
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: navLinks.length * 0.1 }}
                            className="flex flex-col items-center gap-4 mt-6"
                        >
                            {session ? (
                                <>
                                    <div className="flex items-center gap-4">
                                        <img src={session.user.image?.src || session.user.image} alt="Perfil" className="w-12 h-12 rounded-full border border-white/20" />
                                        <button onClick={() => { setIsMenuOpen(false); signOut(); }} className="text-lg text-white/70 hover:text-white uppercase tracking-widest transition-colors">Salir</button>
                                    </div>
                                    {session?.user?.role === 'admin' && (
                                        <button
                                            onClick={() => { setIsMenuOpen(false); router.push('/admin'); }}
                                            className="bg-iskf-blue text-white text-xs font-bold tracking-widest px-6 py-3 rounded-full hover:bg-[#1a1b4d] shadow-[0_0_10px_rgba(45,46,131,0.5)] transition-all duration-300 uppercase"
                                        >
                                            Panel Admin
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button
                                    onClick={() => { setIsMenuOpen(false); signIn('google'); }}
                                    className="bg-iskf-blue text-white text-sm font-bold tracking-widest px-8 py-3.5 rounded-full hover:bg-[#1a1b4d] shadow-[0_0_15px_rgba(45,46,131,0.6)] transition-all duration-300 uppercase"
                                >
                                    Ingresar
                                </button>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
