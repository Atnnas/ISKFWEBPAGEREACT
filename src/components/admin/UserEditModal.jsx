"use client";
import React, { useState } from 'react';
import { createUser } from '../../app/admin/actions';
import AlertModal from '../ui/AlertModal';

export default function UserEditModal({ isOpen, onClose, onSaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    isActive: true
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.email) {
        setAlertModal({ isOpen: true, message: 'El correo electrónico es obligatorio.' });
        setLoading(false);
        return;
      }

      await createUser(formData);
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving user:", error);
      setAlertModal({ isOpen: true, message: error.message || 'Error al guardar el usuario.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white">Agregar Nuevo Usuario</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Nombre (Opcional)</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-iskf-red focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Correo Electrónico (Requerido) <span className="text-iskf-red">*</span></label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-iskf-red focus:border-transparent transition-all"
                />
                <p className="text-xs text-neutral-500 mt-1">El usuario utilizará este correo para ingresar mediante Google.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Rol de Acceso</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-iskf-red focus:border-transparent transition-all"
                >
                  <option value="user">Usuario Básico</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex items-center gap-3 mt-2 bg-neutral-800/50 p-4 rounded-lg border border-neutral-700/50">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-neutral-600 text-iskf-red focus:ring-iskf-red bg-neutral-700"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-neutral-300 cursor-pointer">
                  Usuario Activo (Permitir acceso)
                </label>
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-neutral-800 bg-neutral-900 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={loading}
            className="px-6 py-2.5 bg-iskf-red hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(190,19,34,0.3)]"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : null}
            Crear Usuario
          </button>
        </div>
      </div>

      <AlertModal 
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: '' })}
        title="Error"
        message={alertModal.message}
        isError={true}
      />
    </div>
  );
}
