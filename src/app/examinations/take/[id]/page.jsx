import { getPublicExaminationSession } from '../../../../lib/actions/examinations';
import StudentExamTaker from '../../../../components/examinations/StudentExamTaker';
import Link from 'next/link';
import { AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { cookies } from 'next/headers';
import fondoInicioNuevo from '../../../../assets/images/Fondo-inicio-nuevo.jpg';

export const metadata = {
  title: 'Resolución de Examen - ISKF',
  description: 'Plataforma oficial de evaluación teórica ISKF.',
};

export const dynamic = 'force-dynamic';

export default async function TakeExamPage({ params }) {
  const resolvedParams = typeof params?.then === 'function' ? await params : params;
  const id = resolvedParams?.id || '';

  const cookieStore = await cookies();

  const deviceToken = cookieStore.get('iskf_device_token')?.value || '';

  const res = await getPublicExaminationSession(id, { deviceToken });

  if (!res.success) {
    // 1. Bloqueo por Infracción de Seguridad detectado en el Servidor Backend
    if (res.isSecurityLocked) {
      return (
        <div className="relative min-h-screen bg-transparent text-gray-900 flex items-center justify-center p-4 font-sans selection:bg-[#2D2E83] selection:text-white">
          <div className="fixed inset-0 z-0 bg-white pointer-events-none select-none">
            <img 
              src={fondoInicioNuevo?.src || fondoInicioNuevo} 
              alt="ISKF Background" 
              className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.25]" 
            />
          </div>

          <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-2xl border border-red-300 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 border border-red-200 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 uppercase tracking-widest font-mono">
                Infracción de Seguridad
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                Examen Cancelado y Bloqueado
              </h1>
              <p className="text-gray-600 text-sm leading-relaxed">
                El sistema detectó reiteradas salidas de la ventana de evaluación en la convocatoria <strong className="text-gray-900">{res.title}</strong>.
              </p>
            </div>

            <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl text-xs text-gray-700 text-left space-y-2">
              <div className="flex items-start gap-2 text-red-700 font-medium">
                <span>⛔</span>
                <span>Este dispositivo ha sido bloqueado de forma definitiva en el servidor para esta evaluación.</span>
              </div>
              <div className="flex items-start gap-2 text-gray-600">
                <span>•</span>
                <span>Tus respuestas parciales e incidencias fueron remitidas a la mesa examinadora.</span>
              </div>
              <div className="flex items-start gap-2 text-gray-600">
                <span>•</span>
                <span>Cualquier intento de refrescar o reiniciar el navegador mantendrá este bloqueo activo.</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2. Examen ya entregado previamente desde este dispositivo
    if (res.isAlreadySubmitted) {
      return (
        <div className="relative min-h-screen bg-transparent text-gray-900 flex items-center justify-center p-4 font-sans selection:bg-[#2D2E83] selection:text-white">
          <div className="fixed inset-0 z-0 bg-white pointer-events-none select-none">
            <img 
              src={fondoInicioNuevo?.src || fondoInicioNuevo} 
              alt="ISKF Background" 
              className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.25]" 
            />
          </div>

          <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-widest font-mono">
                Examen Ya Entregado
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                Acceso Concluido
              </h1>
              <p className="text-gray-600 text-sm leading-relaxed">
                Ya se ha registrado una entrega previa para la convocatoria <strong className="text-gray-900">{res.title}</strong> desde este dispositivo.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 3. Tiempo Límite Agotado
    if (res.isTimeExpired) {
      return (
        <div className="relative min-h-screen bg-transparent text-gray-900 flex items-center justify-center p-4 font-sans selection:bg-[#2D2E83] selection:text-white">
          <div className="fixed inset-0 z-0 bg-white pointer-events-none select-none">
            <img 
              src={fondoInicioNuevo?.src || fondoInicioNuevo} 
              alt="ISKF Background" 
              className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.25]" 
            />
          </div>

          <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-widest font-mono">
                Tiempo Agotado
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                Acceso Concluido
              </h1>
              <p className="text-gray-600 text-sm leading-relaxed">
                El tiempo límite asignado para resolver la prueba <strong className="text-gray-900">{res.title}</strong> ha concluido.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 4. Convocatoria Finalizada o Código no disponible
    return (
      <div className="relative min-h-screen bg-transparent text-gray-900 flex items-center justify-center p-4 font-sans selection:bg-[#2D2E83] selection:text-white">
        <div className="fixed inset-0 z-0 bg-white pointer-events-none select-none">
          <img 
            src={fondoInicioNuevo?.src || fondoInicioNuevo} 
            alt="ISKF Background" 
            className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.25]" 
          />
        </div>

        <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            {res.isClosed ? <Clock className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 uppercase tracking-widest font-mono">
              {res.isClosed ? 'Convocatoria Finalizada' : 'Enlace No Disponible'}
            </span>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {res.title || 'Examinación no disponible'}
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              {res.error || 'No se pudo encontrar la convocatoria solicitada. Por favor verifica el enlace con tu Sensei.'}
            </p>
          </div>

          {id && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 font-mono select-all">
              Código recibido: <span className="text-gray-800 font-semibold">{id}</span>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Ir a la Página Principal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StudentExamTaker 
      session={res.session} 
      exam={res.exam} 
      initialDeviceToken={deviceToken} 
    />
  );
}
