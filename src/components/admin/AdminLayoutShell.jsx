"use client";

import React, { useState, useEffect, useSyncExternalStore } from 'react';
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
  BookOpen, 
  Construction, 
  ExternalLink, 
  Menu, 
  X, 
  ChevronDown, 
  ShieldAlert,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import fondoInicioNuevo from '../../assets/images/Fondo-inicio-nuevo.jpg';

const subscribeSidebar = (onStoreChange) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('sidebar-toggle', onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    window.removeEventListener('sidebar-toggle', onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
};

const getSidebarSnapshot = () => {
  try {
    return localStorage.getItem('iskf_admin_sidebar_collapsed') === 'true';
  } catch {
    return false;
  }
};

const getSidebarServerSnapshot = () => false;

export default function AdminLayoutShell({ children, user }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExaminationsOpen, setIsExaminationsOpen] = useState(true);

  // Estado sincronizado de forma segura con SSR y hydration sin desajustes
  const isSidebarCollapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    getSidebarServerSnapshot
  );

  const toggleSidebar = () => {
    const current = getSidebarSnapshot();
    const next = !current;
    try {
      localStorage.setItem('iskf_admin_sidebar_collapsed', String(next));
      window.dispatchEvent(new Event('sidebar-toggle'));
    } catch (err) {
      console.debug('Error guardando estado de sidebar:', err);
    }
  };

  const isTechnicalRoute = Boolean(
    pathname?.includes('/examinations/technical') || 
    pathname?.includes('/examinations/syllabi') ||
    pathname?.includes('/examinations/costs')
  );
  const [technicalOverride, setTechnicalOverride] = useState(null);
  const isTechnicalOpen = technicalOverride !== null ? technicalOverride : isTechnicalRoute;
  const toggleTechnicalMenu = () => {
    setTechnicalOverride(prev => (prev === null ? !isTechnicalRoute : !prev));
  };

  const isWrittenRoute = Boolean(pathname === '/admin/examinations' || pathname?.includes('/examinations/written'));
  const [writtenOverride, setWrittenOverride] = useState(null);
  const isWrittenOpen = writtenOverride !== null ? writtenOverride : isWrittenRoute;
  const toggleWrittenMenu = () => {
    setWrittenOverride(prev => (prev === null ? !isWrittenRoute : !prev));
  };

  // Activar escalamiento tipográfico del +10% de forma scoped en el documento
  useEffect(() => {
    document.documentElement.classList.add('admin-scope');
    return () => {
      document.documentElement.classList.remove('admin-scope');
    };
  }, []);

  const isActive = (path, exact = false) => {
    if (exact) return pathname === path;
    return pathname === path || (path !== '/admin' && pathname?.startsWith(path));
  };

  const isSensei = user?.role === 'sensei';
  const isInstructor = user?.role === 'editor';

  const navLinks = isSensei ? [
    { 
      label: 'Lista Estudiante', 
      href: '/admin/students', 
      icon: Users, 
      exact: true 
    },
    { 
      label: 'Temarios Exámenes Técnicos', 
      href: '/admin/examinations/syllabi', 
      icon: BookOpen, 
    },
  ] : isInstructor ? [
    { 
      label: 'Lista Estudiante', 
      href: '/admin/students', 
      icon: Users, 
      exact: true 
    },
    { 
      label: 'Temarios Exámenes Técnicos', 
      href: '/admin/examinations/syllabi', 
      icon: BookOpen, 
    },
  ] : [
    { 
      label: 'Dashboard', 
      href: '/admin', 
      icon: LayoutDashboard, 
      exact: true 
    },
    { 
      label: 'Lista Estudiantes', 
      href: '/admin/students', 
      icon: Users, 
      exact: true 
    },
    { 
      label: 'Usuarios', 
      href: '/admin/users', 
      icon: ShieldAlert, 
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
        { 
          label: 'Exámenes Escritos', 
          href: '/admin/examinations/written',
          hasNested: true,
          nestedType: 'written',
          nestedLinks: [
            { label: 'Temario Exámenes Escritos', href: '/admin/examinations/written/syllabi' },
            { label: 'Convocatorias de Examen Escrito', href: '/admin/examinations', exact: true },
          ]
        },
        { 
          label: 'Exámenes Técnicos', 
          href: '/admin/examinations/technical',
          hasNested: true,
          nestedType: 'technical',
          nestedLinks: [
            { label: 'Temarios Exámenes Técnicos', href: '/admin/examinations/syllabi' },
            { label: 'Convocatorias de Examen Técnico', href: '/admin/examinations/technical', exact: true },
            { label: 'Configuración de Costos', href: '/admin/examinations/costs' },
          ]
        },
      ]
    },
    { 
      label: 'Organizaciones', 
      href: '/admin/entities', 
      icon: Globe 
    },
  ];

  return (
    <div className="admin-scope relative min-h-screen flex flex-col font-sans text-gray-900 bg-white">
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
          <div className="w-9 h-9 rounded-xl bg-white border border-[#2D2E83]/20 flex items-center justify-center shrink-0 p-1 shadow-2xs overflow-hidden">
            <img 
              src={(isSensei || isInstructor) && user?.dojoLogo ? user.dojoLogo : "/images/dojos/escudo.jpg"} 
              alt="Logo" 
              className="w-full h-full object-contain rounded-lg" 
            />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#BE1622] block font-mono">
              {isSensei ? (user?.dojoName ? `${user.dojoName} • Admin Dojo` : 'Admin Dojo') : isInstructor ? (user?.dojoName || 'Instructor ISKF') : 'ISKF Costa Rica'}
            </span>
            <span className="text-base font-black text-[#2D2E83] tracking-tight block leading-tight">
              {isSensei ? 'Panel Sensei' : isInstructor ? 'Portal de Instructor' : 'Panel Administrativo'}
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
                          if (sub.hasNested) {
                            const isNestedActive = sub.nestedLinks.some(nested => isActive(nested.href, nested.exact));
                            const isThisOpen = sub.nestedType === 'written' ? isWrittenOpen : isTechnicalOpen;
                            const toggleThisMenu = sub.nestedType === 'written' ? toggleWrittenMenu : toggleTechnicalMenu;

                            return (
                              <div key={sub.label} className="space-y-1">
                                <button
                                  type="button"
                                  onClick={toggleThisMenu}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    isNestedActive
                                      ? 'bg-blue-50 text-[#2D2E83] border border-blue-200/60'
                                      : 'text-gray-700 hover:text-[#2D2E83] hover:bg-gray-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${isNestedActive ? 'bg-[#2D2E83]' : 'bg-[#BE1622]'}`} />
                                    <span>{sub.label}</span>
                                  </div>
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isThisOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isThisOpen && (
                                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-[#2D2E83]/20 ml-3">
                                    {sub.nestedLinks.map((nested) => {
                                      const nestedActive = isActive(nested.href, nested.exact);
                                      return (
                                        <Link
                                          key={nested.href}
                                          href={nested.href}
                                          onClick={() => setIsMobileMenuOpen(false)}
                                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            nestedActive
                                              ? 'bg-[#2D2E83] text-white shadow-xs'
                                              : 'text-gray-600 hover:text-[#2D2E83] hover:bg-gray-100'
                                          }`}
                                        >
                                          <span className={`w-1 h-1 rounded-full ${nestedActive ? 'bg-white' : 'bg-gray-400'}`} />
                                          <span>{nested.label}</span>
                                        </Link>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          }

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

                const isStudentsItem = item.href === '/admin/students';
                const showDojoLogo = isStudentsItem && user?.dojoLogo;

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
                    {showDojoLogo ? (
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-white p-0.5 border border-white/30 shrink-0 shadow-2xs flex items-center justify-center">
                        <img
                          src={user.dojoLogo}
                          alt="Logo Dojo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <IconComponent className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-500'}`} />
                    )}
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
      <aside 
        className={`hidden md:flex flex-col w-64 fixed top-0 bottom-0 left-0 z-30 bg-white/95 backdrop-blur-xl border-r border-gray-200/90 shadow-[4px_0_24px_rgba(0,0,0,0.03)] overflow-y-auto custom-scrollbar transition-transform duration-300 ease-in-out ${
          isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        {/* Encabezado del Sidebar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#2D2E83]/20 flex items-center justify-center shrink-0 p-1 shadow-sm overflow-hidden">
              <img 
                src={(isSensei || isInstructor) && user?.dojoLogo ? user.dojoLogo : "/images/dojos/escudo.jpg"} 
                alt="Logo" 
                className="w-full h-full object-contain rounded-lg" 
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#BE1622] block font-mono truncate">
                {isSensei ? (user?.dojoName ? `${user.dojoName} • Admin Dojo` : 'Admin Dojo') : isInstructor ? (user?.dojoName || 'Instructor ISKF') : 'ISKF Costa Rica'}
              </span>
              <h2 className="text-lg font-black text-[#2D2E83] tracking-tight leading-tight truncate">
                {isSensei ? 'Mi Dojo' : isInstructor ? 'Mi Dojo' : 'Panel Admin'}
              </h2>
            </div>
          </div>

          {/* Botón arriba del panel admin para ocultar el menú de la izquierda */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 text-gray-400 hover:text-[#2D2E83] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Ocultar menú lateral"
            aria-label="Ocultar menú lateral"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
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
                        if (sub.hasNested) {
                          const isNestedActive = sub.nestedLinks.some(nested => isActive(nested.href, nested.exact));
                          const isThisOpen = sub.nestedType === 'written' ? isWrittenOpen : isTechnicalOpen;
                          const toggleThisMenu = sub.nestedType === 'written' ? toggleWrittenMenu : toggleTechnicalMenu;

                          return (
                            <div key={sub.label} className="space-y-1">
                              <button
                                type="button"
                                onClick={toggleThisMenu}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  isNestedActive
                                    ? 'bg-blue-50 text-[#2D2E83] border border-blue-200/60'
                                    : 'text-gray-700 hover:text-[#2D2E83] hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${isNestedActive ? 'bg-[#2D2E83]' : 'bg-[#BE1622]'}`} />
                                  <span>{sub.label}</span>
                                </div>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isThisOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {isThisOpen && (
                                <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-[#2D2E83]/20 ml-3 animate-in fade-in duration-150">
                                  {sub.nestedLinks.map((nested) => {
                                    const nestedActive = isActive(nested.href, nested.exact);
                                    return (
                                      <Link
                                        key={nested.href}
                                        href={nested.href}
                                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                          nestedActive
                                            ? 'bg-[#2D2E83] text-white shadow-xs'
                                            : 'text-gray-600 hover:text-[#2D2E83] hover:bg-gray-100'
                                        }`}
                                      >
                                        <span className={`w-1 h-1 rounded-full ${nestedActive ? 'bg-white' : 'bg-gray-400'}`} />
                                        <span>{nested.label}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }

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

            const isStudentsItem = item.href === '/admin/students';
            const showDojoLogo = isStudentsItem && user?.dojoLogo;

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
                {showDojoLogo ? (
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-white p-0.5 border border-white/30 shrink-0 shadow-2xs flex items-center justify-center">
                    <img
                      src={user.dojoLogo}
                      alt="Logo Dojo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <IconComponent className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-500'}`} />
                )}
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
          {user && (
            <div className="px-2 pt-2 border-t border-gray-200/50 flex flex-col">
              <span className="text-xs font-bold text-gray-800 truncate">{user.name || user.email}</span>
              <span className="text-[10px] text-[#BE1622] font-semibold uppercase">
                {isSensei ? 'Admin Dojo' : user.role || 'Administrador'}
              </span>
              {user.dojoName && (
                <span className="text-[10px] text-gray-500 font-mono truncate">{user.dojoName}</span>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* BOTÓN EXPUESTO CUANDO EL MENÚ ESTÁ OCULTO */}
      {/* ========================================================================= */}
      {isSidebarCollapsed && (
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden md:flex fixed top-4 left-0 z-40 items-center gap-2 pl-2.5 pr-3.5 py-2 bg-white/95 backdrop-blur-md border border-l-0 border-gray-200/90 rounded-r-xl shadow-lg text-[#2D2E83] hover:text-[#BE1622] hover:bg-blue-50/80 transition-all cursor-pointer group animate-in slide-in-from-left duration-200"
          title="Mostrar menú lateral"
          aria-label="Mostrar menú lateral"
        >
          <PanelLeftOpen className="w-5 h-5 text-[#2D2E83] group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black tracking-tight font-sans">
            Menú
          </span>
        </button>
      )}

      {/* ========================================================================= */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ========================================================================= */}
      <main 
        className={`flex-1 ml-0 ${
          isSidebarCollapsed ? 'md:ml-0' : 'md:ml-64'
        } pt-20 md:pt-6 p-3 sm:p-5 md:p-6 relative z-10 transition-all duration-300 ease-in-out`}
      >
        {children}
      </main>
    </div>
  );
}
