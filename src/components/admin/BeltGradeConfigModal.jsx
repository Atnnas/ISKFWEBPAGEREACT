'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  ShieldCheck,
  RotateCcw,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { ALL_RANKS_DEFINITIONS } from '../../lib/constants/kyuRanks';
import { saveExamGradeConfig } from '../../lib/actions/gradeConfig';

export default function BeltGradeConfigModal({
  isOpen,
  onClose,
  initialConfig = null,
  onConfigSaved = null,
  isAdmin = false
}) {
  const [defaultMinScore, setDefaultMinScore] = useState(70);
  const [rankGrades, setRankGrades] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Inicializar estado con la configuración recibida
  useEffect(() => {
    if (initialConfig) {
      setDefaultMinScore(Number(initialConfig.defaultMinScore) || 70);
      const existingRanks = initialConfig.ranks || [];

      // Mapear asegurando que todos los grados oficiales estén presentes
      const mapped = ALL_RANKS_DEFINITIONS.map(def => {
        const found = existingRanks.find(r => r.rankKey === def.id || r.rankLabel === def.full);
        return {
          rankKey: def.id,
          rankLabel: def.full,
          digit: def.digit,
          name: def.name,
          solidClass: def.solidClass,
          hasStripe: Boolean(def.hasStripe),
          minScore: found && typeof found.minScore === 'number' ? found.minScore : (Number(initialConfig.defaultMinScore) || 70),
          active: found ? found.active !== false : true
        };
      });
      setRankGrades(mapped);
    } else {
      const initialList = ALL_RANKS_DEFINITIONS.map(def => ({
        rankKey: def.id,
        rankLabel: def.full,
        digit: def.digit,
        name: def.name,
        solidClass: def.solidClass,
        hasStripe: Boolean(def.hasStripe),
        minScore: 70,
        active: true
      }));
      setRankGrades(initialList);
      setDefaultMinScore(70);
    }
  }, [initialConfig, isOpen]);

  if (!isOpen) return null;

  const handleScoreChange = (rankKey, val) => {
    const num = Math.min(100, Math.max(0, Number(val) || 0));
    setRankGrades(prev => prev.map(r => r.rankKey === rankKey ? { ...r, minScore: num } : r));
  };

  const handleStep = (rankKey, delta) => {
    setRankGrades(prev => prev.map(r => {
      if (r.rankKey === rankKey) {
        const next = Math.min(100, Math.max(50, (Number(r.minScore) || 70) + delta));
        return { ...r, minScore: next };
      }
      return r;
    }));
  };

  const handleApplyPreset = (type) => {
    if (type === 'all-70') {
      setRankGrades(prev => prev.map(r => ({ ...r, minScore: 70 })));
      setDefaultMinScore(70);
    } else if (type === 'standard-curve') {
      // Curva oficial marcial: 70% Kyus básicos (10°-7°), 75% Kyus intermedios (6°-4°), 80% Marrones (3°-1°), 85% Dan
      setRankGrades(prev => prev.map(r => {
        const k = r.rankKey;
        let score = 70;
        if (['10-kyu', '9-kyu', '8-kyu', '7-kyu'].includes(k)) score = 70;
        else if (['6-kyu', '5-kyu', '4-kyu'].includes(k)) score = 75;
        else if (['3-kyu', '2-kyu', '1-kyu'].includes(k)) score = 80;
        else if (k.endsWith('-dan')) score = 85;
        return { ...r, minScore: score };
      }));
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      setFeedback({ type: 'error', message: 'Únicamente administradores pueden modificar esta configuración.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      const payload = {
        defaultMinScore,
        ranks: rankGrades.map(r => ({
          rankKey: r.rankKey,
          rankLabel: r.rankLabel,
          minScore: r.minScore,
          active: r.active
        }))
      };

      const res = await saveExamGradeConfig(payload);
      if (res.success) {
        setFeedback({ type: 'success', message: '¡Notas mínimas por cinturón guardadas y oficializadas!' });
        if (typeof onConfigSaved === 'function') {
          onConfigSaved(res.config);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Error al guardar la configuración.' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Error de conexión al guardar.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-white animate-in zoom-in-95 duration-150 overflow-hidden">
        
        {/* Encabezado Sobrio y Marcial ISKF */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D2E83]/40 border border-[#2D2E83] text-indigo-300 flex items-center justify-center font-bold shadow-md">
              <Sliders className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Notas Mínimas de Aprobación por Cinturón
                </h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Defina el porcentaje (%) mínimo para aprobar cada grado. Regirá en tiempo real en fases, dictamen y certificado PDF.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra Rápida de Presets Gráficos */}
        <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-[11px] font-semibold text-slate-400">Atajos rápidos:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('all-70')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[11px] cursor-pointer transition-all active:scale-95"
            >
              Fijar todo en 70%
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('standard-curve')}
              className="px-2.5 py-1 rounded-lg bg-[#2D2E83]/40 hover:bg-[#2D2E83]/70 text-indigo-200 border border-indigo-500/40 font-bold text-[11px] cursor-pointer transition-all active:scale-95"
              title="70% Kyu Inicial, 75% Kyu Medio, 80% Marrones, 85% Dan"
            >
              Escala Progresiva ISKF (70% → 85%)
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>Verde = Aprobado, Rojo = Reprobado (&lt; Nota Mínima)</span>
          </div>
        </div>

        {/* Contenido: Grid Gráfica de Cinturones */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {rankGrades.map((rg) => {
              const score = rg.minScore;
              const isHighExcellence = score >= 80;

              return (
                <div
                  key={rg.rankKey}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 group"
                >
                  {/* Encabezado de la tarjeta con cinta física */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-white tracking-wide">
                        {rg.digit}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 truncate max-w-[140px]">
                        {rg.name}
                      </span>
                    </div>

                    {/* Representación gráfica de la cinta */}
                    <div className="mt-2 h-3.5 w-full rounded-md shadow-inner relative overflow-hidden flex items-center justify-center">
                      <div className={`w-full h-full ${rg.solidClass}`}>
                        {rg.hasStripe && (
                          <div className="absolute inset-y-0 left-1/4 right-1/4 bg-white/90 shadow-xs" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selector Numérico y Gráfico de Nota Mínima */}
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                        Nota Mínima
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className={`text-base font-black font-mono tracking-tight ${isHighExcellence ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {score}%
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold">mín.</span>
                      </div>
                    </div>

                    {/* Steppers -5 y +5 */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStep(rg.rankKey, -5)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer transition-all active:scale-90"
                        title="Disminuir -5%"
                      >
                        -5
                      </button>

                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={score}
                        onChange={(e) => handleScoreChange(rg.rankKey, e.target.value)}
                        className="w-12 h-7 rounded-lg bg-slate-950 border border-slate-700 text-center font-mono font-black text-xs text-white focus:outline-hidden focus:border-indigo-500"
                      />

                      <button
                        type="button"
                        onClick={() => handleStep(rg.rankKey, 5)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer transition-all active:scale-90"
                        title="Aumentar +5%"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  {/* Indicador de estado visual (Aprobado vs Reprobado) */}
                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-900/90 font-medium">
                    <span className="text-rose-400/90 font-semibold flex items-center gap-1">
                      &lt; {score}%: <span className="underline decoration-rose-500/50">Reprobado</span>
                    </span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      ≥ {score}%: <span className="underline decoration-emerald-500/50">Aprobado</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mensaje de Feedback */}
        {feedback && (
          <div className={`px-5 py-2.5 text-xs font-bold flex items-center gap-2 border-t ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800'
              : 'bg-rose-950/80 text-rose-200 border-rose-800'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Pie de Acciones */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleApplyPreset('all-70')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Todo a 70%</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !isAdmin}
              className="px-5 py-2 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-900/40 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Guardar Configuración Oficial</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
