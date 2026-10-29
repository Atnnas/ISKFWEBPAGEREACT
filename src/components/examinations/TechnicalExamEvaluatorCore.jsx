'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Star,
  StarHalf,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  User,
  Check,
  RotateCcw,
  Users,
  MessageSquare,
  X,
  Edit3,
  Info,
  BookOpen,
  AlertTriangle,
  Lock,
  Calendar,
  Camera,
  Save,
  Loader2,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { saveEvaluatorAtomicGrade, getCallSchedulesLatest, getEvaluatorGradesForCall } from '../../lib/actions/technicalExams';
import { updateStudent } from '../../lib/actions/students';
import { DEFAULT_TECHNICAL_ASPECTS } from '../../lib/constants/technicalAspects';
import { KYU_OPTIONS, getBeltBadgeClass } from '../../lib/constants/kyuRanks';
import TribunalProgressMonitor from '../admin/TribunalProgressMonitor';
import { handleBulletInputChange, handleBulletKeyDown } from '../../lib/utils/bulletNotes';
import {
  parseCustomDate,
  calculateAge,
  formatDateDDMMAAAA,
  getBeltBadge,
  getTandasRosterSignature,
  parseAspectPoint,
  KIHON_CANON_ORDER,
  KATA_CANON_ORDER,
  getCanonicalTechKey,
  DEFAULT_TECHNIQUES
} from '../../lib/utils/evaluatorHelpers';

