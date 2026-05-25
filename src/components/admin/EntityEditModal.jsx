"use client";
import React, { useState, useEffect } from 'react';
import { createEntity, updateEntity } from '../../lib/actions/entities';
import AlertModal from '../ui/AlertModal';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
          <h3 className="text-xl font-bold text-white">
            {entity ? 'Editar Entidad' : 'Nueva Entidad'}
          </h3>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar">
          <form id="entity-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Nombre</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                placeholder="Ej. ISKF Costa Rica"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">URL del Logo</label>
              <input
                type="text"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleChange}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                placeholder="Ej. /images/dojos/mi-logo.jpg o https://..."
              />
              <p className="text-xs text-neutral-500 mt-1">
                Puedes usar una URL externa o subir la imagen a la carpeta <code className="bg-neutral-800 px-1 rounded text-red-400">public/images/dojos</code>.
              </p>
            </div>
            
            {formData.logoUrl && (
              <div className="mt-4 flex flex-col items-center p-4 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
                <span className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">Vista previa del Logo</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={formData.logoUrl} 
                  alt="Vista previa" 
                  className="max-h-24 rounded bg-white p-2 object-contain shadow-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/dojos/default_logo.jpg';
                  }}
                />
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-neutral-800 bg-neutral-900/50 flex justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium text-sm border border-neutral-700"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="entity-form"
            disabled={loading}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center justify-center min-w-[120px] shadow-lg shadow-red-900/20"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              'Guardar Entidad'
            )}
          </button>
        </div>
      </div>

      <AlertModal 
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        title={alert.isError ? "Error" : "Éxito"}
        message={alert.message}
        isError={alert.isError}
      />
    </div>
  );
}
