'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  ShieldCheck, 
  Sparkles, 
  RotateCcw,
  Minus,
  Plus
} from 'lucide-react';
import { saveExamGradeConfig } from '../../lib/actions/gradeConfig';
import { ALL_RANKS_DEFINITIONS, KYU_DEFINITIONS, DAN_DEFINITIONS } from '../../lib/constants/kyuRanks';
import { DEFAULT_MIN_PASSING_SCORE } from '../../lib/utils/gradeConfigHelper';

export default function BeltGradeConfigView({ initialConfig, _currentUser }) {
  // Inicialización de la configuración
  const [defaultMinScore, setDefaultMinScore] = useState(() => 
    Number(initialConfig?.defaultMinScore) || DEFAULT_MIN_PASSING_SCORE
  );

  const [ranks, setRanks] = useState(() => {
    const saved = initialConfig?.ranks || [];
    return ALL_RANKS_DEFINITIONS.map(def => {
      const existing = saved.find(s => s.rankKey === def.id || s.rankLabel === def.full);
      return {
        rankKey: def.id,
        rankLabel: def.full,
        digit: def.digit,
        name: def.name,
        solidClass: def.solidClass,
        hasStripe: Boolean(def.hasStripe),
        minScore: typeof existing?.minScore === 'number' ? existing.minScore : (Number(initialConfig?.defaultMinScore) || DEFAULT_MIN_PASSING_SCORE),
        active: existing?.active !== false
      };
    });
  });

  const [filterTab, setFilterTab] = useState('all'); // 'all', 'kyu', 'dan'
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Filtrado de grados para la vista
  const visibleRanks = useMemo(() => {
    if (filterTab === 'kyu') {
      const kyuIds = new Set(KYU_DEFINITIONS.map(k => k.id));
      return ranks.filter(r => kyuIds.has(r.rankKey));
    }
    if (filterTab === 'dan') {
      const danIds = new Set(DAN_DEFINITIONS.map(d => d.id));
      return ranks.filter(r => danIds.has(r.rankKey));
    }
    return ranks;
  }, [ranks, filterTab]);

  // Actualizar nota mínima de un grado individual
  const updateRankScore = useCallback((rankKey, deltaOrValue, isAbsolute = false) => {
    setRanks(prev => prev.map(r => {
      if (r.rankKey !== rankKey) return r;
      let nextVal = isAbsolute ? Number(deltaOrValue) : r.minScore + Number(deltaOrValue);
      nextVal = Math.min(100, Math.max(50, nextVal));
      return { ...r, minScore: nextVal };
    }));
    setStatusMessage(null);
  }, []);

  // Aplicar un valor a todos los grados
  const applyPresetToAll = (score) => {
    const val = Math.min(100, Math.max(50, score));
    setDefaultMinScore(val);
    setRanks(prev => prev.map(r => ({ ...r, minScore: val })));
    setStatusMessage(null);
  };

  // Preset diferencial: Kyu 70% y Dan 75%
  const applyPresetTiered = (kyuScore, danScore) => {
    const kyuIds = new Set(KYU_DEFINITIONS.map(k => k.id));
    setRanks(prev => prev.map(r => ({
      ...r,
      minScore: kyuIds.has(r.rankKey) ? kyuScore : danScore
    })));
    setStatusMessage(null);
  };

  // Guardar en base de datos
  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const payload = {
        defaultMinScore,
        ranks: ranks.map(r => ({
          rankKey: r.rankKey,
          rankLabel: r.rankLabel,
          minScore: r.minScore,
          active: r.active !== false
        }))
      };

      const res = await saveExamGradeConfig(payload);

      if (res?.success) {
        setStatusMessage({
          type: 'success',
          text: 'Notas mínimas de aprobación guardadas correctamente. Se aplicarán de inmediato en los tribunales, actas y certificados.'
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res?.error || 'No se pudieron guardar las notas mínimas.'
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error de conexión al guardar.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 pt-2 pb-12 font-sans text-gray-900">
      {/* Breadcrumb Principal Oficial */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
          <Link href="/admin/examinations" className="text-[#2D2E83] hover:underline flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Examinaciones
          </Link>
          <span className="text-gray-400">/</span>
          <Link href="/admin/examinations/technical" className="text-[#2D2E83] hover:underline transition-colors">
            Exámenes Técnicos
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-[#BE1622] font-mono uppercase tracking-wider font-bold">
            Configuración de Notas Mínimas
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#2D2E83] border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2D2E83]" />
            Exclusivo Administrador
          </span>
        </div>
      </div>

      {/* Header Principal con Botón de Guardado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#2D2E83] flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5 text-[#2D2E83]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#2D2E83] tracking-tight">
                Notas Mínimas por Cinturón
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Parametrización gráfica de la nota mínima aprobatoria para cada grado en evaluaciones técnicas, tribunal y actas oficiales.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-[#2D2E83] hover:bg-[#1E1F5A] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mensaje de Estado / Feedback */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-xs font-bold">{statusMessage.text}</span>
        </div>
      )}

      {/* Panel Superior: Criterio Gráfico y Presets Rápidos */}
      <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Explicación Gráfica del Criterio Aprobado / Reprobado */}
          <div className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
              Regla de Evaluación Marcial Dinámica
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Nota ≥ Mínimo: <strong>Aprobado</strong></span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-red-50 border border-red-300 text-red-800 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Nota &lt; Mínimo: <strong>Reprobado</strong> (Marca en rojo en actas y PDF)</span>
              </span>
            </div>
          </div>

          {/* Presets Rápidos Oficiales */}
          <div className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Plantillas Rápidas
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyPresetToAll(70)}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
                title="Aplica 70% a todos los grados"
              >
                Estándar (70%)
              </button>
              <button
                type="button"
                onClick={() => applyPresetToAll(75)}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
                title="Aplica 75% a todos los grados"
              >
                Exigente (75%)
              </button>
              <button
                type="button"
                onClick={() => applyPresetTiered(70, 75)}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#2D2E83] text-xs font-bold transition-all cursor-pointer"
                title="Aplica 70% a Kyus y 75% a Danes"
              >
                Kyu 70% / Dan 75%
              </button>
              <button
                type="button"
                onClick={() => applyPresetTiered(75, 80)}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-all cursor-pointer"
                title="Aplica 75% a Kyus y 80% a Danes"
              >
                Kyu 75% / Dan 80%
              </button>
            </div>
          </div>
        </div>

        {/* Selector de Pestañas: Todos, Kyu, Dan */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-[#2D2E83] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos los Grados ({ranks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('kyu')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'kyu'
                ? 'bg-[#2D2E83] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Grados Kyu ({KYU_DEFINITIONS.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('dan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === 'dan'
                ? 'bg-[#2D2E83] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Grados Dan ({DAN_DEFINITIONS.length})
          </button>
        </div>
      </div>

      {/* Grid de Tarjetas Gráficas por Cinturón */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleRanks.map((rank) => {
          const score = rank.minScore;

          return (
            <div
              key={rank.rankKey}
              className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              {/* Encabezado de la Tarjeta del Cinturón */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Cinta / Cinta Marcial Gráfica */}
                  <div 
                    className={`w-10 h-7 rounded-md shadow-xs border border-gray-300/80 shrink-0 ${rank.solidClass}`}
                    title={rank.rankLabel}
                  >
                    {rank.hasStripe && (
                      <div className="w-full h-1.5 bg-white mt-2.5 shadow-2xs" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 leading-tight">
                      {rank.digit}
                    </h3>
                    <p className="text-[11px] font-semibold text-gray-500">
                      {rank.name}
                    </p>
                  </div>
                </div>

                {/* Badge Gráfico del Porcentaje Mínimo */}
                <div className="text-right">
                  <div className="inline-flex items-baseline gap-0.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-[#2D2E83]">
                    <span className="text-lg font-black tracking-tight">{score}</span>
                    <span className="text-xs font-extrabold">%</span>
                  </div>
                </div>
              </div>

              {/* Controles de Ajuste Rápido (-5, -1, +1, +5) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
                  <span>Nota Mínima Requerida:</span>
                  <span className="text-[#2D2E83] font-mono">{score}% / 100%</span>
                </div>

                {/* Slider Gráfico */}
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="1"
                  value={score}
                  onChange={(e) => updateRankScore(rank.rankKey, e.target.value, true)}
                  className="w-full accent-[#2D2E83] cursor-pointer h-2 bg-gray-200 rounded-lg"
                />

                {/* Botonera de Steppers */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => updateRankScore(rank.rankKey, -5)}
                    className="py-1 px-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold transition-all text-center cursor-pointer active:scale-95"
                    title="Restar 5%"
                  >
                    -5%
                  </button>
                  <button
                    type="button"
                    onClick={() => updateRankScore(rank.rankKey, -1)}
                    className="py-1 px-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold transition-all text-center cursor-pointer active:scale-95 flex items-center justify-center"
                    title="Restar 1%"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateRankScore(rank.rankKey, 1)}
                    className="py-1 px-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold transition-all text-center cursor-pointer active:scale-95 flex items-center justify-center"
                    title="Sumar 1%"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateRankScore(rank.rankKey, 5)}
                    className="py-1 px-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold transition-all text-center cursor-pointer active:scale-95"
                    title="Sumar 5%"
                  >
                    +5%
                  </button>
                </div>
              </div>

              {/* Indicador de Estado del Cinturón */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-gray-500">Criterio en acta:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Aprobado ≥ {score}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón Flotante Inferior de Guardado Rápido */}
      <div className="flex items-center justify-end pt-4 border-t border-gray-200/80">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-[#2D2E83] hover:bg-[#1E1F5A] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Guardando configuración...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-white" />
              <span>Guardar Notas Mínimas</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
