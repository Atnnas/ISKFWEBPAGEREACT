"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  X, 
  Loader2, 
  Image as ImageIcon,
  Save,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { 
  getStudentsByDojo, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  toggleStudentExamPromotion 
} from '../../lib/actions/students';
import { handleBulletInputChange, handleBulletKeyDown } from '../../lib/utils/bulletNotes';
import ConfirmModal from '../ui/ConfirmModal';
import AlertModal from '../ui/AlertModal';

const KYU_OPTIONS = [
  '10° Kyu (Cinta Blanca)',
  '9° Kyu (Cinta Amarilla)',
  '8° Kyu (Cinta Naranja)',
  '7° Kyu (Cinta Azul)',
  '6° Kyu (Cinta Verde)',
  '5° Kyu (Cinta Morada)',
  '4° Kyu (Cinta Morada I)',
  '3° Kyu (Cinta Marrón)',
  '2° Kyu (Cinta Marrón I)',
  '1° Kyu (Cinta Marrón II)',
  '1° Dan (Cinta Negra)',
  '2° Dan (Cinta Negra)',
  '3° Dan (Cinta Negra)',
  '4° Dan (Cinta Negra)',
  '5° Dan (Cinta Negra)',
];

function getRankWeight(rank) {
  if (!rank) return 999;
  const r = rank.toLowerCase();
  if (r.includes('blanca') || r.includes('10')) return 10;
  if (r.includes('amarilla') || r.includes('9')) return 9;
  if (r.includes('naranja') || r.includes('8')) return 8;
  if (r.includes('verde') && !r.includes('azul')) return 7;
  if (r.includes('azul')) return 6;
  if (r.includes('morada') && !r.includes('línea') && !r.includes('linea')) return 5;
  if (r.includes('morada') && (r.includes('línea') || r.includes('linea'))) return 4;
  if (r.includes('marrón') || r.includes('marron')) {
    if (r.includes('3') || r.includes('iii')) return 3;
    if (r.includes('2') || r.includes('ii')) return 2;
    if (r.includes('1') || r.includes('i')) return 1;
    return 3;
  }
  if (r.includes('dan') || r.includes('negra')) return 0;
  const match = rank.match(/(\d+)/);
  if (match) return parseInt(match[1], 10);
  return 999;
}

