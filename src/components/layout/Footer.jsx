"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Footer = () => {
    const pathname = usePathname();
    if (pathname?.startsWith('/examinations/take') || pathname?.startsWith('/admin')) {
        return null;
    }
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full relative z-50 bg-gradient-to-b from-[#ff4d5a]/90 via-[#be1322]/95 to-[#7a000d]/95 backdrop-blur-2xl border-t-[1px] border-white/60 border-b-[3px] border-[#4a0005]/80 shadow-[0_-10px_20px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-4px_10px_rgba(0,0,0,0.2)] text-white py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs md:text-sm font-bold tracking-widest uppercase drop-shadow-md">
                <div className="flex items-center text-center md:text-left">
                    <p>&copy; {currentYear} ISKF Costa Rica. Todos los derechos reservados.</p>
                </div>
                
                <div className="flex items-center gap-6">
                    <Link href="/privacidad" className="hover:text-iskf-blue transition-colors duration-300">
                        Privacidad
                    </Link>
                    <Link href="/terminos" className="hover:text-iskf-blue transition-colors duration-300">
                        Términos
                    </Link>
                </div>

                <div className="flex items-center text-center md:text-right text-white/80 mt-4 md:mt-0">
                    <p>Dev by <span className="font-bold text-white tracking-widest uppercase">Kumadev.inc</span></p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
