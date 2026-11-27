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
  Plus,
  Search,
  Check
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Filtrado de grados para la tabla
  const visibleRanks = useMemo(() => {
    let list = ranks;
    if (filterTab === 'kyu') {
      const kyuIds = new Set(KYU_DEFINITIONS.map(k => k.id));
      list = list.filter(r => kyuIds.has(r.rankKey));
    } else if (filterTab === 'dan') {
      const danIds = new Set(DAN_DEFINITIONS.map(d => d.id));
      list = list.filter(r => danIds.has(r.rankKey));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r => 
        r.digit?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.rankLabel?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [ranks, filterTab, searchQuery]);

  // Actualizar nota mínima de un grado individual
  const updateRankScore = useCallback((rankKey, deltaOrValue, isAbsolute = false) => {
    setRanks(prev => prev.map(r => {
      if (r.rankKey !== rankKey) return r;
      let nextVal = isAbsolute ? Number(deltaOrValue) : r.minScore + Number(deltaOrValue);
      if (isNaN(nextVal)) nextVal = 70;
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
                Tabla de Notas Mínimas por Cinturón
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Edite de forma ordenada y precisa el porcentaje mínimo exigido para cada grado Kyu y Dan en evaluaciones oficiales.
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

      {/* Panel Superior: Regla Dinámica y Presets Rápidos */}
      <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Criterio Visual Aprobado / Reprobado */}
          <div className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
              Regla de Evaluación en Tribunal y Certificados
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Nota Obtenida ≥ Mínimo: <strong>Aprobado</strong></span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-red-50 border border-red-300 text-red-800 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Nota Obtenida &lt; Mínimo: <strong>Reprobado</strong> (Marca en rojo en actas y PDF)</span>
              </span>
            </div>
          </div>

          {/* Plantillas Rápidas Oficiales */}
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

        {/* Barra de Filtros y Búsqueda */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
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
              Kyu ({KYU_DEFINITIONS.length})
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
              Dan ({DAN_DEFINITIONS.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cinturón o kyu..."
              className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2D2E83] focus:border-[#2D2E83]"
            />
          </div>
        </div>
      </div>

      {/* Tabla Oficial de Configuración de Notas Mínimas */}
      <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-wider">
                <th className="py-3 px-5">Cinturón / Grado</th>
                <th className="py-3 px-5 text-center">Tipo</th>
                <th className="py-3 px-5 text-center min-w-[200px]">Nota Mínima Requerida</th>
                <th className="py-3 px-5 min-w-[220px]">Ajuste Deslizante</th>
                <th className="py-3 px-5 text-center">Criterio en Tribunal & PDF</th>
                <th className="py-3 px-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {visibleRanks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">
                    No se encontraron grados que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                visibleRanks.map((rank) => {
                  const score = rank.minScore;
                  const isDan = rank.rankKey.includes('dan');

                  return (
                    <tr 
                      key={rank.rankKey} 
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* 1. Grado / Cinta Visual */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div 
                            className={`w-9 h-6 rounded-md shadow-2xs border border-gray-300/80 shrink-0 ${rank.solidClass}`}
                            title={rank.rankLabel}
                          >
                            {rank.hasStripe && (
                              <div className="w-full h-1.5 bg-white mt-2 shadow-2xs" />
                            )}
                          </div>
                          <div>
                            <span className="font-black text-gray-900 text-sm block">
                              {rank.digit}
                            </span>
                            <span className="text-[11px] font-medium text-gray-500">
                              {rank.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Tipo (Kyu / Dan) */}
                      <td className="py-3.5 px-5 text-center">
                        <span 
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isDan 
                              ? 'bg-gray-900 text-amber-300 border border-gray-800'
                              : 'bg-blue-50 text-[#2D2E83] border border-blue-200'
                          }`}
                        >
                          {isDan ? 'Grado Dan' : 'Grado Kyu'}
                        </span>
                      </td>

                      {/* 3. Input Numérico + Botones Stepper */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateRankScore(rank.rankKey, -5)}
                            className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] transition-all cursor-pointer active:scale-95 border border-gray-200"
                            title="Restar 5%"
                          >
                            -5%
                          </button>
                          <button
                            type="button"
                            onClick={() => updateRankScore(rank.rankKey, -1)}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-gray-200"
                            title="Restar 1%"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          {/* Campo de entrada editable directamente */}
                          <div className="relative inline-flex items-center">
                            <input
                              type="number"
                              min="50"
                              max="100"
                              value={score}
                              onChange={(e) => updateRankScore(rank.rankKey, e.target.value, true)}
                              className="w-18 text-center font-black font-mono text-sm py-1 px-1 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D2E83] text-[#2D2E83]"
                            />
                            <span className="text-xs font-black text-gray-400 ml-1">%</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => updateRankScore(rank.rankKey, 1)}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-gray-200"
                            title="Sumar 1%"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateRankScore(rank.rankKey, 5)}
                            className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] transition-all cursor-pointer active:scale-95 border border-gray-200"
                            title="Sumar 5%"
                          >
                            +5%
                          </button>
                        </div>
                      </td>

                      {/* 4. Slider Deslizante */}
                      <td className="py-3.5 px-5">
                        <div className="space-y-1">
                          <input
                            type="range"
                            min="50"
                            max="100"
                            step="1"
                            value={score}
                            onChange={(e) => updateRankScore(rank.rankKey, e.target.value, true)}
                            className="w-full accent-[#2D2E83] cursor-pointer h-2 bg-gray-200 rounded-lg"
                          />
                          <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                            <span>50%</span>
                            <span className="text-[#2D2E83] font-mono">{score}%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Criterio Visual en Tribunal */}
                      <td className="py-3.5 px-5 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>≥ {score}% Aprobado</span>
                          </span>
                          <span className="text-[10px] text-red-600 font-semibold">
                            &lt; {score}% Reprobado
                          </span>
                        </div>
                      </td>

                      {/* 6. Acción de Restablecer */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => updateRankScore(rank.rankKey, defaultMinScore, true)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#2D2E83] hover:bg-gray-100 transition-colors cursor-pointer"
                          title={`Restablecer al valor por defecto (${defaultMinScore}%)`}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de la Tabla con Resumen y Guardado */}
        <div className="p-4 bg-gray-50/90 border-t border-gray-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-gray-500 font-medium flex items-center gap-4">
            <span>
              Mostrando <strong>{visibleRanks.length}</strong> de <strong>{ranks.length}</strong> grados configurados.
            </span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="hidden sm:inline">
              Promedio de notas mínimas: <strong>
                {Math.round(visibleRanks.reduce((sum, r) => sum + r.minScore, 0) / (visibleRanks.length || 1))}%
              </strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-[#2D2E83] hover:bg-[#1E1F5A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Guardando cambios...</span>
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
    </div>
  );
}
