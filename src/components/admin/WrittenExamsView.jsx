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
        <div className="fixed bottom-6 right-6 z-50 bg-white/95 text-gray-900 text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 shadow-xl flex items-center gap-2 backdrop-blur-md">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2D2E83]" />
          <span>Guardando en base de datos...</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 1: LISTA PRINCIPAL DE EXÁMENES (MINIMALISTA) */}
      {/* ========================================================================= */}
      {currentView === 'list' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-1.5">
                <Link href="/admin/examinations" className="hover:text-[#2D2E83] flex items-center gap-1 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Examinaciones
                </Link>
                <span>/</span>
                <span className="text-[#2D2E83] font-bold">Exámenes Escritos</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#2D2E83] tracking-tight">
                Exámenes Escritos
              </h1>
              <p className="text-gray-600 text-xs md:text-sm font-medium mt-0.5">
                Confección y administración de evaluaciones teóricas en base de datos.
              </p>
            </div>

            <button
              onClick={handleOpenCreateExam}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2D2E83] to-[#be1322] hover:from-[#232468] hover:to-[#9c0f1b] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#2D2E83]/20 active:scale-95 cursor-pointer"
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
                className="group bg-white/95 hover:bg-blue-50/40 border border-gray-200/90 hover:border-[#2D2E83]/40 rounded-2xl p-5 cursor-pointer transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-gray-900"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[#2D2E83] transition-colors">
                      {exam.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-gray-100 text-gray-700 border border-gray-200">
                      {exam.questions ? exam.questions.length : 0} {(exam.questions?.length === 1) ? 'pregunta' : 'preguntas'}
                    </span>
                  </div>
                  {exam.description && (
                    <p className="text-xs text-gray-600 font-medium line-clamp-1">
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
                    className="px-4 py-2 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                  >
                    Ver Preguntas
                  </button>

                  <button
                    onClick={(e) => handleOpenEditExam(exam, e)}
                    className="p-2 text-gray-500 hover:text-[#2D2E83] hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-200 cursor-pointer"
                    title="Editar nombre"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDeleteExam(exam.id || exam._id, e)}
                    className="p-2 text-gray-400 hover:text-[#BE1622] hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200 cursor-pointer"
                    title="Eliminar examen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {exams.length === 0 && (
              <div className="p-12 text-center border border-dashed border-gray-300 rounded-2xl bg-white/80 text-gray-500 space-y-3 shadow-sm">
                <FileText className="w-8 h-8 mx-auto text-gray-400" />
                <p className="text-sm font-bold text-gray-700">Aún no hay exámenes creados en la base de datos.</p>
                <button
                  onClick={handleOpenCreateExam}
                  className="text-xs text-[#2D2E83] font-bold hover:underline cursor-pointer"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
            <div>
              <button
                onClick={() => setCurrentView('list')}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#2D2E83] font-bold mb-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a la lista de exámenes
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-[#2D2E83] tracking-tight">
                  {activeExam.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-[#2D2E83] border border-blue-200">
                  {activeExam.questions ? activeExam.questions.length : 0} preguntas
                </span>
              </div>
              {activeExam.description && (
                <p className="text-gray-600 text-xs font-medium mt-1">
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
                className="flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Ver el examen como lo resuelven los alumnos"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>Vista Previa (Estudiante)</span>
              </button>
              <button
                onClick={handleOpenAddQuestion}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2D2E83] to-[#be1322] hover:from-[#232468] hover:to-[#9c0f1b] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
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
                className="bg-white/95 border border-gray-200/90 rounded-2xl p-5 space-y-3 transition-all shadow-sm text-gray-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-xs font-black text-[#2D2E83]">
                      {index + 1}
                    </span>
                    {getTypeBadge(q.type)}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditQuestion(q)}
                      className="p-1.5 text-gray-500 hover:text-[#2D2E83] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Editar pregunta"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 text-gray-400 hover:text-[#BE1622] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Quitar pregunta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm md:text-base font-bold text-gray-900 leading-relaxed pl-1">
                  {q.text}
                </p>

                {/* Imagen adjunta en la pregunta con zoom elegante */}
                {q.imageUrl && (
                  <div className="pt-2 pl-1">
                    <div 
                      onClick={() => setLightboxImage(q.imageUrl)}
                      className="group/img relative inline-block border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 p-2 shadow-xs cursor-pointer hover:border-[#2D2E83]/50 transition-all"
                      title="Clic para ampliar imagen"
                    >
                      <img 
                        src={q.imageUrl} 
                        alt="Ilustración de la pregunta" 
                        className="max-h-48 max-w-full rounded-xl object-contain group-hover/img:scale-[1.02] transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold rounded-2xl backdrop-blur-[2px]">
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
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                              : 'bg-gray-50/80 border-gray-200 text-gray-800'
                          }`}
                        >
                          <span className="truncate pr-2">
                            <strong className="text-gray-500 mr-1.5">{String.fromCharCode(65 + optIndex)}.</strong>
                            {opt}
                          </span>
                          {isCorrect && (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === 'short_answer' && (
                  <div className="pt-1 pl-1">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500 italic">
                      Formato: Respuesta corta (1 a 2 líneas de texto por parte del alumno).
                    </div>
                  </div>
                )}

                {q.type === 'long_answer' && (
                  <div className="pt-1 pl-1">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500 italic">
                      Formato: Respuesta larga / desarrollo libre.
                    </div>
                  </div>
                )}

                {/* Asociar Términos (Eje Izquierdo vs Eje Superior) */}
                {q.type === 'matching' && q.leftTerms && q.topTerms && (
                  <div className="pt-2 pl-1 overflow-x-auto">
                    <table className="min-w-full border-collapse text-xs border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-2.5 border-b border-r border-gray-200 text-gray-700 font-bold text-left">
                            Eje Izquierdo \ Eje Superior
                          </th>
                          {q.topTerms.map((col, cIdx) => (
                            <th key={cIdx} className="p-2.5 border-b border-gray-200 text-[#2D2E83] font-bold text-center whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {q.leftTerms.map((row, rIdx) => {
                          const matchedCol = q.correctMatches?.find(m => m.leftIndex === rIdx)?.rightIndex;
                          return (
                            <tr key={rIdx} className="border-b border-gray-100 hover:bg-blue-50/20">
                              <td className="p-2.5 border-r border-gray-200 font-bold text-gray-900 bg-gray-50/50">
                                {row}
                              </td>
                              {q.topTerms.map((_, cIdx) => {
                                const isMatched = matchedCol === cIdx;
                                return (
                                  <td key={cIdx} className="p-2.5 border-gray-100 text-center">
                                    {isMatched ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 mx-auto shadow-xs" title="Asociación correcta">
                                        <Check className="w-3.5 h-3.5" />
                                      </span>
                                    ) : (
                                      <span className="inline-block w-2 h-2 rounded-full bg-gray-300 mx-auto"></span>
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
              <div className="p-10 text-center border border-dashed border-gray-300 rounded-2xl text-gray-500 bg-white/80 space-y-3 shadow-sm">
                <HelpCircle className="w-8 h-8 mx-auto text-gray-400" />
                <p className="text-sm font-bold text-gray-700">Este examen aún no tiene preguntas agregadas.</p>
                <button
                  onClick={handleOpenAddQuestion}
                  className="px-4 py-2 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200/90 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">
                {examModalMode === 'create' ? 'Nuevo Examen Escrito' : 'Modificar Examen'}
              </h3>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-gray-700 mb-1.5">
                  Nombre del Examen *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Examen de 4 a 3 Kyu"
                  value={examNameInput}
                  onChange={(e) => setExamNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20 focus:border-[#2D2E83]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-gray-700 mb-1.5">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Evaluación teórica de Heian Godan y Kihon"
                  value={examDescInput}
                  onChange={(e) => setExamDescInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20 focus:border-[#2D2E83]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200/90 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">
                {editingQuestionId ? 'Editar Pregunta' : 'Agregar Pregunta'}
              </h3>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              {/* Selector de Tipo de Pregunta */}
              <div>
                <label className="block text-xs uppercase font-bold text-gray-700 mb-2">
                  Tipo de Pregunta
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuestionType('single_choice')}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      questionType === 'single_choice'
                        ? 'bg-[#2D2E83]/10 border-[#2D2E83] text-[#2D2E83] font-bold shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
                    }`}
                  >
                    <ListOrdered className="w-4 h-4" />
                    <span>Selección Única</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuestionType('short_answer')}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      questionType === 'short_answer'
                        ? 'bg-amber-500/10 border-amber-600 text-amber-700 font-bold shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
                    }`}
                  >
                    <Type className="w-4 h-4" />
                    <span>Respuesta Corta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuestionType('long_answer')}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      questionType === 'long_answer'
                        ? 'bg-purple-500/10 border-purple-600 text-purple-700 font-bold shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                    <span>Respuesta Larga</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuestionType('matching')}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      questionType === 'matching'
                        ? 'bg-emerald-500/10 border-emerald-600 text-emerald-700 font-bold shadow-xs'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'
                    }`}
                  >
                    <Table className="w-4 h-4" />
                    <span>Asociar Términos</span>
                  </button>
                </div>
              </div>

              {/* Enunciado */}
              <div>
                <label className="block text-xs uppercase font-bold text-gray-700 mb-1.5">
                  Enunciado de la Pregunta *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Escribe aquí la pregunta o indicación..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20 focus:border-[#2D2E83] resize-none"
                />
              </div>

              {/* Opciones para Selección Única */}
              {questionType === 'single_choice' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs uppercase font-bold text-gray-700">
                      Opciones (Marca la correcta)
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Mínimo 2 opciones
                    </span>
                  </div>

                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCorrectOptionIndex(idx)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          correctOptionIndex === idx
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-gray-300 hover:border-gray-400 text-transparent'
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
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20 focus:border-[#2D2E83]"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Configuración para Asociar Términos (Eje Izquierdo vs Eje Superior) */}
              {questionType === 'matching' && (
                <div className="space-y-4 pt-1">
                  {/* Eje Superior (Columnas) */}
                  <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs uppercase font-bold text-[#2D2E83]">
                        Eje Superior (Columnas / Términos de Arriba)
                      </label>
                      <span className="text-[11px] text-gray-500">Mínimo 2 términos</span>
                    </div>
                    <div className="space-y-2">
                      {topTerms.map((term, colIdx) => (
                        <div key={colIdx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#2D2E83]/10 text-[#2D2E83] text-[11px] font-black flex items-center justify-center shrink-0">
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
                            className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20 focus:border-[#2D2E83]"
                          />
                          {topTerms.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = topTerms.filter((_, idx) => idx !== colIdx);
                                setTopTerms(next);
                              }}
                              className="p-1.5 text-gray-400 hover:text-[#BE1622] rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
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
                        className="text-xs text-[#2D2E83] hover:text-[#232468] font-bold flex items-center gap-1.5 pt-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar otro término superior
                      </button>
                    </div>
                  </div>

                  {/* Eje Izquierdo (Filas) */}
                  <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs uppercase font-bold text-emerald-800">
                        Eje Izquierdo (Filas / Términos de la Izquierda)
                      </label>
                      <span className="text-[11px] text-gray-500">Mínimo 2 términos</span>
                    </div>
                    <div className="space-y-2">
                      {leftTerms.map((term, rowIdx) => (
                        <div key={rowIdx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-emerald-600/10 text-emerald-700 text-[11px] font-black flex items-center justify-center shrink-0">
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
                            className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                          />
                          {leftTerms.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = leftTerms.filter((_, idx) => idx !== rowIdx);
                                setLeftTerms(next);
                              }}
                              className="p-1.5 text-gray-400 hover:text-[#BE1622] rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
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
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1.5 pt-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar otro término izquierdo
                      </button>
                    </div>
                  </div>

                  {/* Matriz de Asociación (Respuestas Correctas) */}
                  <div className="bg-gray-50/70 border border-gray-200/90 rounded-2xl p-3.5 space-y-2.5">
                    <div>
                      <label className="block text-xs uppercase font-bold text-gray-900">
                        Matriz de Asociación (Marca la respuesta correcta)
                      </label>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Selecciona para cada fila el término superior correspondiente que el alumno debe asociar.
                      </p>
                    </div>

                    <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-xs">
                      <table className="min-w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100/80">
                            <th className="p-2.5 text-left text-gray-700 font-bold border-b border-r border-gray-200">
                              Términos Izquierda
                            </th>
                            {topTerms.map((col, cIdx) => (
                              <th key={cIdx} className="p-2.5 text-center text-[#2D2E83] font-bold border-b border-gray-200 whitespace-nowrap">
                                {col.trim() || `Columna ${cIdx + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {leftTerms.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-gray-100 hover:bg-gray-50/80">
                              <td className="p-2.5 border-r border-gray-200 font-bold text-gray-900 bg-gray-50/50">
                                {row.trim() || `Fila ${String.fromCharCode(65 + rIdx)}`}
                              </td>
                              {topTerms.map((_, cIdx) => {
                                const isSelected = matchesMap[rIdx] === cIdx;
                                return (
                                  <td
                                    key={cIdx}
                                    onClick={() => setMatchesMap({ ...matchesMap, [rIdx]: cIdx })}
                                    className="p-2 text-center cursor-pointer hover:bg-blue-50/40 transition-colors"
                                  >
                                    <button
                                      type="button"
                                      className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center border transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                          : 'border-gray-300 hover:border-gray-400 text-transparent'
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
              <div className="pt-2 border-t border-gray-200 space-y-2">
                <label className="block text-xs uppercase font-bold text-gray-700">
                  Adjuntar Imagen a la Pregunta (Opcional)
                </label>

                {imageUrl ? (
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <img 
                        src={imageUrl} 
                        alt="Vista previa" 
                        className="w-16 h-16 object-cover rounded-xl border border-gray-200 shadow-xs" 
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-900 block">Imagen seleccionada</span>
                        <span className="text-[11px] text-emerald-700 font-medium">Lista para guardar en base de datos</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#BE1622] border border-red-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="Quitar imagen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar imagen</span>
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-gray-50/80 hover:bg-blue-50/40 border border-dashed border-gray-300 hover:border-[#2D2E83] text-gray-700 rounded-xl text-xs font-bold transition-all group">
                    <Upload className="w-4 h-4 text-[#2D2E83] group-hover:scale-110 transition-transform" />
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
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-600 font-medium">
                  El alumno responderá de forma breve y concisa (ejemplo: un nombre, técnica o concepto clave).
                </div>
              )}

              {questionType === 'long_answer' && (
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-600 font-medium">
                  El alumno dispondrá de un espacio amplio para redactar y desarrollar su respuesta teórica.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200/90 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/95 sticky top-0 z-20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                    Modo Resolución de Alumno
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {activeExam.questions ? activeExam.questions.length : 0} preguntas en total
                  </span>
                </div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  {activeExam.name}
                </h2>
              </div>
              <button
                onClick={() => setIsStudentPreviewOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                title="Cerrar vista previa"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions Container */}
            <div className="p-6 overflow-y-auto space-y-6 bg-gray-50/50">
              {(activeExam.questions || []).map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="bg-white border border-gray-200/90 rounded-2xl p-5 space-y-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-xs font-black text-[#2D2E83] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">
                          {q.type === 'single_choice' && 'Selección Única'}
                          {q.type === 'short_answer' && 'Respuesta Breve'}
                          {q.type === 'long_answer' && 'Desarrollo Escrito'}
                          {q.type === 'matching' && 'Asociación de Términos'}
                        </span>
                      </div>
                      <p className="text-sm md:text-base font-bold text-gray-900 leading-relaxed">
                        {q.text}
                      </p>
                    </div>
                  </div>

                  {/* Imagen elegante con clic para ampliar */}
                  {q.imageUrl && (
                    <div className="pt-1">
                      <div
                        onClick={() => setLightboxImage(q.imageUrl)}
                        className="group/pimg relative inline-block border border-gray-200 rounded-2xl overflow-hidden bg-gray-100 p-2 cursor-pointer shadow-sm hover:border-[#2D2E83]/40 transition-all max-w-full"
                        title="Clic para ampliar imagen"
                      >
                        <img
                          src={q.imageUrl}
                          alt="Ilustración para resolver"
                          className="max-h-60 rounded-xl object-contain group-hover/pimg:scale-[1.01] transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/pimg:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold rounded-2xl">
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
                                ? 'bg-[#2D2E83]/10 border-[#2D2E83] text-[#2D2E83] font-bold shadow-xs'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold ${
                              isSelected
                                ? 'border-[#2D2E83] bg-[#2D2E83] text-white'
                                : 'border-gray-300 text-gray-500'
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
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs md:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                    />
                  )}

                  {/* Respuesta Larga */}
                  {q.type === 'long_answer' && (
                    <textarea
                      rows={3}
                      placeholder="Redacta aquí tu desarrollo teórico completo..."
                      value={studentAnswers[q.id] || ''}
                      onChange={(e) => setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-xs md:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none font-medium"
                    />
                  )}

                  {/* Asociar Términos (Matriz interactiva para el estudiante) */}
                  {q.type === 'matching' && q.leftTerms && q.topTerms && (
                    <div className="pt-1 overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-xs">
                      <table className="min-w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-100/80">
                            <th className="p-3 text-left text-gray-700 font-bold border-b border-r border-gray-200">
                              Términos (Izquierda \ Arriba)
                            </th>
                            {q.topTerms.map((col, cIdx) => (
                              <th key={cIdx} className="p-3 text-center text-[#2D2E83] font-bold border-b border-gray-200 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {q.leftTerms.map((row, rIdx) => {
                            const selectedCol = studentAnswers[`${q.id}-${rIdx}`];
                            return (
                              <tr key={rIdx} className="border-b border-gray-100 hover:bg-gray-50/80">
                                <td className="p-3 border-r border-gray-200 font-bold text-gray-900 bg-gray-50/50">
                                  {row}
                                </td>
                                {q.topTerms.map((_, cIdx) => {
                                  const isChecked = selectedCol === cIdx;
                                  return (
                                    <td
                                      key={cIdx}
                                      onClick={() => setStudentAnswers({ ...studentAnswers, [`${q.id}-${rIdx}`]: cIdx })}
                                      className="p-3 text-center cursor-pointer hover:bg-blue-50/30 transition-colors"
                                    >
                                      <button
                                        type="button"
                                        className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center border transition-all cursor-pointer ${
                                          isChecked
                                            ? 'bg-[#2D2E83] border-[#2D2E83] text-white shadow-xs'
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
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
              <button
                onClick={() => setIsStudentPreviewOpen(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