function getKyuBadge(rank) {
  if (!rank) return { bg: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' };
  const r = rank.toLowerCase();
  if (r.includes('blanca')) return { bg: 'bg-slate-100 text-slate-800 border-slate-300', dot: 'bg-slate-400' };
  if (r.includes('amarilla')) return { bg: 'bg-amber-100 text-amber-900 border-amber-300', dot: 'bg-amber-500' };
  if (r.includes('naranja')) return { bg: 'bg-orange-100 text-orange-900 border-orange-300', dot: 'bg-orange-500' };
  if (r.includes('azul')) return { bg: 'bg-blue-100 text-blue-900 border-blue-300', dot: 'bg-blue-600' };
  if (r.includes('verde')) return { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', dot: 'bg-emerald-600' };
  if (r.includes('morada')) return { bg: 'bg-purple-100 text-purple-900 border-purple-300', dot: 'bg-purple-600' };
  if (r.includes('marrón') || r.includes('marron')) return { bg: 'bg-amber-900/15 text-amber-950 border-amber-800/30', dot: 'bg-amber-800' };
  if (r.includes('negra') || r.includes('dan')) return { bg: 'bg-gray-900 text-white border-black', dot: 'bg-red-500' };
  return { bg: 'bg-blue-50 text-[#2D2E83] border-blue-200', dot: 'bg-[#2D2E83]' };
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatDate(isoDate) {
  if (!isoDate) return 'No registrada';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return 'No registrada';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function parseCustomDate(str) {
  if (!str) return null;
  const dmyMatch = String(str).trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!dmyMatch) return null;
  const day = parseInt(dmyMatch[1], 10);
  const month = parseInt(dmyMatch[2], 10) - 1;
  const year = parseInt(dmyMatch[3], 10);
  const d = new Date(year, month, day);
  return (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) ? d : null;
}

export default function StudentsRosterView({ 
  initialDojos = [], 
  initialStudents = [], 
  user = null,
  defaultDojoId = null 
}) {
  const isSensei = user?.role === 'sensei';
  
  // Si es sensei, su dojo está restringido a su dojoId
  const userDojo = isSensei && user?.dojoId
    ? initialDojos.find(d => (d._id || d.id) === user.dojoId) || { _id: user.dojoId, id: user.dojoId, name: user.dojoName || 'Mi Dojo' }
    : null;

  const [selectedDojoId, setSelectedDojoId] = useState(
    isSensei && userDojo 
      ? (userDojo._id || userDojo.id) 
      : (defaultDojoId || (initialDojos[0]?.id || initialDojos[0]?._id))
  );

  const [students, setStudents] = useState(initialStudents);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rankFilter, setRankFilter] = useState('all');
  const [promotionFilter, setPromotionFilter] = useState('all');
  const [sortField, setSortField] = useState('index'); // 'index' | 'name' | 'rank' | 'birthDate' | 'status'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Modal Crear / Editar Estudiante
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    birthDate: '',
    currentRank: '10° Kyu (Cinta Blanca)',
    notes: '',
    photo: '',
    positiveAspects: '',
    hasSpecialCondition: false,
    specialCondition: ''
  });

  // Modal Alerta y Confirmación
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', isError: false });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [togglingPromotionId, setTogglingPromotionId] = useState(null);

  const selectedDojo = isSensei && userDojo
    ? userDojo
    : initialDojos.find(d => (d._id || d.id) === selectedDojoId) || initialDojos[0];

  // Cargar estudiantes al cambiar el dojo
  useEffect(() => {
    if (!selectedDojoId) return;

    async function loadStudents() {
      setIsLoadingStudents(true);
      try {
        const data = await getStudentsByDojo(selectedDojoId);
        setStudents(data || []);
      } catch (err) {
        console.error('Error cargando estudiantes:', err);
      } finally {
        setIsLoadingStudents(false);
      }
    }

    loadStudents();
  }, [selectedDojoId]);

  const showAlert = (message, title = 'Atención', isError = false) => {
    setAlertModal({ isOpen: true, title, message, isError });
  };

  const showConfirm = ({ title, message, onConfirm }) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  // Abrir Modal Crear
  const handleOpenCreateStudent = () => {
    setEditingStudent(null);
    setStudentFormData({
      name: '',
      birthDate: '',
      currentRank: '10° Kyu (Cinta Blanca)',
      notes: '',
      photo: '',
      positiveAspects: '',
      hasSpecialCondition: false,
      specialCondition: ''
    });
    setIsStudentModalOpen(true);
  };

  // Abrir Modal Editar
  const handleOpenEditStudent = (student) => {
    setEditingStudent(student);
    setStudentFormData({
      name: student.name || '',
      birthDate: formatDate(student.birthDate),
      currentRank: student.currentRank || '10° Kyu (Cinta Blanca)',
      notes: student.notes || '',
      photo: student.photo || '',
      positiveAspects: student.positiveAspects || '',
      hasSpecialCondition: Boolean(student.hasSpecialCondition),
      specialCondition: student.specialCondition || ''
    });
    setIsStudentModalOpen(true);
  };

  // Guardar Estudiante
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!studentFormData.name.trim()) {
      showAlert('El nombre del estudiante es obligatorio.', 'Campo Requerido', true);
      return;
    }
    const cleanBirth = (studentFormData.birthDate || '').trim();
    if (cleanBirth && cleanBirth !== 'No registrada' && cleanBirth !== 'No indicada') {
      const parsed = parseCustomDate(cleanBirth);
      if (!parsed) {
        showAlert('Fecha de nacimiento no válida (use formato DD/MM/AAAA o deje vacío).', 'Campo Inválido', true);
        return;
      }
    }

    const finalPositiveAspects = (studentFormData.positiveAspects || '').trim();

    const isSpecial = Boolean(studentFormData.hasSpecialCondition);
    const finalSpecial = isSpecial
      ? (studentFormData.specialCondition.trim() || '• Condición especial')
      : '';

    const payload = {
      ...studentFormData,
      positiveAspects: finalPositiveAspects,
      hasSpecialCondition: isSpecial,
      specialCondition: finalSpecial
    };

    setIsSavingStudent(true);
    try {
      if (editingStudent) {
        const res = await updateStudent(editingStudent._id || editingStudent.id, payload);
        if (res.success) {
          setStudents(prev => prev.map(s => (s._id === res.student._id || s.id === res.student.id) ? res.student : s));
          setIsStudentModalOpen(false);
          showAlert(`Estudiante "${res.student.name}" actualizado con éxito.`, 'Actualizado');
        } else {
          showAlert(res.error || 'Error al actualizar el estudiante.', 'Error', true);
        }
      } else {
        const res = await createStudent({
          ...payload,
          dojoId: selectedDojoId
        });
        if (res.success) {
          setStudents(prev => [res.student, ...prev]);
          setIsStudentModalOpen(false);
          showAlert(`Estudiante "${res.student.name}" incorporado al padrón de ${selectedDojo?.name}.`, 'Registrado');
        } else {
          showAlert(res.error || 'Error al registrar el estudiante.', 'Error', true);
        }
      }
    } catch (err) {
      console.error(err);
      showAlert('Error en la comunicación con la base de datos.', 'Error', true);
    } finally {
      setIsSavingStudent(false);
    }
  };

  // Eliminar Estudiante
  const handleDeleteStudent = (student) => {
    showConfirm({
      title: '¿Eliminar Estudiante del Padrón?',
      message: `¿Estás seguro de que deseas eliminar a "${student.name}" del padrón de ${selectedDojo?.name}? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          const res = await deleteStudent(student._id || student.id);
          if (res.success) {
            setStudents(prev => prev.filter(s => (s._id || s.id) !== (student._id || student.id)));
            showAlert(`El estudiante "${student.name}" fue eliminado del padrón.`, 'Eliminado');
          } else {
            showAlert(res.error || 'Error al eliminar estudiante.', 'Error', true);
          }
        } catch (err) {
          console.error(err);
          showAlert('Error al procesar la eliminación.', 'Error', true);
        }
      }
    });
  };

  // Alternar promoción a examen
  const handleTogglePromotion = async (student) => {
    const studentId = student._id || student.id;
    setTogglingPromotionId(studentId);
    try {
      const nextState = !student.isPromotedForExam;
      const res = await toggleStudentExamPromotion(studentId, nextState);
      if (res.success) {
        setStudents(prev => prev.map(s => (s._id === studentId || s.id === studentId) ? { ...s, isPromotedForExam: res.isPromotedForExam } : s));
      } else {
        showAlert(res.error || 'Error al cambiar estado.', 'Error', true);
      }
    } catch (err) {
      console.error(err);
      showAlert('Error de conexión.', 'Error', true);
    } finally {
      setTogglingPromotionId(null);
    }
  };

  // Carga de foto
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert('La foto supera el límite de 2MB.', 'Archivo muy pesado', true);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentFormData(prev => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtrado de estudiantes
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRank = rankFilter === 'all' || s.currentRank === rankFilter;
    const matchesPromotion = promotionFilter === 'all' 
      ? true 
      : promotionFilter === 'promoted' 
      ? Boolean(s.isPromotedForExam) 
      : !s.isPromotedForExam;
    return matchesSearch && matchesRank && matchesPromotion;
  });

  const promotedCount = students.filter(s => s.isPromotedForExam).length;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedStudents = useMemo(() => {
    const list = filteredStudents.map((s, idx) => ({ ...s, originalIndex: idx + 1 }));
    if (sortField === 'index') {
      return sortDirection === 'desc' ? list.reverse() : list;
    }

    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      } else if (sortField === 'rank') {
        comparison = getRankWeight(b.currentRank) - getRankWeight(a.currentRank);
      } else if (sortField === 'birthDate') {
        const timeA = a.birthDate ? new Date(a.birthDate).getTime() : 0;
        const timeB = b.birthDate ? new Date(b.birthDate).getTime() : 0;
        comparison = timeA - timeB;
      } else if (sortField === 'status') {
        const statA = a.isPromotedForExam ? 1 : 0;
        const statB = b.isPromotedForExam ? 1 : 0;
        comparison = statB - statA;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [filteredStudents, sortField, sortDirection]);

  return (
    <div className="space-y-6">
      {/* Header Minimalista */}
      <div className="border-b border-gray-200/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2D2E83] tracking-tight">
            Lista Estudiantes
          </h1>
          {!isSensei ? (
            <div className="flex items-center gap-2 mt-1">
              <label htmlFor="selectDojoAdmin" className="text-xs font-bold text-gray-500">
                Dojo:
              </label>
              <select
                id="selectDojoAdmin"
                value={selectedDojoId}
                onChange={(e) => setSelectedDojoId(e.target.value)}
                className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-[#2D2E83] shadow-2xs focus:border-[#2D2E83] outline-hidden cursor-pointer"
              >
                {initialDojos.map((d) => (
                  <option key={d._id || d.id} value={d._id || d.id}>
                    {d.name} {d.studentCount ? `(${d.studentCount})` : ''}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500 font-medium">
                • {students.length} karatecas
              </span>
            </div>
          ) : (
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {selectedDojo?.name ? `${selectedDojo.name} • ${students.length} karatecas` : 'Padrón oficial'}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleOpenCreateStudent}
          className="px-4 py-2.5 bg-gradient-to-r from-[#2D2E83] to-[#be1322] hover:from-[#232468] hover:to-[#9c0f1b] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-[#2D2E83]/20 flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 self-end sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Inscribir</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/90 border border-gray-200/80 rounded-2xl p-3.5 shadow-xs relative z-10">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre de alumno..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 focus:border-[#2D2E83] focus:bg-white rounded-xl text-xs md:text-sm font-medium text-gray-900 transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {/* Filtro Rápido: Todos vs Para Examen */}
          <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setPromotionFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                promotionFilter === 'all'
                  ? 'bg-white text-[#2D2E83] shadow-xs font-black'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todos ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setPromotionFilter('promoted')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                promotionFilter === 'promoted'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Para Examen ({promotedCount})
            </button>
          </div>

          {/* Selector de Kyu */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Filter className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-gray-50 border border-gray-200 focus:border-[#2D2E83] rounded-xl text-xs font-bold text-gray-800 transition-all cursor-pointer"
            >
              <option value="all">Todos los Kyu</option>
              {KYU_OPTIONS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla Oficial de Estudiantes */}
      <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden">
        {isLoadingStudents ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#2D2E83]" />
            <p className="text-xs md:text-sm font-bold">Cargando padrón oficial de estudiantes...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 md:p-16 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-gray-900">No hay karatecas registrados</h3>
              <p className="text-xs text-gray-500">
                {searchQuery || rankFilter !== 'all' || promotionFilter !== 'all'
                  ? 'No se encontraron alumnos con los filtros seleccionados.'
                  : `Comienza inscribiendo a los practicantes de ${selectedDojo?.name} para mantener el padrón al día.`}
              </p>
            </div>
            {!searchQuery && rankFilter === 'all' && (
              <button
                type="button"
                onClick={handleOpenCreateStudent}
                className="px-5 py-2.5 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                + Inscribir Primer Karateca
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] uppercase tracking-wider font-mono text-gray-600 select-none">
                  <th 
                    onClick={() => handleSort('index')}
                    className="py-3.5 px-3 md:px-4 font-bold text-center w-14 cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    title="Ordenar por número consecutivo"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>#</span>
                      {sortField === 'index' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2D2E83]" /> : <ArrowDown className="w-3 h-3 text-[#2D2E83]" />
                      ) : (
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="py-3.5 px-4 md:px-6 font-bold cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    title="Ordenar por nombre"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Karateca</span>
                      {sortField === 'name' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#2D2E83]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#2D2E83]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('rank')}
                    className="py-3.5 px-4 md:px-6 font-bold cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    title="Ordenar por cinturón / kyu"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Rango Actual (Kyu)</span>
                      {sortField === 'rank' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#2D2E83]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#2D2E83]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('birthDate')}
                    className="py-3.5 px-4 md:px-6 font-bold cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    title="Ordenar por fecha de nacimiento / edad"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Fecha Nacimiento & Edad</span>
                      {sortField === 'birthDate' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#2D2E83]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#2D2E83]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="py-3.5 px-4 md:px-6 font-bold text-center cursor-pointer hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    title="Ordenar por estado para examen"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Estado para Examen</span>
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#2D2E83]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#2D2E83]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 md:px-6 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedStudents.map((student) => {
                  const badge = getKyuBadge(student.currentRank);
                  const age = calculateAge(student.birthDate);
                  const birthFormatted = formatDate(student.birthDate);

                  return (
                    <tr 
                      key={student._id || student.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* Numeral Consecutivo */}
                      <td className="py-4 px-3 md:px-4 text-center font-mono text-xs font-bold text-gray-400 select-none">
                        {student.originalIndex}
                      </td>

                      {/* Karateca */}
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex items-center gap-3">
                          {student.photo ? (
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#2D2E83]/20 bg-white shrink-0 shadow-2xs">
                              <img 
                                src={student.photo} 
                                alt={student.name} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-[#2D2E83]/10 text-[#2D2E83] font-black text-xs flex items-center justify-center shrink-0 border border-[#2D2E83]/20 shadow-2xs">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-gray-900 leading-tight">
                                {student.name}
                              </span>
                              {student.hasSpecialCondition && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300" title={student.specialCondition}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                  Condición Especial
                                </span>
                              )}
                            </div>
                            {student.hasSpecialCondition && (
                              <div className="text-[11px] text-amber-900 font-medium mt-0.5 line-clamp-1">
                                <span className="font-bold text-amber-800">Condición:</span> {student.specialCondition || 'En observación'}
                              </div>
                            )}
                            {student.positiveAspects && (
                              <div className="mt-1 space-y-0.5" title={student.positiveAspects}>
                                {student.positiveAspects.split('\n').filter(Boolean).map((line, i) => (
                                  <div key={i} className="flex items-start gap-1 text-[11px] text-emerald-800 font-medium">
                                    <span className="text-emerald-600 font-black shrink-0 leading-none mt-0.5">•</span>
                                    <span className="line-clamp-1">{line.replace(/^[\s•\-*]+/, '')}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {student.notes && (
                              <span className="text-[11px] text-gray-500 line-clamp-1 italic mt-0.5 block">
                                {student.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Rango */}
                      <td className="py-4 px-4 md:px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                          {student.currentRank}
                        </span>
                      </td>

                      {/* Nacimiento y Edad */}
                      <td className="py-4 px-4 md:px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-mono font-bold text-xs sm:text-sm">
                            {birthFormatted}
                          </span>
                          {age !== null && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-blue-50 text-[#2D2E83] border border-blue-200">
                              {age} años
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado para Examen */}
                      <td className="py-4 px-4 md:px-6 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePromotion(student)}
                          disabled={togglingPromotionId === (student._id || student.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-2xs border cursor-pointer active:scale-95 disabled:opacity-50 ${
                            student.isPromotedForExam
                              ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-emerald-600/20'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                          }`}
                          title={student.isPromotedForExam ? "Quitar postulación para examen" : "Postular como listo para examen"}
                        >
                          {togglingPromotionId === (student._id || student.id) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                          ) : student.isPromotedForExam ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400" />
                          )}
                          <span>{student.isPromotedForExam ? 'Listo para Examen' : 'En Preparación'}</span>
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-4 md:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditStudent(student)}
                            className="p-2 rounded-xl text-gray-600 hover:text-[#2D2E83] hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                            title="Editar estudiante"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student)}
                            className="p-2 rounded-xl text-gray-400 hover:text-[#BE1622] hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                            title="Eliminar estudiante"
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
        )}
      </div>

      {/* MODAL CREAR / EDITAR ESTUDIANTE */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#BE1622] block font-mono">
                  {selectedDojo?.name}
                </span>
                <h3 className="text-lg font-black text-[#2D2E83]">
                  {editingStudent ? 'Editar Datos del Karateca' : 'Inscribir Nuevo Karateca'}
                </h3>
              </div>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={studentFormData.name}
                  onChange={(e) => setStudentFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: David Artavia Rodríguez"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs md:text-sm font-semibold text-gray-900 focus:bg-white focus:border-[#2D2E83] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Fecha de Nacimiento (Opcional)
                  </label>
                  <input
                    type="text"
                    value={studentFormData.birthDate}
                    onChange={(e) => setStudentFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                    placeholder="DD/MM/AAAA"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs md:text-sm font-mono font-bold text-gray-900 focus:bg-white focus:border-[#2D2E83] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Rango / Grado Kyu
                  </label>
                  <select
                    value={studentFormData.currentRank}
                    onChange={(e) => setStudentFormData(prev => ({ ...prev, currentRank: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-[#2D2E83] focus:outline-none cursor-pointer"
                  >
                    {KYU_OPTIONS.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Foto de Perfil (Opcional)
                </label>
                <div className="flex items-center gap-4">
                  {studentFormData.photo ? (
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-200 shrink-0">
                      <img src={studentFormData.photo} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#2D2E83] hover:file:bg-blue-100 cursor-pointer"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">JPG o PNG, máx. 2MB.</p>
                  </div>
                </div>
              </div>

              {/* Aspectos Positivos Desglosados en Viñetas */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Aspectos Positivos</span>
                  <span className="text-[10px] text-gray-400 font-normal lowercase tracking-normal">
                    (Escribe o presiona enter para viñeta automática)
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={studentFormData.positiveAspects}
                  onChange={(e) => handleBulletInputChange(e, studentFormData.positiveAspects, (val) => setStudentFormData(prev => ({ ...prev, positiveAspects: val })))}
                  onKeyDown={(e) => handleBulletKeyDown(e, studentFormData.positiveAspects, (val) => setStudentFormData(prev => ({ ...prev, positiveAspects: val })))}
                  placeholder="• Técnica de guardia sólida&#10;• Gran espíritu en kihon..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-[#2D2E83] outline-hidden placeholder:text-gray-400 transition-colors"
                />
              </div>

              {/* Toggle Condición Especial */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label htmlFor="toggleSpecial" className="text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer">
                    ¿Tiene Condición Especial?
                  </label>
                  <button
                    type="button"
                    id="toggleSpecial"
                    role="switch"
                    aria-checked={studentFormData.hasSpecialCondition}
                    onClick={() => setStudentFormData(prev => ({ 
                      ...prev, 
                      hasSpecialCondition: !prev.hasSpecialCondition,
                      specialCondition: !prev.hasSpecialCondition ? (prev.specialCondition || '') : ''
                    }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      studentFormData.hasSpecialCondition ? 'bg-amber-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        studentFormData.hasSpecialCondition ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {studentFormData.hasSpecialCondition && (
                  <div className="animate-in fade-in duration-150">
                    <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Detalle de Condición Especial</span>
                      <span className="text-[10px] text-amber-700/70 font-normal lowercase tracking-normal">
                        (viñetas automáticas al escribir y dar enter)
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      value={studentFormData.specialCondition}
                      onChange={(e) => handleBulletInputChange(e, studentFormData.specialCondition, (val) => setStudentFormData(prev => ({ ...prev, specialCondition: val })))}
                      onKeyDown={(e) => handleBulletKeyDown(e, studentFormData.specialCondition, (val) => setStudentFormData(prev => ({ ...prev, specialCondition: val })))}
                      placeholder="• Condición física o requerimiento de adaptación..."
                      className="w-full px-4 py-2 bg-amber-50/50 border border-amber-300 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-[#2D2E83] outline-hidden placeholder:text-amber-800/40"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingStudent}
                  className="px-6 py-2.5 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingStudent ? 'Guardar Cambios' : 'Inscribir en Padrón'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />

      {/* MODAL ALERTA */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        isError={alertModal.isError}
        onClose={() => setAlertModal({ isOpen: false, title: '', message: '', isError: false })}
      />
    </div>
  );
}
