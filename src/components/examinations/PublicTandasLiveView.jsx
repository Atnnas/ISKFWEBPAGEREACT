"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Clock4,
  FileSpreadsheet,
  FileText,
  Share2,
  Check,
  Search,
  Radio,
  ExternalLink
} from 'lucide-react';
import { formatDateDDMMAAAA } from '../../lib/utils/dateFormatter';
import { getBeltBadge } from '../../lib/utils/evaluatorHelpers';
import { getNextRank } from '../../lib/constants/kyuRanks';
import { generateTandasSchedulePDF } from '../../lib/pdf/tandasSchedulePdfGenerator';
import { downloadTandasScheduleXLS } from '../../lib/excel/tandasScheduleExcelGenerator';
import { getTandasLiveUpdateByToken } from '../../lib/actions/technicalExams';

export default function PublicTandasLiveView({
  initialCall,
  initialStudents = [],
  initialDay = null
}) {
  // Estado reactivo para reflejar cambios en tiempo real
  const [call, setCall] = useState(initialCall);
  const [students, setStudents] = useState(initialStudents);

  // Filtro de día (inicializado con initialDay si viene en URL o por defecto Día 1 en multidia)
  const [dayFilter, setDayFilter] = useState(() => {
    if (initialDay !== null && initialDay !== undefined) {
      return initialDay;
    }
    return initialCall?.isMultiDay ? 1 : 'all';
  });

  const [lastUpdatedAt, setLastUpdatedAt] = useState(initialCall?.updatedAt || null);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingXLS, setIsExportingXLS] = useState(false);

  // Polling reactivo en tiempo real (cada 4.5 segundos)
  useEffect(() => {
    if (!call?.accessToken) return;

    let isMounted = true;

    const syncLiveTandas = async () => {
      // Si la pestaña está oculta, evitar consumo de recursos
      if (typeof document !== 'undefined' && document.hidden) return;

      try {
        setIsLiveSyncing(true);
        const res = await getTandasLiveUpdateByToken(call.accessToken, lastUpdatedAt);
        if (!isMounted) return;

        if (res?.success) {
          if (!res.unchanged && res.call) {
            setCall(res.call);
            if (Array.isArray(res.students)) {
              setStudents(res.students);
            }
            if (res.updatedAt) {
              setLastUpdatedAt(res.updatedAt);
            }
          }
        }
      } catch (err) {
        console.debug('Error en sincronización en vivo de tandas:', err);
      } finally {
        if (isMounted) {
          setIsLiveSyncing(false);
        }
      }
    };

    const intervalId = setInterval(syncLiveTandas, 4500);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [call?.accessToken, lastUpdatedAt]);

  // Sincronizar cambio de día en la URL del navegador sin recargar
  const handleDayChange = (newDay) => {
    setDayFilter(newDay);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newDay === 'all') {
        url.searchParams.delete('dia');
      } else {
        url.searchParams.set('dia', String(newDay));
      }
      window.history.replaceState(null, '', url.toString());
    }
  };

  // Copiar link específico por día
  const handleCopyLink = (targetDay = null) => {
    if (typeof window === 'undefined') return;
    const activeDay = targetDay !== null ? targetDay : dayFilter;
    const url = new URL(window.location.origin + window.location.pathname);
    if (call?.isMultiDay && activeDay !== 'all') {
      url.searchParams.set('dia', String(activeDay));
    }
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  // Reloj en vivo de Tatami
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mapa de estudiantes indexado por ID
  const studentsMap = useMemo(() => {
    const map = {};
    students.forEach(st => {
      map[String(st._id || st.id)] = st;
    });
    return map;
  }, [students]);

  // Tandas y sus karatecas
  const tandas = useMemo(() => call?.schedules || [], [call?.schedules]);

  // Filtrado de tandas por día
  const filteredTandas = useMemo(() => {
    if (!call?.isMultiDay || dayFilter === 'all') return tandas;
    return tandas.filter(t => (Number(t.day) === 2 ? 2 : 1) === Number(dayFilter));
  }, [tandas, call?.isMultiDay, dayFilter]);

  // Karatecas asignados únicos
  const allAssignedStudentIds = useMemo(() => {
    return [...new Set(tandas.flatMap(t => (t.studentIds || []).map(String)))];
  }, [tandas]);

  const totalAssignedStudents = allAssignedStudentIds.length;

  // Exportar PDF
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await generateTandasSchedulePDF({
        call,
        tandas: filteredTandas,
        students,
        dayFilter
      });
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Ocurrió un error al generar el archivo PDF.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Exportar Excel
  const handleExportXLS = () => {
    setIsExportingXLS(true);
    try {
      downloadTandasScheduleXLS({
        call,
        tandas: filteredTandas,
        students,
        dayFilter
      });
    } catch (err) {
      console.error('Error al generar XLS:', err);
      alert('Ocurrió un error al exportar la tabla a Excel.');
    } finally {
      setIsExportingXLS(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-24 select-none">
      {/* 1. BARRA SUPERIOR DE MEMBRETE MARCIAL ISKF */}
      <div className="bg-slate-950 border-b border-slate-800/80 sticky top-0 z-40 shadow-xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#2D2E83]/20 flex items-center justify-center p-1 shadow-md shrink-0">
              <img
                src="/images/dojos/escudo.jpg"
                alt="Logo ISKF"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#BE1622] block font-mono">
                ISKF Costa Rica • Cronograma
              </span>
              <h1 className="text-sm sm:text-base font-black text-white truncate leading-tight">
                Horario de Tandas y Estudiantes
              </h1>
            </div>
          </div>

          {/* Reloj, Indicador En Vivo y Botones Rápidos de Compartir y Descargar */}
          <div className="flex items-center gap-2 flex-wrap sm:justify-end">
            {/* Indicador de Sincronización en Vivo */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold shadow-inner"
              title="Sincronización en vivo activada: cualquier cambio realizado en la mesa de examen se refleja automáticamente aquí."
            >
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${isLiveSyncing ? 'animate-ping' : ''}`}></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 text-[11px]">
                {isLiveSyncing ? 'Sincronizando...' : 'En vivo'}
              </span>
            </div>

            {/* Reloj digital de tatami */}
            {currentTime && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-amber-400 shadow-inner">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{currentTime}</span>
              </div>
            )}

            {/* Botón Copiar Link */}
            <button
              type="button"
              onClick={() => handleCopyLink()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
              title="Copiar enlace directo de esta lista para compartir"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
              <span>
                {copied ? '¡Copiado!' : (call?.isMultiDay && dayFilter !== 'all' ? `Compartir Día ${dayFilter}` : 'Compartir')}
              </span>
            </button>

            {/* Descargar PDF */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              title="Descargar lista de tandas y estudiantes en formato PDF"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">{isExportingPDF ? 'Generando...' : 'Descargar PDF'}</span>
            </button>

            {/* Descargar Excel XLS */}
            <button
              type="button"
              onClick={handleExportXLS}
              disabled={isExportingXLS}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              title="Descargar lista de tandas y estudiantes en formato Excel (.xls)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">{isExportingXLS ? 'Exportando...' : 'Descargar Excel'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 space-y-4">
        {/* 2. HERO CARD DE LA CONVOCATORIA */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm font-mono">
                  {call?.dojoName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Sensei: {call?.dojoSensei || 'Sensei del Dojo'}
                </span>
                {call?.isMultiDay && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    2 Días
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                {call?.title || 'Convocatoria Oficial de Examen Técnico ISKF'}
              </h2>

              <div className="flex items-center gap-4 text-xs text-slate-300 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>
                    {call?.isMultiDay && call?.examEndDate
                      ? `Día 1: ${formatDateDDMMAAAA(call.examDate)} • Día 2: ${formatDateDDMMAAAA(call.examEndDate)}`
                      : formatDateDDMMAAAA(call.examDate)}
                  </span>
                </span>

                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Inicio general: {call?.startTime || '09:00 AM'}</span>
                </span>
              </div>
            </div>

            {/* Resumen numérico rápido */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:justify-end">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center min-w-[110px] shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Total Tandas</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{tandas.length}</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center min-w-[120px] shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Total Estudiantes</span>
                <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">{totalAssignedStudents}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SELECTOR DE DÍAS (SI ES MULTIDÍA) Y BUSCADOR ÁGIL */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Selector de Días con Exclusión Mutua (Más grande y visible) */}
          {call?.isMultiDay ? (
            <div className="flex items-center gap-2 p-1.5 sm:p-2 bg-slate-950 rounded-2xl sm:rounded-3xl border-2 border-slate-800/90 shadow-xl flex-wrap">
              <button
                type="button"
                onClick={() => handleDayChange(1)}
                className={`px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all cursor-pointer flex items-center gap-2 sm:gap-3 text-xs sm:text-base font-black shadow-md ${
                  Number(dayFilter) === 1
                    ? 'bg-gradient-to-r from-blue-700 via-[#2D2E83] to-indigo-900 text-white border-2 border-blue-400 shadow-blue-900/50 scale-[1.02]'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span className="text-sm sm:text-lg">🥋</span>
                <span>Día 1: {formatDateDDMMAAAA(call.examDate)}</span>
                <span className={`text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                  Number(dayFilter) === 1 ? 'bg-white/25 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tandas.filter(t => (Number(t.day) === 2 ? 2 : 1) === 1).length} tandas
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDayChange(2)}
                className={`px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all cursor-pointer flex items-center gap-2 sm:gap-3 text-xs sm:text-base font-black shadow-md ${
                  Number(dayFilter) === 2
                    ? 'bg-gradient-to-r from-red-700 via-[#BE1622] to-rose-900 text-white border-2 border-red-400 shadow-red-900/50 scale-[1.02]'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span className="text-sm sm:text-lg">🥋</span>
                <span>Día 2: {formatDateDDMMAAAA(call.examEndDate)}</span>
                <span className={`text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                  Number(dayFilter) === 2 ? 'bg-white/25 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tandas.filter(t => (Number(t.day) === 2 ? 2 : 1) === 2).length} tandas
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDayChange('all')}
                className={`px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all cursor-pointer text-xs sm:text-base font-black shadow-md ${
                  dayFilter === 'all'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-2 border-amber-300 shadow-amber-400/30 scale-[1.02]'
                    : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>Ambos Días</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Cronograma Oficial de Estudiantes por Tanda</span>
            </div>
          )}

          {/* Buscador de Karatecas */}
          <div className="relative min-w-[240px] sm:min-w-[300px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar estudiante por nombre o grado..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-slate-400 hover:text-white absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 4. LISTA DE TANDAS CON HORA INICIO, HORA FINAL Y ESTUDIANTES */}
        {filteredTandas.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
            <Clock4 className="w-12 h-12 mx-auto text-amber-400/60" />
            <h4 className="text-base font-bold text-white">No hay tandas configuradas</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Aún no se han configurado tandas horarias para este examen.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTandas.map((tanda, tIdx) => {
              const tandaName = tanda.blockName || `Tanda ${tIdx + 1}`;
              const dayNum = Number(tanda.day) === 2 ? 2 : 1;
              const studentList = (tanda.studentIds || []).map(id => studentsMap[String(id)]).filter(Boolean);

              // Filtro de búsqueda dentro de la tanda
              const matchedStudents = studentList.filter(st => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                  (st.name || '').toLowerCase().includes(q) ||
                  (st.currentRank || '').toLowerCase().includes(q)
                );
              });

              if (searchQuery.trim() && matchedStudents.length === 0) {
                return null;
              }

              return (
                <div
                  key={tanda.id || tIdx}
                  className="bg-slate-950 border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl transition-all"
                >
                  {/* Encabezado de la Tanda: Nombre, Día, Hora Inicio y Hora Final (Fuentes Grandes) */}
                  <div className="bg-slate-900/90 border-b border-slate-800/80 p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3.5">
                      <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-base sm:text-xl shadow-md font-mono shrink-0">
                        {tIdx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                          <h4 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">{tandaName}</h4>
                          {call?.isMultiDay && (
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase font-mono border ${
                              dayNum === 2 ? 'bg-red-500/20 text-rose-300 border-rose-500/40' : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            }`}>
                              Día {dayNum}
                            </span>
                          )}
                          <span className="text-xs sm:text-sm px-3 py-1 rounded-lg bg-slate-800 text-slate-200 font-mono font-bold border border-slate-700">
                            {studentList.length} estudiantes
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Horario: Hora Inicio y Hora Final */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2.5 px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm font-mono font-bold shadow-inner">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-slate-400">Hora Inicio:</span>
                        <span className="text-white font-black text-sm sm:text-base">{tanda.startTime || 'Por definir'}</span>
                        <span className="text-slate-500 mx-1">•</span>
                        <span className="text-slate-400">Hora Final:</span>
                        <span className="text-amber-300 font-black text-sm sm:text-base">{tanda.endTime || 'Por definir'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Estudiantes de la Tanda (Fuentes Grandes y Legibles) */}
                  {studentList.length === 0 ? (
                    <div className="p-8 text-center text-sm sm:text-base text-slate-400 font-medium italic">
                      No hay estudiantes asignados a esta tanda.
                    </div>
                  ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[550px]">
                        <thead>
                          <tr className="bg-slate-900/60 border-b border-slate-800 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-400">
                            <th className="py-3.5 px-4 sm:px-5 w-14 text-center">#</th>
                            <th className="py-3.5 px-4 sm:px-5 min-w-[260px]">Estudiante</th>
                            <th className="py-3.5 px-4 sm:px-5 min-w-[200px]">Grado Actual</th>
                            <th className="py-3.5 px-4 sm:px-5 min-w-[180px]">Aspira a</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70 text-sm sm:text-base">
                          {studentList.map((st, sIdx) => {
                            const sId = String(st._id || st.id);
                            const studentAspirant = (call?.aspirants || []).find(a => String(a.studentId) === sId);
                            const currentRank = studentAspirant?.currentRank || st.currentRank || '10° Kyu (Cinta Blanca)';
                            const belt = getBeltBadge(currentRank);
                            const targetRank = (studentAspirant?.targetRank && studentAspirant.targetRank !== currentRank)
                              ? studentAspirant.targetRank
                              : (st.targetRank && st.targetRank !== currentRank)
                              ? st.targetRank
                              : (getNextRank(currentRank) || currentRank || 'Por definir');

                            return (
                              <tr
                                key={sId}
                                className="transition-colors hover:bg-slate-800/40"
                              >
                                <td className="py-3.5 sm:py-4 px-4 sm:px-5 text-center font-mono font-black text-slate-400 text-sm sm:text-base">
                                  {sIdx + 1}
                                </td>

                                <td className="py-3.5 sm:py-4 px-4 sm:px-5">
                                  <div className="flex items-center gap-3 sm:gap-3.5">
                                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs sm:text-sm text-slate-300 overflow-hidden shrink-0 shadow-xs">
                                      {st.photo ? (
                                        <img src={st.photo} alt={st.name} className="w-full h-full object-cover" />
                                      ) : (
                                        st.name ? st.name.substring(0, 2).toUpperCase() : 'E'
                                      )}
                                    </div>
                                    <span className="font-black text-white text-sm sm:text-base md:text-lg block tracking-tight">
                                      {st.name}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-3.5 sm:py-4 px-4 sm:px-5">
                                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border ${belt.bg}`}>
                                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${belt.dot}`} />
                                    <span>{belt.label}</span>
                                  </span>
                                </td>

                                <td className="py-3.5 sm:py-4 px-4 sm:px-5">
                                  <span className="text-sm sm:text-base text-amber-300 font-mono font-black">
                                    ➔ {targetRank}
                                  </span>
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

        {/* 5. PIE DE PÁGINA INFORMATIVO */}
        <div className="pt-6 pb-12 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-1">
          <p className="font-bold text-slate-400">
            ISKF Costa Rica • International Shotokan Karate Federation
          </p>
          <p>
            Los horarios asignados a cada tanda corresponden a la hora estimada de inicio y finalización en el tatami.
          </p>
        </div>
      </div>
    </div>
  );
}
