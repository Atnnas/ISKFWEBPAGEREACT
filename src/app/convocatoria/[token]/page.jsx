"use client";

import React, { useState, useEffect, useTransition, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Award, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  UserCheck, 
  UserPlus, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Shield,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  BookOpen,
  Trash2
} from 'lucide-react';
import { 
  getTechnicalExamCallByToken, 
  toggleStudentPromotionForCall, 
  quickRegisterStudentForCall, 
  updateExamCallSchedulesAndEvaluators 
} from '../../../lib/actions/technicalExams';

const KYU_RANKS = [
  '10° Kyu (Cinta Blanca)',
  '9° Kyu (Cinta Amarilla)',
  '8° Kyu (Cinta Naranja)',
  '7° Kyu (Cinta Verde)',
  '6° Kyu (Cinta Azul)',
  '5° Kyu (Cinta Morada)',
  '4° Kyu (Cinta Morada con Línea Blanca)',
  '3° Kyu (Cinta Marrón 3)',
  '2° Kyu (Cinta Marrón 2)',
  '1° Kyu (Cinta Marrón 1)',
  '1° Dan (Cinta Negra / Shodan)'
];

function getBeltColor(kyuString) {
  const kyu = (kyuString || '').toLowerCase();
  if (kyu.includes('10') || kyu.includes('blanco') || kyu.includes('blanca')) {
    return { bg: 'bg-gray-100 text-gray-800 border-gray-300', dot: 'bg-gray-400', label: 'Blanca' };
  }
  if (kyu.includes('9') || kyu.includes('amarill')) {
    return { bg: 'bg-yellow-100 text-yellow-900 border-yellow-300', dot: 'bg-yellow-500', label: 'Amarilla' };
  }
  if (kyu.includes('8') || kyu.includes('naranj')) {
    return { bg: 'bg-orange-100 text-orange-900 border-orange-300', dot: 'bg-orange-500', label: 'Naranja' };
  }
  if (kyu.includes('7') || kyu.includes('verd')) {
    return { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-500', label: 'Verde' };
  }
  if (kyu.includes('6') || kyu.includes('azul')) {
    return { bg: 'bg-blue-100 text-blue-900 border-blue-300', dot: 'bg-blue-600', label: 'Azul' };
  }
  if (kyu.includes('5') || kyu.includes('4') || kyu.includes('morad')) {
    return { bg: 'bg-purple-100 text-purple-900 border-purple-300', dot: 'bg-purple-600', label: 'Morada' };
  }
  if (kyu.includes('3') || kyu.includes('2') || kyu.includes('1') || kyu.includes('marron') || kyu.includes('marrón')) {
    return { bg: 'bg-amber-100 text-amber-900 border-amber-400', dot: 'bg-amber-800', label: 'Marrón' };
  }
  if (kyu.includes('dan') || kyu.includes('negr')) {
    return { bg: 'bg-neutral-900 text-white border-neutral-700', dot: 'bg-red-500', label: 'Negra' };
  }
  return { bg: 'bg-gray-100 text-gray-800 border-gray-300', dot: 'bg-gray-400', label: 'Kyu' };
}

export default function ConvocatoriaPublicPage({ params }) {
  const unwrappedParams = use(params);
  const token = unwrappedParams.token;

  const [isLoading, setIsLoading] = useState(true);
  const [callData, setCallData] = useState(null);
  const [students, setStudents] = useState([]);
  const [_syllabi, setSyllabi] = useState([]);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Filtro y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('padron'); // 'padron' | 'alumnos' | 'horarios'

  // Modal para inscribir nuevo alumno
  const [showNewStudentModal, setShowNewStudentModal] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    birthDate: '',
    currentRank: '10° Kyu (Cinta Blanca)',
    targetRank: '9° Kyu (Cinta Amarilla)',
    scheduleBlock: ''
  });
  const [isSubmittingNewStudent, setIsSubmittingNewStudent] = useState(false);

  // Horarios y evaluadores
  const [schedulesList, setSchedulesList] = useState([]);
  const [evaluatorsList, setEvaluatorsList] = useState([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleNotice, setScheduleNotice] = useState(null);

  const [isPending, startTransition] = useTransition();

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getTechnicalExamCallByToken(token);
      if (!res.success) {
        setError(res.error || 'No se pudo cargar la convocatoria solicitada.');
      } else {
        setCallData(res.call);
        setStudents(res.students || []);
        setSyllabi(res.syllabi || []);
        setSchedulesList(res.call.schedules || []);
        setEvaluatorsList(res.call.evaluators || []);
      }
    } catch (err) {
      setError('Error al conectar con el servidor.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, loadData]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Promover o retirar alumno de la convocatoria
  const handleTogglePromotion = (student, currentTargetRank = null) => {
    const isCurrentlyPromoted = callData?.aspirants?.some(a => a.studentId === student._id);
    const newPromotionState = !isCurrentlyPromoted;

    startTransition(async () => {
      const targetRank = currentTargetRank || student.currentRank;
      const res = await toggleStudentPromotionForCall({
        callId: callData._id,
        studentId: student._id,
        isPromoted: newPromotionState,
        targetRank
      });

      if (res.success) {
        // Actualizar aspirantes locales
        setCallData(prev => {
          if (!prev) return prev;
          let updatedAspirants = [...(prev.aspirants || [])];
          if (newPromotionState) {
            updatedAspirants.push({
              studentId: student._id,
              studentName: student.name,
              currentRank: student.currentRank,
              targetRank,
              scheduleBlock: '',
              promotedAt: new Date().toISOString()
            });
          } else {
            updatedAspirants = updatedAspirants.filter(a => a.studentId !== student._id);
          }
          return { ...prev, aspirants: updatedAspirants };
        });

        // Actualizar lista de estudiantes
        setStudents(prev => prev.map(s => 
          s._id === student._id ? { ...s, isPromotedForExam: newPromotionState } : s
        ));
      }
    });
  };

  // Registro rápido de alumno nuevo directo al padrón
  const handleQuickRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!newStudentForm.name.trim()) return;

    setIsSubmittingNewStudent(true);
    try {
      const res = await quickRegisterStudentForCall({
        callId: callData._id,
        dojoId: callData.dojoId,
        dojoName: callData.dojoName,
        name: newStudentForm.name,
        birthDate: newStudentForm.birthDate || '2012-01-01',
        currentRank: newStudentForm.currentRank,
        targetRank: newStudentForm.targetRank,
        scheduleBlock: newStudentForm.scheduleBlock
      });

      if (res.success) {
        setShowNewStudentModal(false);
        setNewStudentForm({
          name: '',
          birthDate: '',
          currentRank: '10° Kyu (Cinta Blanca)',
          targetRank: '9° Kyu (Cinta Amarilla)',
          scheduleBlock: ''
        });
        await loadData();
      } else {
        alert(res.error || 'Error al registrar al estudiante.');
      }
    } catch (err) {
      console.error(err);
      alert('Error al registrar estudiante.');
    } finally {
      setIsSubmittingNewStudent(false);
    }
  };

  // Guardar horarios y tribunal
  const handleSaveSchedulesAndEvaluators = async () => {
    setIsSavingSchedule(true);
    setScheduleNotice(null);
    try {
      const res = await updateExamCallSchedulesAndEvaluators({
        callId: callData._id,
        schedules: schedulesList,
        evaluators: evaluatorsList
      });

      if (res.success) {
        setScheduleNotice({ type: 'success', text: 'Horarios y mesa de evaluadores guardados correctamente.' });
        setCallData(prev => ({ ...prev, status: res.status }));
      } else {
        setScheduleNotice({ type: 'error', text: res.error || 'Error al guardar.' });
      }
    } catch (err) {
      console.error(err);
      setScheduleNotice({ type: 'error', text: 'Error al persistir cambios.' });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Agregar bloque horario
  const handleAddScheduleBlock = () => {
    setSchedulesList(prev => [
      ...prev,
      {
        blockName: `Tanda ${prev.length + 1}: Kyus Iniciales`,
        startTime: '09:00 AM',
        targetRanks: ['10° Kyu (Cinta Blanca)', '9° Kyu (Cinta Amarilla)'],
        studentIds: []
      }
    ]);
  };

  // Eliminar bloque horario
  const handleRemoveScheduleBlock = (idx) => {
    setSchedulesList(prev => prev.filter((_, i) => i !== idx));
  };

  // Agregar evaluador (hasta 5)
  const handleAddEvaluator = () => {
    if (evaluatorsList.length >= 5) return;
    setEvaluatorsList(prev => [
      ...prev,
      { name: `Sensei Evaluador ${prev.length + 1}`, email: '', role: 'Sinodal' }
    ]);
  };

  // Eliminar evaluador (Sensei Roy Gatjens en índice 0 es permanente por ser Director Nacional)
  const handleRemoveEvaluator = (idx) => {
    if (idx === 0) return; // Sensei Roy Gatjens es permanente
    if (evaluatorsList.length <= 1) return; // Mínimo 1
    setEvaluatorsList(prev => prev.filter((_, i) => i !== idx));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-xl border border-gray-100 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-[#BE1622] animate-spin" />
        </div>
        <h2 className="text-lg font-black text-slate-800 tracking-tight">ISKF Costa Rica</h2>
        <p className="text-xs text-slate-500 mt-1">Cargando convocatoria de examen técnico...</p>
      </div>
    );
  }

  if (error || !callData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 border border-red-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-800">Convocatoria No Disponible</h2>
        <p className="text-sm text-slate-600 max-w-md mt-2">{error || 'El enlace provisto es inválido o la convocatoria ha expirado.'}</p>
        <Link 
          href="/admin/examinations/technical" 
          className="mt-6 px-5 py-2.5 bg-[#2D2E83] text-white rounded-xl text-xs font-bold hover:bg-[#232468] transition-all shadow-md inline-flex items-center gap-2"
        >
          Volver a Convocatorias
        </Link>
      </div>
    );
  }

  // Filtrado de estudiantes
  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.currentRank.toLowerCase().includes(q);
  });

  const aspirantsCount = callData.aspirants?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-800">
      {/* Cabecera Principal */}
      <header className="bg-[#1E1F5C] text-white border-b-4 border-[#BE1622] shadow-lg sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
              <Image 
                src="/images/logo.png" 
                alt="ISKF Costa Rica" 
                width={40} 
                height={40} 
                className="object-contain" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#BE1622] text-white">
                  Convocatoria Oficial
                </span>
                <span className="text-xs text-blue-200 font-medium">ISKF Costa Rica</span>
              </div>
              <h1 className="text-lg md:text-xl font-black tracking-tight">{callData.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/examinations/technical"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Volver al panel de Convocatorias Técnicas"
            >
              <span>← Convocatorias</span>
            </Link>

            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Copiar enlace directo de esta convocatoria"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Enlace Copiado!' : 'Copiar Link'}</span>
            </button>

            <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-right">
              <div className="text-[10px] text-blue-200 uppercase tracking-widest font-bold">Estado</div>
              <div className="font-black text-amber-300 capitalize">{callData.status}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Tarjeta de Resumen del Evento */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-[#2D2E83]/10 text-[#2D2E83] flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dojo Sede</div>
                <div className="text-sm font-bold text-slate-800">{callData.dojoName}</div>
                {callData.dojoSensei && (
                  <div className="text-xs text-slate-500">Sensei: {callData.dojoSensei}</div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-[#BE1622]/10 text-[#BE1622] flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Fecha del Examen</div>
                <div className="text-sm font-bold text-slate-800">{callData.examDate}</div>
                <div className="text-xs text-slate-500">Hora inicio: {callData.startTime}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Lugar / Sede</div>
                <div className="text-sm font-bold text-slate-800 truncate max-w-[160px]">{callData.location || 'Dojo Central'}</div>
                <div className="text-xs text-slate-500">Mesa oficial ISKF</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Aspirantes en Padrón</div>
                <div className="text-xl font-black text-emerald-900">{aspirantsCount}</div>
                <div className="text-[11px] text-emerald-700 font-medium">Postulados para examen</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación del Sensei */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('padron')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all cursor-pointer ${
              activeTab === 'padron'
                ? 'bg-[#2D2E83] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Padrón Oficial de Examen</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white font-black">
              {aspirantsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('alumnos')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all cursor-pointer ${
              activeTab === 'alumnos'
                ? 'bg-[#2D2E83] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Alumnos del Dojo (Inscribir / Promocionar)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700 font-black">
              {students.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('horarios')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all cursor-pointer ${
              activeTab === 'horarios'
                ? 'bg-[#BE1622] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Horarios y Tribunal Evaluador</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white font-black">
              {evaluatorsList.length} Sinodales
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VISTA 1: PADRÓN OFICIAL DE ASPIRANTES A EXAMEN */}
        {/* ========================================================================= */}
        {activeTab === 'padron' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    Padrón Oficial Confirmado ({aspirantsCount} Aspirantes)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Estos karatecas se presentarán ante el tribunal en tatami para optar por su nuevo grado.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('alumnos')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Más Karatecas al Padrón
                </button>
              </div>

              {aspirantsCount === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
                    <Users className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">El Padrón Oficial aún está vacío</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                    Pase a la pestaña de &ldquo;Alumnos del Dojo&rdquo; y presione el botón &ldquo;Promocionar&rdquo; en los karatecas listos para examinarse.
                  </p>
                  <button
                    onClick={() => setActiveTab('alumnos')}
                    className="px-5 py-2.5 bg-[#2D2E83] text-white rounded-xl text-xs font-bold hover:bg-[#232468] transition-all shadow-md inline-flex items-center gap-2"
                  >
                    <span>Ver Alumnos del Dojo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {callData.aspirants.map((aspirant, idx) => {
                    const currentBelt = getBeltColor(aspirant.currentRank);
                    const targetBelt = getBeltColor(aspirant.targetRank);
                    const matchingStudent = students.find(s => s._id === aspirant.studentId);

                    return (
                      <div 
                        key={aspirant.studentId || idx}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {aspirant.scheduleBlock || 'Horario por asignar'}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-black text-slate-900 leading-snug">{aspirant.studentName}</h4>
                          
                          <div className="mt-3 flex items-center gap-2 text-xs">
                            <div className="flex-1">
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Grado Actual</div>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${currentBelt.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${currentBelt.dot}`} />
                                <span className="truncate max-w-[100px]">{aspirant.currentRank}</span>
                              </span>
                            </div>

                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-3" />

                            <div className="flex-1">
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Aspira A</div>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${targetBelt.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${targetBelt.dot}`} />
                                <span className="truncate max-w-[100px]">{aspirant.targetRank}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Listo en Padrón
                          </span>
                          <button
                            onClick={() => matchingStudent && handleTogglePromotion(matchingStudent)}
                            disabled={isPending}
                            className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                            title="Retirar de este examen"
                          >
                            Retirar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 2: LISTA DE ALUMNOS DEL DOJO - PROMOCIÓN E INSCRIPCIÓN */}
        {/* ========================================================================= */}
        {activeTab === 'alumnos' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar alumno por nombre o grado..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-[#2D2E83] focus:bg-white transition-all"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowNewStudentModal(true)}
                    className="px-4 py-2 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Inscribir Nuevo Karateca</span>
                  </button>
                </div>
              </div>

              {/* Listado de Alumnos */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-3">Karateca</th>
                      <th className="py-3 px-3">Grado Actual</th>
                      <th className="py-3 px-3">Grado a Aspirar</th>
                      <th className="py-3 px-3 text-center">Estado Padrón</th>
                      <th className="py-3 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No se encontraron karatecas registrados con ese criterio.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => {
                        const isPromoted = callData?.aspirants?.some(a => a.studentId === student._id);
                        const belt = getBeltColor(student.currentRank);

                        return (
                          <tr key={student._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{student.name}</div>
                              <div className="text-[11px] text-slate-400">{student.dojoName}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${belt.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${belt.dot}`} />
                                <span>{student.currentRank}</span>
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <select 
                                id={`rank-target-${student._id}`}
                                defaultValue={KYU_RANKS[Math.min(KYU_RANKS.indexOf(student.currentRank) + 1, KYU_RANKS.length - 1)] || student.currentRank}
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#2D2E83]"
                              >
                                {KYU_RANKS.map(rk => (
                                  <option key={rk} value={rk}>{rk}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {isPromoted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  En Padrón
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                                  No postulado
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => {
                                  const selectEl = document.getElementById(`rank-target-${student._id}`);
                                  const targetVal = selectEl ? selectEl.value : student.currentRank;
                                  handleTogglePromotion(student, targetVal);
                                }}
                                disabled={isPending}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                                  isPromoted
                                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                }`}
                              >
                                {isPromoted ? 'Quitar del Padrón' : 'Promocionar a Examen'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 3: HORARIOS ESPECÍFICOS Y TRIBUNAL EVALUADOR */}
        {/* ========================================================================= */}
        {activeTab === 'horarios' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#BE1622]" />
                    Planificación de Horarios de Atención por Bloques
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Organice las horas de inicio para cada tanda o grupo de grados.
                  </p>
                </div>

                <button
                  onClick={handleAddScheduleBlock}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Tanda Horaria
                </button>
              </div>

              {/* Lista de Bloques de Horarios */}
              <div className="mt-4 space-y-3">
                {schedulesList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500">No hay bloques de horario configurados aún. El examen comenzará a las {callData.startTime}.</p>
                    <button
                      onClick={handleAddScheduleBlock}
                      className="mt-3 text-xs font-bold text-[#2D2E83] hover:underline"
                    >
                      + Crear primera tanda horaria
                    </button>
                  </div>
                ) : (
                  schedulesList.map((block, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 flex-1 w-full">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre del Bloque</label>
                          <input
                            type="text"
                            value={block.blockName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSchedulesList(prev => prev.map((b, i) => i === idx ? { ...b, blockName: val } : b));
                            }}
                            className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Hora de Inicio</label>
                          <input
                            type="text"
                            value={block.startTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSchedulesList(prev => prev.map((b, i) => i === idx ? { ...b, startTime: val } : b));
                            }}
                            placeholder="ej. 09:30 AM"
                            className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Grados Incluidos</label>
                          <input
                            type="text"
                            value={(block.targetRanks || []).join(', ')}
                            onChange={(e) => {
                              const val = e.target.value.split(',').map(s => s.trim());
                              setSchedulesList(prev => prev.map((b, i) => i === idx ? { ...b, targetRanks: val } : b));
                            }}
                            placeholder="Cinta Blanca, Amarilla"
                            className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveScheduleBlock(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Eliminar bloque"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Sección Tribunal Evaluador */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#2D2E83]" />
                      Tribunal Evaluador Convocado (Mínimo 1, Máximo 5 Senseis)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Senseis acreditados para calificar en las tablets durante el tatami.
                    </p>
                  </div>

                  {evaluatorsList.length < 5 && (
                    <button
                      onClick={handleAddEvaluator}
                      className="px-3.5 py-2 bg-blue-50 text-[#2D2E83] hover:bg-blue-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Sensei Evaluador
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {evaluatorsList.map((evaluator, idx) => {
                    const isRoyPermanent = idx === 0;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                          isRoyPermanent
                            ? 'bg-amber-50/70 border-amber-300/80 shadow-2xs'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Sinodal #{idx + 1}</span>
                            {isRoyPermanent && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-400/80 font-black text-[9px]">
                                👑 Director Nacional ISKF (Permanente)
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={isRoyPermanent ? (evaluator.name || 'Sensei Roy Gatjens') : evaluator.name}
                            readOnly={isRoyPermanent}
                            onChange={(e) => {
                              if (isRoyPermanent) return;
                              const val = e.target.value;
                              setEvaluatorsList(prev => prev.map((ev, i) => i === idx ? { ...ev, name: val } : ev));
                            }}
                            placeholder="Nombre del Sensei"
                            className={`w-full mt-1 px-2.5 py-1 border rounded-lg text-xs font-bold ${
                              isRoyPermanent
                                ? 'bg-amber-100/60 border-amber-300 text-amber-950 font-black cursor-not-allowed'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          />
                        </div>
                        {!isRoyPermanent && evaluatorsList.length > 1 && (
                          <button
                            onClick={() => handleRemoveEvaluator(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer shrink-0"
                            title="Quitar evaluador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botón de Guardar Todo */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {scheduleNotice && (
                    <div className={`text-xs font-bold ${scheduleNotice.type === 'success' ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {scheduleNotice.text}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSaveSchedulesAndEvaluators}
                  disabled={isSavingSchedule}
                  className="px-6 py-2.5 bg-[#BE1622] hover:bg-[#9E121C] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Guardar Planificación y Tribunal</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Inscribir Nuevo Estudiante Rápido */}
      {showNewStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#2D2E83]" />
              Inscribir Karateca al Dojo y Padrón
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              El alumno será registrado bajo {callData.dojoName} e incluido directamente en este examen.
            </p>

            <form onSubmit={handleQuickRegisterSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700">Nombre Completo del Karateca *</label>
                <input
                  type="text"
                  required
                  value={newStudentForm.name}
                  onChange={(e) => setNewStudentForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ej. Mateo Rodríguez Vargas"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#2D2E83] outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={newStudentForm.birthDate}
                  onChange={(e) => setNewStudentForm(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#2D2E83] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700">Grado Actual</label>
                  <select
                    value={newStudentForm.currentRank}
                    onChange={(e) => setNewStudentForm(prev => ({ ...prev, currentRank: e.target.value }))}
                    className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#2D2E83] outline-hidden"
                  >
                    {KYU_RANKS.map(rk => (
                      <option key={rk} value={rk}>{rk}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700">Aspira A</label>
                  <select
                    value={newStudentForm.targetRank}
                    onChange={(e) => setNewStudentForm(prev => ({ ...prev, targetRank: e.target.value }))}
                    className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#2D2E83] outline-hidden"
                  >
                    {KYU_RANKS.map(rk => (
                      <option key={rk} value={rk}>{rk}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewStudentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewStudent}
                  className="px-5 py-2 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingNewStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Inscribir y Promocionar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
