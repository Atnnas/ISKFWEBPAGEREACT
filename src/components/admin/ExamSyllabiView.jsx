"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Check, 
  Repeat, 
  Compass, 
  Save, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  Search, 
  Filter, 
  Shield, 
  Zap, 
  Award, 
  ChevronDown, 
  ChevronUp,
  GripVertical,
  Layers,
  FileText,
  Sliders,
  CheckCheck,
  Sparkles,
  Loader2
} from 'lucide-react';
import { 
  createExamSyllabus, 
  updateExamSyllabus, 
  deleteExamSyllabus,
  updateSyllabusTechnicalAspects
} from '../../lib/actions/syllabi';
import { DEFAULT_TECHNICAL_ASPECTS } from '../../lib/constants/technicalAspects';
import {
  ASPECT_ICONS,
  KYU_DEFINITIONS,
  KYU_OPTIONS,
  COMMON_STANCES,
  COMMON_DIRECTIONS,
  isSameRank
} from '../../lib/constants/kyuRanks';

/**
 * Indicador visual sobrio de cinturón con color sólido
 */
function BeltBadge({ rankString }) {
  const def = KYU_DEFINITIONS.find(k => k.full === rankString) || {
    digit: rankString?.split('(')[0]?.trim() || '',
    name: rankString?.split('(')[1]?.replace(')', '') || rankString || '',
    solidClass: 'bg-slate-300 border border-slate-400'
  };

  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 shadow-2xs">
      <span className={`w-3.5 h-3.5 rounded-xs shrink-0 shadow-2xs ${def.solidClass} ${def.hasStripe ? 'ring-1 ring-white ring-inset' : ''}`} />
      <span className="font-bold text-slate-900">{def.digit}</span>
      <span className="text-slate-600">{def.name}</span>
    </span>
  );
}

/**
 * Combobox elegante con color sólido, dígito de kyu y descripción
 */
