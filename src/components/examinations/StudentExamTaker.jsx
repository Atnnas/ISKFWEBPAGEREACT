"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Send, 
  User, 
  MapPin, 
  Award, 
  FileText, 
  Maximize2, 
  X, 
  CheckCircle2, 
  Loader2, 
  Table,
  Clock,
  Shield,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { submitStudentExam } from '../../lib/actions/examinations';
import ConfirmModal from '../ui/ConfirmModal';
import AlertModal from '../ui/AlertModal';

export default function StudentExamTaker({ session, exam }) {
  const [studentName, setStudentName] = useState('');
  const [studentDojo, setStudentDojo] = useState(
    session?.assignedDojos?.length === 1 ? session.assignedDojos[0].name : ''
  );
  const [studentRank, setStudentRank] = useState('');

  // Modo de seguridad configurado por el examinador: 'audit' | 'warnings' | 'strict'
  const securityMode = session?.securityMode || 'audit';

  // Respuestas: { [qId]: { selectedOptionIndex, writtenAnswer, matchingMatches: [{ leftIndex, rightIndex }] } }
  const [answers, setAnswers] = useState({});

  // Lightbox de imagen
  const [lightboxImage, setLightboxImage] = useState(null);

  // Estados de envío y feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
  const [isAutoSubmittedSuccess, setIsAutoSubmittedSuccess] = useState(false);
  const [isClosedBySecuritySuccess, setIsClosedBySecuritySuccess] = useState(false);

  // Estados de Seguridad
  const [_securityViolationsCount, setSecurityViolationsCount] = useState(0);
  const [isSecurityLocked, setIsSecurityLocked] = useState(false);
  const [requiresFullscreenPrompt, setRequiresFullscreenPrompt] = useState(securityMode === 'strict');
  const [securityWarningModal, setSecurityWarningModal] = useState({
    isOpen: false,
    attempt: 0,
    title: '',
    message: ''
  });

  const securityViolationsRef = useRef(0);
  const securityLogsRef = useRef([]);
  const isAwayRef = useRef(false);
  const awayTimestampRef = useRef(null);
  const blurDebounceRef = useRef(null);

  // Temporizador de tiempo límite
  const [timeLeft, setTimeLeft] = useState(null); // en segundos
  const startTimeRef = useRef(null);
  const isAutoSubmittingRef = useRef(false);

  // Modales en página
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '¿Confirmas el envío?',
    message: '',
    confirmText: 'Enviar Examen',
    onConfirm: () => {}
  });

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: 'Atención',
    message: '',
    isError: false
  });

  const showAlert = (message, title = 'Atención', isError = true) => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      isError
    });
  };

  const showConfirm = ({ title, message, onConfirm, confirmText = 'Confirmar' }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      isDanger: false,
      onConfirm
    });
  };

  const formatTime = (seconds) => {
    if (seconds <= 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Función unificada de envío (manual, por tiempo o por infracción de seguridad)
  const executeSubmission = async (isAuto = false, isSecurityClosed = false, customReport = '') => {
    if (isSubmitting || isSubmitted || isAlreadySubmitted) return;
    setIsSubmitting(true);
    try {
      const finalStudentName = studentName.trim() || (isAuto ? 'Aspirante (Envío Automático)' : '');
      const finalStudentDojo = studentDojo.trim() || (session?.assignedDojos?.[0]?.name || 'ISKF Dojo');

      const formattedAnswers = (exam.questions || []).map(q => {
        const ans = answers[q.id] || {};
        return {
          questionId: q.id,
          selectedOptionIndex: ans.selectedOptionIndex ?? null,
          writtenAnswer: ans.writtenAnswer ?? '',
          matchingMatches: ans.matchingMatches ?? []
        };
      });

      const elapsedSeconds = startTimeRef.current 
        ? Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000))
        : 0;

      const finalSecurityReport = customReport || (
        securityViolationsRef.current > 0
          ? `Se detectaron ${securityViolationsRef.current} salidas de foco de la ventana del examen.`
          : 'Sin incidencias de salida de ventana detectadas.'
      );

      const res = await submitStudentExam({
        sessionId: session.id || session._id,
        studentName: finalStudentName,
        studentDojo: finalStudentDojo,
        studentRank: studentRank.trim(),
        answers: formattedAnswers,
        timeSpentSeconds: elapsedSeconds,
        isAutoSubmitted: isAuto,
        securityViolationsCount: securityViolationsRef.current,
        closedBySecurity: isSecurityClosed,
        securityReport: finalSecurityReport
      });

      if (res.success) {
        if (typeof window !== 'undefined') {
          const sessId = session.id || session._id;
          localStorage.setItem(`iskf_exam_submitted_${sessId}`, 'true');
          if (isSecurityClosed) {
            localStorage.setItem(`iskf_exam_security_locked_${sessId}`, 'true');
          }
        }
        setIsSubmitted(true);
        setIsAutoSubmittedSuccess(isAuto && !isSecurityClosed);
        setIsClosedBySecuritySuccess(isSecurityClosed);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        if (res.error?.includes("entrega previa")) {
          setIsAlreadySubmitted(true);
        } else {
          showAlert("Ocurrió un error al enviar el examen: " + (res.error || ""), "Error al enviar", true);
        }
      }
    } catch (err) {
      console.error("Error submitting exam:", err);
      showAlert("Error de conexión al enviar el examen. Por favor intenta nuevamente.", "Error de conexión", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeSubmissionRef = useRef(executeSubmission);
  executeSubmissionRef.current = executeSubmission;

  // Detección de salida de ventana o cambio de pestaña
  const handleViolationDetected = (reason = "Salida de ventana") => {
    if (isSubmitting || isSubmitted || isAlreadySubmitted || isSecurityLocked || requiresFullscreenPrompt) return;

    securityViolationsRef.current += 1;
    const currentCount = securityViolationsRef.current;
    setSecurityViolationsCount(currentCount);

    const timestamp = new Date().toLocaleTimeString('es-CR');
    securityLogsRef.current.push({ timestamp, reason, count: currentCount });

    // MODO 1: AUDITORÍA (FLEXIBLE) - Registra silenciosamente sin interrumpir
    if (securityMode === 'audit') {
      return;
    }

    // MODO 2: CONTROLADO (3 INTENTOS CON ADVERTENCIA)
    if (securityMode === 'warnings') {
      if (currentCount === 1) {
        setSecurityWarningModal({
          isOpen: true,
          attempt: 1,
          title: "Advertencia de Seguridad (1/3)",
          message: "Has salido de la pantalla del examen y has vuelto a ingresar. Recuerda que no está permitido salir de la prueba ni cambiar de aplicación. Esta es tu primera falta (1 de 3). Al acumular 3 faltas por salir y volver a entrar, tu examen se cerrará de forma automática y definitiva."
        });
      } else if (currentCount === 2) {
        setSecurityWarningModal({
          isOpen: true,
          attempt: 2,
          title: "Última Advertencia de Seguridad (2/3)",
          message: "Has vuelto a salir y reingresar a la pantalla de evaluación. Esta es tu ÚLTIMA advertencia (2 de 3 faltas). Si sales y vuelves a entrar una vez más por cualquier motivo, el examen será cerrado y enviado inmediatamente con lo que tengas contestado."
        });
      } else if (currentCount >= 3) {
        // Tercera salida y reingreso: Cierre forzado inmediato
        setSecurityWarningModal({ isOpen: false, attempt: 3, title: '', message: '' });
        setIsSecurityLocked(true);
        if (!isAutoSubmittingRef.current) {
          isAutoSubmittingRef.current = true;
          executeSubmissionRef.current?.(
            true, 
            true, 
            `Examen cancelado automáticamente por seguridad: El aspirante acumuló 3 faltas por salida y reingreso a la ventana.`
          );
        }
      }
    }

    // MODO 3: ESTRICTO (PANTALLA COMPLETA & TOLERANCIA CERO)
    if (securityMode === 'strict') {
      setIsSecurityLocked(true);
      if (!isAutoSubmittingRef.current) {
        isAutoSubmittingRef.current = true;
        executeSubmissionRef.current?.(
          true, 
          true, 
          `Examen anulado por seguridad en Modo Estricto: Se detectó salida de ventana o abandono de pantalla completa.`
        );
      }
    }
  };

  const handleViolationDetectedRef = useRef(handleViolationDetected);
  handleViolationDetectedRef.current = handleViolationDetected;

  // Inicializar verificación de reingreso, temporizador y estado de seguridad
  useEffect(() => {
    const sessId = session.id || session._id;
    if (typeof window !== 'undefined') {
      // 1. Verificar si fue bloqueado por seguridad
      if (localStorage.getItem(`iskf_exam_security_locked_${sessId}`)) {
        setIsSecurityLocked(true);
        return;
      }

      // 2. Verificar si ya se envió previamente desde este navegador
      if (localStorage.getItem(`iskf_exam_submitted_${sessId}`)) {
        setIsAlreadySubmitted(true);
        return;
      }

      // 3. Manejo de tiempo límite
      const timeLimitMinutes = session?.timeLimitMinutes || 0;
      if (timeLimitMinutes > 0) {
        const startKey = `iskf_exam_start_${sessId}`;
        let startMs = localStorage.getItem(startKey);
        if (!startMs) {
          startMs = Date.now().toString();
          localStorage.setItem(startKey, startMs);
        }
        const startTime = parseInt(startMs, 10);
        startTimeRef.current = startTime;

        const totalSeconds = timeLimitMinutes * 60;
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const remaining = totalSeconds - elapsedSeconds;

        if (remaining <= 0) {
          setTimeLeft(0);
          if (!isAutoSubmittingRef.current) {
            isAutoSubmittingRef.current = true;
            executeSubmissionRef.current?.(true, false, 'Tiempo límite agotado.');
          }
        } else {
          setTimeLeft(remaining);
        }
      }
    }
  }, [session]);

  // Intervalo regresivo para el tiempo límite
  useEffect(() => {
    const timeLimitMinutes = session?.timeLimitMinutes || 0;
    if (timeLimitMinutes <= 0 || timeLeft === null || isSubmitted || isAlreadySubmitted || isSecurityLocked) return;

    if (timeLeft <= 0) {
      if (!isAutoSubmittingRef.current) {
        isAutoSubmittingRef.current = true;
        executeSubmissionRef.current?.(true, false, 'Tiempo límite agotado.');
      }
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalId);
          if (!isAutoSubmittingRef.current) {
            isAutoSubmittingRef.current = true;
            executeSubmissionRef.current?.(true, false, 'Tiempo límite agotado.');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, session, isSubmitted, isAlreadySubmitted, isSecurityLocked]);

  // Monitoreo de Salida y Reingreso ("Salir y Volver a Entrar" = 1 Falta)
  useEffect(() => {
    if (isSubmitted || isAlreadySubmitted || isSecurityLocked || requiresFullscreenPrompt) return;

    // Detectar salida de la ventana del examen
    const handleUserLeave = () => {
      if (isAwayRef.current) return; // Ya está marcado como fuera, no duplicar la falta

      if (document.visibilityState === 'hidden' || !document.hasFocus()) {
        isAwayRef.current = true;
        awayTimestampRef.current = Date.now();

        // En Modo Estricto, la tolerancia es cero inmediata
        if (securityMode === 'strict') {
          handleViolationDetectedRef.current("Salida de ventana o minimización en Modo Estricto");
        }
      }
    };

    // Manejador de blur con debounce para filtrar micro-focos
    const onWindowBlur = () => {
      if (blurDebounceRef.current) clearTimeout(blurDebounceRef.current);
      blurDebounceRef.current = setTimeout(() => {
        handleUserLeave();
      }, 350);
    };

    // Manejador de retorno a la ventana del examen ("Volver a Entrar")
    const handleUserReturn = () => {
      if (blurDebounceRef.current) clearTimeout(blurDebounceRef.current);

      if (isAwayRef.current) {
        const timeAway = Date.now() - (awayTimestampRef.current || 0);
        isAwayRef.current = false;
        awayTimestampRef.current = null;

        // Solo cuenta como falta al volver a entrar si estuvo fuera al menos 400ms (evita micro-parpadeos)
        if (timeAway >= 400) {
          handleViolationDetectedRef.current("Salida y reingreso a la ventana del examen");
        }
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleUserLeave();
      } else if (document.visibilityState === 'visible') {
        handleUserReturn();
      }
    };

    const onWindowFocus = () => {
      handleUserReturn();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
      if (blurDebounceRef.current) clearTimeout(blurDebounceRef.current);
    };
  }, [securityMode, isSubmitted, isAlreadySubmitted, isSecurityLocked, requiresFullscreenPrompt]);

  // Monitoreo de Pantalla Completa en Modo Estricto
  useEffect(() => {
    if (securityMode !== 'strict' || isSubmitted || isAlreadySubmitted || isSecurityLocked || requiresFullscreenPrompt) return;

    const handleFullscreenChange = () => {
      const inFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      if (!inFullscreen) {
        handleViolationDetectedRef.current("Salida no autorizada del modo pantalla completa obligatorio");
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [securityMode, requiresFullscreenPrompt, isSubmitted, isAlreadySubmitted, isSecurityLocked]);

  // Bloqueo Anti-Copia (Clic derecho, Selección, Atajos de teclado) en Modo Estricto
  useEffect(() => {
    if (securityMode !== 'strict' || isSubmitted || isAlreadySubmitted || isSecurityLocked) return;

    const preventDefaultAction = (e) => {
      e.preventDefault();
      return false;
    };

    const preventSpecialKeys = (e) => {
      // Bloquea Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+U, Ctrl+S, Ctrl+P, F12
      if (
        (e.ctrlKey && ['c', 'v', 'x', 'u', 's', 'p', 'a'].includes(e.key.toLowerCase())) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('copy', preventDefaultAction);
    document.addEventListener('cut', preventDefaultAction);
    document.addEventListener('paste', preventDefaultAction);
    document.addEventListener('contextmenu', preventDefaultAction);
    document.addEventListener('keydown', preventSpecialKeys);

    return () => {
      document.removeEventListener('copy', preventDefaultAction);
      document.removeEventListener('cut', preventDefaultAction);
      document.removeEventListener('paste', preventDefaultAction);
      document.removeEventListener('contextmenu', preventDefaultAction);
      document.removeEventListener('keydown', preventSpecialKeys);
    };
  }, [securityMode, isSubmitted, isAlreadySubmitted, isSecurityLocked]);

  // Manejo de ingreso a Pantalla Completa
  const handleEnterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        await document.documentElement.webkitRequestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen request error:", err);
    }
    setRequiresFullscreenPrompt(false);
  };

  // Manejo de respuestas de selección única
  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedOptionIndex: optionIndex
      }
    }));
  };

  // Manejo de respuestas de texto (corta y larga)
  const handleTextAnswer = (questionId, text) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        writtenAnswer: text
      }
    }));
  };

  // Manejo de respuestas de asociar términos (matriz)
  const handleMatchCell = (questionId, leftIndex, rightIndex) => {
    setAnswers(prev => {
      const currentMatches = prev[questionId]?.matchingMatches || [];
      const filtered = currentMatches.filter(m => m.leftIndex !== leftIndex);
      const nextMatches = [...filtered, { leftIndex, rightIndex }];
      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          matchingMatches: nextMatches
        }
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!studentName.trim()) {
      showAlert("Por favor ingresa tu nombre y apellidos completos.", "Nombre requerido", false);
      return;
    }

    if (!studentDojo.trim()) {
      showAlert("Por favor selecciona o indica tu Dojo de procedencia.", "Dojo requerido", false);
      return;
    }

    showConfirm({
      title: "Confirmar Envío de Examen",
      message: "¿Estás seguro de que deseas enviar tus respuestas? Una vez enviado, el examen será remitido a la mesa examinadora y no podrá ser modificado ni volver a abrirse.",
      confirmText: "Enviar Examen",
      onConfirm: () => executeSubmission(false)
    });
  };

  // =========================================================================
  // VISTA: PANTALLA DE BLOQUEO POR INFRACCIÓN DE SEGURIDAD
  // =========================================================================
  if (isSecurityLocked || isClosedBySecuritySuccess) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 py-16 font-sans">
        <div className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
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
              El sistema ha detectado reiteradas salidas de la ventana de evaluación o abandono de pantalla completa en la convocatoria <strong className="text-white">{session.title}</strong>.
            </p>
          </div>

          <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-2xl text-xs text-neutral-300 text-left space-y-2">
            <div className="flex items-start gap-2 text-red-400">
              <span>⛔</span>
              <span>Tus respuestas contestadas hasta este momento fueron remitidas automáticamente al Tribunal Examinador.</span>
            </div>
            <div className="flex items-start gap-2 text-neutral-400">
              <span>•</span>
              <span>El informe de salidas e incidencias ha sido anexado a tu entrega.</span>
            </div>
            <div className="flex items-start gap-2 text-neutral-400">
              <span>•</span>
              <span>Este enlace ha quedado inhabilitado de forma permanente para este dispositivo.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA: PANTALLA PREVIA DE PANTALLA COMPLETA EN MODO ESTRICTO
  // =========================================================================
  if (requiresFullscreenPrompt && securityMode === 'strict') {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 py-16 font-sans">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
            <Shield className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest font-mono">
              Modo Estricto de Seguridad
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {session.title}
            </h1>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              Esta evaluación teórica oficial ISKF se rige bajo protocolos de máxima seguridad anti-trampa.
            </p>
          </div>

          <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-2xl text-xs text-neutral-300 text-left space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">1.</span>
              <span><strong>Pantalla Completa Obligatoria:</strong> Toda la prueba se resolverá en modo inmersivo sin pestañas visibles.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">2.</span>
              <span><strong>Anti-Copia Activo:</strong> El copiado de texto, selección y menú contextual están deshabilitados.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-400 font-bold">3.</span>
              <span><strong>Tolerancia Cero:</strong> Minimizar la ventana o cambiar de aplicación cancelará el examen de inmediato.</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEnterFullscreen}
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Activar Pantalla Completa y Comenzar</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA: PANTALLA DE BLOQUEO POR INTENTO PREVIO
  // =========================================================================
  if (isAlreadySubmitted) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 py-16 font-sans">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl animate-in fade-in duration-300">
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
              Ya se ha registrado una entrega para la convocatoria <strong className="text-white">{session.title}</strong> desde este dispositivo. No está permitido resolver la prueba nuevamente.
            </p>
          </div>

          <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-2xl text-xs text-neutral-400 text-left space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Tus respuestas previas están resguardadas en la base de datos oficial.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Los resultados y revisiones serán anunciados directamente por el Sensei de tu Dojo.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA: PANTALLA DE ÉXITO TRAS EL ENVÍO
  // =========================================================================
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 py-16 font-sans">
        <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest font-mono">
              Examen Entregado
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              ¡Muchas Gracias{studentName ? `, ${studentName}` : ''}!
            </h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Tus respuestas para la convocatoria <strong className="text-white">{session.title}</strong> han sido recibidas con éxito por el Tribunal Examinador.
            </p>
          </div>

          {isAutoSubmittedSuccess && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>El tiempo límite concluyó. El examen fue enviado automáticamente con tus respuestas completadas.</span>
            </div>
          )}

          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4 text-left space-y-2 text-xs text-neutral-300">
            <div className="flex justify-between border-b border-neutral-800/80 pb-2">
              <span className="text-neutral-500">Aspirante:</span>
              <span className="font-semibold text-white">{studentName || 'Aspirante'}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-800/80 pb-2">
              <span className="text-neutral-500">Dojo:</span>
              <span className="font-semibold text-white">{studentDojo || 'ISKF'}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-800/80 pb-2">
              <span className="text-neutral-500">Evaluación:</span>
              <span className="font-semibold text-blue-400">{session.writtenExamName}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-neutral-500">Estado:</span>
              <span className="font-semibold text-amber-400">En revisión por Sensei</span>
            </div>
          </div>

          <p className="text-xs text-neutral-500">
            Puedes cerrar esta pestaña con tranquilidad. Los resultados serán anunciados por el Sensei de tu Dojo.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA: CUESTIONARIO ACTIVO DEL ESTUDIANTE
  // =========================================================================
  return (
    <div className="min-h-screen bg-neutral-950 text-white py-8 px-4 sm:px-6 md:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Temporizador Flotante Minimalista */}
        {session?.timeLimitMinutes > 0 && timeLeft !== null && (
          <aside 
            aria-label="Temporizador de examen"
            className="sticky top-4 z-40 flex justify-center pointer-events-none"
          >
            <div className={`pointer-events-auto flex items-center gap-3 px-5 py-2.5 rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-300 ${
              timeLeft <= 60
                ? 'bg-red-950/95 border-red-500/80 text-red-300 animate-pulse shadow-red-500/30'
                : timeLeft <= 300
                ? 'bg-amber-950/95 border-amber-500/60 text-amber-300 shadow-amber-500/20'
                : 'bg-neutral-900/95 border-neutral-700 text-neutral-200'
            }`}>
              <Clock className={`w-4 h-4 shrink-0 ${
                timeLeft <= 60 ? 'text-red-400' : timeLeft <= 300 ? 'text-amber-400' : 'text-blue-400'
              }`} />
              <div className="flex items-center gap-2 font-mono">
                <span className="text-[11px] font-sans text-neutral-400 uppercase tracking-wider font-semibold">
                  Tiempo:
                </span>
                <span className="text-sm font-black tracking-widest">
                  {formatTime(timeLeft)}
                </span>
              </div>
              {timeLeft <= 180 && (
                <span className="text-[10px] uppercase font-sans font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 tracking-wider">
                  ¡Por Concluir!
                </span>
              )}
            </div>
          </aside>
        )}

        {/* Cabecera Oficial */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase tracking-widest font-mono">
              <Award className="w-4 h-4 text-red-500" />
              <span>ISKF Karate Do • Evaluación Oficial</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {session?.timeLimitMinutes > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {session.timeLimitMinutes} min límite
                </span>
              )}
              {securityMode === 'strict' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Seguridad Estricta
                </span>
              )}
              {securityMode === 'warnings' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Seguridad: 3 Intentos
                </span>
              )}
              {securityMode === 'audit' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Seguridad: Auditoría
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {exam.questions ? exam.questions.length : 0} Preguntas
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {session.title}
            </h1>
            <p className="text-sm font-medium text-blue-400">
              {session.writtenExamName}
            </p>
            {exam.description && (
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed pt-1">
                {exam.description}
              </p>
            )}
          </div>
        </div>

        {/* Formulario de Respuestas */}
        <form onSubmit={handleSubmit} className={`space-y-6 ${securityMode === 'strict' ? 'select-none' : ''}`}>

          {/* Tarjeta de Datos del Aspirante */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              <span>Datos del Aspirante</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-neutral-400">
                  Nombre y Apellidos Completos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: David Salazar Morales"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-neutral-400">
                  Dojo de Procedencia *
                </label>
                {session?.assignedDojos && session.assignedDojos.length > 1 ? (
                  <select
                    required
                    value={studentDojo}
                    onChange={(e) => setStudentDojo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Selecciona tu Dojo...</option>
                    {session.assignedDojos.map((dojo, dIdx) => (
                      <option key={dIdx} value={dojo.name}>
                        {dojo.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Ej: Dojo Central ISKF"
                    value={studentDojo}
                    onChange={(e) => setStudentDojo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-neutral-400">
                  Grado / Kyu Actual o Aspirado (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 4° Kyu aspirando a 3er Kyu"
                  value={studentRank}
                  onChange={(e) => setStudentRank(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Preguntas */}
          <div className="space-y-5">
            {(exam.questions || []).map((q, idx) => {
              const currentAns = answers[q.id] || {};

              return (
                <div
                  key={q.id || idx}
                  className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-1">
                      <span className="text-[11px] uppercase font-semibold text-neutral-400 font-mono tracking-wider">
                        {q.type === 'single_choice' && 'Selección Única'}
                        {q.type === 'short_answer' && 'Respuesta Breve'}
                        {q.type === 'long_answer' && 'Desarrollo Escrito'}
                        {q.type === 'matching' && 'Asociación de Términos'}
                      </span>
                      <p className="text-sm md:text-base font-semibold text-white leading-relaxed">
                        {q.text}
                      </p>
                    </div>
                  </div>

                  {/* Imagen elegante si la pregunta incluye imagen */}
                  {q.imageUrl && (
                    <div className="pt-1 pl-1">
                      <div
                        onClick={() => setLightboxImage(q.imageUrl)}
                        className="group/img relative inline-block border border-neutral-700/80 rounded-2xl overflow-hidden bg-neutral-950 p-2.5 shadow-md cursor-pointer hover:border-blue-500/40 transition-all max-w-full"
                        title="Clic para ampliar imagen"
                      >
                        <img
                          src={q.imageUrl}
                          alt="Ilustración de la pregunta"
                          className="max-h-56 rounded-xl object-contain group-hover/img:scale-[1.01] transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium rounded-2xl backdrop-blur-[2px]">
                          <Maximize2 className="w-4 h-4" />
                          <span>Ampliar imagen</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1. SELECCIÓN ÚNICA */}
                  {q.type === 'single_choice' && q.options && (
                    <div className="space-y-2 pt-1 pl-1">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = currentAns.selectedOptionIndex === optIdx;
                        return (
                          <label
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-600/20 border-blue-500 text-white font-medium shadow-sm'
                                : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-600'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : 'border-neutral-600 text-neutral-400'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. RESPUESTA CORTA */}
                  {q.type === 'short_answer' && (
                    <div className="pt-1 pl-1">
                      <input
                        type="text"
                        placeholder="Escribe aquí tu respuesta breve..."
                        value={currentAns.writtenAnswer || ''}
                        onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-800/80 border border-neutral-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  )}

                  {/* 3. RESPUESTA LARGA */}
                  {q.type === 'long_answer' && (
                    <div className="pt-1 pl-1">
                      <textarea
                        rows={4}
                        placeholder="Redacta aquí tu desarrollo teórico y reflexión..."
                        value={currentAns.writtenAnswer || ''}
                        onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-800/80 border border-neutral-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                      />
                    </div>
                  )}

                  {/* 4. ASOCIAR TÉRMINOS (MATRIZ INTERACTIVA) */}
                  {q.type === 'matching' && q.leftTerms && q.topTerms && (
                    <div className="pt-1 pl-1">
                      <div className="overflow-x-auto border border-neutral-700/80 rounded-2xl bg-neutral-950/60 shadow-inner">
                        <table className="min-w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-neutral-800/90">
                              <th className="p-3 text-left text-neutral-400 font-semibold border-b border-r border-neutral-700/80">
                                Términos (Izquierda \ Arriba)
                              </th>
                              {q.topTerms.map((col, cIdx) => (
                                <th key={cIdx} className="p-3 text-center text-blue-400 font-semibold border-b border-neutral-700/80 whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {q.leftTerms.map((row, rIdx) => {
                              const matchingMatches = currentAns.matchingMatches || [];
                              const selectedCol = matchingMatches.find(m => m.leftIndex === rIdx)?.rightIndex;

                              return (
                                <tr key={rIdx} className="border-b border-neutral-800 hover:bg-neutral-800/30">
                                  <td className="p-3 border-r border-neutral-700/70 font-medium text-white bg-neutral-900/40">
                                    {row}
                                  </td>
                                  {q.topTerms.map((_, cIdx) => {
                                    const isChecked = selectedCol === cIdx;
                                    return (
                                      <td
                                        key={cIdx}
                                        onClick={() => handleMatchCell(q.id, rIdx, cIdx)}
                                        className="p-3 text-center cursor-pointer hover:bg-neutral-700/20 transition-colors"
                                      >
                                        <button
                                          type="button"
                                          className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center border transition-all ${
                                            isChecked
                                              ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                                              : 'border-neutral-600 hover:border-neutral-400 text-transparent'
                                          }`}
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Botón de Envío */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="text-center sm:text-left space-y-0.5">
              <p className="text-sm font-semibold text-white">¿Has revisado todas tus respuestas?</p>
              <p className="text-xs text-neutral-400">Al enviar, tu examen será registrado en la mesa examinadora.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando Examen...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Finalizar y Enviar Examen</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Discreto */}
        <div className="text-center text-xs text-neutral-600 pb-8 font-mono">
          ISKF Costa Rica • Sistema Oficial de Examinaciones
        </div>

      </div>

      {/* Lightbox / Zoom de Imagen en Pantalla Completa */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-4xl max-h-[90vh] p-2">
            <img 
              src={lightboxImage} 
              alt="Imagen ampliada" 
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl border border-neutral-700/80" 
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 bg-neutral-900/90 hover:bg-red-600 text-white rounded-xl border border-neutral-700 transition-colors shadow-xl"
              title="Cerrar imagen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modales de Confirmación y Alerta integrados en la página (cero recurrencia a Chrome) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDanger={confirmModal.isDanger}
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        isError={alertModal.isError}
      />

      <AlertModal
        isOpen={securityWarningModal.isOpen}
        onClose={() => setSecurityWarningModal(prev => ({ ...prev, isOpen: false }))}
        title={securityWarningModal.title}
        message={securityWarningModal.message}
        isError={true}
      />
    </div>
  );
}
