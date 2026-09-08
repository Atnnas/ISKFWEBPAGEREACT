"use client";
import React, { useState } from 'react';
import { createUser } from '../../app/admin/actions';
import AlertModal from '../ui/AlertModal';
import { X, UserPlus, Shield, Mail, User } from 'lucide-react';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] text-gray-900">
        <div className="flex justify-between items-center p-6 border-b border-gray-200/90 bg-gray-50/80">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#BE1622] block font-mono">
              Acceso a Plataforma
            </span>
            <h2 className="text-xl font-black text-[#2D2E83] tracking-tight">
              Agregar Nuevo Usuario
            </h2>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="user-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Nombre Completo (Opcional)
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. Sensei Juan Pérez"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Correo Electrónico (Google Auth) <span className="text-[#BE1622]">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="ejemplo@iskfcostarica.com"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-all"
              />
              <p className="text-[11px] text-gray-500 mt-1 font-medium">El usuario utilizará esta cuenta de correo para autenticarse en el sistema.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Rol de Acceso en el Panel
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-bold focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-all cursor-pointer"
              >
                <option value="user">Usuario Básico (Lectura)</option>
                <option value="editor">Editor (Técnico / Calendario)</option>
                <option value="admin">Administrador (Control Total)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-5 h-5 rounded-lg border-gray-300 text-[#2D2E83] focus:ring-[#2D2E83] cursor-pointer"
              />
              <label htmlFor="isActive" className="text-xs font-bold text-gray-800 cursor-pointer">
                Usuario Activo (Permitir acceso inmediato a la plataforma)
              </label>
            </div>
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
            form="user-form"
            disabled={loading}
            className="px-6 py-2.5 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-[#2D2E83]/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : null}
            <span>Crear Usuario</span>
          </button>
        </div>
      </div>

      <AlertModal 
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: '' })}
        title="Atención"
        message={alertModal.message}
        isError={true}
      />
    </div>
  );
}