function KyuCombobox({ selectedRank, onSelectRank, syllabi }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentDef = KYU_DEFINITIONS.find(k => k.full === selectedRank);
  const totalCount = syllabi.length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-80 flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white border border-slate-300 hover:border-[#2D2E83] rounded-xl text-xs font-semibold text-slate-800 shadow-2xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {currentDef ? (
            <>
              <span className={`w-3.5 h-3.5 rounded-xs shrink-0 shadow-2xs ${currentDef.solidClass} ${currentDef.hasStripe ? 'ring-1 ring-white ring-inset' : ''}`} />
              <span className="font-bold text-slate-900">{currentDef.digit}</span>
              <span className="text-slate-600 truncate">— {currentDef.name}</span>
            </>
          ) : (
            <>
              <div className="w-3.5 h-3.5 rounded-xs bg-slate-900 shrink-0" />
              <span className="font-bold text-slate-900">Todos los Cinturones y Grados</span>
              <span className="text-slate-500 font-medium text-xs">({totalCount})</span>
            </>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full sm:w-84 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-40 space-y-0.5 max-h-80 overflow-y-auto">
          {/* Opción Todos */}
          <button
            type="button"
            onClick={() => {
              onSelectRank('all');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedRank === 'all'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-3.5 h-3.5 rounded-xs ${selectedRank === 'all' ? 'bg-white' : 'bg-slate-800'}`} />
              <span>Todos los Cinturones</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${selectedRank === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {totalCount}
            </span>
          </button>

          <div className="h-px bg-slate-100 my-1" />

          {/* Opciones por Kyu */}
          {KYU_DEFINITIONS.map(kyu => {
            const count = syllabi.filter(s => s.targetRank === kyu.full || s.currentRank === kyu.full).length;
            const isSelected = selectedRank === kyu.full;

            return (
              <button
                key={kyu.id}
                type="button"
                onClick={() => {
                  onSelectRank(kyu.full);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-3.5 h-3.5 rounded-xs shrink-0 shadow-2xs ${kyu.solidClass} ${kyu.hasStripe ? 'ring-1 ring-white ring-inset' : ''}`} />
                  <span className={`font-mono font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{kyu.digit}</span>
                  <span className={`truncate text-xs ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>— {kyu.name}</span>
                </div>
                {count > 0 && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ExamSyllabiView({ initialSyllabi = [], currentUser = null }) {
  const isAdmin = currentUser?.role === 'admin';

  // Control de pestaña principal: 'temario' | 'aspectos'
  const [activeMainTab, setActiveMainTab] = useState('temario');

  const [syllabi, setSyllabi] = useState(initialSyllabi);
  const [selectedRankFilter, setSelectedRankFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modales de Temario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State Temario
  const [formName, setFormName] = useState('');
  const [formCurrentRank, setFormCurrentRank] = useState(KYU_OPTIONS[0]);
  const [formTargetRank, setFormTargetRank] = useState(KYU_OPTIONS[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formTechniques, setFormTechniques] = useState([]);

  // Active technique builder tab inside modal: 'kihon' | 'kumite' | 'kata'
  const [activeBuilderGroup, setActiveBuilderGroup] = useState('kihon');

  // Input fields for adding a technique inside the modal
  const [techName, setTechName] = useState('');
  const [techStance, setTechStance] = useState(COMMON_STANCES[0]);
  const [techDirection, setTechDirection] = useState(COMMON_DIRECTIONS[0]);
  const [techRepetitions, setTechRepetitions] = useState(3);
  const [techTripType, setTechTripType] = useState('ida_y_vuelta');
  const [techEmbusen, setTechEmbusen] = useState('Embusen Oficial');
  const [techNotes, setTechNotes] = useState('');

  // Modal para edición individual de una técnica desde la tarjeta
  const [editingTechModal, setEditingTechModal] = useState({
    isOpen: false,
    syllabus: null,
    tech: null,
    name: '',
    stance: '',
    direction: '',
    repetitions: 3,
    tripType: 'ida_y_vuelta',
    embusen: 'Embusen Oficial',
    notes: '',
  });

  const [editingTechInModalId, setEditingTechInModalId] = useState(null);

  // =========================================================================
  // ESTADO DE LA PESTAÑA: ASPECTOS TÉCNICOS Y RÚBRICA (PERSISTIDA EN BD)
  // =========================================================================
  // El temario de Aspectos Técnicos se determina automáticamente por el cinturón elegido en Temario
  const [aspectSyllabusId, setAspectSyllabusId] = useState(() => {
    return initialSyllabi[0]?._id || initialSyllabi[0]?.id || null;
  });

  // Sincronizar automáticamente con el cinturón elegido en la pestaña de Temario
  useEffect(() => {
    if (selectedRankFilter !== 'all') {
      const matched =
        syllabi.find(s => isSameRank(s.currentRank, selectedRankFilter)) ||
        syllabi.find(s => isSameRank(s.targetRank, selectedRankFilter));
      if (matched) {
        const matchedId = matched.id || matched._id;
        setAspectSyllabusId(matchedId);
      }
    } else if (!aspectSyllabusId && syllabi.length > 0) {
      setAspectSyllabusId(syllabi[0].id || syllabi[0]._id);
    }
  }, [selectedRankFilter, syllabi, aspectSyllabusId]);

  const selectedAspectSyllabus = useMemo(() => {
    if (selectedRankFilter !== 'all') {
      const matched =
        syllabi.find(s => isSameRank(s.currentRank, selectedRankFilter)) ||
        syllabi.find(s => isSameRank(s.targetRank, selectedRankFilter));
      if (matched) return matched;
    }
    return syllabi.find(s => (s.id || s._id) === aspectSyllabusId) || syllabi[0] || null;
  }, [syllabi, aspectSyllabusId, selectedRankFilter]);

  // Respetar estrictamente los aspectos técnicos guardados por el usuario en MongoDB
  const mergeAspectsWithDefaults = (existingAspects) => {
    if (!Array.isArray(existingAspects) || existingAspects.length === 0) {
      return JSON.parse(JSON.stringify(DEFAULT_TECHNICAL_ASPECTS));
    }
    return JSON.parse(JSON.stringify(existingAspects)).sort((a, b) => (a.order || 99) - (b.order || 99));
  };

  // Aspectos técnicos en memoria para edición
  const [aspectsState, setAspectsState] = useState(() => {
    return mergeAspectsWithDefaults(selectedAspectSyllabus?.technicalAspects);
  });

  // Mantener sincronizado al cambiar el temario seleccionado en la pestaña de aspectos
  useEffect(() => {
    if (selectedAspectSyllabus) {
      setAspectsState(mergeAspectsWithDefaults(selectedAspectSyllabus.technicalAspects));
    }
  }, [selectedAspectSyllabus]);

  // Estado para tarjetas de aspectos técnicos abiertas/cerradas (por defecto todas cerradas como solicita el usuario)
  const [openAspectCards, setOpenAspectCards] = useState({});

  const toggleAspectCard = (aspectId) => {
    setOpenAspectCards(prev => ({
      ...prev,
      [aspectId]: !prev[aspectId]
    }));
  };

  const handleToggleAllSection = (categories, openAll) => {
    setOpenAspectCards(prev => {
      const next = { ...prev };
      aspectsState
        .filter(a => categories.includes(a.category))
        .forEach(a => {
          next[a.id] = openAll;
        });
      return next;
    });
  };

  const section1Aspects = useMemo(() => {
    return aspectsState.filter(a => ['tsuki', 'uke', 'dachi', 'geri', 'kata', 'kumite'].includes(a.category));
  }, [aspectsState]);

  const section2Aspects = useMemo(() => {
    return aspectsState.filter(a => ['physical', 'mental', 'do'].includes(a.category));
  }, [aspectsState]);

  const allSection1Open = section1Aspects.length > 0 && section1Aspects.every(a => Boolean(openAspectCards[a.id]));
  const allSection2Open = section2Aspects.length > 0 && section2Aspects.every(a => Boolean(openAspectCards[a.id]));

  // Input para agregar nuevo punto/criterio en cada bloque de aspecto
  const [newPointInput, setNewPointInput] = useState({});
  const [newPointEvaluable, setNewPointEvaluable] = useState({});
  const [isSavingAspects, setIsSavingAspects] = useState(false);

  // Helper para normalizar un parámetro técnico (string u objeto con isEvaluable)
  const getPointData = (point, isSection2 = false) => {
    if (!point) return { text: '', isEvaluable: false };
    if (typeof point === 'object') {
      return {
        text: point.text || point.point || point.rawText || '',
        isEvaluable: Boolean(point.isEvaluable || point.evaluableInExam || point.evaluable)
      };
    }
    return {
      text: String(point),
      isEvaluable: !isSection2
    };
  };

  const handleAddPointToAspect = (aspectId, defaultEvaluable = false) => {
    const text = (newPointInput[aspectId] || '').trim();
    if (!text) return;

    const isEvaluable = typeof newPointEvaluable[aspectId] === 'boolean'
      ? newPointEvaluable[aspectId]
      : defaultEvaluable;

    setAspectsState(prev => prev.map(a => {
      if (a.id === aspectId) {
        return {
          ...a,
          points: [...(a.points || []), { text, isEvaluable }]
        };
      }
      return a;
    }));

    setNewPointInput(prev => ({ ...prev, [aspectId]: '' }));
    setNewPointEvaluable(prev => ({ ...prev, [aspectId]: false }));
  };

  const handleTogglePointEvaluable = (aspectId, pointIndex) => {
    setAspectsState(prev => prev.map(a => {
      if (a.id === aspectId) {
        const isSec2 = ['physical', 'mental', 'do'].includes(a.category);
        const updatedPoints = (a.points || []).map((p, idx) => {
          if (idx !== pointIndex) return p;
          const current = getPointData(p, isSec2);
          return {
            text: current.text,
            isEvaluable: !current.isEvaluable
          };
        });
        return {
          ...a,
          points: updatedPoints
        };
      }
      return a;
    }));
  };

  const handleRemovePointFromAspect = (aspectId, pointIndex) => {
    setAspectsState(prev => prev.map(a => {
      if (a.id === aspectId) {
        return {
          ...a,
          points: (a.points || []).filter((_, idx) => idx !== pointIndex)
        };
      }
      return a;
    }));
  };

  // Drag and drop para reordenar criterios dentro de cada tarjeta
  const [draggedPointInfo, setDraggedPointInfo] = useState(null); // { aspectId, pointIndex }
  const [dragOverPointInfo, setDragOverPointInfo] = useState(null); // { aspectId, pointIndex }

  const handlePointDragStart = (e, aspectId, pointIndex) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ aspectId, pointIndex }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPointInfo({ aspectId, pointIndex });
  };

  const handlePointDragOver = (e, aspectId, pointIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedPointInfo || draggedPointInfo.aspectId !== aspectId) return;
    if (dragOverPointInfo?.aspectId !== aspectId || dragOverPointInfo?.pointIndex !== pointIndex) {
      setDragOverPointInfo({ aspectId, pointIndex });
    }
  };

  const handlePointDrop = (e, targetAspectId, targetPointIndex) => {
    e.preventDefault();
    setDragOverPointInfo(null);
    if (!draggedPointInfo) return;
    const { aspectId: sourceAspectId, pointIndex: sourcePointIndex } = draggedPointInfo;
    setDraggedPointInfo(null);

    if (sourceAspectId !== targetAspectId || sourcePointIndex === targetPointIndex) return;

    setAspectsState(prev => prev.map(a => {
      if (a.id === targetAspectId) {
        const points = [...(a.points || [])];
        const [movedItem] = points.splice(sourcePointIndex, 1);
        points.splice(targetPointIndex, 0, movedItem);
        return { ...a, points };
      }
      return a;
    }));
  };

  const handlePointDragEnd = () => {
    setDraggedPointInfo(null);
    setDragOverPointInfo(null);
  };

  // Botones rápidos subir / bajar de posición un criterio
  const handleMovePointStep = (aspectId, pointIndex, direction) => {
    setAspectsState(prev => prev.map(a => {
      if (a.id === aspectId) {
        const points = [...(a.points || [])];
        const targetIndex = pointIndex + direction;
        if (targetIndex < 0 || targetIndex >= points.length) return a;
        const temp = points[pointIndex];
        points[pointIndex] = points[targetIndex];
        points[targetIndex] = temp;
        return { ...a, points };
      }
      return a;
    }));
  };

  // Estado para edición / modificación en línea de un criterio
  const [editingPoint, setEditingPoint] = useState(null); // { aspectId, pointIndex, text }

  const handleStartEditPoint = (aspectId, pointIndex, currentText) => {
    setEditingPoint({
      aspectId,
      pointIndex,
      text: currentText
    });
  };

  const handleSaveEditPoint = () => {
    if (!editingPoint) return;
    const trimmed = (editingPoint.text || '').trim();
    if (!trimmed) return;

    setAspectsState(prev => prev.map(a => {
      if (a.id === editingPoint.aspectId) {
        const isSec2 = ['physical', 'mental', 'do'].includes(a.category);
        const points = (a.points || []).map((p, idx) => {
          if (idx !== editingPoint.pointIndex) return p;
          const prevData = getPointData(p, isSec2);
          if (typeof p === 'object') {
            return {
              ...p,
              text: trimmed,
              isEvaluable: prevData.isEvaluable
            };
          }
          return isSec2 ? { text: trimmed, isEvaluable: prevData.isEvaluable } : trimmed;
        });
        return { ...a, points };
      }
      return a;
    }));
    setEditingPoint(null);
  };

  const handleCancelEditPoint = () => {
    setEditingPoint(null);
  };

  // Restablecer un bloque/aspecto a sus criterios oficiales de fábrica
  const handleResetAspectToDefault = (aspectId) => {
    const defaultAspect = DEFAULT_TECHNICAL_ASPECTS.find(d => d.id === aspectId || d.category === aspectId);
    if (!defaultAspect) return;
    setAspectsState(prev => prev.map(a => {
      if (a.id === aspectId || a.category === defaultAspect.category) {
        return JSON.parse(JSON.stringify(defaultAspect));
      }
      return a;
    }));
  };

  // Vaciar todos los criterios de un bloque/aspecto específico
  const handleClearAspectPoints = (aspectId, aspectTitle) => {
    showConfirm({
      title: `Vaciar ${aspectTitle}`,
      message: `¿Estás seguro de que deseas borrar todos los criterios dentro de "${aspectTitle}" para este cinturón? Recuerda presionar "Guardar en Base de Datos" para confirmar el cambio.`,
      onConfirm: () => {
        setAspectsState(prev => prev.map(a => {
          if (a.id === aspectId) {
            return { ...a, points: [] };
          }
          return a;
        }));
      }
    });
  };

  // Borrar todos los aspectos técnicos referentes al cinturón activo y guardar en BD
  const handleClearAllAspectsForBelt = () => {
    if (!selectedAspectSyllabus) return;
    const syllabusId = selectedAspectSyllabus.id || selectedAspectSyllabus._id;

    showConfirm({
      title: 'Borrar Aspectos Técnicos del Cinturón',
      message: `¿Estás seguro de que deseas borrar todos los criterios y aspectos técnicos de "${selectedAspectSyllabus.name}" (${selectedAspectSyllabus.targetRank})? Las categorías quedarán en blanco listas para que cargues los nuevos criterios de este cinturón.`,
      onConfirm: async () => {
        const clearedAspects = aspectsState.map(a => ({
          ...a,
          points: []
        }));
        setAspectsState(clearedAspects);
        setIsSavingAspects(true);
        try {
          const res = await updateSyllabusTechnicalAspects(syllabusId, clearedAspects);
          if (res.success) {
            setSyllabi(prev => prev.map(s => {
              if ((s.id || s._id) === syllabusId) {
                return { ...s, technicalAspects: clearedAspects };
              }
              return s;
            }));
            showAlert(
              `Se han borrado todos los aspectos técnicos de "${selectedAspectSyllabus.name}". Ahora puedes ingresar los criterios propios de este cinturón.`,
              'Aspectos Técnicos Borrados'
            );
          } else {
            showAlert(res.error || 'No se pudieron borrar los aspectos técnicos.', 'Error', true);
          }
        } catch (err) {
          console.error(err);
          showAlert('Error al borrar los aspectos técnicos en base de datos.', 'Error', true);
        } finally {
          setIsSavingAspects(false);
        }
      }
    });
  };

  // Guardar aspectos técnicos en Base de Datos
  const handleSaveAspectsToDatabase = async () => {
    if (!selectedAspectSyllabus) {
      showAlert('No hay un temario seleccionado para guardar.', 'Error', true);
      return;
    }

    const syllabusId = selectedAspectSyllabus.id || selectedAspectSyllabus._id;
    setIsSavingAspects(true);

    try {
      const res = await updateSyllabusTechnicalAspects(syllabusId, aspectsState);
      if (res.success) {
        // Actualizar en el estado de temarios
        setSyllabi(prev => prev.map(s => {
          if ((s.id || s._id) === syllabusId) {
            return {
              ...s,
              technicalAspects: aspectsState
            };
          }
          return s;
        }));
        showAlert(
          `Los aspectos técnicos y parámetros de evaluación para "${selectedAspectSyllabus.name}" han sido guardados correctamente en la base de datos.`,
          '¡Guardado en Base de Datos!'
        );
      } else {
        showAlert(res.error || 'Error al guardar aspectos técnicos.', 'Error', true);
      }
    } catch (err) {
      console.error(err);
      showAlert('Error de conexión al guardar aspectos en base de datos.', 'Error', true);
    } finally {
      setIsSavingAspects(false);
    }
  };

  // =========================================================================
  // HANDLERS DE TEMARIOS DE TÉCNICAS
  // =========================================================================
  const handleOpenEditTechModal = (syllabus, tech) => {
    setEditingTechModal({
      isOpen: true,
      syllabus,
      tech,
      name: tech.name,
      stance: tech.stance || COMMON_STANCES[0],
      direction: tech.direction || COMMON_DIRECTIONS[0],
      repetitions: tech.repetitions || 3,
      tripType: tech.tripType || 'ida_y_vuelta',
      embusen: tech.embusen || 'Embusen Oficial',
      notes: tech.notes || '',
    });
  };

  const handleSaveIndividualTech = async () => {
    if (!editingTechModal.syllabus || !editingTechModal.tech) return;
    const { syllabus, tech, name, stance, direction, repetitions, tripType, embusen, notes } = editingTechModal;

    const updatedTechniques = (syllabus.techniques || []).map(t => {
      if (t.id === tech.id) {
        return {
          ...t,
          name: name.trim() || t.name,
          stance,
          direction,
          repetitions: Math.max(1, parseInt(repetitions, 10) || 1),
          tripType,
          embusen: (embusen || '').trim(),
          notes: notes.trim(),
        };
      }
      return t;
    });

    const payload = {
      name: syllabus.name,
      currentRank: syllabus.currentRank,
      targetRank: syllabus.targetRank,
      description: syllabus.description,
      techniques: updatedTechniques,
    };

    const syllabusId = syllabus.id || syllabus._id;
    try {
      const res = await updateExamSyllabus(syllabusId, payload);
      if (res.success) {
        setSyllabi(prev => prev.map(s => (s.id === syllabusId || s._id === syllabusId) ? { ...s, ...payload } : s));
        setEditingTechModal(prev => ({ ...prev, isOpen: false }));
        showAlert('Técnica modificada y guardada correctamente.', '¡Actualizado!');
      } else {
        showAlert(res.error || 'No se pudo guardar la modificación.', 'Error', true);
      }
    } catch (err) {
      console.error(err);
      showAlert('Error al modificar la técnica.', 'Error', true);
    }
  };

  const handleQuickToggleTripType = async (syllabus, techId) => {
    const updatedTechniques = (syllabus.techniques || []).map(t => {
      if (t.id === techId) {
        return {
          ...t,
          tripType: t.tripType === 'ida_y_vuelta' ? 'solo_ida' : 'ida_y_vuelta',
        };
      }
      return t;
    });

    const payload = {
      name: syllabus.name,
      currentRank: syllabus.currentRank,
      targetRank: syllabus.targetRank,
      description: syllabus.description,
      techniques: updatedTechniques,
    };

    const syllabusId = syllabus.id || syllabus._id;
    setSyllabi(prev => prev.map(s => (s.id === syllabusId || s._id === syllabusId) ? { ...s, ...payload } : s));
    await updateExamSyllabus(syllabusId, payload);
  };

  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', isError: false });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showAlert = (message, title = 'Atención', isError = false) => {
    setAlertModal({ isOpen: true, title, message, isError });
  };

  const showConfirm = ({ title, message, onConfirm }) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  // Filtrado de temarios
  const filteredSyllabi = useMemo(() => {
    return syllabi.filter(item => {
      const matchesRank = selectedRankFilter === 'all' || 
        isSameRank(item.targetRank, selectedRankFilter) || 
        isSameRank(item.currentRank, selectedRankFilter);
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        item.name.toLowerCase().includes(term) || 
        item.targetRank.toLowerCase().includes(term) ||
        item.currentRank.toLowerCase().includes(term) ||
        item.techniques?.some(t => t.name.toLowerCase().includes(term));
      return matchesRank && matchesSearch;
    });
  }, [syllabi, selectedRankFilter, searchTerm]);

  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormName('');
    setFormCurrentRank(KYU_OPTIONS[0]);
    setFormTargetRank(KYU_OPTIONS[0]);
    setFormDescription('');
    setFormTechniques([]);
    setActiveBuilderGroup('kihon');
    resetTechniqueInputs();
    setEditingTechInModalId(null);
    setIsModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (syllabus) => {
    setModalMode('edit');
    setEditingId(syllabus.id || syllabus._id);
    setFormName(syllabus.name);
    setFormCurrentRank(syllabus.currentRank || KYU_OPTIONS[0]);
    setFormTargetRank(syllabus.targetRank || KYU_OPTIONS[0]);
    setFormDescription(syllabus.description || '');
    setFormTechniques(syllabus.techniques ? JSON.parse(JSON.stringify(syllabus.techniques)) : []);
    setActiveBuilderGroup('kihon');
    resetTechniqueInputs();
    setEditingTechInModalId(null);
    setIsModalOpen(true);
  };

  // Duplicar temario para crear uno nuevo a partir de una plantilla
  const handleDuplicate = (syllabus) => {
    setModalMode('create');
    setEditingId(null);
    setFormName(`${syllabus.name} (Copia)`);
    setFormCurrentRank(syllabus.currentRank);
    setFormTargetRank(syllabus.targetRank);
    setFormDescription(syllabus.description || '');
    setFormTechniques(syllabus.techniques ? JSON.parse(JSON.stringify(syllabus.techniques)) : []);
    setActiveBuilderGroup('kihon');
    resetTechniqueInputs();
    setIsModalOpen(true);
  };

  const handleStartEditTechInModal = (tech) => {
    setEditingTechInModalId(tech.id);
    setActiveBuilderGroup(tech.group);
    setTechName(tech.name);
    setTechStance(tech.stance || COMMON_STANCES[0]);
    setTechDirection(tech.direction || COMMON_DIRECTIONS[0]);
    setTechRepetitions(tech.repetitions || 3);
    setTechTripType(tech.tripType || 'ida_y_vuelta');
    setTechEmbusen(tech.embusen || 'Embusen Oficial');
    setTechNotes(tech.notes || '');
  };

  const handleCancelEditTechInModal = () => {
    setEditingTechInModalId(null);
    resetTechniqueInputs();
  };

  const resetTechniqueInputs = () => {
    setTechName('');
    setTechStance(COMMON_STANCES[0]);
    setTechDirection(COMMON_DIRECTIONS[0]);
    setTechRepetitions(3);
    setTechTripType('ida_y_vuelta');
    setTechEmbusen('Embusen Oficial');
    setTechNotes('');
  };

  const handleAddTechnique = () => {
    if (!techName.trim()) {
      showAlert('Por favor ingresa el nombre de la técnica.', 'Campo requerido', true);
      return;
    }

    if (editingTechInModalId) {
      setFormTechniques(prev => prev.map(t => {
        if (t.id === editingTechInModalId) {
          return {
            ...t,
            name: techName.trim(),
            stance: techStance,
            direction: techDirection,
            repetitions: parseInt(techRepetitions, 10) || 3,
            tripType: techTripType,
            embusen: activeBuilderGroup === 'kata' ? (techEmbusen || 'Embusen Oficial').trim() : '',
            notes: techNotes.trim()
          };
        }
        return t;
      }));
      setEditingTechInModalId(null);
      resetTechniqueInputs();
      return;
    }

    const newTech = {
      id: `tech-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      group: activeBuilderGroup,
      name: techName.trim(),
      stance: techStance,
      direction: techDirection,
      repetitions: parseInt(techRepetitions, 10) || 3,
      tripType: techTripType,
      embusen: activeBuilderGroup === 'kata' ? (techEmbusen || 'Embusen Oficial').trim() : '',
      notes: techNotes.trim(),
      order: formTechniques.length + 1
    };

    setFormTechniques(prev => [...prev, newTech]);
    resetTechniqueInputs();
  };

  const handleRemoveTechnique = (techId) => {
    setFormTechniques(prev => prev.filter(t => t.id !== techId));
  };

  const handleMoveTechnique = (techId, direction) => {
    setFormTechniques(prev => {
      const idx = prev.findIndex(t => t.id === techId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleSaveSyllabus = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showAlert('El nombre del temario es obligatorio.', 'Validación', true);
      return;
    }

    if (formTechniques.length === 0) {
      showAlert('Debes agregar al menos una técnica a evaluar en el temario.', 'Sin Técnicas', true);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        currentRank: formCurrentRank,
        targetRank: formTargetRank,
        description: formDescription.trim(),
        techniques: formTechniques
      };

      if (modalMode === 'create') {
        const res = await createExamSyllabus(payload);
        if (res.success) {
          setSyllabi(prev => [res.syllabus, ...prev]);
          setIsModalOpen(false);
          showAlert('El temario de examen ha sido creado exitosamente.', '¡Guardado!');
        } else {
          showAlert(res.error || 'No se pudo crear el temario.', 'Error', true);
        }
      } else {
        const res = await updateExamSyllabus(editingId, payload);
        if (res.success) {
          setSyllabi(prev => prev.map(s => (s.id === editingId || s._id === editingId) ? { ...s, ...payload } : s));
          setIsModalOpen(false);
          showAlert('El temario ha sido actualizado correctamente.', '¡Actualizado!');
        } else {
          showAlert(res.error || 'No se pudo actualizar el temario.', 'Error', true);
        }
      }
    } catch (err) {
      console.error('Error guardando temario:', err);
      showAlert('Ocurrió un error inesperado al procesar la solicitud.', 'Error', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSyllabus = (syllabus) => {
    showConfirm({
      title: 'Eliminar Temario de Examen',
      message: `¿Estás seguro de que deseas eliminar el temario "${syllabus.name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        const syllabusId = syllabus.id || syllabus._id;
        try {
          const res = await deleteExamSyllabus(syllabusId);
          if (res.success) {
            setSyllabi(prev => prev.filter(s => (s.id !== syllabusId && s._id !== syllabusId)));
            showAlert('El temario ha sido eliminado.', 'Eliminado');
          } else {
            showAlert(res.error || 'No se pudo eliminar el temario.', 'Error', true);
          }
        } catch (err) {
          console.error(err);
          showAlert('Error al eliminar temario.', 'Error', true);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Principal Estándar */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
          <Link href="/admin/examinations" className="text-[#2D2E83] hover:underline flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Examinaciones
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-[#BE1622] font-mono uppercase tracking-wider">Temarios Técnicos</span>
        </div>
      </div>

      {/* Cabecera Principal */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-100 text-[#2D2E83] border border-slate-200 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#2D2E83]" />
              Catálogo Oficial de Exámenes Técnicos
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              ISKF Costa Rica
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#2D2E83] tracking-tight mt-1.5">
            Temarios y Parámetros de Examen
          </h1>
        </div>

        {activeMainTab === 'temario' && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-5 py-3 bg-[#BE1622] hover:bg-[#9E121B] text-white font-bold text-xs md:text-sm rounded-xl transition-all shadow-md shadow-[#BE1622]/20 flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Temario</span>
          </button>
        )}

        {activeMainTab === 'aspectos' && (
          <button
            type="button"
            disabled={isSavingAspects}
            onClick={handleSaveAspectsToDatabase}
            className="px-5 py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs md:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 self-start md:self-auto disabled:opacity-50"
          >
            {isSavingAspects ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-emerald-400" />}
            <span>{isSavingAspects ? 'Guardando...' : 'Guardar en Base de Datos'}</span>
          </button>
        )}
      </div>

      {/* PESTAÑAS PRINCIPALES: TEMARIO TÉCNICO vs ASPECTOS TÉCNICOS */}
      <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveMainTab('temario')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMainTab === 'temario'
              ? 'bg-[#2D2E83] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Temario de Técnicas (Kihon • Kumite • Kata)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('aspectos')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMainTab === 'aspectos'
              ? 'bg-[#2D2E83] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Aspectos Técnicos y Rúbrica Oficial (Parámetros)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: TEMARIOS DE TÉCNICAS (KIHON, KUMITE, KATA) */}
      {/* ========================================================================= */}
      {activeMainTab === 'temario' && (
        <div className="space-y-6">
          {/* Barra de Filtros Sobria: Combobox de Cinturones + Buscador */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider shrink-0">
                <Filter className="w-4 h-4 text-[#2D2E83]" />
                <span>Grado / Cinturón:</span>
              </div>
              <KyuCombobox
                selectedRank={selectedRankFilter}
                onSelectRank={setSelectedRankFilter}
                syllabi={syllabi}
              />
            </div>

            {/* Buscador de texto */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por técnica o examen..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20 focus:border-[#2D2E83] transition-all bg-slate-50/50"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {selectedRankFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedRankFilter('all')}
                  className="text-xs font-bold text-[#2D2E83] hover:underline shrink-0 cursor-pointer"
                >
                  Ver Todos
                </button>
              )}
            </div>
          </div>

          {/* Listado de Temarios */}
          {filteredSyllabi.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-2xs">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-black text-slate-800">No se encontraron temarios para este filtro</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Puedes crear un temario oficial para este cinturón haciendo clic en &ldquo;Crear Nuevo Temario&rdquo;.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 bg-[#2D2E83] hover:bg-[#232468] text-white font-black text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Crear Temario Ahora
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSyllabi.map((syllabus) => {
                const kihonList = (syllabus.techniques || []).filter(t => t.group === 'kihon');
                const kumiteList = (syllabus.techniques || []).filter(t => t.group === 'kumite');
                const kataList = (syllabus.techniques || []).filter(t => t.group === 'kata');

                return (
                  <div 
                    key={syllabus.id || syllabus._id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-2xs space-y-5 hover:border-[#2D2E83]/40 transition-all"
                  >
                    {/* Cabecera del Temario */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h2 className="text-xl font-bold text-[#2D2E83] tracking-tight">
                          {syllabus.name}
                        </h2>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDuplicate(syllabus)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Duplicar para usar como base de otro examen"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Duplicar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(syllabus)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#2D2E83] text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Editar temario"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#2D2E83]" />
                          <span>Editar</span>
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSyllabus(syllabus)}
                            className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar temario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Los 3 Grandes Grupos: Kihon, Kumite, Kata */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      {/* GRUPO 1: KIHON */}
                      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#2D2E83] text-white flex items-center justify-center text-xs font-bold">
                                1
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                  KIHON
                                </h3>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-2xs">
                              {kihonList.length} Técnicas
                            </span>
                          </div>

                          {kihonList.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-4 text-center">
                              Sin técnicas de Kihon asignadas
                            </p>
                          ) : (
                            <div className="space-y-2.5">
                              {kihonList.map((tech, idx) => (
                                <div key={tech.id || idx} className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5 group/tech hover:border-[#2D2E83]/40 transition-all">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-sm font-bold text-slate-900 leading-snug">
                                      {idx + 1}. {tech.name}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                        {tech.stance}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditTechModal(syllabus, tech)}
                                        className="p-1 rounded-md text-slate-400 hover:text-[#2D2E83] hover:bg-slate-100 transition-colors cursor-pointer"
                                        title="Modificar parámetros de esta técnica"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Atributos exclusivos de KIHON: Dirección, Reps, Ida/Vuelta */}
                                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700">
                                      {tech.direction.includes('Atrás') || tech.direction.includes('Ushiro') ? (
                                        <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                                      ) : (
                                        <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                                      )}
                                      <span>{tech.direction}</span>
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditTechModal(syllabus, tech)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition-colors cursor-pointer"
                                      title="Clic para cambiar número de repeticiones"
                                    >
                                      <Repeat className="w-3.5 h-3.5 text-slate-500" />
                                      <span className="font-semibold">{tech.repetitions} reps</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleQuickToggleTripType(syllabus, tech.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition-all cursor-pointer"
                                      title="Clic para alternar entre 'Ida y Vuelta' y 'Solo Ida'"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                      <span>{tech.tripType === 'ida_y_vuelta' ? 'Ida y Vuelta (Mawatte)' : 'Solo Ida'}</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* GRUPO 2: KUMITE */}
                      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#BE1622] text-white flex items-center justify-center text-xs font-bold">
                                2
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                  KUMITE
                                </h3>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-2xs">
                              {kumiteList.length} Ejercicios
                            </span>
                          </div>

                          {kumiteList.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-4 text-center">
                              Sin ejercicios de Kumite asignados
                            </p>
                          ) : (
                            <div className="space-y-2.5">
                              {kumiteList.map((tech, idx) => (
                                <div key={tech.id || idx} className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5 group/tech hover:border-[#2D2E83]/40 transition-all">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-sm font-bold text-slate-900 leading-snug">
                                      {idx + 1}. {tech.name}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                        {tech.stance}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditTechModal(syllabus, tech)}
                                        className="p-1 rounded-md text-slate-400 hover:text-[#2D2E83] hover:bg-slate-100 transition-colors cursor-pointer"
                                        title="Modificar este ejercicio de Kumite"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* GRUPO 3: KATA */}
                      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                                3
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                  KATA
                                </h3>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-2xs">
                              {kataList.length} Kata(s)
                            </span>
                          </div>

                          {kataList.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-4 text-center">
                              Sin Kata asignada
                            </p>
                          ) : (
                            <div className="space-y-2.5">
                              {kataList.map((tech, idx) => (
                                <div key={tech.id || idx} className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5 group/tech hover:border-[#2D2E83]/40 transition-all">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-sm font-bold text-slate-900 leading-snug">
                                      {idx + 1}. {tech.name}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                        {tech.stance}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditTechModal(syllabus, tech)}
                                        className="p-1 rounded-md text-slate-400 hover:text-[#2D2E83] hover:bg-slate-100 transition-colors cursor-pointer"
                                        title="Modificar Embusen o datos de este Kata"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Único atributo para Kata: EMBUSEN */}
                                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 border border-slate-200 text-slate-800">
                                      <Compass className="w-3.5 h-3.5 text-[#2D2E83]" />
                                      <span className="font-semibold text-slate-900">Embusen:</span>
                                      <span className="text-slate-700">{tech.embusen || 'Embusen Oficial ISKF'}</span>
                                    </span>
                                  </div>

                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: ASPECTOS TÉCNICOS Y RÚBRICA (PERSISTENCIA TOTAL EN MONGODB) */}
      {/* ========================================================================= */}
      {activeMainTab === 'aspectos' && (
        <div className="space-y-6">
          {/* Cabecera informativa del Cinturón elegido desde Temario (Sin selector redundante) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {selectedAspectSyllabus ? (
                <>
                  <BeltBadge rankString={selectedAspectSyllabus.currentRank || selectedAspectSyllabus.targetRank} />
                  <span className="text-sm font-bold text-[#2D2E83]">
                    {selectedAspectSyllabus.name}
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-500 font-medium">
                  Selecciona o crea un temario en la pestaña de Temarios de Técnicas.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {selectedAspectSyllabus && (
                <button
                  type="button"
                  disabled={isSavingAspects}
                  onClick={handleClearAllAspectsForBelt}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Borrar todos los criterios técnicos de este cinturón para empezar en limpio"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Borrar Aspectos de este Cinturón</span>
                </button>
              )}
            </div>
          </div>

          {/* Grid de Aspectos Técnicos (Categoría 1 y Categoría 2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SECCIÓN 1: ASPECTOS TÉCNICOS (Tsuki, Uke, Dachi, Geri, Kata, Kumite) */}
            <div className="border border-slate-200/90 rounded-2xl p-5 md:p-6 bg-white shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-[#2D2E83] uppercase tracking-wide flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#BE1622]" />
                  1. Aspectos Técnicos (Kihon, Kata y Kumite)
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleAllSection(['tsuki', 'uke', 'dachi', 'geri', 'kata', 'kumite'], !allSection1Open)}
                    className="text-[11px] font-bold text-[#2D2E83] hover:text-[#BE1622] hover:underline cursor-pointer"
                  >
                    {allSection1Open ? 'Cerrar todas' : 'Abrir todas'}
                  </button>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                    {section1Aspects.length} Bloques
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {section1Aspects.map(aspect => {
                  const isOpen = Boolean(openAspectCards[aspect.id]);
                  const icon = ASPECT_ICONS[aspect.category] || '🥋';
                  const pointsCount = (aspect.points || []).length;

                  return (
                    <div 
                      key={aspect.id} 
                      className={`rounded-xl border transition-all ${
                        isOpen 
                          ? 'bg-slate-50/80 border-[#2D2E83]/40 shadow-xs space-y-3 p-4' 
                          : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-2xs p-3.5'
                      }`}
                    >
                      {/* Cabecera Clickeable para Abrir / Cerrar */}
                      <button
                        type="button"
                        onClick={() => toggleAspectCard(aspect.id)}
                        className="w-full flex items-center justify-between gap-3 text-left cursor-pointer group"
                        aria-expanded={isOpen}
                        title={isOpen ? "Clic para cerrar tarjeta" : "Clic para abrir y manipular contenido"}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg shrink-0 group-hover:scale-110 transition-transform">
                            {icon}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#2D2E83] transition-colors tracking-tight truncate">
                              {aspect.title}
                            </h4>
                            {aspect.subtitle && (
                              <span className="text-xs text-slate-500 font-medium block truncate mt-0.5">
                                {aspect.subtitle}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border transition-colors ${
                            isOpen 
                              ? 'bg-[#2D2E83] text-white border-[#2D2E83]' 
                              : 'bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-slate-200'
                          }`}>
                            {pointsCount} {pointsCount === 1 ? 'Parámetro' : 'Parámetros'}
                          </span>
                          <div className={`p-1 rounded-lg text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#2D2E83]' : ''}`}>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </button>

                      {/* Contenido Desplegable: Manipulación de Puntos */}
                      {isOpen && (
                        <div className="space-y-3 pt-2 border-t border-slate-200/80 animate-in fade-in duration-150">
                          {/* Lista de Puntos / Parámetros Evaluados */}
                          <div className="flex items-center justify-between gap-2 pb-0.5 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              Criterios Evaluados ({pointsCount})
                            </span>
                            <div className="flex items-center gap-3">
                              {pointsCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleClearAspectPoints(aspect.id, aspect.title)}
                                  className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                                  title="Borrar todos los criterios de esta categoría"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Vaciar bloque</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleResetAspectToDefault(aspect.id)}
                                className="text-[11px] font-semibold text-slate-500 hover:text-[#2D2E83] flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                                title="Restablecer a los criterios oficiales por defecto de este aspecto"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restablecer oficiales</span>
                              </button>
                            </div>
                          </div>

                          {pointsCount === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2 text-center">
                              No hay parámetros registrados en esta tarjeta.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {(aspect.points || []).map((point, pIdx) => {
                                const isEditing = editingPoint?.aspectId === aspect.id && editingPoint?.pointIndex === pIdx;
                                const isDraggingThis = draggedPointInfo?.aspectId === aspect.id && draggedPointInfo?.pointIndex === pIdx;
                                const isDragOverThis = dragOverPointInfo?.aspectId === aspect.id && dragOverPointInfo?.pointIndex === pIdx;
                                const pointData = getPointData(point);

                                return (
                                  <li 
                                    key={pIdx} 
                                    onDragOver={(e) => handlePointDragOver(e, aspect.id, pIdx)}
                                    onDrop={(e) => handlePointDrop(e, aspect.id, pIdx)}
                                    className={`p-2.5 rounded-xl border text-xs md:text-sm font-normal leading-relaxed flex items-start justify-between gap-2 shadow-2xs group/point transition-all ${
                                      isDraggingThis ? 'opacity-40 border-dashed border-[#2D2E83] bg-indigo-50/50' :
                                      isDragOverThis ? 'border-2 border-[#2D2E83] bg-indigo-50' :
                                      'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    {/* Drag handle, botones subir/bajar y badge de número */}
                                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                                      <div
                                        draggable={!isEditing}
                                        onDragStart={(e) => handlePointDragStart(e, aspect.id, pIdx)}
                                        onDragEnd={handlePointDragEnd}
                                        className="p-1 rounded text-slate-400 hover:text-[#2D2E83] hover:bg-slate-100 cursor-grab active:cursor-grabbing transition-colors"
                                        title="Arrastrar para mover este criterio de posición"
                                      >
                                        <GripVertical className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="flex flex-col opacity-60 group-hover/point:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          disabled={pIdx === 0}
                                          onClick={() => handleMovePointStep(aspect.id, pIdx, -1)}
                                          className="p-0.5 text-slate-400 hover:text-[#2D2E83] disabled:opacity-20 disabled:pointer-events-none rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                          title="Subir de orden"
                                        >
                                          <ChevronUp className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={pIdx === (aspect.points || []).length - 1}
                                          onClick={() => handleMovePointStep(aspect.id, pIdx, 1)}
                                          className="p-0.5 text-slate-400 hover:text-[#2D2E83] disabled:opacity-20 disabled:pointer-events-none rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                          title="Bajar de orden"
                                        >
                                          <ChevronDown className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0 border border-slate-200">
                                        {pIdx + 1}
                                      </span>
                                    </div>

                                    {/* Cuerpo del Criterio: Modo Edición o Modo Visualización */}
                                    {isEditing ? (
                                      <div className="flex-1 min-w-0 flex items-center gap-2">
                                        <input
                                          type="text"
                                          autoFocus
                                          value={editingPoint.text}
                                          onChange={(e) => setEditingPoint(prev => ({ ...prev, text: e.target.value }))}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleSaveEditPoint();
                                            } else if (e.key === 'Escape') {
                                              e.preventDefault();
                                              handleCancelEditPoint();
                                            }
                                          }}
                                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#2D2E83] text-xs md:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20 bg-white"
                                          placeholder="Escribe el criterio técnico..."
                                        />
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={handleSaveEditPoint}
                                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                            title="Guardar modificación (Enter)"
                                          >
                                            <Check className="w-3.5 h-3.5 stroke-3" />
                                            <span>Guardar</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={handleCancelEditPoint}
                                            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                            title="Cancelar (Escape)"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-start gap-2 flex-1 min-w-0 pt-0.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#2D2E83] mt-2 shrink-0" />
                                          <span className="leading-relaxed text-slate-800 break-words flex-1">{pointData.text}</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => handleStartEditPoint(aspect.id, pIdx, pointData.text)}
                                            className="text-slate-400 hover:text-[#2D2E83] p-1 rounded-lg opacity-60 group-hover/point:opacity-100 transition-opacity cursor-pointer hover:bg-slate-100"
                                            title="Modificar texto del criterio"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRemovePointFromAspect(aspect.id, pIdx)}
                                            className="text-slate-400 hover:text-red-600 p-1 rounded-lg opacity-60 group-hover/point:opacity-100 transition-opacity cursor-pointer hover:bg-red-50"
                                            title="Remover parámetro"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                          {/* Input para agregar un nuevo parámetro a este aspecto */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={newPointInput[aspect.id] || ''}
                              onChange={(e) => setNewPointInput({ ...newPointInput, [aspect.id]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddPointToAspect(aspect.id, true);
                                }
                              }}
                              placeholder="+ Escribir nuevo parámetro técnico..."
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20 bg-white placeholder-slate-400"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddPointToAspect(aspect.id, true)}
                              className="px-3.5 py-2 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-lg text-xs md:text-sm font-semibold transition-all shrink-0 cursor-pointer"
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 2: ASPECTOS FÍSICOS, MENTALES Y EL "DO" */}
            <div className="border border-slate-200/90 rounded-2xl p-5 md:p-6 bg-white shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-[#2D2E83] uppercase tracking-wide flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#2D2E83]" />
                  2. Aspectos Físicos, Mentales y el &ldquo;DO&rdquo;
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleAllSection(['physical', 'mental', 'do'], !allSection2Open)}
                    className="text-[11px] font-bold text-[#2D2E83] hover:text-[#BE1622] hover:underline cursor-pointer"
                  >
                    {allSection2Open ? 'Cerrar todas' : 'Abrir todas'}
                  </button>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                    {section2Aspects.length} Bloques
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {section2Aspects.map(aspect => {
                  const isOpen = Boolean(openAspectCards[aspect.id]);
                  const icon = ASPECT_ICONS[aspect.category] || '⚡';
                  const pointsCount = (aspect.points || []).length;
                  const evaluableCount = (aspect.points || []).filter(p => getPointData(p, true).isEvaluable).length;

                  return (
                    <div 
                      key={aspect.id} 
                      className={`rounded-xl border transition-all ${
                        isOpen 
                          ? 'bg-slate-50/80 border-[#2D2E83]/40 shadow-xs space-y-3 p-4' 
                          : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-2xs p-3.5'
                      }`}
                    >
                      {/* Cabecera Clickeable para Abrir / Cerrar */}
                      <button
                        type="button"
                        onClick={() => toggleAspectCard(aspect.id)}
                        className="w-full flex items-center justify-between gap-3 text-left cursor-pointer group"
                        aria-expanded={isOpen}
                        title={isOpen ? "Clic para cerrar tarjeta" : "Clic para abrir y manipular contenido"}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg shrink-0 group-hover:scale-110 transition-transform">
                            {icon}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#2D2E83] transition-colors tracking-tight truncate">
                              {aspect.title}
                            </h4>
                            {aspect.subtitle && (
                              <span className="text-xs text-slate-500 font-medium block truncate mt-0.5">
                                {aspect.subtitle}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {evaluableCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 hidden sm:inline-block">
                              {evaluableCount} en examen
                            </span>
                          )}
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border transition-colors ${
                            isOpen 
                              ? 'bg-[#2D2E83] text-white border-[#2D2E83]' 
                              : 'bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-slate-200'
                          }`}>
                            {pointsCount} {pointsCount === 1 ? 'Parámetro' : 'Parámetros'}
                          </span>
                          <div className={`p-1 rounded-lg text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#2D2E83]' : ''}`}>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </button>

                      {/* Contenido Desplegable: Manipulación de Puntos */}
                      {isOpen && (
                        <div className="space-y-3 pt-2 border-t border-slate-200/80 animate-in fade-in duration-150">
                          {/* Lista de Puntos / Parámetros Evaluados con Selector "Evaluar en examen" */}
                          <div className="flex items-center justify-between gap-2 pb-0.5 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              Criterios Formativos y de Examen ({pointsCount})
                            </span>
                            <div className="flex items-center gap-3">
                              {pointsCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleClearAspectPoints(aspect.id, aspect.title)}
                                  className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                                  title="Borrar todos los criterios de esta categoría"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Vaciar bloque</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleResetAspectToDefault(aspect.id)}
                                className="text-[11px] font-semibold text-slate-500 hover:text-[#2D2E83] flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                                title="Restablecer a los criterios oficiales por defecto de este aspecto"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restablecer oficiales</span>
                              </button>
                            </div>
                          </div>

                          {pointsCount === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2 text-center">
                              No hay parámetros registrados en esta tarjeta.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {(aspect.points || []).map((point, pIdx) => {
                                const isEditing = editingPoint?.aspectId === aspect.id && editingPoint?.pointIndex === pIdx;
                                const isDraggingThis = draggedPointInfo?.aspectId === aspect.id && draggedPointInfo?.pointIndex === pIdx;
                                const isDragOverThis = dragOverPointInfo?.aspectId === aspect.id && dragOverPointInfo?.pointIndex === pIdx;
                                const pointData = getPointData(point, true);

                                return (
                                  <li 
                                    key={pIdx} 
                                    onDragOver={(e) => handlePointDragOver(e, aspect.id, pIdx)}
                                    onDrop={(e) => handlePointDrop(e, aspect.id, pIdx)}
                                    className={`p-2.5 rounded-xl border text-xs md:text-sm font-normal leading-relaxed flex items-start justify-between gap-2 shadow-2xs group/point transition-all ${
                                      isDraggingThis ? 'opacity-40 border-dashed border-[#2D2E83] bg-indigo-50/50' :
                                      isDragOverThis ? 'border-2 border-[#2D2E83] bg-indigo-50' :
                                      pointData.isEvaluable 
                                        ? 'bg-emerald-50/50 border-emerald-200/80' 
                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    {/* Drag handle, botones subir/bajar y badge de número */}
                                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                                      <div
                                        draggable={!isEditing}
                                        onDragStart={(e) => handlePointDragStart(e, aspect.id, pIdx)}
                                        onDragEnd={handlePointDragEnd}
                                        className="p-1 rounded text-slate-400 hover:text-[#2D2E83] hover:bg-slate-100 cursor-grab active:cursor-grabbing transition-colors"
                                        title="Arrastrar para mover este criterio de posición"
                                      >
                                        <GripVertical className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="flex flex-col opacity-60 group-hover/point:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          disabled={pIdx === 0}
                                          onClick={() => handleMovePointStep(aspect.id, pIdx, -1)}
                                          className="p-0.5 text-slate-400 hover:text-[#2D2E83] disabled:opacity-20 disabled:pointer-events-none rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                          title="Subir de orden"
                                        >
                                          <ChevronUp className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={pIdx === (aspect.points || []).length - 1}
                                          onClick={() => handleMovePointStep(aspect.id, pIdx, 1)}
                                          className="p-0.5 text-slate-400 hover:text-[#2D2E83] disabled:opacity-20 disabled:pointer-events-none rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                          title="Bajar de orden"
                                        >
                                          <ChevronDown className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0 border border-slate-200">
                                        {pIdx + 1}
                                      </span>
                                    </div>

                                    {/* Cuerpo del Criterio: Modo Edición o Modo Visualización */}
                                    {isEditing ? (
                                      <div className="flex-1 min-w-0 flex items-center gap-2">
                                        <input
                                          type="text"
                                          autoFocus
                                          value={editingPoint.text}
                                          onChange={(e) => setEditingPoint(prev => ({ ...prev, text: e.target.value }))}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleSaveEditPoint();
                                            } else if (e.key === 'Escape') {
                                              e.preventDefault();
                                              handleCancelEditPoint();
                                            }
                                          }}
                                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#2D2E83] text-xs md:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20 bg-white"
                                          placeholder="Escribe el criterio..."
                                        />
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={handleSaveEditPoint}
                                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                            title="Guardar modificación (Enter)"
                                          >
                                            <Check className="w-3.5 h-3.5 stroke-3" />
                                            <span>Guardar</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={handleCancelEditPoint}
                                            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                            title="Cancelar (Escape)"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-start gap-2.5 flex-1 min-w-0 pt-0.5">
                                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${pointData.isEvaluable ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-slate-300'}`} />
                                          <div className="flex-1 min-w-0">
                                            <span className="leading-relaxed text-slate-800 break-words">{pointData.text}</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => handleTogglePointEvaluable(aspect.id, pIdx)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                              pointData.isEvaluable
                                                ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300 hover:bg-emerald-200/80 shadow-2xs'
                                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70 hover:text-slate-800'
                                            }`}
                                            title={pointData.isEvaluable ? 'Aparecerá en la evaluación del tatami para calificar con estrellas' : 'Criterio sólo formativo para el sensei que instruye (no aparece en examen)'}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={pointData.isEvaluable}
                                              readOnly
                                              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer pointer-events-none accent-emerald-600"
                                            />
                                            <span>{pointData.isEvaluable ? 'Evaluar en examen' : 'Sólo preparatorio'}</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleStartEditPoint(aspect.id, pIdx, pointData.text)}
                                            className="text-slate-400 hover:text-[#2D2E83] p-1 rounded-lg opacity-60 group-hover/point:opacity-100 transition-opacity cursor-pointer hover:bg-slate-100"
                                            title="Modificar texto del criterio"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRemovePointFromAspect(aspect.id, pIdx)}
                                            className="text-slate-400 hover:text-red-600 p-1 rounded-lg opacity-60 group-hover/point:opacity-100 transition-opacity cursor-pointer shrink-0 hover:bg-red-50"
                                            title="Remover parámetro"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                          {/* Input y Checkbox para agregar un nuevo aspecto/criterio */}
                          <div className="space-y-2 pt-1 bg-white p-2.5 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newPointInput[aspect.id] || ''}
                                onChange={(e) => setNewPointInput({ ...newPointInput, [aspect.id]: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddPointToAspect(aspect.id, newPointEvaluable[aspect.id] || false);
                                  }
                                }}
                                placeholder="+ Escribir nuevo aspecto o criterio..."
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#BE1622]/20 bg-slate-50/50 placeholder-slate-400"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddPointToAspect(aspect.id, newPointEvaluable[aspect.id] || false)}
                                className="px-3.5 py-2 bg-[#BE1622] hover:bg-[#9E121B] text-white rounded-lg text-xs md:text-sm font-semibold transition-all shrink-0 cursor-pointer shadow-2xs"
                              >
                                Agregar
                              </button>
                            </div>
                            <div className="flex items-center justify-between px-1">
                              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none hover:text-slate-900">
                                <input
                                  type="checkbox"
                                  checked={Boolean(newPointEvaluable[aspect.id])}
                                  onChange={(e) => setNewPointEvaluable({ ...newPointEvaluable, [aspect.id]: e.target.checked })}
                                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
                                />
                                <span className="font-semibold text-slate-800">
                                  Evaluar en examen
                                </span>
                                <span className="text-[11px] text-slate-500 font-normal">
                                  (Marcar si los sinodales deben calificarlo en el tatami)
                                </span>
                              </label>
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                                newPointEvaluable[aspect.id] ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {newPointEvaluable[aspect.id] ? 'Aparecerá en examen' : 'Sólo preparatorio de sensei'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Botón flotante o inferior para guardar aspectos a Base de Datos */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Todos los criterios modificados se guardan de forma persistente en MongoDB para este grado.</span>
            </div>

            <button
              type="button"
              disabled={isSavingAspects}
              onClick={handleSaveAspectsToDatabase}
              className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSavingAspects ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-emerald-400" />}
              <span>{isSavingAspects ? 'Guardando en BD...' : 'Guardar Aspectos Técnicos en Base de Datos'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR / EDITAR TEMARIO */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 my-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#2D2E83]/10 text-[#2D2E83] rounded-2xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {modalMode === 'create' ? 'Crear Nuevo Temario de Examen' : 'Editar Temario de Examen'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Define el nombre, cinturones y agrega las técnicas a evaluar en Kihon, Kumite y Kata.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSyllabus} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                    Nombre del Temario / Examen *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Temario Oficial: Cinturón Blanco (10° Kyu)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20 focus:border-[#2D2E83] transition-all font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                    Cinturón Actual (Origen) *
                  </label>
                  <select
                    value={formCurrentRank}
                    onChange={(e) => setFormCurrentRank(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs md:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20 bg-white"
                  >
                    {KYU_OPTIONS.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                    Cinturón a Evaluar (Destino) *
                  </label>
                  <select
                    value={formTargetRank}
                    onChange={(e) => setFormTargetRank(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs md:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20 bg-white"
                  >
                    {KYU_OPTIONS.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1.5">
                    Descripción Breve (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Ej: Temario de evaluación oficial"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20 text-slate-800 font-normal"
                  />
                </div>
              </div>

              {/* Constructor de Técnicas por Grupo */}
              <div className="border border-slate-200 rounded-2xl p-4 md:p-5 bg-slate-50/60 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D2E83] flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#2D2E83]" />
                    Adjuntar Técnicas a Evaluar por Grupo
                  </h4>

                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                    {[
                      { key: 'kihon', label: '1. KIHON' },
                      { key: 'kumite', label: '2. KUMITE' },
                      { key: 'kata', label: '3. KATA' }
                    ].map(tab => {
                      const count = formTechniques.filter(t => t.group === tab.key).length;
                      const isActive = activeBuilderGroup === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setActiveBuilderGroup(tab.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isActive
                              ? 'bg-[#2D2E83] text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-xs font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        {activeBuilderGroup === 'kihon' ? 'Nombre de la Técnica (Kihon) *' :
                         activeBuilderGroup === 'kumite' ? 'Nombre del Ejercicio (Kumite) *' :
                         'Nombre del Kata *'}
                      </label>
                      <input
                        type="text"
                        value={techName}
                        onChange={(e) => setTechName(e.target.value)}
                        placeholder={
                          activeBuilderGroup === 'kihon' ? 'Ej: Oi Zuki Chudan, Mae Geri...' :
                          activeBuilderGroup === 'kumite' ? 'Ej: Gohon Kumite Jodan...' :
                          'Ej: Heian Shodan, Heian Nidan...'
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Postura / Dachi
                      </label>
                      <select
                        value={techStance}
                        onChange={(e) => setTechStance(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs md:text-sm font-medium focus:outline-none bg-white text-slate-900"
                      >
                        {COMMON_STANCES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* ATRIBUTOS EXCLUSIVOS DE KIHON */}
                    {activeBuilderGroup === 'kihon' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                            Repeticiones
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={techRepetitions}
                            onChange={(e) => setTechRepetitions(e.target.value)}
                            placeholder="Ej: 3"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs md:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                            Dirección (Toggle Flecha)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setTechDirection(prev => prev.includes('Atrás') || prev.includes('Ushiro') ? 'Adelante (Mae)' : 'Atrás (Ushiro)');
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer bg-white text-slate-800"
                            title="Clic para alternar entre Adelante y Atrás"
                          >
                            <div className="flex items-center gap-1.5">
                              {techDirection.includes('Atrás') || techDirection.includes('Ushiro') ? (
                                <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
                              ) : (
                                <ArrowUp className="w-3.5 h-3.5 text-slate-600" />
                              )}
                              <span className="truncate">{techDirection.includes('Atrás') || techDirection.includes('Ushiro') ? 'Atrás' : 'Adelante'}</span>
                            </div>
                            <span className="text-xs text-slate-400">⇄</span>
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                            Ida y Vuelta (Reciclaje)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setTechTripType(prev => prev === 'ida_y_vuelta' ? 'solo_ida' : 'ida_y_vuelta');
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer bg-white text-slate-800"
                            title="Clic para marcar si es Ida y Vuelta"
                          >
                            <div className="flex items-center gap-1.5">
                              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                              <span className="text-xs">{techTripType === 'ida_y_vuelta' ? 'Ida y Vuelta' : 'Solo Ida'}</span>
                            </div>
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                              techTripType === 'ida_y_vuelta'
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : 'border-slate-300 bg-white'
                            }`}>
                              {techTripType === 'ida_y_vuelta' && <Check className="w-3 h-3 stroke-3" />}
                            </div>
                          </button>
                        </div>
                      </>
                    )}

                    {/* ATRIBUTO EXCLUSIVO DE KATA: EMBUSEN */}
                    {activeBuilderGroup === 'kata' && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                          Embusen (Línea de Ejecución del Kata) *
                        </label>
                        <input
                          type="text"
                          value={techEmbusen}
                          onChange={(e) => setTechEmbusen(e.target.value)}
                          placeholder="Ej: Embusen Oficial ISKF, Línea I, etc."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs md:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20"
                        />
                      </div>
                    )}

                    <div className={activeBuilderGroup === 'kumite' ? 'sm:col-span-3' : 'sm:col-span-2'}>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Notas / Observación del Comando (Opcional)
                      </label>
                      <input
                        type="text"
                        value={techNotes}
                        onChange={(e) => setTechNotes(e.target.value)}
                        placeholder="Ej: Kiai en la última repetición, pausas marciales..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs md:text-sm text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                    {editingTechInModalId ? (
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        Editando técnica seleccionada
                      </span>
                    ) : <span /> }
                    <div className="flex items-center gap-2">
                      {editingTechInModalId && (
                        <button
                          type="button"
                          onClick={handleCancelEditTechInModal}
                          className="px-3 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all"
                        >
                          Cancelar Edición
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleAddTechnique}
                        className="px-4 py-2 bg-[#2D2E83] hover:bg-[#232468] text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        {editingTechInModalId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{editingTechInModalId ? 'Guardar Cambios en Técnica' : `Agregar a ${activeBuilderGroup.toUpperCase()}`}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Técnicas en {activeBuilderGroup.toUpperCase()} ({formTechniques.filter(t => t.group === activeBuilderGroup).length}):
                  </h5>

                  {formTechniques.filter(t => t.group === activeBuilderGroup).length === 0 ? (
                    <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                      No has agregado técnicas en esta sección aún. Usa el formulario de arriba para agregarlas.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {formTechniques
                        .filter(t => t.group === activeBuilderGroup)
                        .map((tech, idx) => (
                          <div
                            key={tech.id}
                            className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <h6 className="text-sm font-bold text-slate-900 truncate">
                                  {tech.name}
                                </h6>
                                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 font-medium">
                                  <span>{tech.stance}</span>
                                  {tech.group === 'kihon' && (
                                    <>
                                      <span>•</span>
                                      <span>{tech.direction}</span>
                                      <span>•</span>
                                      <span>{tech.repetitions} reps</span>
                                      <span>•</span>
                                      <span className="font-semibold text-slate-800">
                                        {tech.tripType === 'ida_y_vuelta' ? 'Ida y Vuelta' : 'Solo Ida'}
                                      </span>
                                    </>
                                  )}
                                  {tech.group === 'kata' && (
                                    <>
                                      <span>•</span>
                                      <span className="font-semibold text-slate-800">Embusen: {tech.embusen || 'Embusen Oficial'}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditTechInModal(tech)}
                                className="p-1 text-slate-600 hover:text-[#2D2E83] rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Editar parámetros"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveTechnique(tech.id, 'up')}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                                title="Subir"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveTechnique(tech.id, 'down')}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                                title="Bajar"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveTechnique(tech.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                                title="Eliminar técnica"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-black disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : modalMode === 'create' ? 'Guardar Temario' : 'Actualizar Temario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE EDICIÓN INDIVIDUAL RÁPIDA DE TÉCNICA */}
      {/* ========================================================================= */}
      {editingTechModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-[#2D2E83] rounded-2xl border border-slate-200">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 tracking-tight">
                    Modificar Técnica Individual
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingTechModal.syllabus?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTechModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                  Nombre de la Técnica
                </label>
                <input
                  type="text"
                  value={editingTechModal.name}
                  onChange={(e) => setEditingTechModal(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20"
                />
              </div>

              {editingTechModal.tech?.group === 'kihon' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                      Repeticiones *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={editingTechModal.repetitions}
                      onChange={(e) => setEditingTechModal(prev => ({ ...prev, repetitions: e.target.value }))}
                      placeholder="Número"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                      Dirección
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTechModal(prev => ({
                          ...prev,
                          direction: (prev.direction || '').includes('Atrás') || (prev.direction || '').includes('Ushiro') ? 'Adelante (Mae)' : 'Atrás (Ushiro)'
                        }));
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer bg-white text-slate-800"
                      title="Clic para cambiar dirección: Adelante / Atrás"
                    >
                      <div className="flex items-center gap-1.5">
                        {(editingTechModal.direction || '').includes('Atrás') || (editingTechModal.direction || '').includes('Ushiro') ? (
                          <ArrowDown className="w-4 h-4 text-slate-600" />
                        ) : (
                          <ArrowUp className="w-4 h-4 text-slate-600" />
                        )}
                        <span>{(editingTechModal.direction || '').includes('Atrás') || (editingTechModal.direction || '').includes('Ushiro') ? 'Atrás' : 'Adelante'}</span>
                      </div>
                      <span className="text-xs text-slate-400">⇄</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                      Ida y Vuelta
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTechModal(prev => ({
                          ...prev,
                          tripType: prev.tripType === 'ida_y_vuelta' ? 'solo_ida' : 'ida_y_vuelta'
                        }));
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer bg-white text-slate-800"
                    >
                      <div className="flex items-center gap-1.5">
                        <RotateCcw className="w-4 h-4 text-slate-600" />
                        <span className="text-xs">{editingTechModal.tripType === 'ida_y_vuelta' ? 'Ida y Vuelta' : 'Solo Ida'}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        editingTechModal.tripType === 'ida_y_vuelta'
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {editingTechModal.tripType === 'ida_y_vuelta' && <Check className="w-3.5 h-3.5 stroke-3" />}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {editingTechModal.tech?.group === 'kata' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Embusen (Línea de Ejecución del Kata) *
                  </label>
                  <input
                    type="text"
                    value={editingTechModal.embusen || ''}
                    onChange={(e) => setEditingTechModal(prev => ({ ...prev, embusen: e.target.value }))}
                    placeholder="Ej: Embusen Oficial ISKF"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D2E83]/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                  Postura / Dachi
                </label>
                <select
                  value={editingTechModal.stance}
                  onChange={(e) => setEditingTechModal(prev => ({ ...prev, stance: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs md:text-sm font-medium focus:outline-none bg-white text-slate-900"
                >
                  {COMMON_STANCES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                  Notas / Observación del Comando
                </label>
                <input
                  type="text"
                  value={editingTechModal.notes}
                  onChange={(e) => setEditingTechModal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ej: Mawatte Gedan Barai al giro, Kiai en última repetición..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs md:text-sm text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTechModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveIndividualTech}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alerta */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
              alertModal.isError ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              {alertModal.isError ? <ShieldAlert className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900">{alertModal.title}</h4>
              <p className="text-xs text-slate-600">{alertModal.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
              className="w-full py-2.5 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-red-100 text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900">{confirmModal.title}</h4>
              <p className="text-xs text-slate-600">{confirmModal.message}</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-red-600/20 cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
