'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, RefreshCw, CheckCircle2, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { saveExamCostConfig } from '../../lib/actions/examCosts';

export default function ExamCostsConfigView({ initialConfig, currentUser }) {
  const [config, setConfig] = useState(() => ({
    currency: initialConfig?.currency || 'CRC',
    currencySymbol: initialConfig?.currencySymbol || '₡',
    directorGeneral: Number(initialConfig?.directorGeneral) || 10000,
    iskfCr: Number(initialConfig?.iskfCr) || 5000,
    notes: initialConfig?.notes || '',
  }));

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Formato de moneda
  const formatMoney = useCallback((amount) => {
    const num = Number(amount) || 0;
    const sym = config.currencySymbol || '₡';
    return `${sym} ${num.toLocaleString('es-CR')}`;
  }, [config.currencySymbol]);

  // Sumatoria en tiempo real de los rubros oficiales de la ISKF
  const iskfTotal = useMemo(() => {
    const d = Math.max(0, Number(config.directorGeneral) || 0);
    const i = Math.max(0, Number(config.iskfCr) || 0);
    return d + i;
  }, [config.directorGeneral, config.iskfCr]);

  const handleAmountChange = (field, val) => {
    const num = Math.max(0, Number(val) || 0);
    setConfig(prev => ({
      ...prev,
      [field]: num,
    }));
    setSaveStatus(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const payload = {
        currency: config.currency || 'CRC',
        currencySymbol: config.currencySymbol || '₡',
        directorGeneral: Math.max(0, Number(config.directorGeneral) || 0),
        iskfCr: Math.max(0, Number(config.iskfCr) || 0),
        notes: config.notes || '',
      };

      const res = await saveExamCostConfig(payload, currentUser?.email || 'Administración');

      if (res.success) {
        setSaveStatus({
          type: 'success',
          message: 'Aranceles federativos ISKF guardados correctamente.'
        });
      } else {
        setSaveStatus({
          type: 'error',
          message: res.error || 'Error al guardar los costos federativos.'
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

  return (
    <div className="w-full space-y-6 pt-2 pb-12 font-sans text-gray-900">
      {/* Breadcrumb Principal Estándar en la esquina superior izquierda */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
          <Link href="/admin/examinations" className="text-[#2D2E83] hover:underline flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Examinaciones
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-[#BE1622] font-mono uppercase tracking-wider font-bold">Configuración de Costos</span>
        </div>
      </div>

      {/* Encabezado: Título y Botón Guardar Costos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md border border-gray-200/90 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-[#2D2E83] tracking-tight">
              Aranceles Federativos ISKF
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#2D2E83] border border-blue-300">
              Administración Central
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1.5 max-w-2xl leading-relaxed">
            Parámetros oficiales aplicables a toda convocatoria de examen técnico avalada por la ISKF Costa Rica.
          </p>
        </div>

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
              <span>Guardar Aranceles ISKF</span>
            </>
          )}
        </button>
      </div>

      {/* Banner Informativo sobre Autonomía de Ganancia por Dojo */}
      <div className="bg-blue-50/70 border border-blue-200/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
        <div className="p-2 rounded-xl bg-blue-100 text-[#2D2E83] shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs text-gray-700 leading-relaxed">
          <h4 className="font-bold text-[#2D2E83] text-sm">
            Separación de Rubros Institucionales y Ganancia de Dojo
          </h4>
          <p>
            En este panel se configuran exclusivamente los rubros federativos de la ISKF (<strong>Director General</strong> e <strong>ISKF CR</strong>).
          </p>
          <p className="text-gray-500 font-medium">
            La ganancia por aspirante (<strong>Sensei Dojo</strong>) se gestiona de forma autónoma por cada Sensei para su propio dojo desde la opción <strong>Administración Dojo &gt; Montos Examen</strong>.
          </p>
        </div>
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

      {/* Tabla de Rubros Federativos ISKF */}
      <div className="w-full bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2D2E83]" />
            <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider font-mono">
              Rubros Institucionales Federativos
            </h3>
          </div>
          <span className="text-[11px] font-bold text-gray-400">
            Moneda oficial: CRC (₡)
          </span>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/90 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
              <th className="py-3.5 px-6">Rubro Federativo</th>
              <th className="py-3.5 px-6 text-right w-64">Monto (₡ Colones)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {/* Director General */}
            <tr className="hover:bg-gray-50/60 transition-colors">
              <td className="py-5 px-6">
                <div className="font-bold text-gray-900">Director General</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">
                  Arancel correspondiente al Director General ISKF por derecho de mesa evaluadora
                </div>
              </td>
              <td className="py-5 px-6 text-right">
                <div className="relative inline-block w-52">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm font-black pointer-events-none">
                    {config.currencySymbol || '₡'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={config.directorGeneral}
                    onChange={(e) => handleAmountChange('directorGeneral', e.target.value)}
                    className="w-full pl-9 pr-12 py-2.5 text-right rounded-xl border border-gray-300 font-mono font-bold text-gray-900 focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 text-base bg-white shadow-2xs"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono font-bold pointer-events-none">
                    CRC
                  </span>
                </div>
              </td>
            </tr>

            {/* ISKF CR */}
            <tr className="hover:bg-gray-50/60 transition-colors">
              <td className="py-5 px-6">
                <div className="font-bold text-gray-900">ISKF Costa Rica</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">
                  Cuota federativa por homologación, registro y emisión de diplomas
                </div>
              </td>
              <td className="py-5 px-6 text-right">
                <div className="relative inline-block w-52">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm font-black pointer-events-none">
                    {config.currencySymbol || '₡'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={config.iskfCr}
                    onChange={(e) => handleAmountChange('iskfCr', e.target.value)}
                    className="w-full pl-9 pr-12 py-2.5 text-right rounded-xl border border-gray-300 font-mono font-bold text-gray-900 focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 text-base bg-white shadow-2xs"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono font-bold pointer-events-none">
                    CRC
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-blue-50/50 border-t-2 border-gray-200">
              <td className="py-4 px-6 font-black text-gray-900 text-sm uppercase tracking-wide">
                SUMATORIA ARANCELES ISKF
              </td>
              <td className="py-4 px-6 text-right font-black font-mono text-xl text-[#2D2E83]">
                {formatMoney(iskfTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
