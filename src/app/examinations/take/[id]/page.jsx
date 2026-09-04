import { getPublicExaminationSession } from '../../../../lib/actions/examinations';
import StudentExamTaker from '../../../../components/examinations/StudentExamTaker';
import Link from 'next/link';
import { AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { cookies, headers } from 'next/headers';

export const metadata = {
  title: 'Resolución de Examen - ISKF',
  description: 'Plataforma oficial de evaluación teórica ISKF.',
};

export const dynamic = 'force-dynamic';

export default async function TakeExamPage({ params }) {
  const resolvedParams = typeof params?.then === 'function' ? await params : params;
  const id = resolvedParams?.id || '';

  const cookieStore = await cookies();
  const headerStore = await headers();

  const deviceToken = cookieStore.get('iskf_device_token')?.value || '';
  const fingerprint = cookieStore.get('iskf_device_fp')?.value || '';
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() || headerStore.get('x-real-ip') || '';
  const userAgent = headerStore.get('user-agent') || '';

  const res = await getPublicExaminationSession(id, { deviceToken, fingerprint, ip, userAgent });

  if (!res.success) {
    // 1. Bloqueo por Infracción de Seguridad detectado en el Servidor Backend
    if (res.isSecurityLocked) {
      return (
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-widest font-mono">
                Infracción de Seguridad
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Examen Cancelado y Bloqueado
              </h1>
              <p className="text-neutral-400 text-sm leading-relaxed">
                El sistema detectó reiteradas salidas de la ventana de evaluación en la convocatoria <strong className="text-white">{res.title}</strong>.
              </p>
            </div>

            <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-2xl text-xs text-neutral-300 text-left space-y-2">
              <div className="flex items-start gap-2 text-red-400">
                <span>⛔</span>
                <span>Este dispositivo ha sido bloqueado de forma definitiva en el servidor para esta evaluación.</span>
              </div>
              <div className="flex items-start gap-2 text-neutral-400">
                <span>•</span>
                <span>Tus respuestas parciales e incidencias fueron remitidas a la mesa examinadora.</span>
              </div>
              <div className="flex items-start gap-2 text-neutral-400">
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
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest font-mono">
                Examen Ya Entregado
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Acceso Concluido
              </h1>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Ya se ha registrado una entrega previa para la convocatoria <strong className="text-white">{res.title}</strong> desde este dispositivo.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 3. Tiempo Límite Agotado
    if (res.isTimeExpired) {
      return (
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest font-mono">
                Tiempo Agotado
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Acceso Concluido
              </h1>
              <p className="text-neutral-400 text-sm leading-relaxed">
                El tiempo límite asignado para resolver la prueba <strong className="text-white">{res.title}</strong> ha concluido.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 4. Convocatoria Finalizada o Código no disponible
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            {res.isClosed ? <Clock className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-widest font-mono">
              {res.isClosed ? 'Convocatoria Finalizada' : 'Enlace No Disponible'}
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {res.title || 'Examinación no disponible'}
            </h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              {res.error || 'No se pudo encontrar la convocatoria solicitada. Por favor verifica el enlace con tu Sensei.'}
            </p>
          </div>

          {id && (
            <div className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-xl text-xs text-neutral-500 font-mono select-all">
              Código recibido: <span className="text-neutral-300">{id}</span>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors"
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
      initialFingerprint={fingerprint}
    />
  );
}
