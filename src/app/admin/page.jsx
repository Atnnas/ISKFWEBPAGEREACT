import { auth } from "../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Dojo from "../../models/Dojo";
import User from "../../models/User";
import Event from "../../models/Event";
import ExaminationSession from "../../models/ExaminationSession";
import WrittenExam from "../../models/WrittenExam";
import Entity from "../../models/Entity";
import dbConnect from "../../lib/mongodb";
import { getDojosForSelector } from "../../lib/actions/students";
import { getExamCostConfig } from "../../lib/actions/examCosts";
import { 
  MapPin, 
  Users, 
  Award, 
  Calendar, 
  FileText, 
  Globe, 
  ArrowRight,
  Shield,
  Sparkles,
  Building2,
  DollarSign,
  GraduationCap,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Receipt
} from 'lucide-react';

export const metadata = {
  title: 'ISKF Admin - Dashboard',
};

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  if (session.user.role === 'editor') {
    redirect('/admin/examinations/technical');
  }

  // =========================================================================
  // VISTA DEDICADA: DASHBOARD PARA SENSEI (ADMINISTRACIÓN DOJO)
  // =========================================================================
  if (session.user.role === 'sensei') {
    const allDojos = await getDojosForSelector();
    const matchedDojo = allDojos.find(d => 
      (session.user.dojoId && (d.id === session.user.dojoId || d._id === session.user.dojoId)) ||
      (d.email && session.user.email && d.email.trim().toLowerCase() === session.user.email.trim().toLowerCase())
    );

    const dojoId = matchedDojo?.id || matchedDojo?._id || session.user.dojoId || null;
    const costConfig = await getExamCostConfig(dojoId);
    const studentCount = matchedDojo?.studentCount || 0;
    const dojoName = matchedDojo?.name || session.user.dojoName || 'Mi Dojo ISKF';

    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Encabezado Principal del Sensei */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#2D2E83] text-xs font-bold uppercase tracking-widest font-mono">
              <Building2 className="w-3.5 h-3.5 text-[#BE1622]" />
              Administración Dojo • ISKF Costa Rica
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-[#2D2E83] tracking-tight uppercase">
              {dojoName}
            </h1>
            <p className="text-gray-600 text-sm md:text-base font-medium">
              Bienvenido, <strong className="text-gray-900">{session.user.name || 'Sensei Administrador'}</strong>. Control de estudiantes y configuración de aranceles de examen.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white/90 border border-gray-200 rounded-2xl px-4 py-2.5 shadow-xs shrink-0 self-start md:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sensei Autorizado • {dojoName}</span>
          </div>
        </div>

        {/* Tarjetas Principales de Métricas del Dojo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta 1: Estudiantes */}
          <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200/80 text-[#2D2E83] shadow-inner group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-blue-50 text-[#2D2E83] border-blue-200">
                  Padrón Oficial
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Lista de Estudiantes
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Karatecas activos registrados en su dojo
              </p>

              <div className="text-4xl sm:text-5xl font-black text-[#2D2E83] my-5 tracking-tight">
                {studentCount}
              </div>
            </div>

            <Link 
              href="/admin/students" 
              className="mt-2 flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-[#2D2E83]/15 active:scale-95 cursor-pointer"
            >
              <span>Ver Lista de Estudiantes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Tarjeta 2: Ganancia Sensei */}
          <div className="bg-white/95 backdrop-blur-md border border-emerald-200/80 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 shadow-inner group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                  Sensei Dojo
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Ganancia del Sensei
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Monto que usted percibe por cada alumno examinado
              </p>

              <div className="text-3xl sm:text-4xl font-black text-emerald-700 my-5 tracking-tight">
                ₡{Number(costConfig?.senseiDojo || 0).toLocaleString('es-CR')}
              </div>
            </div>

            <Link 
              href="/admin/dojo/sensei" 
              className="mt-2 flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/15 active:scale-95 cursor-pointer"
            >
              <span>Configurar Sensei Dojo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Tarjeta 3: Costo del Examen */}
          <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200/80 text-[#BE1622] shadow-inner group-hover:scale-105 transition-transform">
                  <Receipt className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-red-50 text-[#BE1622] border-red-200">
                  Total Aspirante
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                Costo del Examen
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Sensei (₡{Number(costConfig?.senseiDojo || 0).toLocaleString('es-CR')}) + ISKF (₡{Number(costConfig?.iskfTotal || 15000).toLocaleString('es-CR')})
              </p>

              <div className="text-3xl sm:text-4xl font-black text-[#2D2E83] my-5 tracking-tight">
                ₡{Number(costConfig?.total || 0).toLocaleString('es-CR')}
              </div>
            </div>

            <Link 
              href="/admin/dojo/sensei" 
              className="mt-2 flex items-center justify-center gap-2 w-full py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>Ver Rubros y Desglose</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Sección de Accesos Rápidos Estructurados */}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#2D2E83]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Módulos de Administración del Dojo</h2>
              <p className="text-xs text-gray-500 font-medium">Accesos directos organizados según su rol como Sensei</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/students"
              className="flex items-center justify-between p-5 rounded-2xl border border-gray-200 bg-white hover:border-[#2D2E83] hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2D2E83] flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-[#2D2E83] transition-colors">
                    Lista de Estudiantes
                  </h4>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Mantenimiento de padrón, historial de grados Kyu/Dan y habilitaciones.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#2D2E83] group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/admin/dojo/sensei"
              className="flex items-center justify-between p-5 rounded-2xl border border-gray-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    Sensei Dojo (Ganancia y Aranceles)
                  </h4>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Modificar ganancia del Sensei, ver sumatoria ISKF en solo lectura y costo final.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (session.user.role !== 'admin') {
    redirect('/');
  }

  await dbConnect();
  
  // Consultas en paralelo para métricas reales del sistema
  const [
    totalUsers, 
    totalDojos, 
    totalEvents, 
    totalSessions, 
    totalWrittenExams, 
    totalEntities
  ] = await Promise.all([
    User.countDocuments().catch(() => 0),
    Dojo.countDocuments().catch(() => 0),
    Event.countDocuments().catch(() => 0),
    ExaminationSession.countDocuments().catch(() => 0),
    WrittenExam.countDocuments().catch(() => 0),
    Entity.countDocuments().catch(() => 0)
  ]);

  const cards = [
    {
      title: "Dojos Afiliados",
      description: "Dojos registrados en Costa Rica",
      count: totalDojos,
      unit: "dojos activos",
      href: "/admin/dojos",
      btnText: "Gestionar Dojos",
      icon: MapPin,
      accentColor: "text-[#BE1622]",
      badgeBg: "bg-red-50 text-[#BE1622] border-red-200"
    },
    {
      title: "Usuarios",
      description: "Cuentas con acceso a la plataforma",
      count: totalUsers,
      unit: "usuarios",
      href: "/admin/users",
      btnText: "Gestionar Usuarios",
      icon: Users,
      accentColor: "text-[#2D2E83]",
      badgeBg: "bg-blue-50 text-[#2D2E83] border-blue-200"
    },
    {
      title: "Convocatorias",
      description: "Examinaciones y actas de grado",
      count: totalSessions,
      unit: "sesiones creadas",
      href: "/admin/examinations",
      btnText: "Ver Convocatorias",
      icon: Award,
      accentColor: "text-[#2D2E83]",
      badgeBg: "bg-indigo-50 text-[#2D2E83] border-indigo-200"
    },
    {
      title: "Calendario",
      description: "Torneos, seminarios y actividades",
      count: totalEvents,
      unit: "eventos agendados",
      href: "/admin/events",
      btnText: "Gestionar Calendario",
      icon: Calendar,
      accentColor: "text-[#BE1622]",
      badgeBg: "bg-red-50 text-[#BE1622] border-red-200"
    },
    {
      title: "Exámenes Escritos",
      description: "Bancos de preguntas y cuestionarios",
      count: totalWrittenExams,
      unit: "exámenes oficiales",
      href: "/admin/examinations/written",
      btnText: "Gestionar Cuestionarios",
      icon: FileText,
      accentColor: "text-[#2D2E83]",
      badgeBg: "bg-blue-50 text-[#2D2E83] border-blue-200"
    },
    {
      title: "Organizaciones",
      description: "Entidades organizadoras y federadas",
      count: totalEntities,
      unit: "entidades",
      href: "/admin/entities",
      btnText: "Gestionar Organizaciones",
      icon: Globe,
      accentColor: "text-[#BE1622]",
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200"
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Encabezado Principal del Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200/80 text-[#BE1622] text-xs font-bold uppercase tracking-widest font-mono">
            <Shield className="w-3.5 h-3.5" />
            Panel Central ISKF
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#2D2E83] tracking-tight uppercase">
            Panel de Administración
          </h1>
          <p className="text-gray-600 text-sm md:text-base font-medium">
            Bienvenido, <strong className="text-gray-900">{session.user.name || 'Sensei Administrador'}</strong>. Control central de dojos, examinaciones, usuarios y calendario marcial.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-white/90 border border-gray-200 rounded-2xl px-4 py-2.5 shadow-xs shrink-0 self-start md:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Servidor Activo • ISKF Costa Rica</span>
        </div>
      </div>

      {/* Grid de Tarjetas de Métricas Ejecutivas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const IconComp = card.icon;
          return (
            <div 
              key={card.title} 
              className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 ${card.accentColor} shadow-inner group-hover:scale-105 transition-transform`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${card.badgeBg}`}>
                    {card.unit}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {card.description}
                </p>

                <div className="text-4xl sm:text-5xl font-black text-[#2D2E83] my-5 tracking-tight">
                  {card.count}
                </div>
              </div>

              <Link 
                href={card.href} 
                className="mt-2 flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-[#2D2E83]/15 active:scale-95 cursor-pointer"
              >
                <span>{card.btnText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
