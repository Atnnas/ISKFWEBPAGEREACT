'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { saveExamCostConfig } from '../../lib/actions/examCosts';

export default function ExamCostsConfigView({ initialConfig, currentUser }) {
  const [config, setConfig] = useState(() => initialConfig || {
    currency: 'CRC',
    currencySymbol: '₡',
    senseiDojo: 15000,
    directorGeneral: 10000,
    iskfCr: 5000,
    total: 30000,
    notes: '',
    rankCosts: []
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Formato de moneda
  const formatMoney = useCallback((amount) => {
    const num = Number(amount) || 0;
    const sym = config.currencySymbol || '₡';
    return `${sym} ${num.toLocaleString('es-CR')}`;
  }, [config.currencySymbol]);

  // Cálculo en tiempo real del Total
  const currentTotal = useMemo(() => {
    const s = Math.max(0, Number(config.senseiDojo) || 0);
    const d = Math.max(0, Number(config.directorGeneral) || 0);
    const i = Math.max(0, Number(config.iskfCr) || 0);
    return s + d + i;
  }, [config.senseiDojo, config.directorGeneral, config.iskfCr]);

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
        ...config,
        total: currentTotal,
      };

      const res = await saveExamCostConfig(payload, currentUser?.email || 'Administración');

      if (res.success) {
        setConfig(prev => ({
          ...prev,
          ...res.config,
        }));
        setSaveStatus({
          type: 'success',
          message: 'Costos guardados correctamente.'
        });
      } else {
        setSaveStatus({
          type: 'error',
          message: res.error || 'Error al guardar los costos.'
        });
      }
    } catch (err) {
      setSaveStatus({
        type: 'error',
        message: err.message || 'Error de conexión.'
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
          <span className="text-[#BE1622] font-mono uppercase tracking-wider">Configuración de Costos</span>
        </div>
      </div>

      {/* Encabezado: Título y Botón Guardar Costos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#2D2E83] tracking-tight">
            Configuración de Costos
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#2D2E83] hover:bg-[#232468] text-white transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 self-start sm:self-auto"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-white" />
              <span>Guardar Costos</span>
            </>
          )}
        </button>
      </div>

      {/* Notificación de Éxito / Error */}
      {saveStatus && (
        <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
          saveStatus.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {saveStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{saveStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus(null)}
            className="text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabla de Rubros y Total Expandida */}
      <div className="w-full bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
              <th className="py-3.5 px-6">Rubro</th>
              <th className="py-3.5 px-6 text-right w-60">Monto (₡ Colones)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            <tr className="hover:bg-gray-50/60 transition-colors">
              <td className="py-4 px-6 font-semibold text-gray-800">
                Sensei Dojo
              </td>
              <td className="py-4 px-6 text-right">
                <div className="relative inline-block w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs font-bold">
                    {config.currencySymbol || '₡'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={config.senseiDojo}
                    onChange={(e) => handleAmountChange('senseiDojo', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-right rounded-lg border border-gray-300 font-mono font-bold text-gray-900 focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 text-sm bg-white"
                  />
                </div>
              </td>
            </tr>

            <tr className="hover:bg-gray-50/60 transition-colors">
              <td className="py-4 px-6 font-semibold text-gray-800">
                Director General
              </td>
              <td className="py-4 px-6 text-right">
                <div className="relative inline-block w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs font-bold">
                    {config.currencySymbol || '₡'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={config.directorGeneral}
                    onChange={(e) => handleAmountChange('directorGeneral', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-right rounded-lg border border-gray-300 font-mono font-bold text-gray-900 focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 text-sm bg-white"
                  />
                </div>
              </td>
            </tr>

            <tr className="hover:bg-gray-50/60 transition-colors">
              <td className="py-4 px-6 font-semibold text-gray-800">
                ISKF CR
              </td>
              <td className="py-4 px-6 text-right">
                <div className="relative inline-block w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs font-bold">
                    {config.currencySymbol || '₡'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={config.iskfCr}
                    onChange={(e) => handleAmountChange('iskfCr', e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-right rounded-lg border border-gray-300 font-mono font-bold text-gray-900 focus:border-[#2D2E83] focus:ring-2 focus:ring-[#2D2E83]/20 text-sm bg-white"
                  />
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-gray-50/90 border-t-2 border-gray-200">
              <td className="py-4 px-6 font-black text-gray-900 text-sm uppercase tracking-wide">
                TOTAL
              </td>
              <td className="py-4 px-6 text-right font-black font-mono text-lg text-[#2D2E83]">
                {formatMoney(currentTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
