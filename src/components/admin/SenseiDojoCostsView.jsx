'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Edit3, 
  Award, 
  Calculator, 
  ShieldCheck, 
  HelpCircle,
  Building2,
  Users
} from 'lucide-react';
import { saveSenseiDojoExamCost } from '../../lib/actions/examCosts';

export default function SenseiDojoCostsView({ initialConfig, dojo, currentUser, allDojos = [] }) {
  const [selectedDojoId, setSelectedDojoId] = useState(() => dojo?._id || dojo?.id || '');
  const [senseiDojo, setSenseiDojo] = useState(() => Number(initialConfig?.senseiDojo) || 15000);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [simulationCount, setSimulationCount] = useState(10);

  const isAdmin = currentUser?.role === 'admin';
  const currencySymbol = initialConfig?.currencySymbol || '₡';

  // Rubros oficiales de la ISKF (estrictamente solo lectura para el sensei)
  const iskfDg = useMemo(() => Number(initialConfig?.directorGeneral) || 10000, [initialConfig?.directorGeneral]);
  const iskfCr = useMemo(() => Number(initialConfig?.iskfCr) || 5000, [initialConfig?.iskfCr]);
  const iskfTotal = useMemo(() => iskfDg + iskfCr, [iskfDg, iskfCr]);

  // Sumatoria en vivo: Sensei Dojo + Sumatoria ISKF
  const examTotal = useMemo(() => {
    const s = Math.max(0, Number(senseiDojo) || 0);
    return s + iskfTotal;
  }, [senseiDojo, iskfTotal]);

  // Formato monetario
  const formatMoney = useCallback((amount) => {
    const num = Number(amount) || 0;
    return `${currencySymbol} ${num.toLocaleString('es-CR')}`;
  }, [currencySymbol]);

  // Manejar cambio en el input de la ganancia del sensei
  const handleSenseiFeeChange = (val) => {
    const parsed = val === '' ? '' : Math.max(0, Number(val));
    setSenseiDojo(parsed);
    setSaveStatus(null);
  };

  const handleStepSenseiFee = (delta) => {
    const current = Number(senseiDojo) || 0;
    const next = Math.max(0, current + delta);
    setSenseiDojo(next);
    setSaveStatus(null);
  };

  // Guardar exclusivamente el arancel del Sensei
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const feeNumber = Math.max(0, Number(senseiDojo) || 0);
      const res = await saveSenseiDojoExamCost({
        dojoId: selectedDojoId || null,
        senseiDojo: feeNumber,
        userEmail: currentUser?.email || 'Sensei'
      });

      if (res.success) {
        setSaveStatus({
          type: 'success',
          message: 'Ganancia de Sensei Dojo guardada exitosamente.'
        });
      } else {
        setSaveStatus({
          type: 'error',
          message: res.error || 'No se pudo guardar la ganancia del sensei.'
        });
      }
    } catch (err) {
      setSaveStatus({
        type: 'error',
        message: err.message || 'Error de conexión al guardar.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Dojo activo
  const currentDojoName = useMemo(() => {
    if (dojo?.name) return dojo.name;
    if (selectedDojoId && allDojos.length > 0) {
      const found = allDojos.find(d => (d.id || d._id)?.toString() === selectedDojoId.toString());
      if (found) return found.name;
    }
    return currentUser?.dojoName || 'Mi Dojo';
  }, [dojo, selectedDojoId, allDojos, currentUser]);

  return (
    <div className="w-full space-y-6 pt-2 pb-16 font-sans text-gray-900">
      {/* ========================================================================= */}
      {/* BREADCRUMB */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
          <Link href="/admin" className="text-[#2D2E83] hover:underline flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 font-medium">Administración Dojo</span>
          <span className="text-gray-400">/</span>
          <span className="text-[#BE1622] font-mono uppercase tracking-wider font-bold">Sensei Dojo</span>
        </div>

        {/* Badge identificador del Dojo */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-[#2D2E83] border border-indigo-200 shadow-2xs flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#2D2E83]" />
            <span>{currentDojoName}</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ENCABEZADO PRINCIPAL */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md border border-gray-200/90 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-[#2D2E83] tracking-tight">
              Sensei Dojo — Aranceles y Costo del Examen
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              Parametrización Oficial
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 max-w-2xl leading-relaxed">
            Como <strong>Sensei Administrador de Dojo</strong>, tú tienes el control para definir y modificar la <strong>ganancia de tu dojo</strong> por cada aspirante a examen. Los aranceles de la federación (<strong>ISKF</strong>) se presentan en modo de solo lectura.
          </p>
        </div>

        {/* Botón de Guardado */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-black bg-[#2D2E83] hover:bg-[#232468] text-white transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-white" />
              <span>Guardar Ganancia Sensei</span>
            </>
          )}
        </button>
      </div>

      {/* Notificación de Éxito / Error */}
      {saveStatus && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between transition-all animate-in fade-in ${
          saveStatus.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs'
            : 'bg-rose-50 text-rose-900 border border-rose-300 shadow-2xs'
        }`}>
          <div className="flex items-center gap-2.5">
            {saveStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{saveStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus(null)}
            className="text-xs font-bold text-gray-500 hover:text-gray-900 cursor-pointer ml-3 p-1 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Si es Administrador General, permitir seleccionar el dojo a configurar */}
      {isAdmin && allDojos.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-amber-900 font-bold">
            <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Vista de Administrador General: Selecciona el dojo para gestionar su arancel de Sensei:</span>
          </div>
          <select
            value={selectedDojoId}
            onChange={(e) => setSelectedDojoId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#2D2E83] outline-hidden cursor-pointer"
          >
            <option value="">-- Configuración General por Defecto --</option>
            {allDojos.map((d) => (
              <option key={d.id || d._id} value={d.id || d._id}>
                {d.name} ({d.sensei})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESTRUCTURA VISUAL PRINCIPAL: 3 COLUMNAS / TARJETAS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* ======================================================================= */}
        {/* 1. GANANCIA DEL SENSEI (SENSEI DOJO) - EDITABLE */}
        {/* ======================================================================= */}
        <div className="bg-white border-2 border-indigo-300/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#2D2E83] flex items-center justify-center shrink-0 shadow-2xs">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900">
                    Sensei Dojo
                  </h2>
                  <span className="text-[10px] text-gray-400 font-mono font-bold">
                    Ganancia del Sensei
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-[#2D2E83] border border-indigo-200">
                ✏️ Modificable
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Monto que tú como <strong>Sensei de {currentDojoName}</strong> percibes por cada karateca examinado. Puedes modificarlo libremente según las necesidades de tu dojo.
            </p>

            {/* Input Editable de Ganancia Sensei */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-black text-gray-800 block uppercase tracking-wider">
                Monto Ganancia Sensei (por alumno):
              </label>
              
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gray-400 font-mono text-sm font-black pointer-events-none">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={senseiDojo}
                  onChange={(e) => handleSenseiFeeChange(e.target.value)}
                  placeholder="15000"
                  className="w-full pl-9 pr-14 py-3 rounded-xl border-2 border-indigo-300 font-mono font-black text-xl text-gray-900 text-right focus:border-[#2D2E83] focus:ring-3 focus:ring-[#2D2E83]/15 outline-hidden transition-all bg-white shadow-2xs"
                />
                <span className="absolute right-3.5 text-xs text-gray-400 font-mono font-bold pointer-events-none">
                  CRC
                </span>
              </div>

              {/* Botones de ajuste rápido (+ / -) */}
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <span className="text-[10px] text-gray-400 font-medium mr-1">Ajuste rápido:</span>
                <button
                  type="button"
                  onClick={() => handleStepSenseiFee(-1000)}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  title="Restar ₡1.000"
                >
                  -1.000
                </button>
                <button
                  type="button"
                  onClick={() => handleStepSenseiFee(-500)}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  title="Restar ₡500"
                >
                  -500
                </button>
                <button
                  type="button"
                  onClick={() => handleStepSenseiFee(+500)}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  title="Sumar ₡500"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => handleStepSenseiFee(+1000)}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  title="Sumar ₡1.000"
                >
                  +1.000
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-gray-100 bg-indigo-50/50 rounded-xl p-3 text-[11px] text-indigo-900 font-medium">
            💡 <strong>Tu ganancia neta:</strong> Al guardarse, se utilizará en los cálculos de todas las convocatorias de examen de tu dojo.
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 2. RUBROS OFICIALES ISKF - ESTRICTAMENTE SOLO LECTURA */}
        {/* ======================================================================= */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <Lock className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900">
                    ISKF
                  </h2>
                  <span className="text-[10px] text-gray-400 font-mono font-bold">
                    Aranceles Federativos
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-300 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>Solo Lectura</span>
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Aranceles institucionales fijados por la administración central de <strong>ISKF Costa Rica</strong>. Son rubros de solo lectura y no pueden ser alterados por el sensei.
            </p>

            {/* Desglose de los rubros ISKF */}
            <div className="space-y-2 pt-1">
              {/* Director General */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#BE1622] shrink-0" />
                  <span className="text-xs font-bold text-gray-800">Director General</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-black text-gray-900">
                    {formatMoney(iskfDg)}
                  </span>
                  <Lock className="w-3 h-3 text-gray-400" title="Arancel institucional bloqueado" />
                </div>
              </div>

              {/* ISKF Costa Rica */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2D2E83] shrink-0" />
                  <span className="text-xs font-bold text-gray-800">ISKF Costa Rica</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-black text-gray-900">
                    {formatMoney(iskfCr)}
                  </span>
                  <Lock className="w-3 h-3 text-gray-400" title="Arancel institucional bloqueado" />
                </div>
              </div>

              {/* Sumatoria de Director General + ISKF CR */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-300 shadow-2xs mt-3">
                <div>
                  <span className="text-xs font-black text-gray-900 block">
                    Sumatoria ISKF
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Director General + ISKF CR
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black font-mono text-gray-950 block">
                    {formatMoney(iskfTotal)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 font-mono">
                    (Solo lectura)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-gray-100 bg-gray-50 rounded-xl p-3 text-[11px] text-gray-600 font-medium">
            🔒 <strong>Protección de aranceles:</strong> Para consultar modificaciones en los aranceles federativos, comunícate con la Dirección Técnica ISKF.
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 3. COSTO DEL EXAMEN (TOTAL RESULTANTE) */}
        {/* ======================================================================= */}
        <div className="bg-gradient-to-br from-[#2D2E83] via-[#232468] to-[#1c1d54] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
          {/* Acento visual de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white tracking-wide uppercase">
                    Costo del Examen
                  </h2>
                  <span className="text-[10px] text-blue-200 font-mono">
                    Total por Aspirante
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-gray-950 shadow-xs">
                Monto Final
              </span>
            </div>

            <p className="text-xs text-blue-100/90 leading-relaxed">
              Es el valor definitivo de derecho de examen técnico que cancela cada atleta evaluado. Se calcula sumando tu ganancia de <strong>Sensei Dojo</strong> más la <strong>Sumatoria ISKF</strong>.
            </p>

            {/* Sumatoria Visual en vivo */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="text-blue-200 font-sans">Sensei Dojo (Tu ganancia):</span>
                <span className="font-bold text-white">{formatMoney(senseiDojo)}</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-blue-200 font-sans">+ Sumatoria ISKF (Federativo):</span>
                <span className="font-bold text-white">{formatMoney(iskfTotal)}</span>
              </div>
              <div className="border-t border-white/20 pt-2 flex items-center justify-between font-mono">
                <span className="font-bold text-amber-300 font-sans uppercase text-[11px] tracking-wider">Costo del Examen:</span>
                <span className="text-xl font-black text-amber-300">{formatMoney(examTotal)}</span>
              </div>
            </div>

            {/* Display Numérico Gigante */}
            <div className="pt-2 text-center">
              <span className="text-[11px] text-blue-200 uppercase tracking-widest font-mono font-bold block mb-1">
                Costo Total Oficial por Alumno
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow-sm">
                {formatMoney(examTotal)}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs text-blue-200">
            <span className="text-[11px]">Transparencia garantizada para atletas y dojo.</span>
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN INTERACTIVA: SIMULADOR DE CONVOCATORIA DE EXAMEN */}
      {/* ========================================================================= */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">
                Simulador de Liquidación de Examen
              </h3>
              <p className="text-[11px] text-gray-500">
                Visualiza cómo se desglosa la recaudación total según el número de aspirantes de tu dojo.
              </p>
            </div>
          </div>

          {/* Selector de cantidad de atletas */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl">
            <Users className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="text-xs font-bold text-gray-700">Aspirantes:</span>
            <input
              type="number"
              min="1"
              max="100"
              value={simulationCount}
              onChange={(e) => setSimulationCount(Math.max(1, Number(e.target.value) || 1))}
              className="w-14 px-1.5 py-0.5 text-center font-mono font-black text-xs bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Resumen de la Simulación en 3 Tarjetas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Ganancia del Sensei */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
            <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider block mb-1">
              Tu Ganancia Total (Sensei Dojo)
            </span>
            <div className="text-xl font-black font-mono text-[#2D2E83]">
              {formatMoney((Number(senseiDojo) || 0) * simulationCount)}
            </div>
            <span className="text-[10px] text-gray-500 font-mono mt-1 block">
              {simulationCount} × {formatMoney(senseiDojo)}
            </span>
          </div>

          {/* Monto a Liquidar a la ISKF */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80">
            <span className="text-[10px] font-black uppercase text-gray-700 tracking-wider block mb-1">
              Total a Liquidar (ISKF)
            </span>
            <div className="text-xl font-black font-mono text-gray-900">
              {formatMoney(iskfTotal * simulationCount)}
            </div>
            <span className="text-[10px] text-gray-500 font-mono mt-1 block">
              {simulationCount} × {formatMoney(iskfTotal)} (Dir. Gral + ISKF CR)
            </span>
          </div>

          {/* Recaudación Total del Examen */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
            <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider block mb-1">
              Recaudación Total Convocatoria
            </span>
            <div className="text-xl font-black font-mono text-emerald-800">
              {formatMoney(examTotal * simulationCount)}
            </div>
            <span className="text-[10px] text-emerald-700 font-mono mt-1 block">
              {simulationCount} atletas evaluados
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PREGUNTAS FRECUENTES Y REGLAS DEL ARANCEL */}
      {/* ========================================================================= */}
      <div className="bg-gray-50/90 border border-gray-200/80 rounded-2xl p-5 text-xs text-gray-600 space-y-2.5">
        <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
          <HelpCircle className="w-3.5 h-3.5 text-[#2D2E83]" />
          <span>Información Clave para el Sensei Administrador de Dojo:</span>
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-gray-600">
          <li>
            <strong>¿Qué puedo modificar?</strong> Únicamente el campo <em>Sensei Dojo</em>. Este monto se asocia a tu dojo y se aplica en tus convocatorias.
          </li>
          <li>
            <strong>¿Por qué ISKF está en modo solo lectura?</strong> Los montos correspondientes a Director General (₡10.000) e ISKF CR (₡5.000) son fijados institucionalmente a nivel nacional. La sumatoria oficial de ₡15.000 se calcula automáticamente para garantizar transparencia en la liquidación federativa.
          </li>
          <li>
            <strong>¿Cuándo se actualizan los costos?</strong> Una vez presionado el botón <em>&ldquo;Guardar Ganancia Sensei&rdquo;</em>, el nuevo costo se refleja de inmediato en tu panel y en las convocatorias técnicas activas.
          </li>
        </ul>
      </div>
    </div>
  );
}