export default function TechnicalExamEvaluatorCore({
  call,
  evaluator,
  students = [],
  syllabi = [],
  initialEvaluations = [],
  isAdmin = false
}) {
  const callId = call?._id || call?.id || '';
  const evaluatorEmail = evaluator?.email || '';
  const safeKeyId = String(callId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const safeKeyEmail = String(evaluatorEmail || '').replace(/[^a-zA-Z0-9_@-]/g, '');
  const localStorageKey = `iskf_eval_${safeKeyId}_${safeKeyEmail}`;
  const localEvaluationsKey = `iskf_eval_grades_${safeKeyId}_${safeKeyEmail}`;

  // Tandas y estudiantes con sincronización en tiempo real desde el servidor
  const [liveSchedules, setLiveSchedules] = useState(() => Array.isArray(call?.schedules) ? call.schedules : []);
  const [liveStudents, setLiveStudents] = useState(() => Array.isArray(students) ? students : []);
  const [isSyncingRoster, setIsSyncingRoster] = useState(false);
  const [rosterAlert, setRosterAlert] = useState(null);
  const [isCallClosed, setIsCallClosed] = useState(() => call?.status === 'cerrado');
  const prevSignatureRef = useRef(getTandasRosterSignature(call?.schedules || []));
  const starClickTrackerRef = useRef({});

  // Sincronizar estudiantes en vivo si la prop se actualiza desde el exterior
  useEffect(() => {
    if (Array.isArray(students) && students.length > 0) {
      setLiveStudents(students);
    }
  }, [students]);

  // Auto-ocultar alerta de actualización de tandas
  useEffect(() => {
    if (rosterAlert) {
      const timer = setTimeout(() => setRosterAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [rosterAlert]);

  // Sondeo en tiempo real de tandas y karatecas
  const pollCallRoster = useCallback(async (isManual = false) => {
    if (!call?.accessToken && !callId) return;
    if (isManual) setIsSyncingRoster(true);

    try {
      const res = await getCallSchedulesLatest({ callId, accessToken: call?.accessToken });
      if (res.status === 'cerrado') {
        setIsCallClosed(true);
      }
      if (res.success && Array.isArray(res.schedules)) {
        const newSig = getTandasRosterSignature(res.schedules);
        const oldSig = prevSignatureRef.current;

        // Detectar si hubo un cambio real en las tandas o en la distribución de karatecas
        if (oldSig && newSig !== oldSig) {
          prevSignatureRef.current = newSig;
          setLiveSchedules(res.schedules);
          if (Array.isArray(res.students) && res.students.length > 0) {
            setLiveStudents(res.students);
          }
          setRosterAlert('¡Tandas y lista de karatecas actualizadas en vivo por la administración!');

          // Feedback de audio marcial suave (campanilla de tatami)
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
              osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
              gain.gain.setValueAtTime(0.08, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.35);
            }
          } catch {
            // Silencioso si el navegador bloquea audio
          }
        } else {
          // Mantener sincronía de datos
          prevSignatureRef.current = newSig;
          setLiveSchedules(res.schedules);
          if (Array.isArray(res.students) && res.students.length > 0) {
            setLiveStudents(res.students);
          }
        }
      }
    } catch (err) {
      console.debug('Error al sincronizar tandas en vivo:', err);
    } finally {
      if (isManual) {
        setTimeout(() => setIsSyncingRoster(false), 350);
      }
    }
  }, [callId, call?.accessToken]);

  // Intervalo de sincronización en vivo cada 5s (sólo con pestaña activa) + ejecución inmediata al enfocar
  useEffect(() => {
    if (!call?.accessToken && !callId) return;

    // Ejecutar de inmediato al cargar el tatami
    pollCallRoster(false);

    // Sondeo periódico inteligente: no realiza peticiones si la pestaña está en segundo plano o minimizada
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      pollCallRoster(false);
    }, 5000);

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        pollCallRoster(false);
      }
    };
    const handleFocus = () => {
      pollCallRoster(false);
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [callId, call?.accessToken, pollCallRoster]);

  const tandas = liveSchedules;

  // Evaluaciones en memoria indexadas por studentId con caché local y datos de servidor
  const [evaluationsByStudent, setEvaluationsByStudent] = useState(() => {
    const map = {};
    (initialEvaluations || []).forEach(ev => {
      const sId = String(ev.studentId);
      const existingPhaseNotes = ev.phaseNotes || {};
      if (ev.notes && !existingPhaseNotes.kihon && !existingPhaseNotes.kata && !existingPhaseNotes.kumite) {
        existingPhaseNotes.kihon = ev.notes;
      }
      map[sId] = {
        ...ev,
        phaseNotes: existingPhaseNotes
      };
    });

    // Fusión con caché local para prevenir cualquier pérdida visual al cambiar de pestaña o viñeta
    if (typeof window !== 'undefined') {
      try {
        const rawCached = localStorage.getItem(localEvaluationsKey);
        if (rawCached) {
          const parsed = JSON.parse(rawCached);
          if (typeof parsed === 'object' && parsed !== null) {
            Object.entries(parsed).forEach(([sId, cEv]) => {
              map[sId] = {
                ...(map[sId] || {}),
                ...cEv,
                scores: {
                  ...(map[sId]?.scores || {}),
                  ...(cEv.scores || {})
                },
                techniqueAverages: {
                  ...(map[sId]?.techniqueAverages || {}),
                  ...(cEv.techniqueAverages || {})
                },
                phaseNotes: {
                  ...(map[sId]?.phaseNotes || {}),
                  ...(cEv.phaseNotes || {})
                }
              };
            });
          }
        }
      } catch (err) {
        console.debug('Error al leer caché local de evaluaciones:', err);
      }
    }

    return map;
  });

  // Sincronizar evaluaciones existentes desde la base de datos para este evaluador y convocatoria
  useEffect(() => {
    if (!callId || !evaluatorEmail) return;

    let isMounted = true;
    const fetchExistingGrades = async () => {
      try {
        const res = await getEvaluatorGradesForCall({ callId, evaluatorEmail });
        if (res.success && Array.isArray(res.evaluations) && res.evaluations.length > 0 && isMounted) {
          setEvaluationsByStudent(prev => {
            const merged = { ...prev };
            res.evaluations.forEach(ev => {
              const sId = String(ev.studentId);
              merged[sId] = {
                ...(merged[sId] || {}),
                ...ev,
                scores: {
                  ...(ev.scores || {}),
                  ...(merged[sId]?.scores || {})
                },
                techniqueAverages: {
                  ...(ev.techniqueAverages || {}),
                  ...(merged[sId]?.techniqueAverages || {})
                },
                phaseNotes: {
                  ...(ev.phaseNotes || {}),
                  ...(merged[sId]?.phaseNotes || {})
                }
              };
            });

            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(localEvaluationsKey, JSON.stringify(merged));
              } catch (e) {
                console.debug('Error al actualizar localStorage con notas de BD:', e);
              }
            }

            return merged;
          });
        }
      } catch (err) {
        console.debug('Error al consultar evaluaciones del evaluador:', err);
      }
    };

    fetchExistingGrades();
    return () => { isMounted = false; };
  }, [callId, evaluatorEmail, localEvaluationsKey]);

  // Fase seleccionada en el modal de observaciones (Kihon, Kata, Kumite)
  const [obsModalPhase, setObsModalPhase] = useState('kihon');

  // Helper para leer caché persistente sincrónicamente con validación estricta
  const getCachedState = () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(localStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) return null;
      return {
        selectedTandaIndex: typeof parsed.selectedTandaIndex === 'number' && Number.isInteger(parsed.selectedTandaIndex) ? parsed.selectedTandaIndex : 0,
        selectedPhase: ['kihon', 'kata', 'kumite', 'aspectos'].includes(parsed.selectedPhase) ? parsed.selectedPhase : 'kihon',
        selectedTechniqueIndex: typeof parsed.selectedTechniqueIndex === 'number' && Number.isInteger(parsed.selectedTechniqueIndex) ? parsed.selectedTechniqueIndex : 0,
        lastUpdated: typeof parsed.lastUpdated === 'number' ? parsed.lastUpdated : null
      };
    } catch {
      return null;
    }
  };

  // Tanda, fase y técnica activas inicializadas desde caché
  const [selectedTandaIndex, setSelectedTandaIndex] = useState(() => {
    const cached = getCachedState();
    if (typeof cached?.selectedTandaIndex === 'number' && tandas[cached.selectedTandaIndex]) {
      return cached.selectedTandaIndex;
    }
    return 0;
  });

  // Ajuste automático de índice de tanda si el admin eliminó o reorganizó tandas
  useEffect(() => {
    if (liveSchedules.length > 0 && selectedTandaIndex >= liveSchedules.length) {
      setSelectedTandaIndex(Math.max(0, liveSchedules.length - 1));
    }
  }, [liveSchedules, selectedTandaIndex]);

  const [selectedPhase, setSelectedPhase] = useState(() => {
    const cached = getCachedState();
    return cached?.selectedPhase || 'kihon';
  });

  const [selectedTechniqueIndex, setSelectedTechniqueIndex] = useState(() => {
    const cached = getCachedState();
    return typeof cached?.selectedTechniqueIndex === 'number' ? cached.selectedTechniqueIndex : 0;
  });

  // Control manual independiente de técnica por karateca en caso de desajuste en tatami
  const [studentTechOverrides, setStudentTechOverrides] = useState({});

  // Modal rápido de observaciones por estudiante
  const [activeObsStudent, setActiveObsStudent] = useState(null);

  // Validación estricta: bloqueo si faltan estrellas en algún aspecto de algún karateca
  const [unratedStarKeys, setUnratedStarKeys] = useState(new Set());
  const [validationWarning, setValidationWarning] = useState(null);

  // Modal para ver el monitor del tribunal (supervisar a los demás senseis)
  const [showTribunalMonitorModal, setShowTribunalMonitorModal] = useState(false);

  // Detección de Sensei Roy (Director de Evaluación ISKF / Admin)
  const isDirectorRoy = useMemo(() => {
    return Boolean(
      isAdmin ||
      evaluator?.role === 'director' ||
      evaluator?.isDirector ||
      (evaluator?.name && /roy/i.test(evaluator.name) && !/lee/i.test(evaluator.name)) ||
      (evaluator?.email && /roygatjens/i.test(evaluator.email))
    );
  }, [isAdmin, evaluator]);

  // Modal para consultar "Aspectos a Considerar"
  const [selectedStudentForAspects, setSelectedStudentForAspects] = useState(null);

  // Modal para que Sensei Roy edite datos del atleta
  const [editingStudentModal, setEditingStudentModal] = useState(null);
  const [isSavingStudentData, setIsSavingStudentData] = useState(false);
  const photoInputRef = useRef(null);
  const [editStudentForm, setEditStudentForm] = useState({
    name: '',
    birthDate: '',
    currentRank: '10° Kyu (Cinta Blanca)',
    photo: '',
    notes: '',
    positiveAspects: '',
    hasSpecialCondition: false,
    specialCondition: ''
  });

  const handleOpenEditStudentModal = (student) => {
    const sId = String(student._id || student.id);
    const freshStudent = liveStudents.find(s => String(s._id || s.id) === sId) || student;
    setEditingStudentModal(freshStudent);
    setEditStudentForm({
      name: freshStudent.name || '',
      birthDate: formatDateDDMMAAAA(freshStudent.birthDate),
      currentRank: freshStudent.currentRank || '10° Kyu (Cinta Blanca)',
      photo: freshStudent.photo || '',
      notes: freshStudent.notes || '',
      positiveAspects: freshStudent.positiveAspects || '',
      hasSpecialCondition: Boolean(freshStudent.hasSpecialCondition),
      specialCondition: freshStudent.specialCondition || ''
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setEditStudentForm(prev => ({ ...prev, photo: uploadEvent.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStudentFromEvaluator = async (e) => {
    e.preventDefault();
    if (!editingStudentModal) return;
    if (!editStudentForm.name.trim()) {
      alert('Por favor ingresa el nombre del karateca.');
      return;
    }

    const cleanBirth = (editStudentForm.birthDate || '').trim();
    if (cleanBirth && cleanBirth !== 'No indicada' && cleanBirth !== 'No registrada') {
      const parsedBirth = parseCustomDate(cleanBirth);
      if (!parsedBirth) {
        alert('Fecha de nacimiento inválida. Use DD/MM/AAAA.');
        return;
      }
    }

    const finalPositive = (editStudentForm.positiveAspects || '').trim();
    const finalNotes = (editStudentForm.notes || '').trim();
    const isSpecial = Boolean(editStudentForm.hasSpecialCondition);
    const finalSpecial = isSpecial
      ? (editStudentForm.specialCondition.trim() || '• Condición especial')
      : '';

    setIsSavingStudentData(true);
    try {
      const sId = editingStudentModal._id || editingStudentModal.id;
      const res = await updateStudent(sId, {
        name: editStudentForm.name.trim(),
        birthDate: cleanBirth,
        currentRank: editStudentForm.currentRank,
        photo: editStudentForm.photo,
        notes: finalNotes,
        positiveAspects: finalPositive,
        hasSpecialCondition: isSpecial,
        specialCondition: finalSpecial,
        callId: call?._id || call?.id,
        accessToken: call?.accessToken,
        evaluatorToken: evaluator?.token || evaluator?.email
      });

      if (res.success && res.student) {
        setLiveStudents(prev => prev.map(s => (String(s._id || s.id) === String(sId) ? res.student : s)));
        setEditingStudentModal(null);
      } else {
        alert(res.error || 'No se pudo actualizar el estudiante.');
      }
    } catch (err) {
      console.error('Error al actualizar datos del estudiante:', err);
      alert('Error de conexión al actualizar el estudiante.');
    } finally {
      setIsSavingStudentData(false);
    }
  };

  const modalCalculatedAge = useMemo(() => {
    return calculateAge(editStudentForm.birthDate);
  }, [editStudentForm.birthDate]);

  // Estados de conexión y autoguardado
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'offline' | 'error'
  const [restoredToast, setRestoredToast] = useState(() => {
    const cached = getCachedState();
    return Boolean(cached && cached.lastUpdated);
  });
  const [tandaToast, setTandaToast] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // Auto-ocultar notificación de restauración
  useEffect(() => {
    if (restoredToast) {
      const t = setTimeout(() => setRestoredToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [restoredToast]);

  // Auto-ocultar notificación de cambio de tanda
  useEffect(() => {
    if (tandaToast) {
      const t = setTimeout(() => setTandaToast(null), 3800);
      return () => clearTimeout(t);
    }
  }, [tandaToast]);

  // Detector de conectividad
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Advertencia de salida si hay calificaciones en proceso de guardado
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = 'Tienes notas pendientes de sincronizar con el servidor.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // Estudiantes de la tanda activa respetando fielmente el orden específico fijado por el admin
  const activeTanda = tandas[selectedTandaIndex] || tandas[0] || null;
  const tandaStudents = useMemo(() => {
    // Si no se han definido tandas (examen sin bloques), se muestran todos los alumnos convocados
    if (!tandas || tandas.length === 0) {
      return liveStudents;
    }
    if (!activeTanda) return [];
    if (!Array.isArray(activeTanda.studentIds) || activeTanda.studentIds.length === 0) {
      return [];
    }

    const studentMap = new Map();
    (liveStudents || []).forEach(s => {
      studentMap.set(String(s._id || s.id), s);
    });

    // Mapear respetando fielmente el orden específico de la tanda fijado por el admin
    const orderedList = activeTanda.studentIds
      .map(id => studentMap.get(String(id)))
      .filter(Boolean);

    return orderedList;
  }, [activeTanda, liveStudents, tandas]);

  // Helper para resolver el temario aplicable de cada estudiante según su grado/cinturón
  const getStudentSyllabus = useCallback((st) => {
    if (!st) return syllabi[0] || null;
    const rankTarget = (st.targetRank || '').toLowerCase().trim();
    const rankCurrent = (st.currentRank || '').toLowerCase().trim();

    // 1. Prioridad: Coincidencia exacta por rango actual del estudiante (ej: Cinta Blanca -> Temario Blanco)
    let match = syllabi.find(s => {
      const sCurrent = (s.currentRank || '').toLowerCase().trim();
      return rankCurrent && sCurrent === rankCurrent;
    });
    if (match) return match;

    // 2. Prioridad: Coincidencia por rango objetivo (targetRank)
    match = syllabi.find(s => {
      const sTarget = (s.targetRank || '').toLowerCase().trim();
      const targets = Array.isArray(s.targetRanks) ? s.targetRanks.map(r => (r || '').toLowerCase().trim()) : [];
      return (
        (rankTarget && sTarget === rankTarget) ||
        (rankTarget && targets.includes(rankTarget))
      );
    });
    if (match) return match;

    // 3. Coincidencia difusa por nombre de temario
    match = syllabi.find(s => {
      const sName = (s.name || '').toLowerCase();
      if (rankCurrent && (rankCurrent.includes('blanco') || rankCurrent.includes('blanca')) && (sName.includes('blanco') || sName.includes('blanca') || sName.includes('10'))) return true;
      if (rankCurrent && rankCurrent.includes('amarill') && (sName.includes('amarill') || sName.includes('9'))) return true;
      if (rankTarget && (rankTarget.includes('blanco') || rankTarget.includes('blanca')) && (sName.includes('blanco') || sName.includes('blanca') || sName.includes('10'))) return true;
      if (rankTarget && rankTarget.includes('amarill') && (sName.includes('amarill') || sName.includes('9'))) return true;
      return false;
    });

    return match || syllabi[0] || null;
  }, [syllabi]);

  // Verificar si hay aspectos generales de Sección 2 (Físicos, Mentales, DO) marcados para evaluar en examen
  const hasEvaluableAspects = useMemo(() => {
    const relevantSyllabi = tandaStudents.map(st => getStudentSyllabus(st)).filter(Boolean);
    const pool = relevantSyllabi.length > 0 ? relevantSyllabi : (syllabi.length > 0 ? syllabi : []);
    return pool.some(syl => (syl.technicalAspects || []).some(asp => {
      const cat = (asp.category || '').toLowerCase();
      // Tsuki, Uke, Dachi, Geri se evalúan en Kihon; Kata y Kumite tienen sus fases dedicadas
      if (['tsuki', 'uke', 'dachi', 'geri', 'kata', 'kumite'].includes(cat)) return false;
      const isSec2 = ['physical', 'mental', 'do'].includes(cat);
      return (asp.points || []).some(p => {
        if (!p) return false;
        if (!isSec2) return true;
        if (typeof p === 'object') return Boolean(p.isEvaluable || p.evaluableInExam || p.evaluable);
        return false;
      });
    }));
  }, [tandaStudents, getStudentSyllabus, syllabi]);

  // Fase efectiva considerando si hay o no aspectos evaluables
  const effectivePhase = (selectedPhase === 'aspectos' && !hasEvaluableAspects) ? 'kihon' : selectedPhase;

  // Obtener la secuencia exacta de técnicas oficiales para cada estudiante según su propio temario
  const getStudentTechniques = useCallback((student, phase = effectivePhase) => {
    if (!student) return DEFAULT_TECHNIQUES[phase] || [];
    const syl = getStudentSyllabus(student);
    if (!syl) return DEFAULT_TECHNIQUES[phase] || [];

    if (phase === 'aspectos') {
      const list = [];
      (syl.technicalAspects || []).forEach((asp, aIdx) => {
        const cat = (asp.category || '').toLowerCase();
        if (['tsuki', 'uke', 'dachi', 'geri', 'kata', 'kumite'].includes(cat)) return;
        const isSec2 = ['physical', 'mental', 'do'].includes(cat);
        const validPoints = (asp.points || []).filter(p => {
          if (!p) return false;
          if (!isSec2) return true;
          if (typeof p === 'object') return Boolean(p.isEvaluable || p.evaluableInExam || p.evaluable);
          return false;
        });
        if (isSec2 && validPoints.length === 0) return;
        list.push({
          id: asp.id || asp.category || `asp_${aIdx}`,
          name: asp.title || `Aspecto ${aIdx + 1}`,
          stance: asp.subtitle || asp.categoryLabel || 'Aspecto Normativo Oficial',
          direction: `${validPoints.length} parámetros evaluables`,
          repetitions: validPoints.length,
          notes: asp.subtitle || '',
          aspectObj: asp
        });
      });
      return list;
    }

    const list = [];
    (syl.techniques || []).forEach((t, tIdx) => {
      const group = (t.group || t.phase || 'kihon').toLowerCase();
      if (group === phase.toLowerCase()) {
        list.push({
          id: t.id || `tech_${student._id || student.id}_${tIdx}`,
          canonKey: getCanonicalTechKey(t.name || t.id),
          name: t.name,
          stance: t.stance || '',
          direction: t.direction || '',
          repetitions: t.repetitions || 3,
          notes: t.notes || '',
          embusen: t.embusen || '',
          order: t.order !== undefined ? t.order : tIdx
        });
      }
    });

    list.sort((a, b) => (a.order || 0) - (b.order || 0));

    return list.length > 0 ? list : (DEFAULT_TECHNIQUES[phase] || []);
  }, [effectivePhase, getStudentSyllabus]);

  // Máximo número de pasos/técnicas en la fase actual entre todos los karatecas en tatami
  const maxTechniquesInPhase = useMemo(() => {
    if (!tandaStudents || tandaStudents.length === 0) return 1;
    return Math.max(...tandaStudents.map(st => getStudentTechniques(st, effectivePhase).length), 1);
  }, [tandaStudents, getStudentTechniques, effectivePhase]);

  // Técnicas consolidadas de referencia
  const tandaTechniques = useMemo(() => {
    if (tandaStudents.length > 0) {
      return getStudentTechniques(tandaStudents[0], effectivePhase);
    }
    return DEFAULT_TECHNIQUES[effectivePhase] || DEFAULT_TECHNIQUES.kihon;
  }, [tandaStudents, getStudentTechniques, effectivePhase]);

  // Técnica activa de referencia
  const activeTechnique = useMemo(() => {
    return tandaTechniques[selectedTechniqueIndex] || tandaTechniques[0] || { id: 't1', name: 'Técnica de Evaluación' };
  }, [tandaTechniques, selectedTechniqueIndex]);
  const activeTechKey = activeTechnique.id || activeTechnique.name || `tech_${selectedTechniqueIndex}`;

  // Helper para resolver los criterios o aspectos técnicos configurados en el temario según cinturón
  const getStudentCriteriaForPhase = useCallback((student, phase, technique) => {
    const syl = getStudentSyllabus(student);
    const sylAspects = Array.isArray(syl?.technicalAspects) ? syl.technicalAspects : [];

    const tsukiAspect = sylAspects.find(a => (a.category || a.id || '').toLowerCase().includes('tsuki'));
    const ukeAspect = sylAspects.find(a => (a.category || a.id || '').toLowerCase().includes('uke'));
    const dachiAspect = sylAspects.find(a => (a.category || a.id || '').toLowerCase().includes('dachi'));
    const geriAspect = sylAspects.find(a => (a.category || a.id || '').toLowerCase().includes('geri'));
    const physicalAspect = sylAspects.find(a => (a.category || a.id || '').toLowerCase().includes('physical'));
    const mentalAspect = sylAspects.find(a => (a.category || a.id || '').toLowerCase().includes('mental'));
    const doAspect = sylAspects.find(a => (a.category || a.id || '').toLowerCase().includes('do'));

    // 1. Fase de Aspectos Generales (Parámetros Normativos Oficiales)
    if (phase === 'aspectos') {
      const activeAspId = (technique?.id || '').toLowerCase();
      const matchedAsp = sylAspects.find(a => 
        (a.id || '').toLowerCase() === activeAspId || 
        (a.category || '').toLowerCase() === activeAspId ||
        (a.title || '').toLowerCase() === (technique?.name || '').toLowerCase()
      );

      if (matchedAsp && Array.isArray(matchedAsp.points) && matchedAsp.points.length > 0) {
        const isSec2 = ['physical', 'mental', 'do'].includes((matchedAsp.category || '').toLowerCase());
        const points = matchedAsp.points.map((p, pIdx) => parseAspectPoint(p, pIdx, matchedAsp.category || 'asp', isSec2)).filter(Boolean);
        if (points.length > 0) return points;
      }

      // Fallback combinando físico, mental y do si no hay bloque exacto (sólo evaluables)
      const fallbackPoints = [];
      [physicalAspect, mentalAspect, doAspect].filter(Boolean).forEach(asp => {
        (asp.points || []).forEach((p, pIdx) => {
          const parsed = parseAspectPoint(p, pIdx, asp.category || 'asp', true);
          if (parsed) fallbackPoints.push(parsed);
        });
      });
      if (fallbackPoints.length > 0) return fallbackPoints.slice(0, 5);

      return [
        { key: 'rei', label: 'Protocolo y Etiqueta (Rei)', short: 'Etiqueta / Rei', desc: 'Saludo marcial, respeto y actitud en el tatami', rawText: 'Protocolo y Etiqueta' },
        { key: 'zanshin', label: 'Zanshin y Atención Alerta', short: 'Zanshin', desc: 'Espíritu alerta permanente antes y después de cada técnica', rawText: 'Zanshin' },
        { key: 'kiai', label: 'Kiai y Determinación', short: 'Kiai / Valor', desc: 'Grito marcial potente sincronizado con el Kime', rawText: 'Kiai' }
      ];
    }

    // 2. Fase de Kata
    if (phase === 'kata') {
      const kataAspect = sylAspects.find(a => (a.category || a.id || '').toLowerCase().includes('kata'));
      if (kataAspect && Array.isArray(kataAspect.points)) {
        return kataAspect.points.map((p, pIdx) => parseAspectPoint(p, pIdx, 'kata')).filter(Boolean);
      }
      const defaultKata = DEFAULT_TECHNICAL_ASPECTS.find(a => a.category === 'kata');
      return (defaultKata?.points || []).map((p, pIdx) => parseAspectPoint(p, pIdx, 'kata')).filter(Boolean);
    }

    // 3. Fase de Kumite
    if (phase === 'kumite') {
      const kumiteAspect = sylAspects.find(a => (a.category || a.id || '').toLowerCase().includes('kumite'));
      if (kumiteAspect && Array.isArray(kumiteAspect.points)) {
        return kumiteAspect.points.map((p, pIdx) => parseAspectPoint(p, pIdx, 'kumite')).filter(Boolean);
      }
      const defaultKumite = DEFAULT_TECHNICAL_ASPECTS.find(a => a.category === 'kumite');
      return (defaultKumite?.points || []).map((p, pIdx) => parseAspectPoint(p, pIdx, 'kumite')).filter(Boolean);
    }

    // 4. Fase de Kihon: Mapeo exacto técnica a técnica desde "Aspectos Técnicos y Rúbrica Oficial"
    const techNameLower = (technique?.name || '').toLowerCase();
    const isKick = techNameLower.includes('geri') || techNameLower.includes('patada');
    const isBlock = techNameLower.includes('uke') || techNameLower.includes('barai') || techNameLower.includes('bloqueo');

    const criteria = [];

    if (isKick) {
      if (geriAspect && Array.isArray(geriAspect.points) && geriAspect.points.length > 0) {
        geriAspect.points.forEach((p, pIdx) => {
          const item = parseAspectPoint(p, pIdx, 'geri');
          if (item) criteria.push(item);
        });
      } else {
        criteria.push({ key: 'geri_0', label: 'Trayectoria y Hikiashi', short: 'Elevación / Hikiashi', desc: 'Elevación de rodilla y recogida rápida', rawText: 'Hikiashi' });
        criteria.push({ key: 'geri_1', label: 'Anclaje del pie de apoyo', short: 'Pie de Apoyo', desc: 'Base firme sin balanceo en el impacto', rawText: 'Pie de apoyo' });
      }
    } else if (isBlock) {
      if (ukeAspect && Array.isArray(ukeAspect.points) && ukeAspect.points.length > 0) {
        ukeAspect.points.forEach((p, pIdx) => {
          const item = parseAspectPoint(p, pIdx, 'uke');
          if (item) criteria.push(item);
        });
      } else {
        criteria.push({ key: 'uke_0', label: 'Angulación y Altura Oficial', short: 'Angulación Uke', desc: 'Ángulo correcto de bloqueo a distancia reglamentaria', rawText: 'Angulación' });
        criteria.push({ key: 'uke_1', label: 'Preparación y Rotación', short: 'Rotación / Kime', desc: 'Movimiento preparatorio limpio y giro de antebrazo', rawText: 'Preparación' });
        criteria.push({ key: 'uke_2', label: 'Hikite Sincronizado', short: 'Hikite Firme', desc: 'Tirón de cadera y brazo opuesto sobre cinturón', rawText: 'Hikite' });
      }
    } else {
      if (tsukiAspect && Array.isArray(tsukiAspect.points) && tsukiAspect.points.length > 0) {
        tsukiAspect.points.forEach((p, pIdx) => {
          const item = parseAspectPoint(p, pIdx, 'tsuki');
          if (item) criteria.push(item);
        });
      } else {
        criteria.push({ key: 'tsuki_0', label: 'Trayectoria Directa', short: 'Trayectoria', desc: 'Sin abrir el codo hacia el punto focal', rawText: 'Trayectoria' });
        criteria.push({ key: 'tsuki_1', label: 'Rotación y Kime', short: 'Rotación / Kime', desc: 'Giro de antebrazo al final del impacto', rawText: 'Rotación' });
        criteria.push({ key: 'tsuki_2', label: 'Hikite Firme en Cadera', short: 'Hikite Firme', desc: 'Puño contrario cerrado sobre cresta ilíaca', rawText: 'Hikite' });
      }
    }

    // Agregar punto normativo de Dachi Waza (postura) configurado en el temario
    const techStance = (technique?.stance || '').toLowerCase();
    let matchedDachiPoint = null;
    if (dachiAspect && Array.isArray(dachiAspect.points) && dachiAspect.points.length > 0) {
      const getPtText = (pt) => (typeof pt === 'object' && pt !== null ? (pt.text || pt.point || '') : String(pt || '')).toLowerCase();
      if (techStance.includes('kiba')) {
        matchedDachiPoint = dachiAspect.points.find(p => getPtText(p).includes('kiba')) || dachiAspect.points[1];
      } else if (techStance.includes('kokutsu')) {
        matchedDachiPoint = dachiAspect.points.find(p => getPtText(p).includes('kokutsu')) || dachiAspect.points[2];
      } else {
        matchedDachiPoint = dachiAspect.points.find(p => getPtText(p).includes('zenkutsu')) || dachiAspect.points[0];
      }
    }

    if (matchedDachiPoint) {
      criteria.push(parseAspectPoint(matchedDachiPoint, 0, 'dachi'));
    } else {
      criteria.push({
        key: 'dachi_base',
        label: 'Dachi Waza (Postura y Base)',
        short: 'Postura / Dachi',
        desc: technique?.stance || 'Base estable, altura constante y pies firmes',
        rawText: 'Dachi Waza'
      });
    }

    return criteria.filter(Boolean);
  }, [getStudentSyllabus]);

  // Detectar si la tanda actual tiene karatecas de distintos cinturones / temarios
  const isMixedTanda = useMemo(() => {
    if (!tandaStudents || tandaStudents.length <= 1) return false;
    const ranks = new Set(
      tandaStudents.map(st => (st.currentRank || '').toLowerCase().trim()).filter(Boolean)
    );
    if (ranks.size > 1) return true;
    const syllabiIds = new Set(
      tandaStudents.map(st => {
        const syl = getStudentSyllabus(st);
        return String(syl?._id || syl?.id || '');
      }).filter(Boolean)
    );
    return syllabiIds.size > 1;
  }, [tandaStudents, getStudentSyllabus]);

  // Agrupar los estudiantes de la tanda activa por su respectivo cinturón / temario oficial
  const beltGroups = useMemo(() => {
    if (!tandaStudents || tandaStudents.length === 0) return [];
    const groupsMap = new Map();

    tandaStudents.forEach(student => {
      const syl = getStudentSyllabus(student);
      const key = String(syl?._id || syl?.id || student.currentRank || 'general');
      if (!groupsMap.has(key)) {
        const studentTechs = getStudentTechniques(student, effectivePhase);
        groupsMap.set(key, {
          key,
          syllabus: syl,
          rankLabel: student.currentRank || syl?.currentRank || syl?.name || 'Cinturón Oficial',
          targetRankLabel: syl?.targetRank || student.targetRank || '',
          techniques: studentTechs,
          students: []
        });
      }
      groupsMap.get(key).students.push(student);
    });

    return Array.from(groupsMap.values());
  }, [tandaStudents, getStudentSyllabus, getStudentTechniques, effectivePhase]);

  // Número máximo de pasos entre todos los grupos de cinturones en tatami
  const totalPhaseSteps = useMemo(() => {
    if (beltGroups.length === 0) return 1;
    return Math.max(...beltGroups.map(g => g.techniques.length), 1);
  }, [beltGroups]);

  // Guardar estado de navegación en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify({
        selectedTandaIndex,
        selectedPhase,
        selectedTechniqueIndex,
        lastUpdated: Date.now()
      }));
    } catch (err) {
      console.debug('Error en localStorage:', err);
    }
  }, [localStorageKey, selectedTandaIndex, selectedPhase, selectedTechniqueIndex]);

  // Debounce refs y caché acumulada por estudiante para autoguardado atómico con reintento automático
  const saveTimeoutRefs = useRef({});
  const latestEvaluationsRef = useRef({});

  // Mantener ref sincronizada con las evaluaciones completas en memoria
  useEffect(() => {
    latestEvaluationsRef.current = evaluationsByStudent;
  }, [evaluationsByStudent]);

  // Guardado atómico de calificación por estudiante con fusión acumulada y retry automático
  const persistStudentGrade = useCallback((studentId, newEvalData, studentObj) => {
    if (!studentId || !evaluatorEmail) return;

    setEvaluationsByStudent(prev => {
      const prevStudentEval = prev[studentId] || {};
      const updatedStudentEval = {
        ...prevStudentEval,
        ...newEvalData,
        scores: {
          ...(prevStudentEval.scores || {}),
          ...(newEvalData.scores || {})
        },
        techniqueAverages: {
          ...(prevStudentEval.techniqueAverages || {}),
          ...(newEvalData.techniqueAverages || {})
        },
        observations: {
          ...(prevStudentEval.observations || {}),
          ...(newEvalData.observations || {})
        },
        phaseNotes: {
          ...(prevStudentEval.phaseNotes || {}),
          ...(newEvalData.phaseNotes || {})
        }
      };

      const updatedMap = {
        ...prev,
        [studentId]: updatedStudentEval
      };

      latestEvaluationsRef.current = updatedMap;

      // Respaldo sincrónico inmediato en localStorage para evitar pérdida de datos si se cambia de viñeta
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(localEvaluationsKey, JSON.stringify(updatedMap));
        } catch (e) {
          console.debug('Error en localStorage evals:', e);
        }
      }

      return updatedMap;
    });

    setSaveStatus('saving');

    if (saveTimeoutRefs.current[studentId]) {
      clearTimeout(saveTimeoutRefs.current[studentId]);
    }

    const stSyllabus = getStudentSyllabus(studentObj || liveStudents.find(s => String(s._id || s.id) === String(studentId)));

    const executeSaveWithRetry = async (attempt = 1) => {
      try {
        const latestStudentEval = latestEvaluationsRef.current[studentId] || newEvalData;
        const payloadCallId = String(callId || call?._id || call?.id || '').trim();
        const payloadStudentId = String(studentId).trim();
        const payloadEmail = String(evaluatorEmail || '').trim().toLowerCase();
        const payloadSyllabusId = String(stSyllabus?._id || stSyllabus?.id || 'general').trim();

        const res = await saveEvaluatorAtomicGrade({
          callId: payloadCallId || null,
          studentId: payloadStudentId,
          evaluatorEmail: payloadEmail,
          evaluatorName: String(evaluator?.name || 'Sensei Sinodal'),
          syllabusId: payloadSyllabusId,
          syllabusName: String(stSyllabus?.name || 'Temario Oficial ISKF'),
          scores: latestStudentEval.scores || {},
          techniqueAverages: latestStudentEval.techniqueAverages || {},
          observations: latestStudentEval.observations || {},
          percentage: Number(latestStudentEval.percentage) || 0,
          pointsEarned: Number(latestStudentEval.pointsEarned) || 0,
          pointsPossible: Number(latestStudentEval.pointsPossible) || 0,
          isPassed: Boolean(latestStudentEval.isPassed),
          phaseNotes: latestStudentEval.phaseNotes || {},
          notes: String(latestStudentEval.notes || '')
        });

        if (res.success) {
          setSaveStatus('saved');
        } else if (attempt < 2) {
          setTimeout(() => executeSaveWithRetry(attempt + 1), 800);
        } else {
          console.warn('Advertencia al guardar nota atómica:', res.error);
          setSaveStatus('error');
        }
      } catch (err) {
        if (attempt < 2) {
          setTimeout(() => executeSaveWithRetry(attempt + 1), 800);
        } else {
          console.error('Error al persistir nota atómica:', err);
          setSaveStatus(navigator.onLine ? 'error' : 'offline');
        }
      }
    };

    saveTimeoutRefs.current[studentId] = setTimeout(() => {
      executeSaveWithRetry(1);
    }, 300);
  }, [evaluatorEmail, evaluator, getStudentSyllabus, liveStudents, callId, call?._id, call?.id, localEvaluationsKey]);

  // Calificar un criterio específico para un karateca con estrellas (1 a 5)
  const handleRateStudentCriterion = (student, criterionKey, scoreVal) => {
    const sId = String(student._id || student.id);
    const prevEval = evaluationsByStudent[sId] || {
      scores: {},
      techniqueAverages: {},
      observations: {},
      percentage: 0,
      isPassed: false,
      notes: ''
    };
    const prevScores = { ...(prevEval.scores || {}) };

    prevScores[criterionKey] = Number(scoreVal);

    const scoreValues = Object.values(prevScores).filter(v => typeof v === 'number' && v > 0);
    const sum = scoreValues.reduce((acc, v) => acc + v, 0);
    const avg = scoreValues.length > 0 ? (sum / scoreValues.length) : 0;

    // Determinar con precisión qué técnica se está calificando a partir de criterionKey
    let targetTechKey = activeTechKey;
    if (criterionKey.startsWith('aspect_')) {
      const parts = criterionKey.split('_');
      if (parts.length >= 3) {
        targetTechKey = parts.slice(1, -1).join('_');
      }
    } else if (criterionKey.includes('_')) {
      const lastUnderscore = criterionKey.lastIndexOf('_');
      targetTechKey = criterionKey.substring(0, lastUnderscore);
    }

    // Calcular promedio específico de esta técnica (1 a 10)
    const targetTechScores = Object.entries(prevScores)
      .filter(([k, v]) => {
        if (typeof v !== 'number' || v <= 0) return false;
        if (criterionKey.startsWith('aspect_')) {
          return k.startsWith(`aspect_${targetTechKey}_`);
        }
        return k.startsWith(`${targetTechKey}_`) || k === targetTechKey;
      })
      .map(([, v]) => v);

    const techAvg = targetTechScores.length > 0
      ? (targetTechScores.reduce((acc, v) => acc + v, 0) / targetTechScores.length)
      : Number(scoreVal);

    const updatedTechniqueAverages = {
      ...(prevEval.techniqueAverages || {}),
      [targetTechKey]: Number(techAvg.toFixed(1))
    };

    // Calcular promedio general equilibrado estrictamente entre las tres fases finales: Kihon, Kata y Kumite
    const resolvePhaseForTech = (tKey) => {
      if (!tKey) return 'kihon';
      const tk = String(tKey).toLowerCase();
      if (tk.includes('-ka') || tk.includes('kata') || tk.includes('heian') || tk.includes('tekki') || tk.includes('bassai')) return 'kata';
      if (tk.includes('-ku') || tk.includes('kumite') || tk.includes('sambon') || tk.includes('gohon')) return 'kumite';
      if (tk.startsWith('aspect')) return 'aspectos';
      for (const syl of syllabi || []) {
        const found = (syl.techniques || []).find(t => t.id === tKey || getCanonicalTechKey(t.name) === getCanonicalTechKey(tKey));
        if (found) return (found.group || found.phase || 'kihon').toLowerCase();
      }
      return 'kihon';
    };

    const phaseSums = { kihon: 0, kata: 0, kumite: 0 };
    const phaseCounts = { kihon: 0, kata: 0, kumite: 0 };

    Object.entries(updatedTechniqueAverages).forEach(([tKey, tAvg]) => {
      if (typeof tAvg !== 'number' || tAvg <= 0) return;
      const ph = resolvePhaseForTech(tKey);
      if (phaseSums[ph] !== undefined) {
        const norm = tAvg <= 10 ? tAvg * 10 : tAvg;
        phaseSums[ph] += norm;
        phaseCounts[ph]++;
      }
    });

    const evaluatedPhases = [
      phaseCounts.kihon > 0 ? (phaseSums.kihon / phaseCounts.kihon) : null,
      phaseCounts.kata > 0 ? (phaseSums.kata / phaseCounts.kata) : null,
      phaseCounts.kumite > 0 ? (phaseSums.kumite / phaseCounts.kumite) : null,
    ].filter(v => v !== null);

    const percentage = evaluatedPhases.length > 0
      ? Math.round(evaluatedPhases.reduce((acc, v) => acc + v, 0) / evaluatedPhases.length)
      : (scoreValues.length > 0 ? Math.round((avg / 10) * 100) : 0);
    const isPassed = percentage >= 70;

    const updatedData = {
      ...prevEval,
      scores: prevScores,
      techniqueAverages: updatedTechniqueAverages,
      percentage,
      pointsEarned: sum,
      pointsPossible: scoreValues.length * 10,
      isPassed
    };

    // Si la celda estaba marcada como faltante, removerla de unratedStarKeys
    const cellKey = `${sId}__${criterionKey}`;
    setUnratedStarKeys(prev => {
      if (!prev.has(cellKey)) return prev;
      const next = new Set(prev);
      next.delete(cellKey);
      if (next.size === 0) {
        setValidationWarning(null);
      }
      return next;
    });

    persistStudentGrade(sId, updatedData, student);
  };

  // Manejo de clic simple y doble clic para calificar con estrellas enteras o medias estrellas (1 a 10)
  const handleStarClick = (student, criterionKey, starVal, e) => {
    e?.preventDefault?.();
    const cellKey = `${student._id || student.id}__${criterionKey}`;
    const now = Date.now();
    const tracker = starClickTrackerRef.current[cellKey] || { time: 0, star: null, initialVal: 0 };
    const isQuickSecondClick = tracker.star === starVal && (now - tracker.time < 350);

    const sId = String(student._id || student.id);
    const ev = evaluationsByStudent[sId] || { scores: {} };
    const currentVal = Number(ev.scores?.[criterionKey] ?? 0);

    if (isQuickSecondClick) {
      // Segundo clic rápido en la misma estrellita (doble clic)
      // Alterna entre media estrella (starVal - 0.5) y estrella completa (starVal)
      const baseVal = tracker.initialVal;
      const targetVal = (baseVal === starVal - 0.5 || currentVal === starVal - 0.5)
        ? starVal
        : starVal - 0.5;

      starClickTrackerRef.current[cellKey] = { time: 0, star: null, initialVal: targetVal };
      handleRateStudentCriterion(student, criterionKey, targetVal);
    } else {
      // Clic normal: registrar estado previo y aplicar estrella completa
      starClickTrackerRef.current[cellKey] = { time: now, star: starVal, initialVal: currentVal };
      handleRateStudentCriterion(student, criterionKey, starVal);
    }
  };

  const handleStarDoubleClick = (student, criterionKey, starVal, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const cellKey = `${student._id || student.id}__${criterionKey}`;
    const sId = String(student._id || student.id);
    const ev = evaluationsByStudent[sId] || { scores: {} };
    const currentVal = Number(ev.scores?.[criterionKey] ?? 0);
    // Doble clic explícito: alternar entre estrella completa y media estrella
    const targetVal = currentVal === starVal ? starVal - 0.5 : (currentVal === starVal - 0.5 ? starVal : starVal - 0.5);
    starClickTrackerRef.current[cellKey] = { time: 0, star: null, initialVal: targetVal };
    handleRateStudentCriterion(student, criterionKey, targetVal);
  };

  // Abrir modal de observaciones configurando la fase activa por defecto
  const handleOpenObsModal = (student) => {
    setActiveObsStudent(student);
    setObsModalPhase(effectivePhase);
  };

  // Actualizar notas de texto para un estudiante por fase (Kihon, Kata, Kumite, etc.)
  const handleUpdateStudentNotes = (student, text, phase = obsModalPhase || effectivePhase) => {
    const sId = String(student._id || student.id);
    const prevEval = evaluationsByStudent[sId] || {
      scores: {},
      techniqueAverages: {},
      observations: {},
      percentage: 0,
      isPassed: false,
      notes: '',
      phaseNotes: {}
    };

    const updatedPhaseNotes = {
      ...(prevEval.phaseNotes || {}),
      [phase]: text
    };

    // Sincronizar un resumen combinado para notes general
    const parts = [];
    if (updatedPhaseNotes.kihon?.trim()) parts.push(`• [Kihon]:\n${updatedPhaseNotes.kihon.trim()}`);
    if (updatedPhaseNotes.kata?.trim()) parts.push(`• [Kata]:\n${updatedPhaseNotes.kata.trim()}`);
    if (updatedPhaseNotes.kumite?.trim()) parts.push(`• [Kumite]:\n${updatedPhaseNotes.kumite.trim()}`);
    if (updatedPhaseNotes.aspectos?.trim()) parts.push(`• [Aspectos]:\n${updatedPhaseNotes.aspectos.trim()}`);
    const combinedNotes = parts.join('\n\n');

    const updatedEval = {
      ...prevEval,
      phaseNotes: updatedPhaseNotes,
      notes: combinedNotes
    };

    persistStudentGrade(sId, updatedEval, student);
  };

  // Helper para insertar automáticamente viñetas (•) al presionar Enter en el área de notas
  const handleNotesKeyDown = (e, student, currentNotes, phase = obsModalPhase || effectivePhase) => {
    handleBulletKeyDown(e, currentNotes, (newValue) => {
      handleUpdateStudentNotes(student, newValue, phase);
    });
  };

  // Botón para agregar una nueva viñeta en el textarea
  const handleAddBullet = (student, currentNotes, phase = obsModalPhase || effectivePhase) => {
    let newText = currentNotes || '';
    if (!newText.trim()) {
      newText = '• ';
    } else if (newText.endsWith('\n')) {
      newText += '• ';
    } else {
      newText += '\n• ';
    }
    handleUpdateStudentNotes(student, newText, phase);
    setTimeout(() => {
      const el = document.getElementById('sensei-bullet-notes');
      if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = newText.length;
      }
    }, 0);
  };

  // Convertir líneas sueltas existentes en viñetas
  const handleFormatAllAsBullets = (student, currentNotes, phase = obsModalPhase || effectivePhase) => {
    if (!currentNotes || !currentNotes.trim()) {
      handleUpdateStudentNotes(student, '• ', phase);
      return;
    }
    const lines = currentNotes.split('\n');
    const formatted = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return `• ${trimmed.replace(/^[•\-*]\s*/, '')}`;
      }
      return `• ${trimmed}`;
    }).join('\n');
    handleUpdateStudentNotes(student, formatted, phase);
  };

  // Fases disponibles dinámicamente según el orden oficial ISKF (1. Kihon, 2. Kumite, 3. Kata)
  const availablePhaseKeys = useMemo(() => {
    return ['kihon', 'kumite', 'kata', ...(hasEvaluableAspects ? ['aspectos'] : [])];
  }, [hasEvaluableAspects]);

  // Validar si todos los karatecas en tatami tienen todas sus estrellas asignadas (> 0) en sus técnicas activas
  const validateCurrentTechniqueComplete = useCallback(() => {
    const missing = new Set();
    if (!tandaStudents || tandaStudents.length === 0) {
      return { isValid: true, missing };
    }

    tandaStudents.forEach(student => {
      const sId = String(student._id || student.id);
      const studentTechs = getStudentTechniques(student, effectivePhase);
      const activeIdx = studentTechOverrides[sId] !== undefined ? studentTechOverrides[sId] : selectedTechniqueIndex;

      // Si el karateca ya terminó sus técnicas en esta fase, no le falta nada
      if (activeIdx >= studentTechs.length) return;

      const activeTech = studentTechs[activeIdx];
      if (!activeTech) return;

      const ev = evaluationsByStudent[sId] || { scores: {} };
      const scores = ev.scores || {};
      const criteria = getStudentCriteriaForPhase(student, effectivePhase, activeTech);
      const techKey = activeTech.id || activeTech.name || `tech_${activeIdx}`;

      criteria.forEach(criterion => {
        const criterionKey = effectivePhase === 'aspectos'
          ? `aspect_${techKey}_${criterion.key}`
          : `${techKey}_${criterion.key}`;

        const scoreVal = scores[criterionKey] ?? scores[criterion.key];
        if (!scoreVal || Number(scoreVal) <= 0) {
          missing.add(`${sId}__${criterionKey}`);
        }
      });
    });

    return {
      isValid: missing.size === 0,
      missing
    };
  }, [tandaStudents, evaluationsByStudent, effectivePhase, selectedTechniqueIndex, studentTechOverrides, getStudentTechniques, getStudentCriteriaForPhase]);

  // Flags para control de avance entre técnicas, fases y tandas
  const currentPhaseIndex = availablePhaseKeys.indexOf(effectivePhase);
  const isFirstPhaseInTanda = currentPhaseIndex <= 0;
  const isLastPhaseInTanda = currentPhaseIndex >= availablePhaseKeys.length - 1;
  const isFirstTechniqueInPhase = selectedTechniqueIndex === 0;
  const isLastTechniqueInPhase = selectedTechniqueIndex >= totalPhaseSteps - 1;

  // ¿Está en el primer paso absoluto de esta tanda?
  const isFirstStepInTanda = isFirstPhaseInTanda && isFirstTechniqueInPhase;
  // ¿Está en el último paso absoluto de esta tanda?
  const isLastStepInTanda = isLastPhaseInTanda && isLastTechniqueInPhase;

  // ¿Existe tanda siguiente o anterior?
  const hasNextTanda = selectedTandaIndex < tandas.length - 1;
  const hasPrevTanda = selectedTandaIndex > 0;

  // Navegar a técnica anterior / fase anterior / tanda anterior
  const handlePrevTechnique = () => {
    setValidationWarning(null);
    setUnratedStarKeys(new Set());

    // 1. Si no es el primer paso de la fase, retroceder de paso
    if (selectedTechniqueIndex > 0) {
      setSelectedTechniqueIndex(prev => prev - 1);
      setStudentTechOverrides({});
      return;
    }

    // 2. Si es el primer paso pero no la primera fase, retroceder a la fase previa
    if (currentPhaseIndex > 0) {
      setSelectedPhase(availablePhaseKeys[currentPhaseIndex - 1]);
      setSelectedTechniqueIndex(0);
      setStudentTechOverrides({});
      return;
    }

    // 3. Si está en el primer paso de la tanda y existe tanda anterior (Tanda 2 o superior), retroceder de tanda!
    if (hasPrevTanda) {
      const prevTIdx = selectedTandaIndex - 1;
      setSelectedTandaIndex(prevTIdx);
      setSelectedPhase(availablePhaseKeys[0] || 'kihon');
      setSelectedTechniqueIndex(0);
      setStudentTechOverrides({});
      setTandaToast({
        title: `Tanda Anterior: ${tandas[prevTIdx]?.blockName || `Tanda ${prevTIdx + 1}`}`,
        desc: `Regresando a los karatecas de la tanda ${prevTIdx + 1}`
      });
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextTechnique = () => {
    // Validar técnica actual antes de avanzar
    const { isValid, missing } = validateCurrentTechniqueComplete();
    if (!isValid) {
      setUnratedStarKeys(missing);
      setValidationWarning({
        techName: `Paso ${selectedTechniqueIndex + 1}`,
        count: missing.size,
        message: `Debe completar la calificación de todos los karatecas en sus técnicas activas antes de avanzar. Las estrellas vacías han sido resaltadas en rojo.`
      });
      return;
    }

    setUnratedStarKeys(new Set());
    setValidationWarning(null);

    // 1. Si no es el último paso de la fase actual, avanzar al siguiente paso
    if (selectedTechniqueIndex < totalPhaseSteps - 1) {
      setSelectedTechniqueIndex(prev => prev + 1);
      setStudentTechOverrides({});
      return;
    }

    // 2. Si es el último paso de la fase pero faltan fases en esta tanda (Kihon -> Kata -> Kumite...)
    if (!isLastPhaseInTanda) {
      setSelectedPhase(availablePhaseKeys[currentPhaseIndex + 1]);
      setSelectedTechniqueIndex(0);
      setStudentTechOverrides({});
      return;
    }

    // 3. ¡Llegó a lo último de las evaluaciones de la tanda actual!
    if (hasNextTanda) {
      const nextTIdx = selectedTandaIndex + 1;
      setSelectedTandaIndex(nextTIdx);
      setSelectedPhase(availablePhaseKeys[0] || 'kihon');
      setSelectedTechniqueIndex(0);
      setStudentTechOverrides({});
      setTandaToast({
        title: `¡Avanzando a ${tandas[nextTIdx]?.blockName || `Tanda ${nextTIdx + 1}`}!`,
        desc: `Cargando el siguiente grupo de karatecas en el tatami.`
      });
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 4. Último paso de la última tanda del examen: abrir el monitor del tribunal
    setShowTribunalMonitorModal(true);
  };

  return (
    <div className="space-y-3 w-full pb-20 select-none">
      {/* 1. NOTIFICACIÓN DE PROGRESO RESTAURADO */}
      {restoredToast && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-3.5 py-1.5 rounded-xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>✓ Sesión restaurada en el punto exacto donde la dejaste.</span>
          </div>
          <button
            type="button"
            onClick={() => setRestoredToast(false)}
            className="text-[11px] text-emerald-400 hover:text-white cursor-pointer underline"
          >
            Listo
          </button>
        </div>
      )}

      {/* NOTIFICACIÓN VISUAL DE CAMBIO DE TANDA */}
      {tandaToast && (
        <div className="bg-linear-to-r from-indigo-950 via-slate-900 to-indigo-950 border-2 border-amber-400 text-white px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs font-black shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-amber-400/20 text-amber-300 text-sm">
              🥋
            </span>
            <div>
              <div className="text-amber-300 font-black">{tandaToast.title}</div>
              <div className="text-[10px] text-slate-300 font-normal">{tandaToast.desc}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTandaToast(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. ENCABEZADO ULTRA COMPACTO: IDENTIFICACIÓN DEL SENSEI Y ESTADO */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:p-3 text-white flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-xs">
            🥋
          </span>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-white">{evaluator?.name || 'Sensei Sinodal'}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-white/10 text-amber-300 rounded font-semibold">
                {evaluator?.role || 'Sinodal'}
              </span>
              {isAdmin && (
                <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/30 text-indigo-200 rounded font-bold">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-xs sm:max-w-md">
              {call?.title || 'Examen Técnico'} • {call?.dojoName}
            </p>
          </div>
        </div>

        {/* Botón Monitor Tribunal, Sincronización en Vivo y Estado */}
        <div className="flex items-center gap-2.5 text-[11px] flex-wrap">
          <button
            type="button"
            onClick={() => setShowTribunalMonitorModal(true)}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-indigo-400/40 active:scale-95"
            title="Supervisar avance tanda por tanda de los demás Senseis"
          >
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>Monitor Tribunal</span>
          </button>

          {/* Botón de Sincronización en Tiempo Real */}
          <button
            type="button"
            onClick={() => pollCallRoster(true)}
            disabled={isSyncingRoster}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold transition-all shadow-xs cursor-pointer active:scale-95 text-[11px]"
            title="Sincronizar tandas y lista de karatecas ahora mismo"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncingRoster ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncingRoster ? 'Sincronizando...' : 'En Vivo'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          {saveStatus === 'saving' ? (
            <span className="flex items-center gap-1 text-amber-300 font-medium">
              <RotateCcw className="w-3 h-3 animate-spin" /> Guardando...
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <Check className="w-3.5 h-3.5" /> Guardado
            </span>
          )}

          {!isOnline ? (
            <span className="flex items-center gap-1 text-rose-400 font-bold" title="Sin conexión">
              <WifiOff className="w-3.5 h-3.5" /> Offline
            </span>
          ) : (
            <Wifi className="w-3 h-3 text-emerald-400" title="En línea" />
          )}
        </div>
      </div>

      {/* ALERTA DE TANDAS Y KARATECAS ACTUALIZADAS EN TIEMPO REAL */}
      {rosterAlert && (
        <div className="bg-linear-to-r from-cyan-950 via-slate-900 to-cyan-950 border-2 border-cyan-400 text-cyan-100 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs font-black shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 text-sm animate-bounce">
              ⚡
            </span>
            <div>
              <div className="text-white font-black">{rosterAlert}</div>
              <div className="text-[10px] text-cyan-300/90 font-normal">
                El padrón de examinación ha sido actualizado automáticamente en su pantalla sin perder ninguna calificación previa.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRosterAlert(null)}
            className="p-1.5 text-cyan-300 hover:text-white rounded-lg hover:bg-cyan-900/50 cursor-pointer transition-colors shrink-0 ml-2"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. SELECTOR DE TANDAS Y FASES */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-2">
        {/* Selector de Tandas */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0 px-1">
            <Clock className="w-3 h-3" /> Tanda:
          </span>
          {tandas.map((tanda, tIdx) => {
            const isSelected = selectedTandaIndex === tIdx;
            const studentCount = (tanda.studentIds || []).length;
            return (
              <button
                key={tanda.id || tIdx}
                type="button"
                onClick={() => {
                  setSelectedTandaIndex(tIdx);
                  setSelectedTechniqueIndex(0);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{tanda.blockName || `Tanda ${tIdx + 1}`}</span>
                <span className={`text-[10px] px-1 rounded-full font-mono ${
                  isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}>
                  {studentCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selector de Fases Oficial ISKF */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {[
            { key: 'kihon', label: '1. Kihon' },
            { key: 'kumite', label: '2. Kumite' },
            { key: 'kata', label: '3. Kata' },
            ...(hasEvaluableAspects ? [{ key: 'aspectos', label: '4. Aspectos Generales' }] : [])
          ].map(phase => {
            const isSelected = effectivePhase === phase.key;
            return (
              <button
                key={phase.key}
                type="button"
                onClick={() => {
                  setSelectedPhase(phase.key);
                  setSelectedTechniqueIndex(0);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2D2E83] text-white border border-indigo-400/50 shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {phase.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. BARRA DE FASE Y PASO ACTIVO */}
      <div className="bg-linear-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-400/30 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 shadow-md">
        <button
          type="button"
          onClick={handlePrevTechnique}
          disabled={selectedTechniqueIndex === 0 && effectivePhase === 'kihon'}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors shrink-0"
          title="Paso anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {isMixedTanda ? (
          <div className="text-center flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest font-black text-amber-400 flex items-center justify-center gap-1.5">
              <BookOpen className="w-3 h-3 text-amber-400" />
              <span>{effectivePhase.toUpperCase()} • PASO {selectedTechniqueIndex + 1} DE {totalPhaseSteps}</span>
            </div>
            <h2 className="text-sm sm:text-lg md:text-xl font-black text-white truncate tracking-tight mt-0.5">
              🥋 Evaluación Simultánea en Paralelo ({beltGroups.length} Cinturones Distintos • {tandaStudents.length} Karatecas)
            </h2>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-300 mt-1 flex-wrap">
              {beltGroups.map(group => {
                const curTech = group.techniques[selectedTechniqueIndex];
                return (
                  <span key={group.key} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 shadow-xs">
                    <span className="font-bold text-amber-300">{group.rankLabel}:</span>
                    <span className="font-extrabold text-white">{curTech?.name || '✅ Completado'}</span>
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest font-black text-amber-400 flex items-center justify-center gap-1.5">
              <BookOpen className="w-3 h-3 text-amber-400" />
              <span>{effectivePhase.toUpperCase()} • PASO {selectedTechniqueIndex + 1} DE {totalPhaseSteps}</span>
            </div>
            <h2 className="text-base sm:text-xl md:text-2xl font-black text-white truncate tracking-tight mt-0.5">
              {beltGroups[0]?.techniques[selectedTechniqueIndex]?.name || activeTechnique.name}
            </h2>
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
              {activeTechnique.stance && (
                <span className="text-amber-300/90 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  {activeTechnique.stance}
                </span>
              )}
              {activeTechnique.direction && (
                <span className="text-cyan-300/90 font-semibold bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                  {activeTechnique.direction}
                </span>
              )}
              {activeTechnique.repetitions && (
                <span className="text-emerald-300/90 font-bold bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                  {activeTechnique.repetitions} repeticiones
                </span>
              )}
              {activeTechnique.embusen && (
                <span className="text-purple-300/90 font-medium bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">
                  {activeTechnique.embusen}
                </span>
              )}
            </div>
            {activeTechnique.notes && (
              <p className="text-[11px] text-slate-400 max-w-2xl mx-auto truncate mt-1 italic">
                {activeTechnique.notes}
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleNextTechnique}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer transition-colors shrink-0"
          title="Siguiente paso"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ALERTA DE BLOQUEO POR ESTRELLAS FALTANTES */}
      {validationWarning && (
        <div className="bg-rose-950/90 border-2 border-rose-500 text-rose-100 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg shadow-rose-950/50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                <span>Evaluación Incompleta — {validationWarning.techName}</span>
                <span className="px-2 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-mono">
                  {validationWarning.count} aspecto{validationWarning.count > 1 ? 's' : ''} pendiente{validationWarning.count > 1 ? 's' : ''}
                </span>
              </h4>
              <p className="text-xs text-rose-200 mt-0.5 leading-snug">
                {validationWarning.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setValidationWarning(null)}
            className="p-1 rounded-lg text-rose-300 hover:text-white hover:bg-rose-900/50 cursor-pointer shrink-0"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5. VISTA DE EVALUACIÓN: CARRILES HORIZONTALES APILADOS POR CINTURÓN (OPCIÓN 1) */}
      {tandaStudents.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 font-bold shadow-xl">
          <div className="max-w-md mx-auto space-y-2">
            <div className="text-3xl">🥋</div>
            <div className="text-sm font-black text-white">Esta tanda no tiene karatecas asignados aún</div>
            <div className="text-xs text-slate-400">
              La administración está organizando el tatami. En cuanto se asigne un karateca, aparecerá automáticamente en pantalla en tiempo real.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {beltGroups.map((group, groupIdx) => {
            const groupTechs = group.techniques || [];
            const groupTechIdx = selectedTechniqueIndex;
            const isGroupCompleted = groupTechIdx >= groupTechs.length;
            const groupActiveTech = !isGroupCompleted ? groupTechs[groupTechIdx] : null;
            const groupTechKey = groupActiveTech?.id || groupActiveTech?.name || `tech_${groupTechIdx}`;

            const groupCriteria = (!isGroupCompleted && group.students[0])
              ? getStudentCriteriaForPhase(group.students[0], effectivePhase, groupActiveTech)
              : [];

            const phaseTitleName = {
              kihon: 'Kihon',
              kumite: 'Kumite',
              kata: 'Kata',
              aspectos: 'Aspectos Generales'
            }[effectivePhase] || effectivePhase.toUpperCase();

            return (
              <div
                key={group.key || groupIdx}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl"
              >
                {/* ENCABEZADO DEL CARRIL DEL CINTURÓN */}
                <div className="bg-slate-950/90 border-b border-slate-800/80 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${getBeltBadgeClass(group.rankLabel)}`}>
                      {group.rankLabel}
                    </span>
                    {group.targetRankLabel && group.targetRankLabel !== group.rankLabel && (
                      <span className="text-xs text-amber-300 font-mono flex items-center gap-1 font-bold">
                        <span className="text-slate-500">➔</span>
                        <span>Aspira: {group.targetRankLabel}</span>
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-mono font-bold">
                      {group.students.length} karateca{group.students.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* ESTADO / TÉCNICA ACTIVA DE ESTE CINTURÓN */}
                  <div>
                    {isGroupCompleted ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{phaseTitleName} Completado para este cinturón</span>
                      </div>
                    ) : (
                      <div className="flex flex-col md:items-end text-left md:text-right">
                        <div className="text-xs font-black text-white flex items-center gap-2">
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/25 px-1.5 py-0.5 rounded-md">
                            Paso {groupTechIdx + 1} de {groupTechs.length}
                          </span>
                          <span className="text-amber-200 text-sm font-black">{groupActiveTech?.name}</span>
                        </div>
                        {(groupActiveTech?.stance || groupActiveTech?.direction || groupActiveTech?.repetitions) && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {[groupActiveTech.stance, groupActiveTech.direction, groupActiveTech.repetitions].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* CONTENIDO DEL CARRIL */}
                {isGroupCompleted ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-950/40">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/20">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-200">
                      Todas las técnicas de {phaseTitleName} finalizadas para {group.rankLabel}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Los {group.students.length} karatecas de este cinturón ya fueron evaluados en esta fase. Pulsa el botón inferior &quot;Siguiente&quot; cuando el resto del tatami termine.
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[840px]">
                      <thead>
                        <tr className="bg-slate-950/70 border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-3 min-w-[240px] align-middle">
                            <div className="text-[11px] font-black uppercase text-slate-400">
                              Karateca
                            </div>
                          </th>
                          {groupCriteria.map((criterion, cIdx) => (
                            <th 
                              key={criterion.key} 
                              className="py-3 px-3 text-center align-middle min-w-[180px]"
                            >
                              <div className="flex flex-col items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 rounded-md whitespace-nowrap">
                                  Aspecto #{cIdx + 1}
                                </span>
                                <span className="text-xs font-bold text-slate-200 leading-snug text-center">
                                  {criterion.rawText || criterion.desc || criterion.label}
                                </span>
                              </div>
                            </th>
                          ))}
                          <th className="py-3 px-2 text-center w-20 align-middle">
                            <div className="text-[11px] font-black uppercase text-slate-400">
                              Nota
                            </div>
                          </th>
                          <th className="py-3 px-3 w-40 text-right align-middle">
                            <div className="text-[11px] font-black uppercase text-slate-400">
                              Observaciones
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {group.students.map((student, sIdx) => {
                          const sId = String(student._id || student.id);
                          const ev = evaluationsByStudent[sId] || { scores: {}, observations: {}, notes: '' };
                          const scores = ev.scores || {};
                          const studentSyllabus = getStudentSyllabus(student);

                          // Promedio de criterios de la técnica actual para este karateca
                          const techKeys = groupCriteria.map(c => effectivePhase === 'aspectos' ? `aspect_${groupTechKey}_${c.key}` : `${groupTechKey}_${c.key}`);
                          const aspectScores = techKeys.map(k => scores[k]).filter(v => typeof v === 'number' && v > 0);
                          const techAvg = aspectScores.length > 0
                            ? (aspectScores.reduce((acc, v) => acc + v, 0) / aspectScores.length)
                            : null;

                          const studentPhaseNotes = ev.phaseNotes?.[effectivePhase] !== undefined
                            ? ev.phaseNotes[effectivePhase]
                            : (effectivePhase === 'kihon' ? (ev.notes || '') : '');
                          const hasPhaseNotes = Boolean(studentPhaseNotes && studentPhaseNotes.trim().length > 0);

                          const hasAspects = Boolean(
                            (student.hasSpecialCondition && student.specialCondition?.trim()) ||
                            student.specialCondition?.trim() ||
                            student.positiveAspects?.trim() ||
                            student.notes?.trim()
                          );

                          return (
                            <tr
                              key={sId}
                              className="hover:bg-slate-800/40 transition-colors group"
                            >
                              <td className="py-2.5 px-3 min-w-[240px]">
                                <div className="flex items-center gap-2">
                                  {isDirectorRoy && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditStudentModal(student)}
                                      className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 hover:border-amber-400 transition-all shadow-xs cursor-pointer shrink-0 active:scale-90"
                                      title="Sensei Roy: Editar datos del atleta (Nombre, edad, aspectos)"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <span className="text-[10px] font-mono font-bold text-slate-500 w-4 shrink-0 text-center">
                                    #{sIdx + 1}
                                  </span>

                                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-slate-300 overflow-hidden shrink-0">
                                    {student.photo ? (
                                      <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                    ) : (
                                      student.name ? student.name.substring(0, 2).toUpperCase() : <User className="w-4 h-4 text-slate-400" />
                                    )}
                                  </div>

                                  <div className="leading-snug min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span
                                        className={`text-xs whitespace-normal break-words transition-all font-black text-white ${
                                          hasAspects ? 'white-radiance-glow' : ''
                                        }`}
                                        style={
                                          hasAspects
                                            ? {
                                                color: '#ffffff',
                                                textShadow:
                                                  '0 0 2px #ffffff, 0 0 6px rgba(255, 255, 255, 0.95), 0 0 14px rgba(255, 255, 255, 0.8), 0 0 22px rgba(255, 255, 255, 0.5)',
                                              }
                                            : { color: '#ffffff' }
                                        }
                                      >
                                        {student.name}
                                      </span>

                                      {hasAspects && (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedStudentForAspects(student)}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50 transition-all cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.35)] shrink-0 active:scale-95"
                                          title="Clic para ver los aspectos a considerar de este atleta"
                                        >
                                          <AlertTriangle className="w-3 h-3 text-amber-300 fill-amber-400/40 animate-pulse shrink-0" />
                                          <span className="text-[9px] font-black uppercase tracking-wider">REVISAR</span>
                                        </button>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      {student.birthDate && (
                                        <span className="text-[10px] text-slate-400 font-mono" title={`Nacimiento: ${formatDateDDMMAAAA(student.birthDate)}`}>
                                          {calculateAge(student.birthDate) !== null ? `${calculateAge(student.birthDate)} años` : ''} ({formatDateDDMMAAAA(student.birthDate)})
                                        </span>
                                      )}
                                      {studentSyllabus?.targetRank && studentSyllabus.targetRank !== student.currentRank && (
                                        <span className="text-[9px] text-amber-300/80 font-mono" title={`Aspira a: ${studentSyllabus.targetRank}`}>
                                          ➔ Aspira: {studentSyllabus.targetRank.split(' ')[0]}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Celdas con las 10 estrellas por criterio */}
                              {groupCriteria.map(criterion => {
                                const criterionKey = effectivePhase === 'aspectos'
                                  ? `aspect_${groupTechKey}_${criterion.key}`
                                  : `${groupTechKey}_${criterion.key}`;
                                const currentVal = scores[criterionKey] || scores[criterion.key] || 0;
                                const cellKey = `${sId}__${criterionKey}`;
                                const isMissing = unratedStarKeys.has(cellKey);

                                return (
                                  <td
                                    key={criterion.key}
                                    className={`py-2 px-1 text-center transition-all ${
                                      isMissing
                                        ? 'bg-rose-950/40 ring-2 ring-rose-500 rounded-xl animate-pulse shadow-sm shadow-rose-500/25'
                                        : ''
                                    }`}
                                  >
                                    <div className="flex flex-col items-center justify-center">
                                      <div className="flex flex-col items-center justify-center gap-1 select-none">
                                        {/* Fila 1: Estrellas 1 a 5 */}
                                        <div className="flex items-center justify-center gap-1">
                                          {[1, 2, 3, 4, 5].map(starVal => {
                                            const isFilled = starVal <= currentVal;
                                            const isHalf = !isFilled && (starVal - 0.5 <= currentVal);
                                            return (
                                              <button
                                                key={starVal}
                                                type="button"
                                                onClick={(e) => handleStarClick(student, criterionKey, starVal, e)}
                                                onDoubleClick={(e) => handleStarDoubleClick(student, criterionKey, starVal, e)}
                                                className={`p-0.5 sm:p-1 rounded-lg transition-transform active:scale-90 cursor-pointer ${
                                                  isMissing && !isFilled && !isHalf ? 'hover:bg-rose-900/40' : 'hover:bg-slate-800'
                                                }`}
                                                title={`${criterion.label}: ${starVal}/10 estrellas (Doble clic para ${starVal - 0.5} media estrella)`}
                                              >
                                                {isHalf ? (
                                                  <span className="relative inline-flex items-center justify-center">
                                                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
                                                    <StarHalf className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute inset-0 text-amber-400 fill-amber-400" />
                                                  </span>
                                                ) : (
                                                  <Star
                                                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                                                      isFilled
                                                        ? 'text-amber-400 fill-amber-400'
                                                        : isMissing
                                                        ? 'text-rose-400 hover:text-amber-300 stroke-2'
                                                        : 'text-slate-700 hover:text-amber-300'
                                                    }`}
                                                  />
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>

                                        {/* Fila 2: Estrellas 6 a 10 */}
                                        <div className="flex items-center justify-center gap-1">
                                          {[6, 7, 8, 9, 10].map(starVal => {
                                            const isFilled = starVal <= currentVal;
                                            const isHalf = !isFilled && (starVal - 0.5 <= currentVal);
                                            return (
                                              <button
                                                key={starVal}
                                                type="button"
                                                onClick={(e) => handleStarClick(student, criterionKey, starVal, e)}
                                                onDoubleClick={(e) => handleStarDoubleClick(student, criterionKey, starVal, e)}
                                                className={`p-0.5 sm:p-1 rounded-lg transition-transform active:scale-90 cursor-pointer ${
                                                  isMissing && !isFilled && !isHalf ? 'hover:bg-rose-900/40' : 'hover:bg-slate-800'
                                                }`}
                                                title={`${criterion.label}: ${starVal}/10 estrellas (Doble clic para ${starVal - 0.5} media estrella)`}
                                              >
                                                {isHalf ? (
                                                  <span className="relative inline-flex items-center justify-center">
                                                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
                                                    <StarHalf className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute inset-0 text-amber-400 fill-amber-400" />
                                                  </span>
                                                ) : (
                                                  <Star
                                                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                                                      isFilled
                                                        ? 'text-amber-400 fill-amber-400'
                                                        : isMissing
                                                        ? 'text-rose-400 hover:text-amber-300 stroke-2'
                                                        : 'text-slate-700 hover:text-amber-300'
                                                    }`}
                                                  />
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                                        {currentVal > 0 ? `${currentVal}/10` : '-'}
                                      </span>
                                    </div>
                                  </td>
                                );
                              })}

                              {/* Columna: Nota promedio de la técnica */}
                              <td className="py-2 px-2 text-center align-middle">
                                <div className="flex flex-col items-center justify-center">
                                  <span
                                    className={`text-xs font-black font-mono px-2 py-1 rounded-lg ${
                                      techAvg === null
                                        ? 'text-slate-600 bg-slate-800/40'
                                        : techAvg >= 7
                                        ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/30'
                                        : 'text-amber-300 bg-amber-950/60 border border-amber-500/30'
                                    }`}
                                  >
                                    {techAvg !== null ? techAvg.toFixed(1) : '-'}
                                  </span>
                                </div>
                              </td>

                              {/* Columna: Observaciones */}
                              <td className="py-2.5 px-3 text-right align-middle">
                                <button
                                  type="button"
                                  onClick={() => handleOpenObsModal(student)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border active:scale-95 ${
                                    hasPhaseNotes
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                                  }`}
                                  title={`Notas y observaciones de ${effectivePhase} para ${student.name}`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                                  <span>{hasPhaseNotes ? 'Ver Notas' : 'Añadir'}</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 6. BARRA FIJA INFERIOR PARA AVANCE RÁPIDO */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-2.5 sm:p-3 shadow-2xl">
        <div className="w-full px-2 sm:px-4 md:px-6 flex items-center justify-between gap-2 sm:gap-3">
          {/* BOTÓN ANTERIOR */}
          {isFirstStepInTanda && hasPrevTanda ? (
            <button
              type="button"
              onClick={handlePrevTechnique}
              className="px-3.5 sm:px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 shrink-0"
              title={`Volver a ${tandas[selectedTandaIndex - 1]?.blockName || `Tanda ${selectedTandaIndex}`}`}
            >
              <ChevronLeft className="w-4 h-4 text-amber-400 stroke-[3]" />
              <span>Tanda Anterior</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePrevTechnique}
              disabled={isFirstStepInTanda && !hasPrevTanda}
              className="px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer shrink-0"
              title="Retroceder al paso anterior"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
          )}

          {/* INDICADOR CENTRAL DE TANDA Y PASO */}
          <div className="text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2 truncate px-1 min-w-0">
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 text-[11px] font-mono shrink-0 border border-slate-700">
              Tanda {selectedTandaIndex + 1} de {tandas.length}
            </span>
            <span className="text-white font-mono truncate hidden sm:inline">
              {effectivePhase.toUpperCase()} • Paso {selectedTechniqueIndex + 1} de {totalPhaseSteps}
            </span>
            <span className="text-slate-500 text-[11px] hidden md:inline">({tandaStudents.length} karatecas)</span>
          </div>

          {/* BOTÓN SIGUIENTE */}
          {isLastStepInTanda && hasNextTanda ? (
            <button
              type="button"
              onClick={handleNextTechnique}
              className="px-4 sm:px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-300 active:scale-95 shrink-0"
              title={`Avanzar a ${tandas[selectedTandaIndex + 1]?.blockName || `Tanda ${selectedTandaIndex + 2}`}`}
            >
              <span>Siguiente Tanda</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          ) : isLastStepInTanda && !hasNextTanda ? (
            <button
              type="button"
              onClick={handleNextTechnique}
              className="px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 shrink-0"
              title="Has concluido la última tanda del examen"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Concluir Examen</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextTechnique}
              className="px-4 sm:px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 shrink-0"
            >
              <span>{selectedTechniqueIndex < maxTechniquesInPhase - 1 ? 'Siguiente Paso' : 'Siguiente Fase'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: OBSERVACIONES Y NOTAS EN VIÑETAS POR KARATECA */}
      {/* ========================================================================= */}
      {activeObsStudent && (() => {
        const sId = String(activeObsStudent._id || activeObsStudent.id);
        const studentEval = evaluationsByStudent[sId] || {};
        const phaseNotesMap = studentEval.phaseNotes || {};
        const currentBelt = getBeltBadge(activeObsStudent.currentRank);

        // Fase activa en el modal (por defecto la del tatami actual)
        const currentActivePhase = obsModalPhase || effectivePhase || 'kihon';
        const currentPhaseNotes = phaseNotesMap[currentActivePhase] !== undefined
          ? phaseNotesMap[currentActivePhase]
          : (currentActivePhase === 'kihon' ? (studentEval.notes || '') : '');

        const phaseList = [
          { key: 'kihon', label: 'Kihon', desc: 'Técnicas Básicas' },
          { key: 'kumite', label: 'Kumite', desc: 'Combate' },
          { key: 'kata', label: 'Kata', desc: 'Formas' },
          ...(hasEvaluableAspects ? [{ key: 'aspectos', label: 'Aspectos', desc: 'Generales' }] : [])
        ];

        const activePhaseObj = phaseList.find(p => p.key === currentActivePhase) || phaseList[0];

        const phasePlaceholder = currentActivePhase === 'kihon'
          ? '• Observaciones técnicas de Kihon (posiciones, kime, postura)...\n• Cada línea comienza con viñeta automáticamente.\n• Ejemplo: Corregir rotación de cadera en Gyaku Zuki.'
          : currentActivePhase === 'kata'
          ? '• Observaciones técnicas de Kata (ritmo, embusen, postura, kime)...\n• Cada línea comienza con viñeta automáticamente.\n• Ejemplo: Buen ritmo y fijación de postura en Heian Shodan.'
          : currentActivePhase === 'kumite'
          ? '• Observaciones técnicas de Kumite (distancia maai, reflejos, control)...\n• Cada línea comienza con viñeta automáticamente.\n• Ejemplo: Buena distancia y guardia firme, mantener kime en ataque.'
          : '• Observaciones de aspectos técnicos generales...\n• Cada línea comienza con viñeta automáticamente.';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-white animate-in zoom-in-95 duration-150 flex flex-col">
              {/* Cabecera del modal */}
              <div className="p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold text-sm shadow-xs">
                    🥋
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white">{activeObsStudent.name}</h3>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${currentBelt.bg}`}>
                        {currentBelt.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-400/90 font-medium mt-0.5">
                      Observación condensada de {activePhaseObj.label} ({activePhaseObj.desc})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveObsStudent(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selector de fase: Kihon, Kata, Kumite */}
              <div className="px-4 pt-3.5 pb-1 bg-slate-950/60 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                  {phaseList.map((p) => {
                    const pNotes = (phaseNotesMap[p.key] !== undefined
                      ? phaseNotesMap[p.key]
                      : (p.key === 'kihon' ? (studentEval.notes || '') : '')).trim();
                    const isSelected = currentActivePhase === p.key;

                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setObsModalPhase(p.key)}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                        }`}
                      >
                        <span>{p.label}</span>
                        {pNotes && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-amber-400'}`}
                            title={`Tiene notas en ${p.label}`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contenido: Área de Texto Grande con soporte de Viñetas */}
              <div className="p-4 sm:p-5 space-y-3">
                {/* Barra superior de herramientas de viñetas */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <span>Notas para {activePhaseObj.label}:</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddBullet(activeObsStudent, currentPhaseNotes, currentActivePhase)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-400/50 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Agregar un nuevo punto de viñeta"
                    >
                      <span>+ Nueva Viñeta (•)</span>
                    </button>
                    {currentPhaseNotes && !currentPhaseNotes.includes('•') && (
                      <button
                        type="button"
                        onClick={() => handleFormatAllAsBullets(activeObsStudent, currentPhaseNotes, currentActivePhase)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-all cursor-pointer"
                        title="Convertir todas las líneas en viñetas"
                      >
                        Formatear con •
                      </button>
                    )}
                  </div>
                </div>

                {/* Campo de texto independiente por fase */}
                <textarea
                  id="sensei-bullet-notes"
                  key={currentActivePhase}
                  rows={7}
                  value={currentPhaseNotes}
                  onChange={(e) => handleBulletInputChange(e, currentPhaseNotes, (val) => handleUpdateStudentNotes(activeObsStudent, val, currentActivePhase))}
                  onKeyDown={(e) => handleNotesKeyDown(e, activeObsStudent, currentPhaseNotes, currentActivePhase)}
                  placeholder={phasePlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden transition-colors font-sans leading-relaxed resize-y min-h-[170px]"
                />

                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                  <span>Presiona <strong>Enter</strong> para agregar una nueva viñeta automática en {activePhaseObj.label}.</span>
                </p>
              </div>

              {/* Pie del modal */}
              <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  Campo de: <strong className="text-amber-400">{activePhaseObj.label}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveObsStudent(null)}
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black cursor-pointer shadow-md transition-all active:scale-95"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: MONITOR DEL TRIBUNAL (SUPERVISIÓN TANDA POR TANDA DE COLEGAS) */}
      {/* ========================================================================= */}
      {showTribunalMonitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-slate-100 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-700 my-auto text-slate-900">
            {/* Cabecera del modal */}
            <div className="px-5 py-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                  <Users className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">Monitor del Tribunal Examinador</h3>
                  <p className="text-[11px] text-slate-400">
                    Supervisión en tiempo real tanda por tanda de los demás Senseis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTribunalMonitorModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con Scroll */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <TribunalProgressMonitor
                call={call}
                students={liveStudents}
                currentEvaluatorEmail={evaluatorEmail}
                currentEvaluatorToken={evaluator?.token}
              />
            </div>

            {/* Pie del modal */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                ISKF Costa Rica • Tribunal Oficial
              </span>
              <button
                type="button"
                onClick={() => setShowTribunalMonitorModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                Cerrar Monitor
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL: ASPECTOS A CONSIDERAR DEL KARATECA (EMITE SOMBRA RADIANTE) */}
      {/* ========================================================================= */}
      {selectedStudentForAspects && (
        <div className="fixed inset-0 z-[1250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white rounded-3xl border border-amber-500/50 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-200 shadow-[0_0_30px_rgba(245,158,11,0.25)]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Aspectos a Considerar</h4>
                  <p className="text-xs text-amber-300 font-bold">{selectedStudentForAspects.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForAspects(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {/* Condición Especial */}
              {(selectedStudentForAspects.hasSpecialCondition || selectedStudentForAspects.specialCondition) && (
                <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/50 space-y-1.5 shadow-inner">
                  <div className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Condición Especial / Adaptación</span>
                  </div>
                  <div className="text-xs text-amber-100 whitespace-pre-line leading-relaxed font-medium">
                    {selectedStudentForAspects.specialCondition || '• Condición especial en observación.'}
                  </div>
                </div>
              )}

              {/* Aspectos Positivos */}
              {selectedStudentForAspects.positiveAspects && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-1.5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>Aspectos Positivos / Fortalezas</span>
                  </div>
                  <div className="text-xs text-emerald-100 whitespace-pre-line leading-relaxed font-medium">
                    {selectedStudentForAspects.positiveAspects}
                  </div>
                </div>
              )}

              {/* Notas del Dojo */}
              {selectedStudentForAspects.notes && (
                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-1.5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <span>Observaciones del Dojo</span>
                  </div>
                  <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed font-medium">
                    {selectedStudentForAspects.notes}
                  </div>
                </div>
              )}

              {!selectedStudentForAspects.specialCondition && !selectedStudentForAspects.positiveAspects && !selectedStudentForAspects.notes && (
                <div className="py-6 text-center text-xs text-slate-400">
                  No hay aspectos especiales registrados para este atleta.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentForAspects(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR DATOS DEL ATLETA (EXCLUSIVO SENSEI ROY - DIRECTOR EVALUACIÓN) */}
      {/* ========================================================================= */}
      {editingStudentModal && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/90 w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto text-gray-900">
            {/* Cabecera */}
            <div className="shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-amber-50 via-white to-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center shadow-sm shrink-0 font-black">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                    Editar Datos del Atleta
                  </h3>
                  <p className="text-xs text-amber-900 font-bold">
                    Sensei Roy Gatjens • Director de Evaluación
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudentModal(null)}
                className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSaveStudentFromEvaluator} className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
              {/* Foto */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-white shadow-inner flex items-center justify-center">
                    {editStudentForm.photo ? (
                      <img src={editStudentForm.photo} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Users className="w-7 h-7 opacity-40" />
                        <span className="text-[10px] font-bold mt-1 text-gray-400">Sin foto</span>
                      </div>
                    )}
                  </div>
                  {editStudentForm.photo && (
                    <button
                      type="button"
                      onClick={() => setEditStudentForm(prev => ({ ...prev, photo: '' }))}
                      className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-xs cursor-pointer"
                      title="Eliminar foto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                    Fotografía del Atleta
                  </label>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Visible en padrones y actas oficiales. Máx. 2MB.
                  </p>
                  <div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="roy-eval-photo-upload"
                    />
                    <label
                      htmlFor="roy-eval-photo-upload"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-50 transition-all cursor-pointer shadow-2xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {editStudentForm.photo ? 'Cambiar Fotografía' : 'Subir Fotografía'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Nombre Completo */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700">
                  Nombre Completo del Atleta *
                </label>
                <input
                  type="text"
                  required
                  value={editStudentForm.name}
                  onChange={(e) => setEditStudentForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 focus:border-indigo-600 focus:bg-white rounded-xl text-sm font-semibold text-gray-900 transition-all"
                />
              </div>

              {/* Fecha de Nacimiento & Edad en Vivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      Nacimiento (DD/MM/AAAA)
                    </span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={editStudentForm.birthDate}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      let formatted = raw;
                      if (raw.length > 4) {
                        formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)}`;
                      } else if (raw.length > 2) {
                        formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
                      }
                      setEditStudentForm(prev => ({ ...prev, birthDate: formatted }));
                    }}
                    placeholder="DD/MM/AAAA (ej. 20/02/1995)"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 focus:border-indigo-600 focus:bg-white rounded-xl text-xs md:text-sm font-mono font-bold text-gray-900 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700">
                    Edad Verificada
                  </label>
                  <div className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                    modalCalculatedAge !== null
                      ? 'bg-blue-50/80 border-blue-200 text-indigo-900'
                      : 'bg-gray-100/90 border-gray-200 text-gray-500'
                  }`}>
                    <span>Años cumplidos:</span>
                    <span className="font-mono text-sm font-black">
                      {modalCalculatedAge !== null ? `${modalCalculatedAge} años` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cinturón / Grado Actual */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700">
                  Cinturón / Grado Actual (Kyu) *
                </label>
                <div className="relative">
                  <select
                    value={editStudentForm.currentRank}
                    onChange={(e) => setEditStudentForm(prev => ({ ...prev, currentRank: e.target.value }))}
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-300 focus:border-indigo-600 focus:bg-white rounded-xl text-xs md:text-sm font-bold text-gray-900 transition-all cursor-pointer appearance-none"
                  >
                    {KYU_OPTIONS.map((kyu) => (
                      <option key={kyu} value={kyu}>{kyu}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Aspectos Positivos */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center justify-between">
                  <span>Aspectos Positivos</span>
                  <span className="text-[10px] text-gray-400 font-normal lowercase">
                    (viñeta automática al escribir y enter)
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={editStudentForm.positiveAspects}
                  onChange={(e) => handleBulletInputChange(e, editStudentForm.positiveAspects, (val) => setEditStudentForm(prev => ({ ...prev, positiveAspects: val })))}
                  onKeyDown={(e) => handleBulletKeyDown(e, editStudentForm.positiveAspects, (val) => setEditStudentForm(prev => ({ ...prev, positiveAspects: val })))}
                  placeholder="• Escriba las fortalezas o aspectos positivos del karateca..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 focus:border-indigo-600 focus:bg-white rounded-xl text-xs font-medium text-gray-900 transition-all placeholder:text-gray-400 outline-hidden leading-relaxed resize-y"
                />
              </div>

              {/* Notas / Observaciones Generales */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700">
                  Notas / Observaciones Internas
                </label>
                <textarea
                  rows={2}
                  value={editStudentForm.notes}
                  onChange={(e) => setEditStudentForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observaciones de seguimiento interno del karateca..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 focus:border-indigo-600 focus:bg-white rounded-xl text-xs font-medium text-gray-900 transition-all placeholder:text-gray-400 outline-hidden leading-relaxed resize-y"
                />
              </div>

              {/* Toggle Condición Especial */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label htmlFor="toggleSpecialEvaluator" className="text-xs font-black uppercase tracking-wider text-gray-700 cursor-pointer">
                    ¿Tiene Condición Especial?
                  </label>
                  <button
                    type="button"
                    id="toggleSpecialEvaluator"
                    role="switch"
                    aria-checked={editStudentForm.hasSpecialCondition}
                    onClick={() => {
                      setEditStudentForm(prev => ({
                        ...prev,
                        hasSpecialCondition: !prev.hasSpecialCondition,
                        specialCondition: !prev.hasSpecialCondition ? (prev.specialCondition || '') : ''
                      }));
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      editStudentForm.hasSpecialCondition ? 'bg-amber-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        editStudentForm.hasSpecialCondition ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {editStudentForm.hasSpecialCondition && (
                  <div className="space-y-1.5 animate-in fade-in duration-150">
                    <label className="text-[11px] font-bold text-amber-900 block">
                      Detalle de Condición Especial (viñetas automáticas)
                    </label>
                    <textarea
                      rows={2}
                      value={editStudentForm.specialCondition}
                      onChange={(e) => handleBulletInputChange(e, editStudentForm.specialCondition, (val) => setEditStudentForm(prev => ({ ...prev, specialCondition: val })))}
                      onKeyDown={(e) => handleBulletKeyDown(e, editStudentForm.specialCondition, (val) => setEditStudentForm(prev => ({ ...prev, specialCondition: val })))}
                      placeholder="• Indique la condición física, médica o adaptación especial..."
                      className="w-full px-4 py-2 bg-amber-50/50 border border-amber-300 focus:border-amber-500 focus:bg-white rounded-xl text-xs font-medium text-gray-900 outline-hidden leading-relaxed resize-y"
                    />
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudentModal(null)}
                  disabled={isSavingStudentData}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingStudentData}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingStudentData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Guardar Cambios Permanentes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pantalla de bloqueo si la convocatoria fue cerrada */}
      {isCallClosed && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl border border-amber-300 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                Tribunal Examinador ISKF
              </span>
              <h2 className="text-xl font-black text-gray-900">
                Se cerró la evaluación
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Las votaciones y calificaciones para esta convocatoria han finalizado oficialmente. Por favor espere sus notas y actas finales emitidas por el Sensei Administrador.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
              <a
                href="/admin/examinations/technical"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D2E83] hover:bg-[#202161] text-white text-xs font-bold transition-all shadow-md"
              >
                <span>Volver a Convocatorias</span>
              </a>
              {call?.accessToken && (
                <a
                  href={`/convocatoria/${call.accessToken}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all border border-gray-300"
                >
                  <span>Ver Acta del Dojo</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
