"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Calendar, 
  Award, 
  Globe, 
  FileText, 
  Construction, 
  ExternalLink, 
  Menu, 
  X, 
  ChevronDown, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import fondoInicioNuevo from '../../assets/images/Fondo-inicio-nuevo.jpg';

export default function AdminLayoutShell({ children, user }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExaminationsOpen, setIsExaminationsOpen] = useState(true);

  const isActive = (path, exact = false) => {
    if (exact) return pathname === path;
    return pathname === path || (path !== '/admin' && pathname?.startsWith(path));
  };

  const navLinks = [
    { 
      label: 'Dashboard', 
      href: '/admin', 
      icon: LayoutDashboard, 
      exact: true 
    },
    { 
      label: 'Usuarios', 
      href: '/admin/users', 
      icon: Users 
    },
    { 
      label: 'Dojos', 
      href: '/admin/dojos', 
      icon: MapPin 
    },
    { 
      label: 'Calendario', 
      href: '/admin/events', 
      icon: Calendar 
    },
    { 
      label: 'Examinaciones', 
      href: '/admin/examinations', 
      icon: Award,
      hasSubmenu: true,
      subLinks: [
        { label: 'Convocatorias', href: '/admin/examinations', exact: true },
        { label: 'Exámenes Escritos', href: '/admin/examinations/written' },
        { label: 'Exámenes Técnicos', href: '/admin/examinations/technical' },
      ]
    },
    { 
      label: 'Organizaciones', 
      href: '/admin/entities', 
      icon: Globe 
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col font-sans text-gray-900 bg-white">
      {/* Fondo Oficial de la Web ISKF (Fijo con textura sutil) */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none bg-white">
        <Image
          src={fondoInicioNuevo}
          alt="Background ISKF"
          placeholder="blur"
          quality={80}
          priority
          className="absolute inset-0 object-cover object-center w-full h-full opacity-[0.20]"
        />
      </div>

      {/* ========================================================================= */}
      {/* BARRA SUPERIOR PARA CELULARES (MOBILE HEADER) */}
      {/* ========================================================================= */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200/90 px-4 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#2D2E83]/10 border border-[#2D2E83]/20 flex items-center justify-center shrink-0 p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/images/dojos/escudo.jpg" 
              alt="Escudo ISKF" 
              className="w-full h-full object-contain rounded-lg" 
            />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#BE1622] block font-mono">
              ISKF Costa Rica
            </span>
            <span className="text-base font-black text-[#2D2E83] tracking-tight block leading-tight">
              Panel Administrativo
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2.5 rounded-xl text-gray-700 hover:text-[#2D2E83] hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
          aria-label="Abrir menú de navegación"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ========================================================================= */}
      {/* MENÚ MÓVIL DESPLEGABLE (DRAWER) */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm pt-16 animate-in fade-in duration-150"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="bg-white border-b border-gray-200 shadow-2xl p-5 max-h-[85vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">
              Navegación del Sistema
            </div>

            <nav className="space-y-1.5">
              {navLinks.map((item) => {
                const active = isActive(item.href, item.exact);
                const IconComponent = item.icon;

                if (item.hasSubmenu) {
                  return (
                    <div key={item.label} className="space-y-1 pt-1">
                      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm text-[#2D2E83] bg-blue-50/50">
                        <div className="flex items-center gap-2.5">
                          <IconComponent className="w-4 h-4 text-[#2D2E83]" />
                          <span>{item.label}</span>
                        </div>
                      </div>
                      <div className="pl-6 pr-2 space-y-1">
                        {item.subLinks.map((sub) => {
                          const subActive = isActive(sub.href, sub.exact);
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                subActive
                                  ? 'bg-[#2D2E83] text-white shadow'
                                  : 'text-gray-700 hover:text-[#2D2E83] hover:bg-gray-100'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${subActive ? 'bg-white' : 'bg-[#BE1622]'}`} />
                              <span>{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      active
                        ? 'bg-[#2D2E83] text-white shadow-md shadow-[#2D2E83]/20'
                        : 'text-gray-700 hover:text-[#2D2E83] hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-gray-200">
              <Link
                href="/"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:text-[#2D2E83] bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <span>Volver a la Web Pública</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARRA LATERAL PARA ESCRITORIO (DESKTOP SIDEBAR) */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 fixed top-24 bottom-0 left-0 z-30 bg-white/95 backdrop-blur-xl border-r border-gray-200/90 shadow-[4px_0_24px_rgba(0,0,0,0.03)] overflow-y-auto custom-scrollbar">
        {/* Encabezado del Sidebar */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D2E83]/10 border border-[#2D2E83]/20 flex items-center justify-center shrink-0 p-1 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/images/dojos/escudo.jpg" 
                alt="Escudo ISKF" 
                className="w-full h-full object-contain rounded-lg" 
              />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#BE1622] block font-mono">
                ISKF Costa Rica
              </span>
              <h2 className="text-lg font-black text-[#2D2E83] tracking-tight leading-tight">
                Panel Admin
              </h2>
            </div>
          </div>
        </div>

        {/* Navegación Principal */}
        <nav className="p-4 space-y-1.5 flex-1">
          {navLinks.map((item) => {
            const active = isActive(item.href, item.exact);
            const IconComponent = item.icon;

            if (item.hasSubmenu) {
              const isAnySubActive = item.subLinks.some(sub => isActive(sub.href, sub.exact));

              return (
                <div key={item.label} className="space-y-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsExaminationsOpen(!isExaminationsOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      isAnySubActive
                        ? 'bg-blue-50 text-[#2D2E83] border border-blue-200/60'
                        : 'text-gray-700 hover:text-[#2D2E83] hover:bg-gray-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-4 h-4 ${isAnySubActive ? 'text-[#2D2E83]' : 'text-gray-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExaminationsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isExaminationsOpen && (
                    <div className="pl-6 pr-2 space-y-1 animate-in fade-in duration-150">
                      {item.subLinks.map((sub) => {
                        const subActive = isActive(sub.href, sub.exact);
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                              subActive
                                ? 'bg-[#2D2E83] text-white shadow-md shadow-[#2D2E83]/20'
                                : 'text-gray-600 hover:text-[#2D2E83] hover:bg-gray-100'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${subActive ? 'bg-white' : 'bg-[#BE1622]'}`} />
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  active
                    ? 'bg-[#2D2E83] text-white shadow-md shadow-[#2D2E83]/25'
                    : 'text-gray-700 hover:text-[#2D2E83] hover:bg-gray-100/80'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-gray-100 space-y-3 bg-gray-50/70">
          <Link
            href="/"
            className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:text-[#2D2E83] hover:bg-white border border-gray-200 shadow-xs transition-all"
          >
            <span>Sitio Web Público</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </Link>
          <div className="px-2 text-[11px] text-gray-400 font-medium">
            ISKF Costa Rica • Administración
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ========================================================================= */}
      <main className="flex-1 ml-0 md:ml-64 pt-20 md:pt-28 p-4 sm:p-6 md:p-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
