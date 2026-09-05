"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Award, 
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  Construction,
  User,
  MapPin,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  Eye,
  Loader2,
  X,
  Sparkles,
  Table as TableIcon,
  Shield,
  ShieldAlert,
  AlertTriangle,
  Radio,
  RefreshCw,
  Play,
  Pause,
  Unlock,
  Download
} from 'lucide-react';
import { 
  getExaminationSessions,
  createExaminationSession,
  deleteExaminationSession,
  toggleExaminationSessionStatus,
  getDojosForExaminations,
  getWrittenExams,
  getExamSubmissions,
  gradeExamSubmission,
  deleteExamSubmission,
  getLiveProctoringData,
  resetStudentDeviceLock
} from '../../lib/actions/examinations';
import { generateExaminationActaPDF } from '../../lib/pdf/examinationActaGenerator';
import { generateSingleDiplomaPDF, generateBatchDiplomasPDF } from '../../lib/pdf/examinationDiplomaGenerator';
import ConfirmModal from '../ui/ConfirmModal';
import AlertModal from '../ui/AlertModal';
import fondoInicioNuevo from '../../assets/images/Fondo-inicio-nuevo.jpg';

export default function ExaminationsManagement({ 
  initialSessions = [], 
  initialWrittenExams = [], 
  initialDojos = [] 
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [writtenExams, setWrittenExams] = useState(initialWrittenExams);
  const [dojos, setDojos] = useState(initialDojos);
  const [isLoading, setIsLoading] = useState(false);

  // Navegación interna: 'sessions' | 'inbox' | 'grading'
  const [activeView, setActiveView] = useState('sessions');
  const [selectedSession, setSelectedSession] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Estados de carga de datos iniciales
  useEffect(() => {
    async function init() {
      try {
        const [freshSessions, freshExams, freshDojos] = await Promise.all([
          getExaminationSessions(),
          getWrittenExams(),
          getDojosForExaminations()
        ]);
        if (freshSessions) setSessions(freshSessions);
        if (freshExams) setWrittenExams(freshExams);
        if (freshDojos) setDojos(freshDojos);
      } catch (err) {
        console.error("Error sincronizando examinaciones:", err);
      }
    }

    if (initialSessions.length === 0 || initialWrittenExams.length === 0 || initialDojos.length === 0) {
      init();
    }
  }, [initialSessions, initialWrittenExams, initialDojos]);

  // Modal: Crear Convocatoria
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newWrittenExamId, setNewWrittenExamId] = useState('');
  const [selectedDojoIds, setSelectedDojoIds] = useState([]);
  const [newTimeLimitMinutes, setNewTimeLimitMinutes] = useState(0);
  const [newSecurityMode, setNewSecurityMode] = useState('audit');
  const [newNotes, setNewNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Copiado de link
  const [copiedSessionId, setCopiedSessionId] = useState(null);

  // Modales en página
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '¿Confirmar acción?',
    message: '',
    confirmText: 'Confirmar',
    isDanger: true,
    onConfirm: () => {}
  });

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: 'Atención',
    message: '',
    isError: false
  });

  const showAlert = (message, title = 'Atención', isError = false) => {
    setAlertModal({ isOpen: true, title, message, isError });
  };

  const showConfirm = ({ title, message, onConfirm, confirmText = 'Confirmar', isDanger = true }) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, confirmText, isDanger });
  };

  // --- ESTADO Y ACCIONES: SALA EN VIVO (LIVE PROCTORING) ---
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [liveSession, setLiveSession] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [isAutoRefreshLive, setIsAutoRefreshLive] = useState(true);

  // Auto-refresco en vivo cada 5 segundos
  useEffect(() => {
    if (!isLiveModalOpen || !liveSession || !isAutoRefreshLive) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await getLiveProctoringData(liveSession.id || liveSession._id);
        if (res?.success) {
          setLiveData(res);
        }
      } catch (err) {
        console.error("Error auto-refreshing live proctoring:", err);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isLiveModalOpen, liveSession, isAutoRefreshLive]);

  const handleOpenLiveModal = async (sessionToWatch) => {
    setLiveSession(sessionToWatch);
    setIsLiveModalOpen(true);
    setIsLiveLoading(true);
    try {
      const res = await getLiveProctoringData(sessionToWatch.id || sessionToWatch._id);
      if (res.success) {
        setLiveData(res);
      } else {
        showAlert("No se pudo cargar la sala en vivo: " + (res.error || ""), "Error", true);
      }
    } catch (err) {
      console.error(err);
      showAlert("Error al conectar con la sala en vivo.", "Error", true);
    } finally {
      setIsLiveLoading(false);
    }
  };

  const handleManualRefreshLive = async () => {
    if (!liveSession) return;
    setIsLiveLoading(true);
    try {
      const res = await getLiveProctoringData(liveSession.id || liveSession._id);
      if (res.success) {
        setLiveData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLiveLoading(false);
    }
  };

  const handleUnlockCandidate = (candidate) => {
    if (!liveSession || !candidate) return;
    showConfirm({
      title: "Desbloquear Aspirante",
      message: `¿Deseas desbloquear a "${candidate.studentName}" y reiniciar su contador de infracciones para que pueda continuar su examen?`,
      confirmText: "Desbloquear",
      isDanger: false,
      onConfirm: async () => {
        try {
          const res = await resetStudentDeviceLock(liveSession.id || liveSession._id, candidate.deviceToken, "Autorizado por mesa examinadora");
          if (res.success) {
            showAlert(`Aspirante "${candidate.studentName}" desbloqueado con éxito. Su prueba se reanudará en su dispositivo.`, "Aspirante Desbloqueado", false);
            handleManualRefreshLive();
          } else {
            showAlert("No se pudo desbloquear: " + (res.error || ""), "Error", true);
          }
        } catch (err) {
          console.error(err);
          showAlert("Error al comunicar el desbloqueo.", "Error", true);
        }
      }
    });
  };

  // --- GENERACIÓN DE PDF: ACTA Y DIPLOMAS ---
  const handleDownloadActa = () => {
    if (!selectedSession) return;
    try {
      generateExaminationActaPDF(selectedSession, submissions);
      showAlert("El Acta Oficial en PDF ha sido generada y descargada exitosamente.", "Acta Generada", false);
    } catch (err) {
      console.error("Error generating acta:", err);
      showAlert("Ocurrió un error al generar el Acta Oficial: " + err.message, "Error al Generar PDF", true);
    }
  };

  const handleDownloadSingleDiploma = (submission) => {
    if (!submission || !selectedSession) return;
    try {
      generateSingleDiplomaPDF(submission, selectedSession);
      showAlert(`El diploma para ${submission.studentName} ha sido generado y descargado exitosamente.`, "Diploma Generado", false);
    } catch (err) {
      console.error("Error generating diploma:", err);
      showAlert("Ocurrió un error al generar el Diploma: " + err.message, "Error al Generar PDF", true);
    }
  };

  const handleDownloadBatchDiplomas = () => {
    if (!selectedSession) return;
    try {
      generateBatchDiplomasPDF(submissions, selectedSession);
      showAlert("El lote completo de diplomas para todos los aspirantes aprobados ha sido generado y descargado.", "Diplomas en Lote", false);
    } catch (err) {
      console.error("Error generating batch diplomas:", err);
      showAlert("No se pudo generar el lote de diplomas: " + err.message, "Atención", true);
    }
  };

  // --- ACCIONES DE CONVOCATORIAS ---

  const handleOpenCreateModal = () => {
    setNewTitle('');
    setNewWrittenExamId(writtenExams.length > 0 ? (writtenExams[0].id || writtenExams[0]._id) : '');
    setSelectedDojoIds(dojos.map(d => d.id || d._id)); // Por defecto todos seleccionados
    setNewTimeLimitMinutes(0);
    setNewSecurityMode('audit');
    setNewNotes('');
    setIsCreateModalOpen(true);
  };

  const handleToggleSelectAllDojos = () => {
    if (selectedDojoIds.length === dojos.length) {
      setSelectedDojoIds([]);
    } else {
      setSelectedDojoIds(dojos.map(d => d.id || d._id));
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showAlert("Por favor ingresa el nombre de la examinación.", "Campo requerido", true);
      return;
    }
    if (!newWrittenExamId) {
      showAlert("Por favor selecciona el examen escrito base.", "Campo requerido", true);
      return;
    }
    if (selectedDojoIds.length === 0) {
      showAlert("Debes seleccionar al menos un Dojo para calificar.", "Dojo requerido", true);
      return;
    }

    const assignedDojos = dojos
      .filter(d => selectedDojoIds.includes(d.id || d._id))
      .map(d => ({ 
        id: d.id || d._id, 
        name: d.name,
        logo: d.logo || '/images/dojos/escudo.jpg'
      }));

    setIsCreating(true);
    try {
      const res = await createExaminationSession({
        title: newTitle.trim(),
        writtenExamId: newWrittenExamId,
        assignedDojos,
        timeLimitMinutes: newTimeLimitMinutes,
        securityMode: newSecurityMode,
        notes: newNotes.trim()
      });

      if (res.success && res.session) {
        setSessions([res.session, ...sessions]);
        setIsCreateModalOpen(false);
        showAlert("La examinación ha sido creada con éxito. Ya puedes copiar el link y enviarlo a los estudiantes.", "¡Examinación Creada!", false);
      } else {
        showAlert("Error al crear examinación: " + (res.error || ""), "Error", true);
      }
    } catch (err) {
      console.error(err);
      showAlert("Ocurrió un error inesperado.", "Error", true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSubmission = (submissionId, studentName, e) => {
    e?.stopPropagation();
    showConfirm({
      title: "Eliminar Entrega de Examen",
      message: `¿Estás seguro de que deseas eliminar la entrega del aspirante "${studentName}"? Esta acción borrará permanentemente sus respuestas y notas de la base de datos.`,
      confirmText: "Eliminar Entrega",
      isDanger: true,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const res = await deleteExamSubmission(submissionId);
          if (res.success) {
            const deleted = submissions.find(s => s.id === submissionId || s._id === submissionId);
            const wasPending = deleted?.status === 'submitted';

            setSubmissions(prev => prev.filter(s => s.id !== submissionId && s._id !== submissionId));

            // Actualizar conteos en la sesión seleccionada
            setSessions(prev => prev.map(sess => {
              if (sess.id === selectedSession?.id || sess._id === selectedSession?._id) {
                return {
                  ...sess,
                  totalSubmissions: Math.max(0, (sess.totalSubmissions || 1) - 1),
                  pendingSubmissions: wasPending ? Math.max(0, (sess.pendingSubmissions || 1) - 1) : sess.pendingSubmissions,
                  gradedSubmissions: !wasPending ? Math.max(0, (sess.gradedSubmissions || 1) - 1) : sess.gradedSubmissions
                };
              }
              return sess;
            }));

            if (activeView === 'grading' && (selectedSubmission?.id === submissionId || selectedSubmission?._id === submissionId)) {
              setActiveView('inbox');
              setSelectedSubmission(null);
            }

            showAlert(`La entrega de ${studentName} ha sido eliminada con éxito.`, "Entrega Eliminada", false);
          } else {
            showAlert("Error al eliminar la entrega: " + (res.error || ""), "Error", true);
          }
        } catch (err) {
          console.error(err);
          showAlert("Error al conectar con la base de datos.", "Error", true);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };


  const handleDeleteSession = (sessionId, e) => {
    e?.stopPropagation();
    showConfirm({
      title: "Eliminar Examinación",
      message: "¿Estás seguro de que deseas eliminar esta convocatoria? Se borrarán también todas las entregas de los alumnos asociadas a ella.",
      confirmText: "Eliminar",
      isDanger: true,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const res = await deleteExaminationSession(sessionId);
          if (res.success) {
            setSessions(sessions.filter(s => s.id !== sessionId && s._id !== sessionId));
            showAlert("Examinación eliminada correctamente.", "Eliminada", false);
          } else {
            showAlert("Error al eliminar: " + (res.error || ""), "Error", true);
          }
        } catch (err) {
          console.error(err);
          showAlert("Error al conectar con la base de datos.", "Error", true);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleToggleStatus = async (sessionId, e) => {
    e?.stopPropagation();
    try {
      const res = await toggleExaminationSessionStatus(sessionId);
      if (res.success) {
        setSessions(sessions.map(s => {
          if (s.id === sessionId || s._id === sessionId) {
            return { ...s, status: res.status };
          }
          return s;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = async (session, e) => {
    e?.stopPropagation();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/examinations/take/${session.accessCode}`;
    
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedSessionId(session.id || session._id);
      setTimeout(() => setCopiedSessionId(null), 2500);
    } catch (err) {
      console.warn("Clipboard write failed, using fallback:", err);
      try {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedSessionId(session.id || session._id);
        setTimeout(() => setCopiedSessionId(null), 2500);
      } catch (e2) {
        console.error("Copy failed:", e2);
      }
    }
  };

  // --- BANDEJA DE ENTREGAS ---

  const handleOpenInbox = async (session) => {
    setSelectedSession(session);
    setIsLoading(true);
    setActiveView('inbox');
    try {
      const freshSubmissions = await getExamSubmissions(session.id || session._id);
      setSubmissions(freshSubmissions || []);
    } catch (err) {
      console.error(err);
      showAlert("Error al cargar las entregas recibidas.", "Error", true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- CALIFICADOR DE ENTREGA INDIVIDUAL ---

  // Estado del calificador para la entrega seleccionada
  const [answersGrading, setAnswersGrading] = useState([]);
  const [senseiFeedback, setSenseiFeedback] = useState('');
  const [passedStatus, setPassedStatus] = useState(true);
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  const handleOpenGrading = (submission) => {
    setSelectedSubmission(submission);
    setSenseiFeedback(submission.senseiFeedback || '');
    setPassedStatus(submission.passed !== null ? submission.passed : (submission.percentage >= 70));

    // Inicializar estado de notas por pregunta
    const initGrading = (submission.answers || []).map(ans => ({
      questionId: ans.questionId,
      earnedPoints: ans.earnedPoints ?? (ans.isCorrect ? 1 : 0),
      senseiComments: ans.senseiComments || ''
    }));
    setAnswersGrading(initGrading);

    setActiveView('grading');
  };

  const handlePointsChange = (qId, points) => {
    setAnswersGrading(prev => prev.map(item => {
      if (item.questionId === qId) {
        return { ...item, earnedPoints: Math.max(0, parseFloat(points) || 0) };
      }
      return item;
    }));
  };

  const handleCommentsChange = (qId, comments) => {
    setAnswersGrading(prev => prev.map(item => {
      if (item.questionId === qId) {
        return { ...item, senseiComments: comments };
      }
      return item;
    }));
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setIsSavingGrade(true);
    try {
      const res = await gradeExamSubmission(selectedSubmission.id || selectedSubmission._id, {
        answersGrading,
        senseiFeedback,
        passed: passedStatus,
        gradedBy: 'Sensei ISKF'
      });

      if (res.success) {
        // Actualizar en el estado local de submissions
        setSubmissions(prev => prev.map(s => {
          if (s.id === selectedSubmission.id || s._id === selectedSubmission._id) {
            return {
              ...s,
              status: 'graded',
              totalScore: res.submission.totalScore,
              percentage: res.submission.percentage,
              passed: res.submission.passed,
              senseiFeedback
            };
          }
          return s;
        }));

        // Actualizar conteos en la lista de sessions
        setSessions(prev => prev.map(sess => {
          if (sess.id === selectedSession.id || sess._id === selectedSession._id) {
            return {
              ...sess,
              pendingSubmissions: Math.max(0, (sess.pendingSubmissions || 1) - 1),
              gradedSubmissions: (sess.gradedSubmissions || 0) + 1
            };
          }
          return sess;
        }));

        showAlert("La calificación ha sido asentada y guardada correctamente.", "Calificación Guardada", false);
        setActiveView('inbox');
        setSelectedSubmission(null);
      } else {
        showAlert("Error al guardar la calificación: " + (res.error || ""), "Error", true);
      }
    } catch (err) {
      console.error(err);
      showAlert("Error al conectar con la base de datos.", "Error", true);
    } finally {
      setIsSavingGrade(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pt-2 pb-16">

      {/* Indicador de carga sutil */}
      {isLoading && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900/90 text-white text-xs px-4 py-2.5 rounded-xl border border-neutral-700 shadow-xl flex items-center gap-2 backdrop-blur-md">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
          <span>Sincronizando con base de datos...</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 1: LISTADO DE CONVOCATORIAS / SESIONES DE EXAMINACIÓN */}
      {/* ========================================================================= */}
      {activeView === 'sessions' && (
        <div className="space-y-8">
          {/* Header Principal */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-500/20 text-iskf-red text-xs font-semibold uppercase tracking-widest font-mono">
                <Layers className="w-3.5 h-3.5" />
                Panel de Examinaciones ISKF
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Convocatorias de Examen
              </h1>
              <p className="text-neutral-400 text-xs md:text-sm max-w-2xl">
                Crea sesiones oficiales vinculando los Dojos convocados. Comparte el enlace directo con los alumnos y recibe sus respuestas en la bandeja para calificarlas.
              </p>
            </div>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#2D2E83] to-[#be1322] hover:from-[#232468] hover:to-[#9c0f1b] text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-[#2D2E83]/20 active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nueva Convocatoria
            </button>
          </div>

          {/* Lista de Convocatorias Creadas */}
          <div className="space-y-4">
            {sessions.map((sess) => {
              const origin = typeof window !== 'undefined' ? window.location.origin : '';
              const linkUrl = `${origin}/examinations/take/${sess.accessCode}`;
              const isCopied = copiedSessionId === (sess.id || sess._id);

              return (
                <div
                  key={sess.id || sess._id}
                  className="bg-neutral-800/80 border border-neutral-700/80 rounded-3xl p-6 space-y-4 shadow-xl hover:border-neutral-600 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-lg md:text-xl font-bold text-white">
                          {sess.title}
                        </h3>
                        <button
                          onClick={(e) => handleToggleStatus(sess.id || sess._id, e)}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase transition-colors ${
                            sess.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-neutral-700/40 text-neutral-400 border border-neutral-600 hover:bg-neutral-700'
                          }`}
                          title="Clic para cambiar estado"
                        >
                          {sess.status === 'active' ? '● Activa' : '○ Cerrada'}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 pt-1">
                        <span className="font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-lg">
                          {sess.writtenExamName}
                        </span>
                        <span>•</span>
                        {sess.timeLimitMinutes > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {sess.timeLimitMinutes} min límite
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 bg-neutral-900/80 border border-neutral-700/60 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            Sin límite de tiempo
                          </span>
                        )}
                        <span>•</span>
                        {sess.securityMode === 'strict' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
                            <ShieldAlert className="w-3 h-3 text-red-400" />
                            Seguridad Estricta
                          </span>
                        )}
                        {sess.securityMode === 'warnings' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            <Shield className="w-3 h-3 text-amber-400" />
                            Seguridad: 3 Intentos
                          </span>
                        )}
                        {(!sess.securityMode || sess.securityMode === 'audit') && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 bg-neutral-900/80 border border-neutral-700/60 px-2 py-0.5 rounded-md">
                            <Shield className="w-3 h-3 text-neutral-500" />
                            Seguridad: Auditoría
                          </span>
                        )}
                        <span>•</span>
                        <span>Dojos convocados:</span>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {(sess.assignedDojos || []).map((d, dIdx) => (
                            <span key={dIdx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900/80 text-neutral-300 rounded-lg border border-neutral-700/60 text-[11px]">
                              <img
                                src={d.logo || '/images/dojos/escudo.jpg'}
                                alt={`Escudo ${d.name}`}
                                className="w-3.5 h-3.5 rounded-full object-contain bg-neutral-950 shrink-0"
                                onError={(e) => { e.currentTarget.src = '/images/dojos/escudo.jpg'; }}
                              />
                              <span className="font-medium">{d.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción rápida */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenLiveModal(sess)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all shadow cursor-pointer active:scale-95"
                        title="Monitorear aspirantes rindiendo examen en vivo"
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <Radio className="w-3.5 h-3.5" />
                        <span>Sala en Vivo</span>
                      </button>

                      <button
                        onClick={() => handleOpenInbox(sess)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl text-xs font-semibold transition-colors shadow cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>Bandeja de Entregas ({sess.totalSubmissions || 0})</span>
                      </button>

                      <button
                        onClick={(e) => handleDeleteSession(sess.id || sess._id, e)}
                        className="p-2.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20 cursor-pointer"
                        title="Eliminar convocatoria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Caja de Enlace Copiable para el Estudiante */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-neutral-900/80 border border-neutral-700/60 rounded-2xl">
                    <div className="flex items-center gap-2 text-xs text-neutral-400 w-full sm:w-auto truncate">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-neutral-500 shrink-0">Link para alumnos:</span>
                      <span className="font-mono text-white select-all truncate">{linkUrl}</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {sess.pendingSubmissions > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium shrink-0 animate-pulse">
                          {sess.pendingSubmissions} por calificar
                        </span>
                      )}

                      <button
                        onClick={(e) => handleCopyLink(sess, e)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                          isCopied
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>¡Link Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {sessions.length === 0 && (
              <div className="p-12 text-center border border-dashed border-neutral-800 rounded-3xl bg-neutral-900/30 space-y-4">
                <Award className="w-12 h-12 text-neutral-600 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">No hay convocatorias activas</h3>
                  <p className="text-neutral-400 text-xs max-w-sm mx-auto">
                    Crea una examinación seleccionando qué Dojos calificarás y qué examen escrito deberán resolver los alumnos.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#2D2E83] to-[#be1322] hover:from-[#232468] hover:to-[#9c0f1b] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  + Crear Primera Convocatoria
                </button>
              </div>
            )}
          </div>

          {/* Accesos a Módulos Base (Constructor y Técnico) */}
          <div className="pt-6 border-t border-neutral-800 space-y-4">
            <h2 className="text-xs uppercase font-bold text-neutral-400 tracking-wider">
              Módulos y Configuración de Evaluaciones
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/admin/examinations/written"
                className="group bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all flex items-center justify-between shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                      Banco de Exámenes Escritos
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Confeccionar y editar preguntas teóricas, matrices de asociar e imágenes.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" />
              </Link>

              <Link
                href="/admin/examinations/technical"
                className="group bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-2xl p-6 transition-all flex items-center justify-between shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Construction className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                      Exámenes Técnicos en Tatami
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Rúbricas de Kihon, Kata y Kumite ante el Tribunal Oficial (En Construcción).
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: BANDEJA DE ENTREGAS (POOL DE ALUMNOS DE UNA CONVOCATORIA) */}
      {/* ========================================================================= */}
      {activeView === 'inbox' && selectedSession && (
        <div className="space-y-6">
          {/* Header de la Bandeja */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
            <div className="space-y-1">
              <button
                onClick={() => setActiveView('sessions')}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a Convocatorias
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Bandeja de Entregas: {selectedSession.title}
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {submissions.length} recibidas
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Examen base: <strong className="text-neutral-200">{selectedSession.writtenExamName}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleOpenLiveModal(selectedSession)}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Abrir sala de monitoreo en tiempo real"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Radio className="w-3.5 h-3.5" />
                <span>Sala en Vivo</span>
              </button>

              <button
                onClick={handleDownloadActa}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-semibold transition-all shadow cursor-pointer active:scale-95"
                title="Descargar Acta Oficial en PDF para el Tribunal Examinador"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Acta Oficial (PDF)</span>
              </button>

              {submissions.some(s => s.passed === true) && (
                <button
                  onClick={handleDownloadBatchDiplomas}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-semibold transition-all shadow cursor-pointer active:scale-95"
                  title="Descargar todos los diplomas de aspirantes aprobados en un solo PDF"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Diplomas en Lote ({submissions.filter(s => s.passed === true).length})</span>
                </button>
              )}

              <button
                onClick={() => handleOpenInbox(selectedSession)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Refrescar
              </button>
            </div>
          </div>

          {/* Tabla de Entregas */}
          <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-900 border-b border-neutral-700 text-neutral-400 font-semibold uppercase tracking-wider">
                    <th className="p-4">Aspirante</th>
                    <th className="p-4">Dojo</th>
                    <th className="p-4">Kyu / Grado</th>
                    <th className="p-4">Fecha de Envío</th>
                    <th className="p-4">Seguridad</th>
                    <th className="p-4">Estado / Calificación</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-700/60">
                  {submissions.map((sub) => {
                    const isGraded = sub.status === 'graded';

                    return (
                      <tr key={sub.id || sub._id} className="hover:bg-neutral-700/30 transition-colors">
                        <td className="p-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>{sub.studentName}</span>
                          </div>
                          {sub.isAutoSubmitted && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded mt-1">
                              <Clock className="w-2.5 h-2.5" />
                              Límite de tiempo
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-neutral-300">
                          {sub.studentDojo}
                        </td>
                        <td className="p-4 text-neutral-400">
                          {sub.studentRank || '—'}
                        </td>
                        <td className="p-4 text-neutral-400 font-mono">
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('es-CR') : '—'}
                        </td>
                        <td className="p-4">
                          {sub.closedBySecurity ? (
                            <span 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20"
                              title={sub.securityReport || "Examen cerrado por seguridad"}
                            >
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                              <span>Anulado ({sub.securityViolationsCount || 1} salidas)</span>
                            </span>
                          ) : sub.securityViolationsCount > 0 ? (
                            <span 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              title={sub.securityReport || `${sub.securityViolationsCount} salidas registradas`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>{sub.securityViolationsCount} {sub.securityViolationsCount === 1 ? 'salida' : 'salidas'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Sin incidencias</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {isGraded ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Check className="w-3 h-3" />
                              Nota: {sub.percentage}% ({sub.passed ? 'Aprobado' : 'Reprobado'})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3" />
                              Por Calificar (Auto: {sub.autoScore} pts)
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {sub.passed === true && (
                              <button
                                onClick={() => handleDownloadSingleDiploma(sub)}
                                title="Descargar Diploma Oficial en PDF"
                                className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors border border-amber-500/30 cursor-pointer"
                              >
                                <Award className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenGrading(sub)}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow active:scale-95 cursor-pointer"
                            >
                              {isGraded ? 'Revisar / Editar' : 'Calificar'}
                            </button>
                            <button
                              onClick={(e) => handleDeleteSubmission(sub.id || sub._id, sub.studentName, e)}
                              title="Eliminar entrega de examen"
                              className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {submissions.length === 0 && (
              <div className="p-12 text-center text-neutral-500 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-neutral-600" />
                <p className="text-sm font-semibold text-neutral-400">Aún no se han recibido exámenes en esta bandeja.</p>
                <p className="text-xs text-neutral-500">
                  Comparte el link con los estudiantes para que puedan resolver el cuestionario.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: CALIFICADOR DE EXAMEN INDIVIDUAL */}
      {/* ========================================================================= */}
      {activeView === 'grading' && selectedSubmission && (
        <form onSubmit={handleSaveGrade} className="space-y-6">
          {/* Header de Calificación */}
          <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveView('inbox')}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a Bandeja de Entregas
              </button>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Calificando a: {selectedSubmission.studentName}
              </h1>
              <p className="text-xs text-neutral-400">
                Dojo: <strong className="text-neutral-200">{selectedSubmission.studentDojo}</strong> • Entregado: {new Date(selectedSubmission.submittedAt).toLocaleString('es-CR')}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] uppercase font-semibold text-neutral-400 block">Puntos Acumulados</span>
                <span className="text-2xl font-extrabold text-blue-400">
                  {answersGrading.reduce((acc, curr) => acc + (curr.earnedPoints || 0), 0)} / {selectedSubmission.answers?.length || 0}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSavingGrade}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isSavingGrade ? 'Guardando...' : 'Asentar Calificación'}
              </button>
            </div>
          </div>

          {/* Tarjeta de Auditoría de Seguridad e Integridad */}
          {(selectedSubmission.securityViolationsCount > 0 || selectedSubmission.closedBySecurity) ? (
            <div className={`border rounded-3xl p-5 shadow-lg space-y-2 ${
              selectedSubmission.closedBySecurity
                ? 'bg-red-950/40 border-red-500/40 text-red-200'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}>
              <div className="flex items-center gap-2.5 font-bold text-sm">
                {selectedSubmission.closedBySecurity ? (
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <span>
                  {selectedSubmission.closedBySecurity
                    ? `Atención: Examen anulado y cerrado por infracción de seguridad (${selectedSubmission.securityViolationsCount} salidas registradas)`
                    : `Registro de Incidencias de Navegación: ${selectedSubmission.securityViolationsCount} ${selectedSubmission.securityViolationsCount === 1 ? 'salida detectada' : 'salidas detectadas'}`}
                </span>
              </div>
              {selectedSubmission.securityReport && (
                <p className="text-xs opacity-90 pl-7 font-mono">
                  {selectedSubmission.securityReport}
                </p>
              )}
              <p className="text-[11px] text-neutral-400 pl-7">
                {selectedSubmission.closedBySecurity
                  ? 'El examen fue concluido de manera forzada por el protocolo anti-trampa y el enlace del dispositivo quedó inhabilitado.'
                  : 'El estudiante alternó de ventana o pestaña durante la resolución del cuestionario oficial.'}
              </p>
            </div>
          ) : (
            <div className="bg-neutral-900/60 border border-neutral-700/60 rounded-2xl px-5 py-3 text-xs text-neutral-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Auditoría de Integridad:</strong> Sin incidencias de cambio de ventana reportadas durante la prueba.</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">0 salidas de foco</span>
            </div>
          )}

          {/* Lista de Preguntas y Respuestas del Alumno */}
          <div className="space-y-5">
            {(selectedSubmission.answers || []).map((ans, idx) => {
              const currentGrade = answersGrading.find(g => g.questionId === ans.questionId) || {};

              return (
                <div
                  key={ans.questionId || idx}
                  className="bg-neutral-800/80 border border-neutral-700/80 rounded-3xl p-6 space-y-4 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-xl bg-neutral-900 border border-neutral-700 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-[11px] uppercase font-semibold text-neutral-400 font-mono tracking-wider">
                          {ans.questionType === 'single_choice' && 'Selección Única'}
                          {ans.questionType === 'short_answer' && 'Respuesta Breve'}
                          {ans.questionType === 'long_answer' && 'Desarrollo Escrito'}
                          {ans.questionType === 'matching' && 'Asociación de Términos'}
                        </span>
                        <p className="text-sm font-semibold text-white mt-1">
                          {ans.questionText || `Pregunta #${idx + 1}`}
                        </p>
                      </div>
                    </div>

                    {/* Badge de Puntuación */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-neutral-400">Puntos:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={currentGrade.earnedPoints ?? 0}
                        onChange={(e) => handlePointsChange(ans.questionId, e.target.value)}
                        className="w-16 px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-xl text-center font-bold text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Detalle de Respuesta según Tipo */}
                  {ans.questionType === 'single_choice' && (
                    <div className="bg-neutral-900/60 border border-neutral-700/60 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Opción elegida por el alumno:</span>
                        <span className="font-bold text-white">
                          Opción {ans.selectedOptionIndex !== null ? String.fromCharCode(65 + ans.selectedOptionIndex) : 'Sin responder'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {ans.isCorrect ? (
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            Respuesta acertada (Autocalificada +1 pt)
                          </span>
                        ) : (
                          <span className="text-red-400 flex items-center gap-1 font-semibold">
                            <X className="w-3.5 h-3.5" />
                            Respuesta errónea (0 pts)
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {(ans.questionType === 'short_answer' || ans.questionType === 'long_answer') && (
                    <div className="space-y-2">
                      <div className="bg-neutral-900/80 border border-neutral-700/80 rounded-2xl p-4 text-xs text-neutral-200">
                        <span className="text-neutral-400 block mb-1 font-semibold uppercase text-[10px]">
                          Respuesta escrita del alumno:
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed text-sm">
                          {ans.writtenAnswer ? ans.writtenAnswer : <em className="text-neutral-500">Dejada en blanco</em>}
                        </p>
                      </div>

                      <input
                        type="text"
                        placeholder="Observación o nota del Sensei para esta respuesta..."
                        value={currentGrade.senseiComments || ''}
                        onChange={(e) => handleCommentsChange(ans.questionId, e.target.value)}
                        className="w-full px-3.5 py-2 bg-neutral-900/60 border border-neutral-700 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}

                  {ans.questionType === 'matching' && (
                    <div className="bg-neutral-900/60 border border-neutral-700/60 rounded-2xl p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Matriz de términos asociados:</span>
                        <span className={ans.isCorrect ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {ans.earnedPoints} / 1 pts obtenidos
                        </span>
                      </div>
                      <p className="text-neutral-400 text-[11px]">
                        Las coincidencias fueron evaluadas automáticamente contra la matriz oficial del examen.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Veredicto y Feedback General */}
          <div className="bg-neutral-800/90 border border-neutral-700/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
            <h3 className="text-base font-bold text-white">
              Veredicto del Tribunal Examinador
            </h3>

            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs text-neutral-400">Resolución:</span>
              <button
                type="button"
                onClick={() => setPassedStatus(true)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  passedStatus
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}
              >
                Aprobado (Pase de Grado)
              </button>
              <button
                type="button"
                onClick={() => setPassedStatus(false)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  !passedStatus
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}
              >
                No Aprobado (Reprobado)
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-neutral-400">
                Observaciones Generales / Devolución para el Aspirante
              </label>
              <textarea
                rows={3}
                placeholder="Escribe comentarios sobre la solidez teórica, áreas de mejora en terminología, kata o filosofía..."
                value={senseiFeedback}
                onChange={(e) => setSenseiFeedback(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => handleDeleteSubmission(selectedSubmission.id || selectedSubmission._id, selectedSubmission.studentName, e)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-semibold transition-colors border border-transparent hover:border-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar esta Entrega</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setActiveView('inbox')}
                  className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingGrade}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSavingGrade ? 'Guardando en BD...' : 'Finalizar y Asentar Calificación'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR NUEVA CONVOCATORIA (EXAMINACIÓN) */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[500] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="relative overflow-hidden bg-white/95 backdrop-blur-2xl border border-gray-200/90 rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.3)] my-auto animate-in fade-in zoom-in-95 duration-200 text-gray-900">
            {/* Marca de agua / fondo sutil ISKF con el fondo oficial */}
            <div className="absolute inset-0 z-0 pointer-events-none select-none opacity-[0.08] overflow-hidden">
              <img
                src={fondoInicioNuevo?.src || fondoInicioNuevo}
                alt="ISKF Background"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Cabecera Fija del Modal (Nunca se corta arriba) */}
            <div className="relative z-10 flex justify-between items-center border-b border-gray-200/80 px-6 sm:px-8 py-4 shrink-0 bg-white/85 backdrop-blur-md">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                  <img
                    src="/images/dojos/escudo.jpg"
                    alt="ISKF"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#be1322] font-bold">
                      ISKF Karate Do • Gestión Oficial
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-[#2D2E83] tracking-tight truncate">
                    Nueva Convocatoria de Examinación
                  </h3>
                  <p className="text-xs text-gray-500 font-medium truncate">
                    Configura el examen teórico y selecciona los Dojos convocados.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer shrink-0 ml-2"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="relative z-10 flex flex-col flex-1 min-h-0">
              {/* Cuerpo del Formulario con scroll independiente y espaciado perfecto */}
              <div className="overflow-y-auto px-6 sm:px-8 py-5 space-y-5 flex-1">
                {/* Título */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-bold text-gray-700 tracking-wider">
                    Nombre de la Convocatoria *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: I Convocatoria Nacional de Pases de Grado 2026"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 shadow-sm transition-all placeholder:text-gray-400 font-medium"
                  />
                </div>

                {/* Examen Escrito Base */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-bold text-gray-700 tracking-wider">
                    Examen Escrito Base (Cuestionario a aplicar) *
                  </label>
                  <select
                    required
                    value={newWrittenExamId}
                    onChange={(e) => setNewWrittenExamId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 shadow-sm transition-all cursor-pointer font-medium"
                  >
                    {writtenExams.map((ex) => (
                      <option key={ex.id || ex._id} value={ex.id || ex._id}>
                        {ex.name}{ex.targetRanks ? ` • ${ex.targetRanks}` : ''} ({ex.questions ? ex.questions.length : 0} preguntas)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dojos a Calificar (Desde Base de Datos) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs uppercase font-bold text-gray-700 tracking-wider">
                      Dojos Convocados a Calificar * ({selectedDojoIds.length} seleccionados)
                    </label>
                    <button
                      type="button"
                      onClick={handleToggleSelectAllDojos}
                      className="text-xs text-[#2D2E83] hover:text-[#be1322] font-bold transition-colors cursor-pointer"
                    >
                      {selectedDojoIds.length === dojos.length ? 'Desmarcar todos' : 'Seleccionar todos'}
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-gray-200/90 rounded-2xl p-2.5 bg-gray-50/80 space-y-1.5 shadow-inner">
                    {dojos.map((dojo) => {
                      const dojoId = dojo.id || dojo._id;
                      const isChecked = selectedDojoIds.includes(dojoId);

                      return (
                        <label
                          key={dojoId}
                          className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-blue-50/90 border border-[#2D2E83]/40 shadow-sm'
                              : 'bg-white/80 hover:bg-blue-50/40 border border-gray-200/70 hover:border-blue-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedDojoIds(selectedDojoIds.filter(id => id !== dojoId));
                              } else {
                                setSelectedDojoIds([...selectedDojoIds, dojoId]);
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-[#2D2E83] focus:ring-[#2D2E83]/20 bg-white shrink-0 cursor-pointer accent-[#2D2E83]"
                          />
                          {/* Escudo del Dojo */}
                          <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                            <img
                              src={dojo.logo || '/images/dojos/escudo.jpg'}
                              alt={`Escudo ${dojo.name}`}
                              className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.src = '/images/dojos/escudo.jpg'; }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`font-bold block text-xs truncate ${isChecked ? 'text-[#2D2E83]' : 'text-gray-900'}`}>
                              {dojo.name}
                            </span>
                            <span className="text-[11px] text-gray-500 block truncate">
                              {dojo.province || 'Costa Rica'} • Sensei: {dojo.sensei || 'ISKF'}
                            </span>
                          </div>
                          {isChecked && (
                            <Check className="w-4 h-4 text-[#2D2E83] shrink-0" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Tiempo Límite para Resolver */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs uppercase font-bold text-gray-700 tracking-wider">
                      Tiempo Límite para Resolver
                    </label>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      {newTimeLimitMinutes > 0 ? `${newTimeLimitMinutes} min configurados` : 'Sin límite de tiempo'}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: 'Sin Límite', val: 0 },
                      { label: '30 min', val: 30 },
                      { label: '45 min', val: 45 },
                      { label: '60 min', val: 60 },
                      { label: '90 min', val: 90 },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setNewTimeLimitMinutes(p.val)}
                        className={`py-2 px-1 text-xs rounded-xl font-medium border text-center transition-all cursor-pointer ${
                          newTimeLimitMinutes === p.val
                            ? 'bg-blue-50 border-[#2D2E83] text-[#2D2E83] font-bold shadow-sm ring-1 ring-[#2D2E83]/30'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-xs text-gray-600">
                    <span className="text-[11px] text-gray-600 font-medium">O personalizar minutos:</span>
                    <input
                      type="number"
                      min="0"
                      max="300"
                      placeholder="Minutos"
                      value={newTimeLimitMinutes || ''}
                      onChange={(e) => setNewTimeLimitMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-24 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 shadow-sm"
                    />
                    <span className="text-[11px] text-gray-500 font-medium">minutos (0 = libre)</span>
                  </div>

                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    El cronómetro iniciará de manera individual cuando cada alumno abra su enlace. Al finalizar el tiempo, las respuestas se enviarán automáticamente y el enlace quedará bloqueado.
                  </p>
                </div>

                {/* Modo de Seguridad Anti-Trampa */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs uppercase font-bold text-gray-700 tracking-wider">
                      Protocolo de Seguridad Anti-Trampa *
                    </label>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                      {newSecurityMode === 'audit' && 'Modo Auditoría'}
                      {newSecurityMode === 'warnings' && 'Modo 3 Intentos'}
                      {newSecurityMode === 'strict' && 'Modo Estricto'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Opción 1: Auditoría */}
                    <button
                      type="button"
                      onClick={() => setNewSecurityMode('audit')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        newSecurityMode === 'audit'
                          ? 'bg-blue-50/90 border-[#2D2E83] ring-1 ring-[#2D2E83]/50 shadow-sm text-gray-900'
                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-[#2D2E83]" />
                            Auditoría
                          </span>
                          {newSecurityMode === 'audit' && (
                            <Check className="w-3.5 h-3.5 text-[#2D2E83]" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 leading-tight">
                          Permite salir de la ventana. Registra silenciosamente cada salida y avisa al evaluador para llamar la atención.
                        </p>
                      </div>
                    </button>

                    {/* Opción 2: 3 Intentos */}
                    <button
                      type="button"
                      onClick={() => setNewSecurityMode('warnings')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        newSecurityMode === 'warnings'
                          ? 'bg-amber-50/90 border-amber-500 ring-1 ring-amber-500/50 shadow-sm text-gray-900'
                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-amber-600" />
                            3 Intentos
                          </span>
                          {newSecurityMode === 'warnings' && (
                            <Check className="w-3.5 h-3.5 text-amber-600" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 leading-tight">
                          Alerta en pantalla en salidas 1 y 2. A la 3ª salida detectada, cierra y anula el examen bloqueando el link.
                        </p>
                      </div>
                    </button>

                    {/* Opción 3: Estricto */}
                    <button
                      type="button"
                      onClick={() => setNewSecurityMode('strict')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        newSecurityMode === 'strict'
                          ? 'bg-red-50/90 border-[#be1322] ring-1 ring-[#be1322]/50 shadow-sm text-gray-900'
                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-[#be1322]" />
                            Estricto
                          </span>
                          {newSecurityMode === 'strict' && (
                            <Check className="w-3.5 h-3.5 text-[#be1322]" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 leading-tight">
                          Pantalla completa obligatoria y anti-copia activo. Cualquier intento de minimizar o salir cancela y bloquea la prueba.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-bold text-gray-700 tracking-wider">
                    Notas Internas (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Instrucciones o recordatorios para el tribunal examinador..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 shadow-sm resize-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Pie de Acciones Fijo (Siempre accesible y visible) */}
              <div className="flex justify-end gap-3 border-t border-gray-200/80 px-6 sm:px-8 py-4 shrink-0 bg-white/85 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-7 py-2.5 bg-gradient-to-r from-[#2D2E83] to-[#be1322] hover:from-[#232468] hover:to-[#9c0f1b] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#2D2E83]/20 hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isCreating ? 'Creando Convocatoria...' : 'Crear y Generar Link'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SALA DE EXAMEN EN VIVO (LIVE PROCTORING) */}
      {/* ========================================================================= */}
      {isLiveModalOpen && liveSession && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto">
          <div className="relative overflow-hidden bg-neutral-900 border border-neutral-700/80 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200 text-white">
            
            {/* Header de la Sala en Vivo */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 shrink-0 bg-neutral-950/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Mesa Examinadora en Vivo
                    </span>
                    <span className="text-xs text-neutral-400 truncate font-medium">
                      {liveSession.title}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight truncate">
                    Monitoreo y Control de Aspirantes
                  </h3>
                </div>
              </div>

              {/* Controles de Refresco */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAutoRefreshLive(!isAutoRefreshLive)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                    isAutoRefreshLive
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                  title={isAutoRefreshLive ? "Pausar auto-actualización" : "Activar auto-actualización cada 5s"}
                >
                  {isAutoRefreshLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isAutoRefreshLive ? 'En vivo (5s)' : 'Pausado'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualRefreshLive}
                  disabled={isLiveLoading}
                  className="p-2 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all border border-neutral-700 cursor-pointer disabled:opacity-50"
                  title="Refrescar datos ahora"
                >
                  <RefreshCw className={`w-4 h-4 ${isLiveLoading ? 'animate-spin text-blue-400' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => { setIsLiveModalOpen(false); setLiveData(null); }}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer ml-1"
                  title="Cerrar sala en vivo"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido con scroll independiente */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              
              {/* Tarjetas de Métricas en Vivo */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-neutral-800/60 border border-neutral-700/60 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] font-semibold text-neutral-400 block uppercase tracking-wider">
                    Total Conectados
                  </span>
                  <div className="text-2xl font-black text-white">
                    {liveData?.metrics?.totalConnected ?? (isLiveLoading ? '...' : 0)}
                  </div>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-400 block uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Rindiendo Ahora
                  </span>
                  <div className="text-2xl font-black text-emerald-400">
                    {liveData?.metrics?.inProgress ?? (isLiveLoading ? '...' : 0)}
                  </div>
                </div>

                <div className="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] font-semibold text-blue-400 block uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-3 h-3" />
                    Entregados
                  </span>
                  <div className="text-2xl font-black text-blue-400">
                    {liveData?.metrics?.submitted ?? (isLiveLoading ? '...' : 0)}
                  </div>
                </div>

                <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-3.5 space-y-1">
                  <span className="text-[11px] font-semibold text-amber-400 block uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    Alertas Pantalla
                  </span>
                  <div className="text-2xl font-black text-amber-400">
                    {liveData?.metrics?.securityAlerts ?? (isLiveLoading ? '...' : 0)}
                  </div>
                </div>

                <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-3.5 space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-semibold text-red-400 block uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3 h-3" />
                    Bloqueados
                  </span>
                  <div className="text-2xl font-black text-red-400">
                    {liveData?.metrics?.lockedBySecurity ?? (isLiveLoading ? '...' : 0)}
                  </div>
                </div>
              </div>

              {/* Lista de Aspirantes en Vivo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-bold text-neutral-400 tracking-wider">
                    Aspirantes Detectados en la Sesión ({liveData?.candidates?.length || 0})
                  </h4>
                  <span className="text-[11px] text-neutral-500">
                    Límite: {liveSession.timeLimitMinutes > 0 ? `${liveSession.timeLimitMinutes} min` : 'Sin límite'} • Protocolo: {liveSession.securityMode || 'Auditoría'}
                  </span>
                </div>

                {isLiveLoading && !liveData && (
                  <div className="p-12 text-center text-neutral-400 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
                    <p className="text-xs">Sincronizando con los dispositivos de los aspirantes...</p>
                  </div>
                )}

                {liveData?.candidates && liveData.candidates.length === 0 && (
                  <div className="p-10 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/30 space-y-2">
                    <Radio className="w-8 h-8 mx-auto text-neutral-600" />
                    <p className="text-sm font-semibold text-neutral-300">Aún no hay aspirantes conectados en esta sala.</p>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Envíe el enlace de la convocatoria para que los alumnos ingresen y se visualicen aquí en tiempo real.
                    </p>
                  </div>
                )}

                {liveData?.candidates && liveData.candidates.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {liveData.candidates.map((cand) => {
                      const isCandidateSubmitted = cand.status === 'submitted';
                      const isLocked = cand.status === 'locked_by_security';
                      const isInProgress = cand.status === 'in_progress';
                      const isIdle = cand.status === 'idle';
                      const isExpired = cand.status === 'time_expired';

                      // Porcentaje de avance de preguntas
                      const totalQ = cand.totalQuestionsCount || 0;
                      const answeredQ = cand.answeredQuestionsCount || 0;
                      const progressPct = totalQ > 0 ? Math.min(100, Math.round((answeredQ / totalQ) * 100)) : 0;

                      // Formateo de tiempo restante
                      let timeString = 'Libre';
                      if (typeof cand.remainingSec === 'number') {
                        const m = Math.floor(cand.remainingSec / 60);
                        const s = cand.remainingSec % 60;
                        timeString = `${m}:${s < 10 ? '0' : ''}${s}`;
                      }

                      return (
                        <div
                          key={cand.id || cand.deviceToken}
                          className={`p-4 rounded-2xl border transition-all space-y-3 ${
                            isLocked
                              ? 'bg-red-950/20 border-red-500/40 shadow-sm'
                              : cand.securityViolationsCount > 0
                              ? 'bg-amber-950/15 border-amber-500/40'
                              : isCandidateSubmitted
                              ? 'bg-blue-950/15 border-blue-500/30'
                              : 'bg-neutral-800/80 border-neutral-700/80'
                          }`}
                        >
                          {/* Fila Superior: Nombre y Estado */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white truncate">
                                  {cand.studentName}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-400 truncate">
                                Dojo: <strong className="text-neutral-200">{cand.studentDojo}</strong> {cand.studentRank ? `• ${cand.studentRank}` : ''}
                              </p>
                            </div>

                            {/* Badge de Estatus */}
                            <div className="shrink-0">
                              {isInProgress && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                  En examen
                                </span>
                              )}
                              {isCandidateSubmitted && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                  <Check className="w-3 h-3" />
                                  {cand.submissionScore !== null ? `Nota: ${cand.submissionScore}%` : 'Entregado'}
                                </span>
                              )}
                              {isLocked && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
                                  <ShieldAlert className="w-3 h-3" />
                                  Bloqueado
                                </span>
                              )}
                              {isExpired && !isCandidateSubmitted && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                  <Clock className="w-3 h-3" />
                                  Tiempo vencido
                                </span>
                              )}
                              {isIdle && !isCandidateSubmitted && !isLocked && !isExpired && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-700/40 text-neutral-400 border border-neutral-600/40">
                                  ○ Segundo plano
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Avance de preguntas y tiempo */}
                          {!isCandidateSubmitted && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-400">
                                  Progreso: <strong className="text-white">{answeredQ}</strong> de {totalQ > 0 ? totalQ : '?'} preguntas
                                </span>
                                {typeof cand.remainingSec === 'number' && (
                                  <span className={`font-mono font-bold flex items-center gap-1 ${
                                    cand.remainingSec <= 300 ? 'text-red-400 animate-pulse' : 'text-amber-400'
                                  }`}>
                                    <Clock className="w-3 h-3" />
                                    {timeString}
                                  </span>
                                )}
                              </div>
                              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-300 ${
                                    isLocked ? 'bg-red-500' : progressPct === 100 ? 'bg-blue-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Indicador de Seguridad e Incidencias */}
                          <div className="flex items-center justify-between pt-1 border-t border-neutral-700/50 text-xs">
                            <div className="flex items-center gap-1.5">
                              {cand.securityViolationsCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                                  <span>{cand.securityViolationsCount} {cand.securityViolationsCount === 1 ? 'salida detectada' : 'salidas detectadas'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Sin salidas detectadas</span>
                                </span>
                              )}
                            </div>

                            {/* Botón de Desbloqueo / Reinicio para el Sensei */}
                            {(isLocked || cand.securityViolationsCount > 0) && !isCandidateSubmitted && (
                              <button
                                type="button"
                                onClick={() => handleUnlockCandidate(cand)}
                                className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-colors cursor-pointer"
                                title="Desbloquear o perdonar salidas para que el alumno pueda continuar"
                              >
                                <Unlock className="w-3 h-3" />
                                <span>Desbloquear Alumno</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer de la Sala */}
            <div className="flex items-center justify-between border-t border-neutral-800 px-6 py-3.5 shrink-0 bg-neutral-950/80 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Actualización en tiempo real activa. Los cambios en los dispositivos se sincronizan al instante.</span>
              </div>
              <button
                type="button"
                onClick={() => { setIsLiveModalOpen(false); setLiveData(null); }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Cerrar Sala
              </button>
            </div>
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

    </div>
  );
}
