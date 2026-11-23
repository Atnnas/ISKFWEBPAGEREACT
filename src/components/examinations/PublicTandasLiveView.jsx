"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Clock4,
  FileSpreadsheet,
  FileText,
  Share2,
  Check,
  Search,
  RefreshCw
} from 'lucide-react';
import { formatDateDDMMAAAA, calculateAge } from '../../lib/utils/dateFormatter';
import { getBeltBadge } from '../../lib/utils/evaluatorHelpers';
import { getNextRank } from '../../lib/constants/kyuRanks';
import { toggleStudentPaymentForCall, updateTandaStatusByToken } from '../../lib/actions/technicalExams';
import { generateTandasSchedulePDF } from '../../lib/pdf/tandasSchedulePdfGenerator';
import { downloadTandasScheduleXLS } from '../../lib/excel/tandasScheduleExcelGenerator';

export default function PublicTandasLiveView({ initialCall, initialStudents = [], initialCostConfig = null }) {
  const call = initialCall;
  const students = initialStudents;
  const costConfig = initialCostConfig;

  // Set de IDs pagados para reactividad instantánea
  const [paidIds, setPaidIds] = useState(() => new Set((initialCall?.paidStudentIds || []).map(String)));
  const [tandaStatuses, setTandaStatuses] = useState(() => {
    const map = {};
    (initialCall?.schedules || []).forEach((sc, idx) => {
      map[idx] = sc.status || 'pendiente';
    });
    return map;
  });

  // Filtros
  const [dayFilter, setDayFilter] = useState(call?.isMultiDay ? 1 : 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingXLS, setIsExportingXLS] = useState(false);
  const [updatingStudentId, setUpdatingStudentId] = useState(null);

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

  // Aranceles
  const sCost = Number(costConfig?.senseiDojo) || 0;
  const dCost = Number(costConfig?.directorGeneral) || 0;
  const iCost = Number(costConfig?.iskfCr) || 0;
  const unitCost = Number(costConfig?.total) || (sCost + dCost + iCost) || 30000;

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

  // Estadísticas financieras en vivo
  const totalAssignedStudents = allAssignedStudentIds.length;
  const paidCount = useMemo(() => {
    return allAssignedStudentIds.filter(id => paidIds.has(id)).length;
  }, [allAssignedStudentIds, paidIds]);

  const pendingCount = Math.max(0, totalAssignedStudents - paidCount);
  const totalCollected = paidCount * unitCost;
  const totalExpected = totalAssignedStudents * unitCost;
  const percentCollected = totalAssignedStudents > 0 ? Math.round((paidCount / totalAssignedStudents) * 100) : 0;

  // Manejar cambio en el check de pago
  const handleTogglePayment = async (studentId) => {
    const sId = String(studentId);
    const currentlyPaid = paidIds.has(sId);
    const newPaidStatus = !currentlyPaid;

    // Actualización optimista instantánea
    setPaidIds(prev => {
      const next = new Set(prev);
      if (newPaidStatus) next.add(sId);
      else next.delete(sId);
      return next;
    });

    setUpdatingStudentId(sId);
    try {
      const res = await toggleStudentPaymentForCall({
        token: call.accessToken,
        studentId: sId,
        hasPaid: newPaidStatus
      });

      if (!res.success) {
        // Revertir en caso de error
        setPaidIds(prev => {
          const next = new Set(prev);
          if (currentlyPaid) next.add(sId);
          else next.delete(sId);
          return next;
        });
        alert(res.error || 'No fue posible registrar el pago.');
      }
    } catch (err) {
      console.error(err);
      setPaidIds(prev => {
        const next = new Set(prev);
        if (currentlyPaid) next.add(sId);
        else next.delete(sId);
        return next;
      });
      alert('Error de conexión al guardar el pago.');
    } finally {
      setUpdatingStudentId(null);
    }
  };

  // Manejar cambio de estado de tanda (Pendiente, En Tatami, Evaluada)
  const handleChangeTandaStatus = async (tIdx, newStatus) => {
    setTandaStatuses(prev => ({ ...prev, [tIdx]: newStatus }));
    try {
      await updateTandaStatusByToken({
        token: call.accessToken,
        tandaIndex: tIdx,
        status: newStatus
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Copiar link
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Exportar PDF
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await generateTandasSchedulePDF({
        call,
        tandas: filteredTandas,
        students,
        paidStudentIds: Array.from(paidIds),
        costConfig
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
        paidStudentIds: Array.from(paidIds),
        costConfig
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
                ISKF Costa Rica • Panel Público
              </span>
              <h1 className="text-sm sm:text-base font-black text-white truncate leading-tight">
                Cronograma de Tandas y Horarios
              </h1>
            </div>
          </div>

          {/* Reloj y Botones Rápidos de Compartir y Descargar */}
          <div className="flex items-center gap-2 flex-wrap sm:justify-end">
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
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
              title="Copiar enlace de esta página para compartir con terceros"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copied ? '¡Copiado!' : 'Compartir'}</span>
            </button>

            {/* Descargar PDF */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              title="Descargar cronograma oficial en PDF para imprimir o enviar"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">{isExportingPDF ? 'Generando...' : 'Bajar PDF'}</span>
            </button>

            {/* Descargar Excel XLS */}
            <button
              type="button"
              onClick={handleExportXLS}
              disabled={isExportingXLS}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              title="Descargar tabla completa con aranceles y pagos en formato Excel (.xls)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">{isExportingXLS ? 'Exportando...' : 'Bajar XLS'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 space-y-4">
        {/* 2. HERO CARD DE LA CONVOCATORIA */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm font-mono">
                  {call?.dojoName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Sensei a cargo: {call?.dojoSensei || 'Sensei del Dojo'}
                </span>
                {call?.isMultiDay && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Convocatoria 2 Días
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
                  <span>Inicio: {call?.startTime || '09:00 AM'}</span>
                </span>

                {call?.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    <span>{call.location}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Resumen numérico rápido */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:justify-end">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center min-w-[100px] shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Tandas</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{tandas.length}</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center min-w-[100px] shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Karatecas</span>
                <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">{totalAssignedStudents}</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center min-w-[120px] shadow-sm">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Al Día (Pagaron)</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  {paidCount} <span className="text-xs text-slate-400 font-normal">/ {totalAssignedStudents}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. PANEL DE CONTROL DE RECAUDACIÓN EN VIVO (ARANCELES DE EXAMEN) */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                  ₡
                </div>
                <h3 className="text-sm font-black text-white tracking-tight">
                  Control Financiero de Aranceles Recaudados
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  En Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Marca a cada karateca con el botón de check conforme efectúa su pago para llevar el control en tiempo real.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Total Recaudado</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  ₡{totalCollected.toLocaleString('es-CR')}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-800 hidden sm:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Monto Total Esperado</span>
                <span className="text-sm sm:text-base font-bold text-slate-300 font-mono">
                  ₡{totalExpected.toLocaleString('es-CR')}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-800 hidden sm:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Arancel por Alumno</span>
                <span className="text-sm sm:text-base font-bold text-amber-300 font-mono">
                  ₡{unitCost.toLocaleString('es-CR')}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Progreso de Recaudación */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>{paidCount} de {totalAssignedStudents} karatecas con pago registrado ({pendingCount} pendientes)</span>
              <span className="text-emerald-400 font-bold">{percentCollected}% Recaudado</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${percentCollected}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4. SELECTOR DE DÍAS (SI ES MULTIDÍA) Y BUSCADOR ÁGIL */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Selector de Días con Exclusión Mutua */}
          {call?.isMultiDay ? (
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setDayFilter(1)}
                className={`px-3 sm:px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  Number(dayFilter) === 1
                    ? 'bg-[#2D2E83] text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🥋 Día 1: {formatDateDDMMAAAA(call.examDate)}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
                  {tandas.filter(t => (Number(t.day) === 2 ? 2 : 1) === 1).length} tandas
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDayFilter(2)}
                className={`px-3 sm:px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  Number(dayFilter) === 2
                    ? 'bg-[#BE1622] text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🥋 Día 2: {formatDateDDMMAAAA(call.examEndDate)}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
                  {tandas.filter(t => (Number(t.day) === 2 ? 2 : 1) === 2).length} tandas
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDayFilter('all')}
                className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  dayFilter === 'all'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>Ambos Días</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Cronograma Oficial por Tandas</span>
            </div>
          )}

          {/* Buscador de Karatecas */}
          <div className="relative min-w-[240px] sm:min-w-[300px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar karateca para ver su tanda y hora..."
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

        {/* 5. LISTA DE TANDAS Y CRONOGRAMA EN VIVO */}
        {filteredTandas.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
            <Clock4 className="w-12 h-12 mx-auto text-amber-400/60" />
            <h4 className="text-base font-bold text-white">No hay tandas configuradas para este día</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              El Sensei o Administrador aún no ha repartido los atletas en tandas horarias para esta fecha.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTandas.map((tanda, tIdx) => {
              const tandaName = tanda.blockName || `Tanda ${tIdx + 1}`;
              const timeLabel = tanda.startTime ? `${tanda.startTime}${tanda.endTime ? ` - ${tanda.endTime}` : ''}` : 'Horario por definir';
              const dayNum = Number(tanda.day) === 2 ? 2 : 1;
              const studentList = (tanda.studentIds || []).map(id => studentsMap[String(id)]).filter(Boolean);
              const currentStatus = tandaStatuses[tIdx] || tanda.status || 'pendiente';

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
                  className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all"
                >
                  {/* Encabezado de la Tanda */}
                  <div className="bg-slate-900/90 border-b border-slate-800/80 p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-sm font-mono shrink-0">
                        🥋 {tIdx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-white">{tandaName}</h4>
                          {call?.isMultiDay && (
                            <span className={`px-2 py-0.2 rounded-md text-[10px] font-black uppercase font-mono border ${
                              dayNum === 2 ? 'bg-red-500/15 text-rose-300 border-rose-500/30' : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            }`}>
                              Día {dayNum}
                            </span>
                          )}
                          <span className="text-[11px] px-2 py-0.2 rounded-md bg-slate-800 text-slate-300 font-mono font-bold">
                            {studentList.length} karatecas
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Horario y Estado del Tatami */}
                    <div className="flex items-center gap-3 flex-wrap md:justify-end">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono font-bold text-amber-300">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Hora: {timeLabel}</span>
                      </div>

                      {/* Selector de Estado de la Tanda */}
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => handleChangeTandaStatus(tIdx, 'pendiente')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'pendiente'
                              ? 'bg-slate-700 text-white font-black'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Pendiente
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeTandaStatus(tIdx, 'en_tatami')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            currentStatus === 'en_tatami'
                              ? 'bg-amber-400 text-slate-950 font-black shadow-xs ring-1 ring-amber-300'
                              : 'text-slate-400 hover:text-amber-300'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          <span>En Tatami</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeTandaStatus(tIdx, 'evaluada')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            currentStatus === 'evaluada'
                              ? 'bg-emerald-500 text-white font-black shadow-xs'
                              : 'text-slate-400 hover:text-emerald-300'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>Evaluada</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Karatecas de la Tanda */}
                  {studentList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 font-medium italic">
                      No hay karatecas asignados a esta tanda todavía.
                    </div>
                  ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[680px]">
                        <thead>
                          <tr className="bg-slate-900/40 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <th className="py-2 px-3 w-10 text-center">#</th>
                            <th className="py-2 px-3 min-w-[200px]">Karateca</th>
                            <th className="py-2 px-2.5 min-w-[130px]">Cinturón Actual</th>
                            <th className="py-2 px-2.5 min-w-[130px]">Aspira a</th>
                            <th className="py-2 px-2 text-center w-24">Hora Turno</th>
                            <th className="py-2 px-2.5 text-right w-28">Arancel</th>
                            <th className="py-2 px-3 text-center w-36">Estado de Pago</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-xs">
                          {studentList.map((st, sIdx) => {
                            const sId = String(st._id || st.id);
                            const isPaid = paidIds.has(sId);
                            const studentAspirant = (call?.aspirants || []).find(a => String(a.studentId) === sId);
                            const currentRank = studentAspirant?.currentRank || st.currentRank || '10° Kyu (Cinta Blanca)';
                            const belt = getBeltBadge(currentRank);
                            const targetRank = (studentAspirant?.targetRank && studentAspirant.targetRank !== currentRank)
                              ? studentAspirant.targetRank
                              : (st.targetRank && st.targetRank !== currentRank)
                              ? st.targetRank
                              : (getNextRank(currentRank) || currentRank || 'Por definir');
                            const isUpdating = updatingStudentId === sId;

                            return (
                              <tr
                                key={sId}
                                className={`transition-colors hover:bg-slate-800/30 ${
                                  isPaid ? 'bg-emerald-950/10' : ''
                                }`}
                              >
                                <td className="py-2 px-3 text-center font-mono font-bold text-slate-400">
                                  {sIdx + 1}
                                </td>

                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-slate-300 overflow-hidden shrink-0">
                                      {st.photo ? (
                                        <img src={st.photo} alt={st.name} className="w-full h-full object-cover" />
                                      ) : (
                                        st.name ? st.name.substring(0, 2).toUpperCase() : 'K'
                                      )}
                                    </div>
                                    <div className="leading-snug min-w-0">
                                      <span className="font-bold text-white block truncate">
                                        {st.name}
                                      </span>
                                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 font-mono">
                                        {st.birthDate && calculateAge(st.birthDate) !== null && (
                                          <span>{calculateAge(st.birthDate)} años</span>
                                        )}
                                        {st.hasSpecialCondition && (
                                          <span className="text-amber-400 font-sans font-bold" title={st.specialCondition}>
                                            • Especial
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-2 px-2.5">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${belt.bg}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${belt.dot}`} />
                                    <span>{belt.label}</span>
                                  </span>
                                </td>

                                <td className="py-2 px-2.5">
                                  <span className="text-xs text-amber-300 font-mono font-bold">
                                    ➔ {targetRank}
                                  </span>
                                </td>

                                <td className="py-2 px-2 text-center font-mono font-bold text-slate-300 text-[11px]">
                                  {timeLabel}
                                </td>

                                <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-200">
                                  ₡{unitCost.toLocaleString('es-CR')}
                                </td>

                                <td className="py-2 px-3 text-center">
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleTogglePayment(sId)}
                                    className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 ${
                                      isPaid
                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black shadow-emerald-500/20'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600'
                                    }`}
                                    title={isPaid ? 'Clic para marcar como pendiente de pago' : 'Clic para marcar como pagado'}
                                  >
                                    {isUpdating ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : isPaid ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                                        <span>Pagado</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="w-2.5 h-2.5 rounded-full border border-slate-400" />
                                        <span>Pendiente</span>
                                      </>
                                    )}
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

        {/* 6. PIE DE PÁGINA INFORMATIVO */}
        <div className="pt-6 pb-12 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-1">
          <p className="font-bold text-slate-400">
            ISKF Costa Rica • International Shotokan Karate Federation
          </p>
          <p>
            Los horarios asignados a cada tanda son estimados y sujetos al avance técnico en el tatami.
          </p>
        </div>
      </div>
    </div>
  );
}
