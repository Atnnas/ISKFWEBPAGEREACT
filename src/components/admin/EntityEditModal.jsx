"use client";
import React, { useState, useEffect } from 'react';
import { createEntity, updateEntity } from '../../lib/actions/entities';
import AlertModal from '../ui/AlertModal';
import { X, Globe } from 'lucide-react';

export default function EntityEditModal({ isOpen, onClose, entity, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '/images/dojos/default_logo.jpg',
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ isOpen: false, message: '', isError: false });

  useEffect(() => {
    if (entity) {
      setFormData({
        name: entity.name || '',
        logoUrl: entity.logoUrl || '/images/dojos/default_logo.jpg',
      });
    } else {
      setFormData({
        name: '',
        logoUrl: '/images/dojos/default_logo.jpg',
      });
    }
  }, [entity, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let res;
      if (entity) {
        res = await updateEntity(entity._id, formData);
      } else {
        res = await createEntity(formData);
      }

      if (res.success) {
        onSaveSuccess(res.entity, !entity);
        onClose();
      } else {
        setAlert({ isOpen: true, message: res.error || 'Error al guardar la entidad.', isError: true });
      }
    } catch (error) {
      console.error(error);
      setAlert({ isOpen: true, message: 'Ocurrió un error inesperado.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-gray-900">
        
        <div className="p-6 border-b border-gray-200/90 flex justify-between items-center bg-gray-50/80">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#BE1622] block font-mono">
              Entidades Oficiales
            </span>
            <h3 className="text-xl font-black text-[#2D2E83] tracking-tight">
              {entity ? 'Editar Entidad Organizadora' : 'Nueva Entidad Organizadora'}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar">
          <form id="entity-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Nombre de la Entidad <span className="text-[#BE1622]">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-colors"
                placeholder="Ej. FECOKA, WKF, ISKF Panamericana"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                URL del Logotipo
              </label>
              <input
                type="text"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-colors"
                placeholder="Ej. /images/dojos/FecokaLogo.jpg o https://..."
              />
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Puedes ingresar una ruta local como <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 font-mono">/images/dojos/escudo.jpg</code> o una URL web.
              </p>
            </div>
            
            {formData.logoUrl && (
              <div className="mt-4 flex flex-col items-center p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <span className="text-[11px] text-gray-500 mb-2 font-bold uppercase tracking-wider">
                  Vista Previa del Logotipo
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={formData.logoUrl} 
                  alt="Vista previa" 
                  className="max-h-24 rounded-xl bg-white p-2 object-contain shadow-xs border border-gray-200"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/dojos/default_logo.jpg';
                  }}
                />
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="entity-form"
            disabled={loading}
            className="px-6 py-2.5 bg-[#BE1622] hover:bg-[#9c0f1b] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-[#BE1622]/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : null}
            <span>{entity ? 'Guardar Cambios' : 'Crear Entidad'}</span>
          </button>
        </div>
      </div>

      <AlertModal 
        isOpen={alert.isOpen}
        onClose={() => setAlert({ isOpen: false, message: '', isError: false })}
        title="Atención"
        message={alert.message}
        isError={alert.isError}
      />
    </div>
  );
}
