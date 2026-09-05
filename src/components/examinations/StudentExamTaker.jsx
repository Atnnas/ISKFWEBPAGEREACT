"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Send, 
  User, 
  Award, 
  Maximize2, 
  X, 
  CheckCircle2, 
  Loader2, 
  Clock, 
  Shield, 
  ShieldAlert, 
  EyeOff, 
  Copy, 
  ChevronDown,
  Shuffle
} from 'lucide-react';
import { 
  submitStudentExam,
  registerExamDeviceSession,
  reportSecurityViolationAction,
  pingExamDeviceHeartbeat
} from '../../lib/actions/examinations';
import { getHardwareFingerprint } from '../../lib/deviceFingerprint';
import { detectIncognito } from 'detectincognitojs';
import ConfirmModal from '../ui/ConfirmModal';
import AlertModal from '../ui/AlertModal';
import fondoInicioNuevo from '../../assets/images/Fondo-inicio-nuevo.jpg';

// Función utilitaria para barajado aleatorio Fisher-Yates (Anti-Colusión)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function StudentExamTaker({ session, exam, initialDeviceToken = '', initialFingerprint = '' }) {
  const [studentName, setStudentName] = useState('');
  const [studentDojo, setStudentDojo] = useState(
    session?.assignedDojos?.length === 1 ? session.assignedDojos[0].name : ''
  );
  const [isDojoDropdownOpen, setIsDojoDropdownOpen] = useState(false);
  const dojoDropdownRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dojoDropdownRef.current && !dojoDropdownRef.current.contains(e.target)) {
        setIsDojoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDojoObj = (session?.assignedDojos || []).find(
    d => d.name === studentDojo || d.id === studentDojo
  );

  // Grado / Kyu predefinido desde la generación del examen o convocatoria
  const targetRank = exam?.targetRanks || session?.targetRanks || exam?.name || session?.writtenExamName || '';

  // Modo de seguridad configurado por el examinador: 'audit' | 'warnings' | 'strict'
  const securityMode = session?.securityMode || 'audit';

  // Respuestas: { [qId]: { selectedOptionIndex, writtenAnswer, matchingMatches: [{ leftIndex, rightIndex }] } }
  const [answers, setAnswers] = useState({});

  // Preguntas barajadas aleatoriamente (Anti-Colusión)
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  // Barajado aleatorio de preguntas y opciones con persistencia por sesión en localStorage
  useEffect(() => {
    if (!exam?.questions || exam.questions.length === 0) return;
    const sessId = session?.id || session?._id;
    const cacheKey = sessId ? `iskf_shuffled_exam_${sessId}` : null;

    if (cacheKey && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length === exam.questions.length) {
            const currentIds = new Set(exam.questions.map(q => q.id));
            const allMatch = parsed.every(q => currentIds.has(q.id));
            if (allMatch) {
              setShuffledQuestions(parsed);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Error leyendo preguntas barajadas de localStorage:", err);
      }
    }

    // Generar nuevo barajado aleatorio de preguntas y opciones
    const preparedQuestions = exam.questions.map(q => {
      if (q.type === 'single_choice' && Array.isArray(q.options)) {
        const mappedOptions = q.options.map((optText, origIdx) => ({
          text: optText,
          originalIndex: origIdx
        }));
        return {
          ...q,
          shuffledOptions: shuffleArray(mappedOptions)
        };
      }
      return { ...q };
    });

    const randomized = shuffleArray(preparedQuestions);
    setShuffledQuestions(randomized);

    if (cacheKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(randomized));
      } catch (err) {
        console.warn("Error guardando preguntas barajadas en localStorage:", err);
      }
    }
  }, [exam, session]);

  // Restaurar respuestas y datos del estudiante si hubo desconexión o recarga accidental
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sessId = session?.id || session?._id;
    if (!sessId) return;

    try {
      const savedAnswers = localStorage.getItem(`iskf_exam_answers_${sessId}`);
      if (savedAnswers) {
        const parsed = JSON.parse(savedAnswers);
        if (parsed && typeof parsed === 'object') {
          setAnswers(prev => ({ ...parsed, ...prev }));
        }
      }

      const savedStudent = localStorage.getItem(`iskf_exam_student_${sessId}`);
      if (savedStudent) {
        const parsedStudent = JSON.parse(savedStudent);
        if (parsedStudent.studentName && !studentName) {
          setStudentName(parsedStudent.studentName);
        }
        if (parsedStudent.studentDojo && !studentDojo) {
          setStudentDojo(parsedStudent.studentDojo);
        }
      }
    } catch (err) {
      console.warn("Error restaurando borrador de examen desde localStorage:", err);
    }
  }, [session]);

  // Auto-guardado continuo de respuestas y datos en localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || isSubmitted || isAlreadySubmitted) return;
    const sessId = session?.id || session?._id;
    if (!sessId) return;

    try {
      if (Object.keys(answers).length > 0) {
        localStorage.setItem(`iskf_exam_answers_${sessId}`, JSON.stringify(answers));
      }
      if (studentName || studentDojo) {
        localStorage.setItem(`iskf_exam_student_${sessId}`, JSON.stringify({ studentName, studentDojo }));
      }
    } catch (err) {
      console.warn("Error auto-guardando borrador de examen:", err);
    }
  }, [answers, studentName, studentDojo, session, isSubmitted, isAlreadySubmitted]);

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

  // Detección de Modo Incógnito / Privado
  const [isIncognitoDetected, setIsIncognitoDetected] = useState(false);
  const [detectedBrowser, setDetectedBrowser] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyExamLink = async () => {
    try {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (err) {
      console.warn("Could not copy link:", err);
    }
  };

  const securityViolationsRef = useRef(0);
  const securityLogsRef = useRef([]);
  const isAwayRef = useRef(false);
  const awayTimestampRef = useRef(null);
  const blurDebounceRef = useRef(null);
  const deviceTokenRef = useRef(initialDeviceToken || '');
  const fingerprintRef = useRef(initialFingerprint || '');

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
      const finalStudentRank = targetRank.trim();

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
        studentRank: finalStudentRank,
        answers: formattedAnswers,
        timeSpentSeconds: elapsedSeconds,
        isAutoSubmitted: isAuto,
        securityViolationsCount: securityViolationsRef.current,
        closedBySecurity: isSecurityClosed,
        securityReport: finalSecurityReport,
        deviceToken: deviceTokenRef.current,
        fingerprint: fingerprintRef.current
      });

      if (res.success) {
        if (typeof window !== 'undefined') {
          const sessId = session.id || session._id;
          localStorage.setItem(`iskf_exam_submitted_${sessId}`, 'true');
          if (isSecurityClosed) {
            localStorage.setItem(`iskf_exam_security_locked_${sessId}`, 'true');
          }
          // Limpieza de datos temporales del examen al enviar con éxito
          localStorage.removeItem(`iskf_shuffled_exam_${sessId}`);
          localStorage.removeItem(`iskf_exam_answers_${sessId}`);
          localStorage.removeItem(`iskf_exam_student_${sessId}`);
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

    const isLockout = (securityMode === 'strict') || (securityMode === 'warnings' && currentCount >= 3);

    // REGISTRO INMEDIATO EN EL SERVIDOR BACKEND (MongoDB)
    const activeToken = deviceTokenRef.current;
    if (activeToken || fingerprintRef.current) {
      reportSecurityViolationAction({
        sessionId: session.id || session._id,
        deviceToken: activeToken,
        fingerprint: fingerprintRef.current,
        reason: `${reason} (Falta #${currentCount})`,
        isLockout,
        violationsCount: currentCount
      }).catch(err => console.error("Error reporting security violation to server:", err));
    }

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
        if (typeof window !== 'undefined') {
          const sessId = session.id || session._id;
          localStorage.setItem(`iskf_exam_security_locked_${sessId}`, 'true');
        }
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
      if (typeof window !== 'undefined') {
        const sessId = session.id || session._id;
        localStorage.setItem(`iskf_exam_security_locked_${sessId}`, 'true');
      }
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

  // Verificación de Modo Incógnito / Navegación Privada al inicializar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    detectIncognito()
      .then((result) => {
        if (result && result.isPrivate) {
          setIsIncognitoDetected(true);
          setDetectedBrowser(result.browserName || 'tu navegador');
        }
      })
      .catch((err) => {
        console.warn("Incognito check notice:", err);
      });
  }, []);

  // Inicializar token de dispositivo, huella de hardware inmutable, temporizador y estado de seguridad
  useEffect(() => {
    const sessId = session.id || session._id;
    if (typeof window === 'undefined' || isIncognitoDetected) return;

    // 0. Sincronizar o generar token único persistente de dispositivo en cookies y localStorage
    let token = deviceTokenRef.current;
    if (!token) {
      const match = document.cookie.match(/(?:^|;\s*)iskf_device_token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      } else {
        token = localStorage.getItem('iskf_device_token') || '';
      }
    }
    if (!token) {
      token = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    deviceTokenRef.current = token;
    document.cookie = `iskf_device_token=${encodeURIComponent(token)}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem('iskf_device_token', token);

    // 1. Verificar estado inicial devuelto por el servidor en session
    if (session?.deviceStatus === 'locked_by_security' || localStorage.getItem(`iskf_exam_security_locked_${sessId}`)) {
      setIsSecurityLocked(true);
      return;
    }

    if (session?.deviceStatus === 'submitted' || localStorage.getItem(`iskf_exam_submitted_${sessId}`)) {
      setIsAlreadySubmitted(true);
      return;
    }

    // 2. Extraer Huella Digital de Hardware Inmutable (resiste borrado de cookies, caché y datos de app)
    getHardwareFingerprint().then(fp => {
      if (fp) {
        fingerprintRef.current = fp;
        document.cookie = `iskf_device_fp=${encodeURIComponent(fp)}; path=/; max-age=31536000; SameSite=Lax`;
        localStorage.setItem('iskf_device_fp', fp);
      }

      // Registrar sesión en MongoDB con Huella de Hardware + Token + Datos de Aspirante
      registerExamDeviceSession({
        sessionId: sessId,
        deviceToken: token,
        fingerprint: fp || fingerprintRef.current,
        studentName,
        studentDojo,
        studentRank: targetRank,
        totalQuestionsCount: (exam?.questions || []).length
      }).then(res => {
        if (res.success) {
          if (res.status === 'locked_by_security') {
            setIsSecurityLocked(true);
            localStorage.setItem(`iskf_exam_security_locked_${sessId}`, 'true');
          } else if (res.status === 'submitted') {
            setIsAlreadySubmitted(true);
            localStorage.setItem(`iskf_exam_submitted_${sessId}`, 'true');
          } else if (res.status === 'time_expired') {
            setTimeLeft(0);
          } else if (typeof res.remainingSeconds === 'number') {
            setTimeLeft(prev => prev === null ? res.remainingSeconds : Math.min(prev, res.remainingSeconds));
          }
        }
      }).catch(err => console.error("Error registering device session in MongoDB:", err));
    });

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
      let remaining = totalSeconds - elapsedSeconds;

      if (typeof session?.serverRemainingSeconds === 'number') {
        remaining = Math.min(remaining, session.serverRemainingSeconds);
      }

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
  }, [session, isIncognitoDetected]);

  // Intervalo regresivo para el tiempo límite
  useEffect(() => {
    const timeLimitMinutes = session?.timeLimitMinutes || 0;
    if (timeLimitMinutes <= 0 || timeLeft === null || isSubmitted || isAlreadySubmitted || isSecurityLocked || isIncognitoDetected) return;

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
  }, [timeLeft, session, isSubmitted, isAlreadySubmitted, isSecurityLocked, isIncognitoDetected]);

  // Heartbeat periódico hacia la mesa examinadora (Live Proctoring)
  useEffect(() => {
    if (isSubmitted || isAlreadySubmitted || isIncognitoDetected) return;

    const sendHeartbeat = () => {
      const sessId = session?.id || session?._id;
      const token = deviceTokenRef.current;
      if (!sessId || !token) return;

      const answeredCount = Object.keys(answers).filter(qId => {
        const a = answers[qId];
        if (!a) return false;
        if (typeof a.selectedOptionIndex === 'number') return true;
        if (a.writtenAnswer && a.writtenAnswer.trim()) return true;
        if (a.matchingMatches && a.matchingMatches.length > 0) return true;
        return false;
      }).length;

      pingExamDeviceHeartbeat({
        sessionId: sessId,
        deviceToken: token,
        studentName,
        studentDojo,
        studentRank: targetRank,
        answeredQuestionsCount: answeredCount,
        totalQuestionsCount: (exam?.questions || []).length
      }).then(res => {
        if (res?.success) {
          if (res.status === 'locked_by_security') {
            setIsSecurityLocked(true);
          } else if (res.status === 'active' && isSecurityLocked) {
            // El Sensei ha desbloqueado al alumno remotamente desde la Sala en Vivo
            setIsSecurityLocked(false);
            localStorage.removeItem(`iskf_exam_security_locked_${sessId}`);
          }
        }
      }).catch(err => void err);
    };

    const interval = setInterval(sendHeartbeat, 15000);
    return () => clearInterval(interval);
  }, [studentName, studentDojo, answers, isSubmitted, isAlreadySubmitted, isSecurityLocked, isIncognitoDetected, targetRank, exam?.questions, session]);

  // Monitoreo de Salida y Reingreso ("Salir y Volver a Entrar" = 1 Falta)
  useEffect(() => {
    if (isSubmitted || isAlreadySubmitted || isSecurityLocked || requiresFullscreenPrompt || isIncognitoDetected) return;

    // Detectar salida de la ventana del examen
    const handleUserLeave = () => {
      if (isAwayRef.current) return;

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
  }, [securityMode, isSubmitted, isAlreadySubmitted, isSecurityLocked, requiresFullscreenPrompt, isIncognitoDetected]);

  // Monitoreo de Pantalla Completa en Modo Estricto
  useEffect(() => {
    if (securityMode !== 'strict' || isSubmitted || isAlreadySubmitted || isSecurityLocked || requiresFullscreenPrompt || isIncognitoDetected) return;

    const handleFullscreenChange = () => {
      const inFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      if (!inFullscreen) {
        handleViolationDetectedRef.current("Salida no autorizada del modo pantalla completa obligatorio");
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [securityMode, requiresFullscreenPrompt, isSubmitted, isAlreadySubmitted, isSecurityLocked, isIncognitoDetected]);

  // Bloqueo Anti-Copia (Clic derecho, Selección, Atajos de teclado) en Modo Estricto
  useEffect(() => {
    if (securityMode !== 'strict' || isSubmitted || isAlreadySubmitted || isSecurityLocked || isIncognitoDetected) return;

    const preventDefaultAction = (e) => {
      e.preventDefault();
      return false;
    };

    const preventSpecialKeys = (e) => {
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
  }, [securityMode, isSubmitted, isAlreadySubmitted, isSecurityLocked, isIncognitoDetected]);

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
      showAlert("Por favor selecciona tu Dojo de procedencia.", "Dojo requerido", false);
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
  // VISTA: PANTALLA DE BLOQUEO POR MODO INCÓGNITO / NAVEGACIÓN PRIVADA
  // =========================================================================
  if (isIncognitoDetected) {
    return (
      <div className="relative min-h-screen bg-transparent text-gray-900 flex items-center justify-center p-4 py-16 font-sans selection:bg-[#2D2E83] selection:text-white">
        {/* Fondo oficial de la página ISKF */}
        <div className="fixed inset-0 z-0 bg-white pointer-events-none select-none">
          <img
            src={fondoInicioNuevo?.src || fondoInicioNuevo}
            alt="ISKF Background"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.25]"
          />
        </div>

        <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-2xl border border-amber-300 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <EyeOff className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-widest font-mono">
              Navegación Privada Detectada
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Modo Incógnito No Permitido
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Has abierto la evaluación en una pestaña de incógnito o privada en <strong className="text-gray-900">{detectedBrowser || 'tu navegador'}</strong>.
            </p>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-gray-700 text-left space-y-3">
            <div className="flex items-start gap-2 text-amber-800 font-medium">
              <span>⚠️</span>
              <span>Por protocolos de seguridad e integridad académica ISKF, este examen no puede realizarse en pestañas de incógnito ni navegación privada.</span>
            </div>
            <div className="border-t border-amber-200/80 pt-2.5 text-gray-600 space-y-1.5">
              <p className="font-semibold text-gray-800">¿Cómo ingresar correctamente?</p>
              <p>1. Cierra esta ventana o pestaña de incógnito.</p>
              <p>2. Abre una <strong>pestaña normal y estándar</strong> en tu navegador.</p>
              <p>3. Pega el enlace de la examinación para comenzar.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyExamLink}
            className="w-full py-3 px-6 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? '¡Enlace Copiado al Portapapeles!' : 'Copiar Enlace del Examen'}</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA: PANTALLA DE BLOQUEO POR INFRACCIÓN DE SEGURIDAD
  // =========================================================================
  if (isSecurityLocked || isClosedBySecuritySuccess) {
    return (
      <div className="relative min-h-screen bg-transparent text-gray-900 flex items-center justify-center p-4 py-16 font-sans selection:bg-[#2D2E83] selection:text-white">
        {/* Fondo oficial de la página ISKF */}
        <div className="fixed inset-0 z-0 bg-white pointer-events-none select-none">
          <img
            src={fondoInicioNuevo?.src || fondoInicioNuevo}
            alt="ISKF Background"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.25]"
          />
        </div>

        <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-2xl border border-red-300 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
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
              El sistema ha detectado reiteradas salidas de la ventana de evaluación o abandono de pantalla completa en la convocatoria <strong className="text-gray-900">{session.title}</strong>.
            </p>
          </div>

          <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl text-xs text-gray-700 text-left space-y-2">
            <div className="flex items-start gap-2 text-red-700 font-medium">
              <span>⛔</span>
              <span>Tus respuestas contestadas hasta este momento fueron remitidas automáticamente al Tribunal Examinador.</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
              <span>•</span>
              <span>El informe de salidas e incidencias ha sido anexado a tu entrega.</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
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
      <div className="relative min-h-screen bg-transparent text-gray-900 flex items-center justify-center p-4 py-16 font-sans selection:bg-[#2D2E83] selection:text-white">
        {/* Fondo oficial de la página ISKF */}
        <div className="fixed inset-0 z-0 bg-white pointer-events-none select-none">
          <img
            src={fondoInicioNuevo?.src || fondoInicioNuevo}
            alt="ISKF Background"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.25]"
          />
        </div>

        <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-blue-50 border border-blue-200 text-[#2D2E83] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <Shield className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2D2E83] border border-blue-200 uppercase tracking-widest font-mono">
              Modo Estricto de Seguridad
            </span>
            <h1 className="text-2xl font-extrabold text-[#2D2E83] tracking-tight">
              {session.title}
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Esta evaluación teórica oficial ISKF se rige bajo protocolos de máxima seguridad anti-trampa.
            </p>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-700 text-left space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="text-[#2D2E83] font-bold">1.</span>
              <span><strong>Pantalla Completa Obligatoria:</strong> Toda la prueba se resolverá en modo inmersivo sin pestañas visibles.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#2D2E83] font-bold">2.</span>
              <span><strong>Anti-Copia Activo:</strong> El copiado de texto, selección y menú contextual están deshabilitados.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#be1322] font-bold">3.</span>
              <span><strong>Tolerancia Cero:</strong> Minimizar la ventana o cambiar de aplicación cancelará el examen de inmediato.</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEnterFullscreen}
            className="w-full py-3 px-6 bg-gradient-to-r from-[#2D2E83] to-[#be1322] hover:from-[#232468] hover:to-[#9c0f1b] text-white rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
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
      <div className="relative min-h-screen bg-transparent text-gray-900 flex items-center justify-center p-4 py-16 font-sans selection:bg-[#2D2E83] selection:text-white">
        {/* Fondo oficial de la página ISKF */}
        <div className="fixed inset-0 z-0 bg-white pointer-events-none select-none">
          <img
            src={fondoInicioNuevo?.src || fondoInicioNuevo}
            alt="ISKF Background"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.25]"
          />
        </div>

        <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl animate-in fade-in duration-300">
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
              Ya se ha registrado una entrega para la convocatoria <strong className="text-gray-900">{session.title}</strong> desde este dispositivo. No está permitido resolver la prueba nuevamente.
            </p>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-600 text-left space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-[#2D2E83]">•</span>
              <span>Tus respuestas previas están resguardadas en la base de datos oficial.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#2D2E83]">•</span>
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
      <div className="relative min-h-screen bg-transparent text-gray-900 flex items-center justify-center p-4 py-16 font-sans selection:bg-[#2D2E83] selection:text-white">
        {/* Fondo oficial de la página ISKF */}
        <div className="fixed inset-0 z-0 bg-white pointer-events-none select-none">
          <img
            src={fondoInicioNuevo?.src || fondoInicioNuevo}
            alt="ISKF Background"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.25]"
          />
        </div>

        <div className="relative z-10 max-w-lg w-full bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-3xl p-8 md:p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-widest font-mono">
              Examen Entregado
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              ¡Muchas Gracias{studentName ? `, ${studentName}` : ''}!
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Tus respuestas para la convocatoria <strong className="text-gray-900">{session.title}</strong> han sido recibidas con éxito por el Tribunal Examinador.
            </p>
          </div>

          {isAutoSubmittedSuccess && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>El tiempo límite concluyó. El examen fue enviado automáticamente con tus respuestas completadas.</span>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left space-y-2 text-xs text-gray-700">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500">Aspirante:</span>
              <span className="font-semibold text-gray-900">{studentName || 'Aspirante'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500">Dojo:</span>
              <span className="font-semibold text-gray-900">{studentDojo || 'ISKF'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="text-gray-500">Evaluación:</span>
              <span className="font-semibold text-[#2D2E83]">{session.writtenExamName}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-gray-500">Estado:</span>
              <span className="font-semibold text-amber-600">En revisión por Sensei</span>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Puedes cerrar esta pestaña con tranquilidad. Los resultados serán anunciados por el Sensei de tu Dojo.
          </p>
        </div>
      </div>
    );
  }

  // Preguntas activas (barajadas aleatoriamente para evitar colusión)
  const activeQuestions = shuffledQuestions.length > 0 ? shuffledQuestions : (exam?.questions || []);

  // Conteo de preguntas respondidas para barra de progreso
  const totalQuestions = activeQuestions.length;
  const answeredCount = activeQuestions.filter(q => {
    const ans = answers[q.id];
    if (!ans) return false;
    if (q.type === 'single_choice') return ans.selectedOptionIndex !== null && ans.selectedOptionIndex !== undefined;
    if (q.type === 'short_answer' || q.type === 'long_answer') return Boolean(ans.writtenAnswer?.trim());
    if (q.type === 'matching') return Boolean(ans.matchingMatches?.length > 0);
    return false;
  }).length;

  // =========================================================================
  // VISTA: CUESTIONARIO ACTIVO DEL ESTUDIANTE
  // =========================================================================
  return (
    <div className="relative min-h-screen bg-transparent text-gray-900 font-sans flex flex-col selection:bg-[#2D2E83] selection:text-white">
      {/* ========================================================================= */}
      {/* FONDO OFICIAL ISKF FIJO IDÉNTICO A TODA LA PÁGINA */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 z-0 bg-white pointer-events-none select-none">
        <img
          src={fondoInicioNuevo?.src || fondoInicioNuevo}
          alt="ISKF Background"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-[0.25]"
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR FIJA / STICKY PREMIUM (NO SE CORTA AL SCROLLEAR) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-2xl border-b border-gray-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          
          {/* Lado Izquierdo: Escudo Oficial y Datos de Convocatoria */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 p-0.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
              <img
                src="/images/dojos/escudo.jpg"
                alt="ISKF"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#2D2E83] font-bold truncate">
                  ISKF Karate Do • {targetRank || 'Evaluación Oficial'}
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-gray-900 truncate max-w-[170px] sm:max-w-sm">
                {session.title}
              </h2>
            </div>
          </div>

          {/* Lado Derecho: Progreso y Temporizador en Parte Superior Derecha */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Preguntas Respondidas */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-gray-50 border border-gray-200 text-gray-700 shadow-sm">
              <span className="text-gray-500">Progreso:</span>
              <span className="text-[#2D2E83] font-bold">{answeredCount}</span>
              <span className="text-gray-400">/</span>
              <span>{totalQuestions}</span>
            </div>

            {/* Temporizador Destacado en Superior Derecha */}
            {session?.timeLimitMinutes > 0 && timeLeft !== null ? (
              <div
                aria-label="Tiempo restante"
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border shadow-sm transition-all duration-300 ${
                  timeLeft <= 60
                    ? 'bg-red-50 border-red-400 text-red-700 animate-pulse shadow-red-500/10'
                    : timeLeft <= 300
                    ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-amber-500/10'
                    : 'bg-white border-gray-300 text-[#2D2E83] shadow-sm'
                }`}
              >
                <Clock className={`w-4 h-4 shrink-0 ${
                  timeLeft <= 60 ? 'text-red-600' : timeLeft <= 300 ? 'text-amber-600' : 'text-[#2D2E83]'
                }`} />
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5 leading-none">
                  <span className="hidden md:inline text-[9px] uppercase font-sans text-gray-500 font-bold tracking-wider">
                    Tiempo:
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono tracking-wider">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                {timeLeft <= 180 && (
                  <span className="hidden sm:inline text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 tracking-wider">
                    ¡Fin!
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-gray-50 border border-gray-200 text-gray-500">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="hidden sm:inline">Sin límite</span>
              </div>
            )}
          </div>

        </div>

        {/* Línea de Progreso Sutil al fondo del header */}
        {totalQuestions > 0 && (
          <div className="w-full h-[2.5px] bg-gray-200 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#2D2E83] via-blue-600 to-[#be1322] transition-all duration-300 shadow-[0_0_8px_rgba(45,46,131,0.4)]"
              style={{ width: `${Math.round((answeredCount / totalQuestions) * 100)}%` }}
            />
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. CONTENIDO PRINCIPAL CON ESPACIADO ELEGANTE */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 py-8 px-4 sm:px-6 md:px-8">
        <div className="max-w-3xl mx-auto space-y-8">

        {/* Cabecera Oficial */}
        <div className="bg-white/90 backdrop-blur-xl border border-gray-200/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/80 pb-4">
            <div className="flex items-center gap-2 text-xs text-[#2D2E83] uppercase tracking-widest font-mono font-bold">
              <Award className="w-4 h-4 text-[#be1322]" />
              <span>ISKF Karate Do • Evaluación Oficial</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {session?.timeLimitMinutes > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  {session.timeLimitMinutes} min límite
                </span>
              )}
              {securityMode === 'strict' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  Seguridad Estricta
                </span>
              )}
              {securityMode === 'warnings' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  Seguridad: 3 Intentos
                </span>
              )}
              {securityMode === 'audit' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-gray-500" />
                  Seguridad: Auditoría
                </span>
              )}
              {targetRank && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 font-mono">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  {targetRank}
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2D2E83] border border-blue-200">
                {totalQuestions} Preguntas
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1.5 shadow-sm" title="Orden aleatorio individual de preguntas y opciones para evitar colusión">
                <Shuffle className="w-3.5 h-3.5 text-purple-600" />
                Anti-Colusión Activo
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-[#2D2E83] tracking-tight">
              {session.title}
            </h1>
            <p className="text-sm font-bold text-[#be1322]">
              {session.writtenExamName}
            </p>
            {exam.description && (
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pt-1">
                {exam.description}
              </p>
            )}
          </div>
        </div>

        {/* Formulario de Respuestas */}
        <form onSubmit={handleSubmit} className={`space-y-6 ${securityMode === 'strict' ? 'select-none' : ''}`}>

          {/* Tarjeta de Datos del Aspirante */}
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/90 rounded-3xl p-6 sm:p-8 space-y-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/80 pb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#2D2E83] flex items-center gap-2">
                <User className="w-4 h-4 text-[#be1322]" />
                <span>Datos del Aspirante</span>
              </h2>

              {targetRank && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-semibold font-mono">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kyu a Evaluar: <strong className="text-emerald-950 font-bold">{targetRank}</strong></span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-bold text-gray-600">
                  Nombre y Apellidos Completos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: David Salazar Morales"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 shadow-sm transition-colors placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-1.5" ref={dojoDropdownRef}>
                <label className="block text-xs uppercase font-bold text-gray-600">
                  Dojo al que Pertenece *
                </label>
                {session?.assignedDojos && session.assignedDojos.length > 0 ? (
                  <div className="relative">
                    {/* Botón Selector Personalizado con Escudo y Nombre */}
                    <button
                      type="button"
                      onClick={() => setIsDojoDropdownOpen(prev => !prev)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 hover:border-gray-400 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all focus:outline-none focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 shadow-sm"
                    >
                      {selectedDojoObj ? (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                            <img
                              src={selectedDojoObj.logo || '/images/dojos/escudo.jpg'}
                              alt={`Escudo ${selectedDojoObj.name}`}
                              className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.src = '/images/dojos/escudo.jpg'; }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {selectedDojoObj.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Selecciona tu Dojo...
                        </span>
                      )}
                      <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isDojoDropdownOpen ? 'rotate-180 text-[#2D2E83]' : ''}`} />
                    </button>

                    {/* Menú Desplegable con Escudos y Nombres */}
                    {isDojoDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white/95 border border-gray-200 rounded-2xl shadow-2xl py-1.5 max-h-64 overflow-y-auto divide-y divide-gray-100 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                        {session.assignedDojos.map((dojo, dIdx) => {
                          const isSelected = studentDojo === dojo.name;
                          return (
                            <button
                              key={dIdx}
                              type="button"
                              onClick={() => {
                                setStudentDojo(dojo.name);
                                setIsDojoDropdownOpen(false);
                              }}
                              className={`w-full px-3.5 py-2.5 flex items-center gap-3 text-left transition-colors ${
                                isSelected
                                  ? 'bg-blue-50 text-[#2D2E83] font-semibold'
                                  : 'hover:bg-blue-50/60 text-gray-700'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                                <img
                                  src={dojo.logo || '/images/dojos/escudo.jpg'}
                                  alt={`Escudo ${dojo.name}`}
                                  className="w-full h-full object-contain"
                                  onError={(e) => { e.currentTarget.src = '/images/dojos/escudo.jpg'; }}
                                />
                              </div>
                              <span className="text-sm font-medium flex-1 truncate">
                                {dojo.name}
                              </span>
                              {isSelected && (
                                <Check className="w-4 h-4 text-[#2D2E83] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Ej: Dojo Central ISKF"
                    value={studentDojo}
                    onChange={(e) => setStudentDojo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 shadow-sm transition-colors placeholder:text-gray-400"
                  />
                )}
              </div>
            </div>

            {/* Vista Previa Destacada: Escudo Oficial y Nombre del Dojo Seleccionado */}
            {selectedDojoObj && (
              <div className="pt-2 border-t border-gray-200/80">
                <div className="p-3.5 bg-gray-50/90 border border-gray-200/90 rounded-2xl flex items-center gap-3.5 shadow-sm animate-in fade-in duration-200">
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                    <img
                      src={selectedDojoObj.logo || '/images/dojos/escudo.jpg'}
                      alt={`Escudo ${selectedDojoObj.name}`}
                      className="w-full h-full object-contain"
                      onError={(e) => { e.currentTarget.src = '/images/dojos/escudo.jpg'; }}
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#2D2E83] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Dojo Seleccionado
                    </span>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {selectedDojoObj.name}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preguntas */}
          <div className="space-y-5">
            {activeQuestions.map((q, idx) => {
              const currentAns = answers[q.id] || {};

              return (
                <div
                  key={q.id || idx}
                  className="bg-white/90 backdrop-blur-xl border border-gray-200/90 rounded-3xl p-6 sm:p-7 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-[#2D2E83]/10 border border-[#2D2E83]/20 text-[#2D2E83] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-1">
                      <span className="text-[11px] uppercase font-bold text-gray-500 font-mono tracking-wider">
                        {q.type === 'single_choice' && 'Selección Única'}
                        {q.type === 'short_answer' && 'Respuesta Breve'}
                        {q.type === 'long_answer' && 'Desarrollo Escrito'}
                        {q.type === 'matching' && 'Asociación de Términos'}
                      </span>
                      <p className="text-sm md:text-base font-bold text-gray-900 leading-relaxed">
                        {q.text}
                      </p>
                    </div>
                  </div>

                  {/* Imagen elegante si la pregunta incluye imagen */}
                  {q.imageUrl && (
                    <div className="pt-1 pl-1">
                      <div
                        onClick={() => setLightboxImage(q.imageUrl)}
                        className="group/img relative inline-block border border-gray-200 rounded-2xl overflow-hidden bg-white p-2.5 shadow-sm cursor-pointer hover:border-[#2D2E83]/40 transition-all max-w-full"
                        title="Clic para ampliar imagen"
                      >
                        <img
                          src={q.imageUrl}
                          alt="Ilustración de la pregunta"
                          className="max-h-56 rounded-xl object-contain group-hover/img:scale-[1.01] transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-[#2D2E83]/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium rounded-2xl backdrop-blur-[2px]">
                          <Maximize2 className="w-4 h-4" />
                          <span>Ampliar imagen</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1. SELECCIÓN ÚNICA (OPCIONES BARAJADAS) */}
                  {q.type === 'single_choice' && (q.shuffledOptions || q.options) && (
                    <div className="space-y-2 pt-1 pl-1">
                      {(q.shuffledOptions || (q.options || []).map((opt, i) => ({ text: opt, originalIndex: i }))).map((optObj, optDisplayIdx) => {
                        const optText = typeof optObj === 'string' ? optObj : optObj.text;
                        const origIndex = typeof optObj === 'string' ? optDisplayIdx : optObj.originalIndex;
                        const isSelected = currentAns.selectedOptionIndex === origIndex;
                        return (
                          <label
                            key={optDisplayIdx}
                            onClick={() => handleSelectOption(q.id, origIndex)}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50/90 border-[#2D2E83] text-[#2D2E83] font-semibold ring-2 ring-[#2D2E83]/20 shadow-sm'
                                : 'bg-gray-50/70 border-gray-200/80 text-gray-800 hover:bg-blue-50/50 hover:border-blue-300'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                                isSelected
                                  ? 'border-[#2D2E83] bg-[#2D2E83] text-white'
                                  : 'border-gray-300 text-gray-500 bg-white'
                              }`}
                            >
                              {String.fromCharCode(65 + optDisplayIdx)}
                            </span>
                            <span className="flex-1">{optText}</span>
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
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 shadow-sm transition-colors placeholder:text-gray-400"
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
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 shadow-sm transition-colors resize-none placeholder:text-gray-400"
                      />
                    </div>
                  )}

                  {/* 4. ASOCIAR TÉRMINOS (MATRIZ INTERACTIVA) */}
                  {q.type === 'matching' && q.leftTerms && q.topTerms && (
                    <div className="pt-1 pl-1">
                      <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-sm">
                        <table className="min-w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-100/90">
                              <th className="p-3 text-left text-gray-700 font-semibold border-b border-r border-gray-200">
                                Términos (Izquierda \ Arriba)
                              </th>
                              {q.topTerms.map((col, cIdx) => (
                                <th key={cIdx} className="p-3 text-center text-[#2D2E83] font-bold border-b border-r border-gray-200 whitespace-nowrap">
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
                                <tr key={rIdx} className="border-b border-gray-100 hover:bg-blue-50/30">
                                  <td className="p-3 border-r border-gray-200 font-medium text-gray-800 bg-gray-50/60">
                                    {row}
                                  </td>
                                  {q.topTerms.map((_, cIdx) => {
                                    const isChecked = selectedCol === cIdx;
                                    return (
                                      <td
                                        key={cIdx}
                                        onClick={() => handleMatchCell(q.id, rIdx, cIdx)}
                                        className="p-3 text-center cursor-pointer hover:bg-blue-100/40 transition-colors"
                                      >
                                        <button
                                          type="button"
                                          className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center border transition-all ${
                                            isChecked
                                              ? 'bg-[#2D2E83] border-[#2D2E83] text-white shadow-sm'
                                              : 'border-gray-300 hover:border-gray-400 text-transparent'
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
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/90 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="text-center sm:text-left space-y-0.5">
              <p className="text-sm font-bold text-gray-900">¿Has revisado todas tus respuestas?</p>
              <p className="text-xs text-gray-500">Al enviar, tu examen será registrado en la mesa examinadora.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#2D2E83] to-[#be1322] hover:from-[#232468] hover:to-[#9c0f1b] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#2D2E83]/20 hover:shadow-xl hover:shadow-[#2D2E83]/30 transition-all active:scale-95 disabled:opacity-50"
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

      </div>
      </main>

      {/* Lightbox / Zoom de Imagen en Pantalla Completa */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-4xl max-h-[90vh] p-2">
            <img 
              src={lightboxImage} 
              alt="Imagen ampliada" 
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/20" 
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

      {/* Modales de Confirmación y Alerta integrados en la página */}
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
