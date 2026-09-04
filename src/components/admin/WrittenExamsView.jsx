"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  Check, 
  HelpCircle, 
  AlignLeft, 
  Type, 
  X,
  ListOrdered,
  Loader2,
  Save,
  Image as ImageIcon,
  Upload,
  Table,
  Eye,
  Maximize2
} from 'lucide-react';
import { 
  getWrittenExams,
  createWrittenExam, 
  updateWrittenExam, 
  deleteWrittenExam, 
  saveExamQuestions 
} from '../../lib/actions/examinations';
import ConfirmModal from '../ui/ConfirmModal';
import AlertModal from '../ui/AlertModal';

export default function WrittenExamsView({ initialExams = [] }) {
  const [exams, setExams] = useState(initialExams);
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'builder'
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sincronización continua con los datos reales de la base de datos
  useEffect(() => {
    async function syncDb() {
      try {
        const freshData = await getWrittenExams();
        if (freshData && freshData.length > 0) {
          setExams(freshData);
        }
      } catch (err) {
        console.error("Error sincronizando exámenes con BD:", err);
      }
    }

    if (initialExams && initialExams.length > 0) {
      setExams(initialExams);
    } else {
      syncDb();
    }
  }, [initialExams]);

  // Modals de Examen (Crear / Renombrar)
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examModalMode, setExamModalMode] = useState('create'); // 'create' | 'edit_name'
  const [examNameInput, setExamNameInput] = useState('');
  const [examDescInput, setExamDescInput] = useState('');

  // Modals en página para Alertas y Confirmaciones (reemplaza alert y confirm nativos del navegador)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '¿Estás seguro?',
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

  const showAlert = (message, title = 'Atención', isError = true) => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      isError
    });
  };

  const showConfirm = ({ title = '¿Estás seguro?', message, onConfirm, confirmText = 'Confirmar', isDanger = true }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      isDanger,
      onConfirm
    });
  };

  // Lightbox de imagen ampliada y Simulación de Estudiante
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isStudentPreviewOpen, setIsStudentPreviewOpen] = useState(false);
  const [studentAnswers, setStudentAnswers] = useState({});

  // Formulario Modal de Pregunta
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionType, setQuestionType] = useState('single_choice'); // 'single_choice' | 'short_answer' | 'long_answer' | 'matching'
  const [questionText, setQuestionText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);

  // Estados para preguntas de Asociar Términos (Eje Izquierdo vs Eje Superior)
  const [leftTerms, setLeftTerms] = useState(['', '', '']);
  const [topTerms, setTopTerms] = useState(['', '', '']);
  const [matchesMap, setMatchesMap] = useState({ 0: 0, 1: 1, 2: 2 });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert('La imagen es demasiado grande. El máximo permitido es 2MB.', 'Archivo muy grande', true);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Examen activo en el constructor
  const activeExam = exams.find(e => e.id === selectedExamId || e._id === selectedExamId) || null;

  // --- OPERACIONES DE EXÁMENES (CRUD EN BD) ---

  const handleOpenCreateExam = () => {
    setExamModalMode('create');
    setExamNameInput('');
    setExamDescInput('');
    setIsExamModalOpen(true);
  };

  const handleOpenEditExam = (exam, e) => {
    e?.stopPropagation();
    setExamModalMode('edit_name');
    setSelectedExamId(exam.id || exam._id);
    setExamNameInput(exam.name);
    setExamDescInput(exam.description || '');
    setIsExamModalOpen(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!examNameInput.trim()) return;

    setIsSaving(true);
    try {
      if (examModalMode === 'create') {
        const res = await createWrittenExam({
          name: examNameInput.trim(),
          description: examDescInput.trim(),
          questions: []
        });

        if (res.success && res.exam) {
          setExams([res.exam, ...exams]);
          setSelectedExamId(res.exam.id || res.exam._id);
          setIsExamModalOpen(false);
          setCurrentView('builder'); // Abre directamente para agregar preguntas
        } else {
          showAlert("Error al crear el examen en la base de datos: " + (res.error || ""), "Error", true);
        }
      } else {
        const res = await updateWrittenExam(selectedExamId, {
          name: examNameInput.trim(),
          description: examDescInput.trim()
        });

        if (res.success) {
          setExams(exams.map(ex => 
            (ex.id === selectedExamId || ex._id === selectedExamId)
              ? { ...ex, name: examNameInput.trim(), description: examDescInput.trim() }
              : ex
          ));
          setIsExamModalOpen(false);
        } else {
          showAlert("Error al actualizar el examen: " + (res.error || ""), "Error", true);
        }
      }
    } catch (err) {
      console.error(err);
      showAlert("Ocurrió un error al guardar en la base de datos.", "Error", true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExam = (examId, e) => {
    e?.stopPropagation();
    showConfirm({
      title: "Eliminar Examen",
      message: "¿Estás seguro de que deseas eliminar este examen de la base de datos? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      isDanger: true,
      onConfirm: async () => {
        setIsSaving(true);
        try {
          const res = await deleteWrittenExam(examId);
          if (res.success) {
            setExams(prev => prev.filter(ex => ex.id !== examId && ex._id !== examId));
            if (selectedExamId === examId) {
              setCurrentView('list');
              setSelectedExamId(null);
            }
          } else {
            showAlert("Error al eliminar examen: " + (res.error || ""), "Error", true);
          }
        } catch (err) {
          console.error(err);
          showAlert("Ocurrió un error al eliminar el examen.", "Error", true);
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  const handleOpenBuilder = (examId) => {
    setSelectedExamId(examId);
    setCurrentView('builder');
  };

  // --- OPERACIONES DE PREGUNTAS (AGREGAR, EDITAR, QUITAR) ---

  const handleOpenAddQuestion = () => {
    setEditingQuestionId(null);
    setQuestionType('single_choice');
    setQuestionText('');
    setImageUrl('');
    setOptions(['', '', '', '']);
    setCorrectOptionIndex(0);
    setLeftTerms(['', '', '']);
    setTopTerms(['', '', '']);
    setMatchesMap({ 0: 0, 1: 1, 2: 2 });
    setIsQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q) => {
    setEditingQuestionId(q.id);
    setQuestionType(q.type);
    setQuestionText(q.text);
    setImageUrl(q.imageUrl || '');
    if (q.type === 'single_choice') {
      setOptions(q.options && q.options.length > 0 ? [...q.options] : ['', '', '', '']);
      setCorrectOptionIndex(q.correctOptionIndex ?? 0);
      setLeftTerms(['', '', '']);
      setTopTerms(['', '', '']);
      setMatchesMap({ 0: 0, 1: 1, 2: 2 });
    } else if (q.type === 'matching') {
      setLeftTerms(q.leftTerms && q.leftTerms.length > 0 ? [...q.leftTerms] : ['', '', '']);
      setTopTerms(q.topTerms && q.topTerms.length > 0 ? [...q.topTerms] : ['', '', '']);
      const map = {};
      if (Array.isArray(q.correctMatches)) {
        q.correctMatches.forEach(m => {
          map[m.leftIndex] = m.rightIndex;
        });
      }
      setMatchesMap(map);
      setOptions(['', '', '', '']);
      setCorrectOptionIndex(0);
    } else {
      setOptions(['', '', '', '']);
      setCorrectOptionIndex(0);
      setLeftTerms(['', '', '']);
      setTopTerms(['', '', '']);
      setMatchesMap({ 0: 0, 1: 1, 2: 2 });
    }
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) {
      showAlert("Por favor escribe el enunciado de la pregunta.", "Atención", false);
      return;
    }

    let cleanedOptions = [];
    if (questionType === 'single_choice') {
      cleanedOptions = options.map(o => o.trim()).filter(o => o.length > 0);
      if (cleanedOptions.length < 2) {
        showAlert("Para preguntas de selección única debes ingresar al menos 2 opciones.", "Atención", false);
        return;
      }
    }

    let cleanLeft = [];
    let cleanTop = [];
    let correctMatches = [];
    if (questionType === 'matching') {
      cleanLeft = leftTerms.map(t => t.trim()).filter(t => t.length > 0);
      cleanTop = topTerms.map(t => t.trim()).filter(t => t.length > 0);
      if (cleanLeft.length < 2) {
        showAlert("Para asociar términos debes ingresar al menos 2 términos en el eje izquierdo (filas).", "Atención", false);
        return;
      }
      if (cleanTop.length < 2) {
        showAlert("Para asociar términos debes ingresar al menos 2 términos en el eje superior (columnas).", "Atención", false);
        return;
      }
      correctMatches = cleanLeft.map((_, rIdx) => ({
        leftIndex: rIdx,
        rightIndex: typeof matchesMap[rIdx] === 'number' && matchesMap[rIdx] < cleanTop.length ? matchesMap[rIdx] : 0
      }));
    }

    const questionData = {
      id: editingQuestionId || `q-${Date.now()}`,
      type: questionType,
      text: questionText.trim(),
      imageUrl: imageUrl.trim(),
      ...(questionType === 'single_choice' && {
        options: cleanedOptions,
        correctOptionIndex: Math.min(correctOptionIndex, cleanedOptions.length - 1)
      }),
      ...(questionType === 'matching' && {
        leftTerms: cleanLeft,
        topTerms: cleanTop,
        correctMatches
      })
    };

    let targetExam = exams.find(e => e.id === selectedExamId || e._id === selectedExamId);
    if (!targetExam) return;

    let updatedQuestions = [];
    if (editingQuestionId) {
      updatedQuestions = targetExam.questions.map(q => q.id === editingQuestionId ? questionData : q);
    } else {
      updatedQuestions = [...(targetExam.questions || []), questionData];
    }

    setIsSaving(true);
    try {
      const realId = targetExam.id || targetExam._id;
      const res = await saveExamQuestions(realId, updatedQuestions);

      if (res.success) {
        setExams(exams.map(ex => {
          if (ex.id === realId || ex._id === realId) {
            return { ...ex, questions: updatedQuestions };
          }
          return ex;
        }));
        setIsQuestionModalOpen(false);
      } else {
        showAlert("Error al guardar en la base de datos: " + (res.error || ""), "Error", true);
      }
    } catch (err) {
      console.error(err);
      showAlert("Error al conectar con la base de datos.", "Error", true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = (qId) => {
    showConfirm({
      title: "Quitar Pregunta",
      message: "¿Deseas quitar esta pregunta del examen?",
      confirmText: "Quitar",
      isDanger: true,
      onConfirm: async () => {
        let targetExam = exams.find(e => e.id === selectedExamId || e._id === selectedExamId);
        if (!targetExam) return;

        const updatedQuestions = targetExam.questions.filter(q => q.id !== qId);
        const realId = targetExam.id || targetExam._id;

        setIsSaving(true);
        try {
          const res = await saveExamQuestions(realId, updatedQuestions);
          if (res.success) {
            setExams(prev => prev.map(ex => {
              if (ex.id === realId || ex._id === realId) {
                return { ...ex, questions: updatedQuestions };
              }
              return ex;
            }));
          } else {
            showAlert("Error al eliminar la pregunta: " + (res.error || ""), "Error", true);
          }
        } catch (err) {
          console.error(err);
          showAlert("Error al actualizar la base de datos.", "Error", true);
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  // Helper de badges para tipos de pregunta
  const getTypeBadge = (type) => {
    switch(type) {
      case 'single_choice':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Selección Única
          </span>
        );
      case 'short_answer':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Respuesta Corta
          </span>
        );
      case 'long_answer':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Respuesta Larga
          </span>
        );
      case 'matching':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <Table className="w-3 h-3" />
            <span>Asociar Términos</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-2 pb-16 space-y-8">
      {/* Indicador de guardado sutil */}
      {isSaving && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900/90 text-white text-xs px-4 py-2.5 rounded-xl border border-neutral-700 shadow-xl flex items-center gap-2 backdrop-blur-md">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
          <span>Guardando en base de datos...</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 1: LISTA PRINCIPAL DE EXÁMENES (MINIMALISTA) */}
      {/* ========================================================================= */}
      {currentView === 'list' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1.5">
                <Link href="/admin/examinations" className="hover:text-white flex items-center gap-1 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Examinaciones
                </Link>
                <span>/</span>
                <span className="text-white">Exámenes Escritos</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Exámenes Escritos
              </h1>
              <p className="text-neutral-400 text-xs md:text-sm mt-0.5">
                Confección y administración de evaluaciones teóricas en base de datos.
              </p>
            </div>

            <button
              onClick={handleOpenCreateExam}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Crear Examen
            </button>
          </div>

          {/* Lista de Exámenes */}
          <div className="space-y-3">
            {exams.map((exam) => (
              <div
                key={exam.id || exam._id}
                onClick={() => handleOpenBuilder(exam.id || exam._id)}
                className="group bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/70 hover:border-neutral-600 rounded-2xl p-5 cursor-pointer transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {exam.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-neutral-900 text-neutral-300 border border-neutral-700">
                      {exam.questions ? exam.questions.length : 0} {(exam.questions?.length === 1) ? 'pregunta' : 'preguntas'}
                    </span>
                  </div>
                  {exam.description && (
                    <p className="text-xs text-neutral-400 line-clamp-1">
                      {exam.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenBuilder(exam.id || exam._id);
                    }}
                    className="px-3.5 py-1.5 bg-neutral-700 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Ver Preguntas
                  </button>

                  <button
                    onClick={(e) => handleOpenEditExam(exam, e)}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
                    title="Editar nombre"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDeleteExam(exam.id || exam._id, e)}
                    className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Eliminar examen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {exams.length === 0 && (
              <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl text-neutral-500 space-y-3">
                <FileText className="w-8 h-8 mx-auto text-neutral-600" />
                <p className="text-sm">Aún no hay exámenes creados en la base de datos.</p>
                <button
                  onClick={handleOpenCreateExam}
                  className="text-xs text-blue-400 hover:underline"
                >
                  + Crear el primer examen
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: CONFECCIÓN Y EDICIÓN DE PREGUNTAS (BUILDER MINIMALISTA) */}
      {/* ========================================================================= */}
      {currentView === 'builder' && activeExam && (
        <div className="space-y-6">
          {/* Header del Examen Activo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
            <div>
              <button
                onClick={() => setCurrentView('list')}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white mb-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a la lista de exámenes
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {activeExam.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {activeExam.questions ? activeExam.questions.length : 0} preguntas
                </span>
              </div>
              {activeExam.description && (
                <p className="text-neutral-400 text-xs mt-1">
                  {activeExam.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setStudentAnswers({});
                  setIsStudentPreviewOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95"
                title="Ver el examen como lo resuelven los alumnos"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vista Previa (Estudiante)</span>
              </button>
              <button
                onClick={handleOpenAddQuestion}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Pregunta</span>
              </button>
            </div>
          </div>

          {/* Lista de Preguntas del Examen */}
          <div className="space-y-4">
            {(activeExam.questions || []).map((q, index) => (
              <div
                key={q.id}
                className="bg-neutral-800/90 border border-neutral-700/70 rounded-2xl p-5 space-y-3 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    {getTypeBadge(q.type)}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditQuestion(q)}
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
                      title="Editar pregunta"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Quitar pregunta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm md:text-base font-medium text-neutral-100 leading-relaxed pl-1">
                  {q.text}
                </p>

                {/* Imagen adjunta en la pregunta con zoom elegante */}
                {q.imageUrl && (
                  <div className="pt-2 pl-1">
                    <div 
                      onClick={() => setLightboxImage(q.imageUrl)}
                      className="group/img relative inline-block border border-neutral-700/80 rounded-2xl overflow-hidden bg-neutral-950/80 p-2 shadow-md cursor-pointer hover:border-blue-500/50 transition-all"
                      title="Clic para ampliar imagen"
                    >
                      <img 
                        src={q.imageUrl} 
                        alt="Ilustración de la pregunta" 
                        className="max-h-48 max-w-full rounded-xl object-contain group-hover/img:scale-[1.02] transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium rounded-2xl backdrop-blur-[2px]">
                        <Maximize2 className="w-4 h-4" />
                        <span>Ver en tamaño completo</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vista previa según tipo */}
                {q.type === 'single_choice' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-1">
                    {q.options.map((opt, optIndex) => {
                      const isCorrect = optIndex === q.correctOptionIndex;
                      return (
                        <div
                          key={optIndex}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs border ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-medium'
                              : 'bg-neutral-900/60 border-neutral-700/60 text-neutral-300'
                          }`}
                        >
                          <span className="truncate pr-2">
                            <strong className="text-neutral-400 mr-1.5">{String.fromCharCode(65 + optIndex)}.</strong>
                            {opt}
                          </span>
                          {isCorrect && (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'short_answer' && (
                  <div className="pt-1 pl-1">
                    <div className="bg-neutral-900/40 border border-neutral-700/40 rounded-xl p-3 text-xs text-neutral-400 italic">
                      Formato: Respuesta corta (1 a 2 líneas de texto por parte del alumno).
                    </div>
                  </div>
                )}

                {q.type === 'long_answer' && (
                  <div className="pt-1 pl-1">
                    <div className="bg-neutral-900/40 border border-neutral-700/40 rounded-xl p-3 text-xs text-neutral-400 italic">
                      Formato: Respuesta larga / desarrollo libre.
                    </div>
                  </div>
                )}

                {/* Asociar Términos (Eje Izquierdo vs Eje Superior) */}
                {q.type === 'matching' && q.leftTerms && q.topTerms && (
                  <div className="pt-2 pl-1 overflow-x-auto">
                    <table className="min-w-full border-collapse text-xs border border-neutral-700/80 rounded-xl overflow-hidden shadow-sm">
                      <thead>
                        <tr className="bg-neutral-900/90">
                          <th className="p-2.5 border-b border-r border-neutral-700/80 text-neutral-400 font-semibold text-left">
                            Eje Izquierdo \ Eje Superior
                          </th>
                          {q.topTerms.map((col, cIdx) => (
                            <th key={cIdx} className="p-2.5 border-b border-neutral-700/80 text-blue-400 font-semibold text-center whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {q.leftTerms.map((row, rIdx) => {
                          const matchedCol = q.correctMatches?.find(m => m.leftIndex === rIdx)?.rightIndex;
                          return (
                            <tr key={rIdx} className="border-b border-neutral-800/80 hover:bg-neutral-800/40">
                              <td className="p-2.5 border-r border-neutral-700/80 font-medium text-white bg-neutral-900/40">
                                {row}
                              </td>
                              {q.topTerms.map((_, cIdx) => {
                                const isMatched = matchedCol === cIdx;
                                return (
                                  <td key={cIdx} className="p-2.5 border-neutral-800 text-center">
                                    {isMatched ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto shadow-sm" title="Asociación correcta">
                                        <Check className="w-3.5 h-3.5" />
                                      </span>
                                    ) : (
                                      <span className="inline-block w-2 h-2 rounded-full bg-neutral-700 mx-auto"></span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

            {(!activeExam.questions || activeExam.questions.length === 0) && (
              <div className="p-10 text-center border border-dashed border-neutral-800 rounded-2xl text-neutral-500 space-y-3">
                <HelpCircle className="w-8 h-8 mx-auto text-neutral-600" />
                <p className="text-sm">Este examen aún no tiene preguntas agregadas.</p>
                <button
                  onClick={handleOpenAddQuestion}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-medium transition-colors"
                >
                  + Agregar la primera pregunta
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR O EDITAR EXAMEN (NOMBRE Y DESCRIPCIÓN) */}
      {/* ========================================================================= */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {examModalMode === 'create' ? 'Nuevo Examen Escrito' : 'Modificar Examen'}
              </h3>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-semibold text-neutral-400 mb-1.5">
                  Nombre del Examen *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Examen de 4 a 3 Kyu"
                  value={examNameInput}
                  onChange={(e) => setExamNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-semibold text-neutral-400 mb-1.5">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Evaluación teórica de Heian Godan y Kihon"
                  value={examDescInput}
                  onChange={(e) => setExamDescInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : (examModalMode === 'create' ? 'Crear en BD' : 'Guardar Cambios')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFECCIÓN / EDICIÓN DE PREGUNTA */}
      {/* ========================================================================= */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingQuestionId ? 'Editar Pregunta' : 'Agregar Pregunta'}
              </h3>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              {/* Selector de Tipo de Pregunta */}
              <div>
                <label className="block text-xs uppercase font-semibold text-neutral-400 mb-2">
                  Tipo de Pregunta
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuestionType('single_choice')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-colors ${
                      questionType === 'single_choice'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <ListOrdered className="w-4 h-4" />
                    <span>Selección Única</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuestionType('short_answer')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-colors ${
                      questionType === 'short_answer'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-400'
                        : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Type className="w-4 h-4" />
                    <span>Respuesta Corta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuestionType('long_answer')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-colors ${
                      questionType === 'long_answer'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                        : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                    <span>Respuesta Larga</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuestionType('matching')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-colors ${
                      questionType === 'matching'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                        : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Table className="w-4 h-4" />
                    <span>Asociar Términos</span>
                  </button>
                </div>
              </div>

              {/* Enunciado */}
              <div>
                <label className="block text-xs uppercase font-semibold text-neutral-400 mb-1.5">
                  Enunciado de la Pregunta *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Escribe aquí la pregunta o indicación..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Opciones para Selección Única */}
              {questionType === 'single_choice' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs uppercase font-semibold text-neutral-400">
                      Opciones (Marca la correcta)
                    </label>
                    <span className="text-[11px] text-neutral-500">
                      Mínimo 2 opciones
                    </span>
                  </div>

                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCorrectOptionIndex(idx)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          correctOptionIndex === idx
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-neutral-600 hover:border-neutral-400 text-transparent'
                        }`}
                        title="Marcar como respuesta correcta"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="text"
                        placeholder={`Opción ${String.fromCharCode(65 + idx)}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[idx] = e.target.value;
                          setOptions(updated);
                        }}
                        className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Configuración para Asociar Términos (Eje Izquierdo vs Eje Superior) */}
              {questionType === 'matching' && (
                <div className="space-y-4 pt-1">
                  {/* Eje Superior (Columnas) */}
                  <div className="bg-neutral-900/60 border border-neutral-700/60 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs uppercase font-semibold text-blue-400">
                        Eje Superior (Columnas / Términos de Arriba)
                      </label>
                      <span className="text-[11px] text-neutral-400">Mínimo 2 términos</span>
                    </div>
                    <div className="space-y-2">
                      {topTerms.map((term, colIdx) => (
                        <div key={colIdx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                            {colIdx + 1}
                          </span>
                          <input
                            type="text"
                            placeholder={`Término superior ${colIdx + 1} (ej: 60% peso adelante...)`}
                            value={term}
                            onChange={(e) => {
                              const next = [...topTerms];
                              next[colIdx] = e.target.value;
                              setTopTerms(next);
                            }}
                            className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                          {topTerms.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = topTerms.filter((_, idx) => idx !== colIdx);
                                setTopTerms(next);
                              }}
                              className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors"
                              title="Eliminar columna"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setTopTerms([...topTerms, ''])}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar otro término superior
                      </button>
                    </div>
                  </div>

                  {/* Eje Izquierdo (Filas) */}
                  <div className="bg-neutral-900/60 border border-neutral-700/60 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs uppercase font-semibold text-emerald-400">
                        Eje Izquierdo (Filas / Términos de la Izquierda)
                      </label>
                      <span className="text-[11px] text-neutral-400">Mínimo 2 términos</span>
                    </div>
                    <div className="space-y-2">
                      {leftTerms.map((term, rowIdx) => (
                        <div key={rowIdx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + rowIdx)}
                          </span>
                          <input
                            type="text"
                            placeholder={`Término izquierdo ${rowIdx + 1} (ej: Zenkutsu Dachi...)`}
                            value={term}
                            onChange={(e) => {
                              const next = [...leftTerms];
                              next[rowIdx] = e.target.value;
                              setLeftTerms(next);
                            }}
                            className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                          {leftTerms.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = leftTerms.filter((_, idx) => idx !== rowIdx);
                                setLeftTerms(next);
                              }}
                              className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors"
                              title="Eliminar fila"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setLeftTerms([...leftTerms, ''])}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1.5 pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar otro término izquierdo
                      </button>
                    </div>
                  </div>

                  {/* Matriz de Asociación (Respuestas Correctas) */}
                  <div className="bg-neutral-900/80 border border-neutral-700/80 rounded-2xl p-3.5 space-y-2.5">
                    <div>
                      <label className="block text-xs uppercase font-semibold text-neutral-300">
                        Matriz de Asociación (Marca la respuesta correcta)
                      </label>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Selecciona para cada fila el término superior correspondiente que el alumno debe asociar.
                      </p>
                    </div>

                    <div className="overflow-x-auto border border-neutral-700/70 rounded-xl">
                      <table className="min-w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-neutral-800/80">
                            <th className="p-2.5 text-left text-neutral-400 font-semibold border-b border-r border-neutral-700">
                              Términos Izquierda
                            </th>
                            {topTerms.map((col, cIdx) => (
                              <th key={cIdx} className="p-2.5 text-center text-blue-400 font-semibold border-b border-neutral-700 whitespace-nowrap">
                                {col.trim() || `Columna ${cIdx + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {leftTerms.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-neutral-800 hover:bg-neutral-800/20">
                              <td className="p-2.5 border-r border-neutral-700/70 font-medium text-white bg-neutral-900/40">
                                {row.trim() || `Fila ${String.fromCharCode(65 + rIdx)}`}
                              </td>
                              {topTerms.map((_, cIdx) => {
                                const isSelected = matchesMap[rIdx] === cIdx;
                                return (
                                  <td
                                    key={cIdx}
                                    onClick={() => setMatchesMap({ ...matchesMap, [rIdx]: cIdx })}
                                    className="p-2 text-center cursor-pointer hover:bg-neutral-700/30 transition-colors"
                                  >
                                    <button
                                      type="button"
                                      className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center border transition-all ${
                                        isSelected
                                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                                          : 'border-neutral-600 hover:border-neutral-400 text-transparent'
                                      }`}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Adjuntar Imagen (Solo mediante sistema de archivos) */}
              <div className="pt-2 border-t border-neutral-800 space-y-2">
                <label className="block text-xs uppercase font-semibold text-neutral-400">
                  Adjuntar Imagen a la Pregunta (Opcional)
                </label>

                {imageUrl ? (
                  <div className="flex items-center justify-between p-3.5 bg-neutral-950/80 border border-neutral-700 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <img 
                        src={imageUrl} 
                        alt="Vista previa" 
                        className="w-16 h-16 object-cover rounded-xl border border-neutral-700 shadow-sm" 
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-white block">Imagen seleccionada</span>
                        <span className="text-[11px] text-emerald-400 font-medium">Lista para guardar en base de datos</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-medium transition-colors"
                      title="Quitar imagen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar imagen</span>
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-neutral-800/80 hover:bg-neutral-700/80 border border-dashed border-neutral-600 hover:border-blue-400 text-neutral-300 rounded-xl text-xs font-medium transition-all group">
                    <Upload className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span>Subir imagen desde el equipo (PNG, JPG, WebP — máx. 2MB)</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {/* Explicación / Formato para Respuesta Corta y Larga */}
              {questionType === 'short_answer' && (
                <div className="bg-neutral-800/50 p-3 rounded-xl border border-neutral-700/50 text-xs text-neutral-400">
                  El alumno responderá de forma breve y concisa (ejemplo: un nombre, técnica o concepto clave).
                </div>
              )}

              {questionType === 'long_answer' && (
                <div className="bg-neutral-800/50 p-3 rounded-xl border border-neutral-700/50 text-xs text-neutral-400">
                  El alumno dispondrá de un espacio amplio para redactar y desarrollar su respuesta teórica.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {isSaving ? 'Guardando en BD...' : 'Guardar Pregunta'}
                </button>
              </div>
            </form>
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

      {/* ========================================================================= */}
      {/* MODAL: VISTA PREVIA DEL EXAMEN (MODO RESOLUCIÓN ESTUDIANTE) */}
      {/* ========================================================================= */}
      {isStudentPreviewOpen && activeExam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 sticky top-0 z-20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                    Modo Resolución de Alumno
                  </span>
                  <span className="text-xs text-neutral-400">
                    {activeExam.questions ? activeExam.questions.length : 0} preguntas en total
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {activeExam.name}
                </h2>
              </div>
              <button
                onClick={() => setIsStudentPreviewOpen(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
                title="Cerrar vista previa"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions Container */}
            <div className="p-6 overflow-y-auto space-y-6">
              {(activeExam.questions || []).map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="bg-neutral-800/60 border border-neutral-700/60 rounded-2xl p-5 space-y-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] uppercase font-semibold text-neutral-400 tracking-wider">
                          {q.type === 'single_choice' && 'Selección Única'}
                          {q.type === 'short_answer' && 'Respuesta Breve'}
                          {q.type === 'long_answer' && 'Desarrollo Escrito'}
                          {q.type === 'matching' && 'Asociación de Términos'}
                        </span>
                      </div>
                      <p className="text-sm md:text-base font-semibold text-white leading-relaxed">
                        {q.text}
                      </p>
                    </div>
                  </div>

                  {/* Imagen elegante con clic para ampliar */}
                  {q.imageUrl && (
                    <div className="pt-1">
                      <div
                        onClick={() => setLightboxImage(q.imageUrl)}
                        className="group/pimg relative inline-block border border-neutral-700/80 rounded-2xl overflow-hidden bg-neutral-950 p-2 cursor-pointer shadow-lg hover:border-blue-500/40 transition-all max-w-full"
                        title="Clic para ampliar imagen"
                      >
                        <img
                          src={q.imageUrl}
                          alt="Ilustración para resolver"
                          className="max-h-60 rounded-xl object-contain group-hover/pimg:scale-[1.01] transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/pimg:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium rounded-2xl">
                          <Maximize2 className="w-4 h-4" />
                          <span>Ampliar imagen</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Opciones Selección Única */}
                  {q.type === 'single_choice' && q.options && (
                    <div className="space-y-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = studentAnswers[q.id] === optIdx;
                        return (
                          <label
                            key={optIdx}
                            onClick={() => setStudentAnswers({ ...studentAnswers, [q.id]: optIdx })}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-xs md:text-sm cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-600/20 border-blue-500 text-white font-medium shadow-sm'
                                : 'bg-neutral-900/60 border-neutral-700/60 text-neutral-300 hover:bg-neutral-900 hover:border-neutral-600'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : 'border-neutral-600 text-neutral-400'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Respuesta Corta */}
                  {q.type === 'short_answer' && (
                    <input
                      type="text"
                      placeholder="Escribe aquí tu respuesta breve..."
                      value={studentAnswers[q.id] || ''}
                      onChange={(e) => setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })}
                      className="w-full px-4 py-2.5 bg-neutral-900/80 border border-neutral-700 rounded-xl text-xs md:text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  )}

                  {/* Respuesta Larga */}
                  {q.type === 'long_answer' && (
                    <textarea
                      rows={3}
                      placeholder="Redacta aquí tu desarrollo teórico completo..."
                      value={studentAnswers[q.id] || ''}
                      onChange={(e) => setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })}
                      className="w-full px-4 py-3 bg-neutral-900/80 border border-neutral-700 rounded-xl text-xs md:text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
                    />
                  )}

                  {/* Asociar Términos (Matriz interactiva para el estudiante) */}
                  {q.type === 'matching' && q.leftTerms && q.topTerms && (
                    <div className="pt-1 overflow-x-auto border border-neutral-700/80 rounded-2xl bg-neutral-900/60">
                      <table className="min-w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-neutral-900">
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
                            const selectedCol = studentAnswers[`${q.id}-${rIdx}`];
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
                                      onClick={() => setStudentAnswers({ ...studentAnswers, [`${q.id}-${rIdx}`]: cIdx })}
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
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 flex justify-end">
              <button
                onClick={() => setIsStudentPreviewOpen(false)}
                className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal de Imagen */}
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
    </div>
  );
}
