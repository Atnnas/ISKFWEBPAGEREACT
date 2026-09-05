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
  AlertTriangle
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
  deleteExamSubmission
} from '../../lib/actions/examinations';
import ConfirmModal from '../ui/ConfirmModal';
import AlertModal from '../ui/AlertModal';

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
      .map(d => ({ id: d.id || d._id, name: d.name }));

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
              className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 active:scale-95 shrink-0"
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
                        <div className="flex flex-wrap gap-1">
                          {(sess.assignedDojos || []).map((d, dIdx) => (
                            <span key={dIdx} className="px-2 py-0.5 bg-neutral-900/80 text-neutral-300 rounded-md border border-neutral-700/60 text-[11px]">
                              {d.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción rápida */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenInbox(sess)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl text-xs font-semibold transition-colors shadow"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>Bandeja de Entregas ({sess.totalSubmissions || 0})</span>
                      </button>

                      <button
                        onClick={(e) => handleDeleteSession(sess.id || sess._id, e)}
                        className="p-2.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow"
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenInbox(selectedSession)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Refrescar Bandeja
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
                            <button
                              onClick={() => handleOpenGrading(sub)}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow active:scale-95"
                            >
                              {isGraded ? 'Revisar / Editar' : 'Calificar'}
                            </button>
                            <button
                              onClick={(e) => handleDeleteSubmission(sub.id || sub._id, sub.studentName, e)}
                              title="Eliminar entrega de examen"
                              className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-white">
                  Nueva Convocatoria de Examinación
                </h3>
                <p className="text-xs text-neutral-400">
                  Configura el examen y selecciona qué Dojos serán calificados.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              {/* Título */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-neutral-400">
                  Nombre de la Convocatoria *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: I Convocatoria Nacional de Pases de Grado 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Examen Escrito Base */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-neutral-400">
                  Examen Escrito Base (Cuestionario a aplicar) *
                </label>
                <select
                  required
                  value={newWrittenExamId}
                  onChange={(e) => setNewWrittenExamId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
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
                  <label className="block text-xs uppercase font-semibold text-neutral-400">
                    Dojos Convocados a Calificar * ({selectedDojoIds.length} seleccionados)
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleSelectAllDojos}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    {selectedDojoIds.length === dojos.length ? 'Desmarcar todos' : 'Seleccionar todos'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto border border-neutral-700/80 rounded-2xl p-3 bg-neutral-950/60 space-y-2 divide-y divide-neutral-800">
                  {dojos.map((dojo) => {
                    const dojoId = dojo.id || dojo._id;
                    const isChecked = selectedDojoIds.includes(dojoId);

                    return (
                      <label
                        key={dojoId}
                        className="flex items-center gap-3 pt-2 first:pt-0 cursor-pointer text-xs text-neutral-200 hover:text-white"
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
                          className="w-4 h-4 rounded border-neutral-700 text-blue-600 focus:ring-0 bg-neutral-800"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-white block">{dojo.name}</span>
                          <span className="text-[11px] text-neutral-500">{dojo.province || 'Costa Rica'} • Sensei: {dojo.sensei || 'ISKF'}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Tiempo Límite para Resolver */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs uppercase font-semibold text-neutral-400">
                    Tiempo Límite para Resolver
                  </label>
                  <span className="text-[11px] font-mono text-neutral-400">
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
                      className={`py-2 px-1 text-xs rounded-xl font-medium border text-center transition-all ${
                        newTimeLimitMinutes === p.val
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold shadow-sm'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs text-neutral-400">
                  <span className="text-[11px] text-neutral-400">O personalizar minutos:</span>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    placeholder="Minutos"
                    value={newTimeLimitMinutes || ''}
                    onChange={(e) => setNewTimeLimitMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-24 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-neutral-500">minutos (0 = libre)</span>
                </div>

                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  El cronómetro iniciará de manera individual cuando cada alumno abra su enlace. Al finalizar el tiempo, las respuestas se enviarán automáticamente y el enlace quedará bloqueado.
                </p>
              </div>

              {/* Modo de Seguridad Anti-Trampa */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs uppercase font-semibold text-neutral-400">
                    Protocolo de Seguridad Anti-Trampa *
                  </label>
                  <span className="text-[11px] font-mono text-neutral-400">
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
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      newSecurityMode === 'audit'
                        ? 'bg-neutral-800 border-blue-500 ring-1 ring-blue-500/50 shadow-md'
                        : 'bg-neutral-950/60 border-neutral-700/80 hover:border-neutral-600 text-neutral-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-neutral-400" />
                          Auditoría
                        </span>
                        {newSecurityMode === 'audit' && (
                          <Check className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-tight">
                        Permite salir de la ventana. Registra silenciosamente cada salida y avisa al evaluador para llamar la atención.
                      </p>
                    </div>
                  </button>

                  {/* Opción 2: 3 Intentos */}
                  <button
                    type="button"
                    onClick={() => setNewSecurityMode('warnings')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      newSecurityMode === 'warnings'
                        ? 'bg-neutral-800 border-amber-500 ring-1 ring-amber-500/50 shadow-md'
                        : 'bg-neutral-950/60 border-neutral-700/80 hover:border-neutral-600 text-neutral-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                          3 Intentos
                        </span>
                        {newSecurityMode === 'warnings' && (
                          <Check className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-tight">
                        Alerta en pantalla en salidas 1 y 2. A la 3ª salida detectada, cierra y anula el examen bloqueando el link.
                      </p>
                    </div>
                  </button>

                  {/* Opción 3: Estricto */}
                  <button
                    type="button"
                    onClick={() => setNewSecurityMode('strict')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      newSecurityMode === 'strict'
                        ? 'bg-neutral-800 border-red-500 ring-1 ring-red-500/50 shadow-md'
                        : 'bg-neutral-950/60 border-neutral-700/80 hover:border-neutral-600 text-neutral-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                          Estricto
                        </span>
                        {newSecurityMode === 'strict' && (
                          <Check className="w-3.5 h-3.5 text-red-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-tight">
                        Pantalla completa obligatoria y anti-copia activo. Cualquier intento de minimizar o salir cancela y bloquea la prueba.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-neutral-400">
                  Notas Internas (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Instrucciones o recordatorios para el tribunal examinador..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isCreating ? 'Creando Convocatoria...' : 'Crear y Generar Link'}
                </button>
              </div>
            </form>
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
