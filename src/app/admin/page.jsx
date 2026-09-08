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
import { 
  MapPin, 
  Users, 
  Award, 
  Calendar, 
  FileText, 
  Globe, 
  ArrowRight,
  Shield,
  Sparkles
} from 'lucide-react';

export const metadata = {
  title: 'ISKF Admin - Dashboard',
};

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
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
