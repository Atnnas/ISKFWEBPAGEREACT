"use client";
import React, { useState, useEffect } from 'react';
import { createDojo, updateDojo } from '../../app/admin/actions';
import AlertModal from '../ui/AlertModal';
import { X, Upload, Trash2, Check, MapPin, User, Building2 } from 'lucide-react';

export default function DojoEditModal({ isOpen, onClose, dojo, onSaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
  const [formData, setFormData] = useState({
    idName: '',
    name: '',
    province: '',
    sensei: '',
    senseiImage: '/images/dojos/default_sensei.jpg',
    rank: '',
    profession: '',
    logo: '/images/dojos/default_logo.jpg',
    phone: '',
    email: '',
    fax: '',
    website: '',
    address: '',
    detailsUrl: '#'
  });

  useEffect(() => {
    if (dojo) {
      setFormData({ ...dojo });
    } else {
      setFormData({
        idName: '', name: '', province: '', sensei: '',
        senseiImage: '/images/dojos/default_sensei.jpg', rank: '', profession: '',
        logo: '/images/dojos/default_logo.jpg', phone: '', email: '', fax: '',
        website: '', address: '', detailsUrl: '#'
      });
    }
  }, [dojo, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setAlertModal({ isOpen: true, message: 'La imagen es demasiado grande. El máximo permitido es 2MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'logo' ? '/images/dojos/default_logo.jpg' : '/images/dojos/default_sensei.jpg'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (dojo) {
        await updateDojo(dojo._id, formData);
        onSaveSuccess(formData, false);
      } else {
        const res = await createDojo(formData);
        onSaveSuccess({ ...formData, _id: res.id }, true);
      }
      onClose();
    } catch (error) {
      console.error(error);
      setAlertModal({ isOpen: true, message: "Error al guardar los datos del Dojo. Intenta nuevamente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 md:pt-20 bg-black/60 backdrop-blur-sm overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl w-full max-w-3xl mb-12 relative overflow-hidden flex flex-col text-gray-900">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/90 flex justify-between items-center bg-gray-50/80">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#BE1622] block font-mono">
              Gestión de Afiliación
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#2D2E83] tracking-tight">
              {dojo ? `Editar Dojo: ${dojo.name}` : 'Crear Nuevo Dojo Oficial'}
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

        {/* Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto custom-scrollbar">
          <form id="dojo-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#BE1622] uppercase tracking-wider border-b border-gray-200 pb-2">
                  Información Principal
                </h3>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    ID Único (sin espacios)
                  </label>
                  <input 
                    required 
                    type="text" 
                    name="idName" 
                    value={formData.idName} 
                    onChange={handleChange} 
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-colors" 
                    placeholder="ej. kamae" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nombre del Dojo
                  </label>
                  <input 
                    required 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Provincia
                  </label>
                  <input 
                    required 
                    type="text" 
                    name="province" 
                    value={formData.province} 
                    onChange={handleChange} 
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-colors" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#BE1622] uppercase tracking-wider border-b border-gray-200 pb-2">
                  Información del Sensei
                </h3>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nombre del Sensei
                  </label>
                  <input 
                    required 
                    type="text" 
                    name="sensei" 
                    value={formData.sensei} 
                    onChange={handleChange} 
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-colors" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Rango (Dan)
                    </label>
                    <input 
                      type="text" 
                      name="rank" 
                      value={formData.rank} 
                      onChange={handleChange} 
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Profesión
                    </label>
                    <input 
                      type="text" 
                      name="profession" 
                      value={formData.profession} 
                      onChange={handleChange} 
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-colors" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <h3 className="text-xs font-bold text-[#BE1622] uppercase tracking-wider border-b border-gray-200 pb-2">
                  Contacto y Ubicación
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Teléfono
                    </label>
                    <input 
                      type="text" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange} 
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Email
                    </label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Website
                    </label>
                    <input 
                      type="text" 
                      name="website" 
                      value={formData.website} 
                      onChange={handleChange} 
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-colors" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Dirección Física
                  </label>
                  <textarea 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    rows="2" 
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    URL de Mapa (Waze/Google Maps)
                  </label>
                  <input 
                    type="text" 
                    name="detailsUrl" 
                    value={formData.detailsUrl} 
                    onChange={handleChange} 
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-medium focus:outline-none focus:border-[#2D2E83] focus:ring-1 focus:ring-[#2D2E83] transition-colors" 
                  />
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <h3 className="text-xs font-bold text-[#BE1622] uppercase tracking-wider border-b border-gray-200 pb-2">
                  Multimedia (Logos y Fotos)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Logo Upload */}
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                      Logo del Dojo
                    </label>
                    <div className="flex items-start gap-4">
                      <div className="relative group shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={formData.logo} 
                          alt="Logo" 
                          className="w-20 h-20 object-contain rounded-xl bg-white border border-gray-200 p-1 shadow-sm" 
                        />
                        <button 
                          type="button" 
                          onClick={() => clearImage('logo')}
                          className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg transition-transform hover:scale-110 cursor-pointer"
                          title="Eliminar logo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex-1 w-full overflow-hidden">
                        <label className="block w-full text-center px-4 py-2.5 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl cursor-pointer transition-colors text-xs font-bold mb-2 shadow-sm">
                          Subir Nuevo Logo
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" />
                        </label>
                        <input 
                          type="text" 
                          name="logo" 
                          value={formData.logo} 
                          onChange={handleChange} 
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:border-[#2D2E83] transition-colors truncate" 
                          placeholder="O pega una URL aquí..." 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sensei Image Upload */}
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                      Foto del Sensei
                    </label>
                    <div className="flex items-start gap-4">
                      <div className="relative group shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={formData.senseiImage} 
                          alt="Sensei" 
                          className="w-20 h-20 object-cover rounded-xl bg-white border border-gray-200 shadow-sm" 
                        />
                        <button 
                          type="button" 
                          onClick={() => clearImage('senseiImage')}
                          className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg transition-transform hover:scale-110 cursor-pointer"
                          title="Eliminar foto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex-1 w-full overflow-hidden">
                        <label className="block w-full text-center px-4 py-2.5 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-xl cursor-pointer transition-colors text-xs font-bold mb-2 shadow-sm">
                          Subir Nueva Foto
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'senseiImage')} className="hidden" />
                        </label>
                        <input 
                          type="text" 
                          name="senseiImage" 
                          value={formData.senseiImage} 
                          onChange={handleChange} 
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:border-[#2D2E83] transition-colors truncate" 
                          placeholder="O pega una URL aquí..." 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose} 
            disabled={loading} 
            className="px-5 py-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors font-bold text-xs sm:text-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="dojo-form" 
            disabled={loading} 
            className="px-6 py-2.5 rounded-xl bg-[#BE1622] hover:bg-[#9c0f1b] text-white transition-all shadow-md shadow-[#BE1622]/20 font-bold text-xs sm:text-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            <span>{dojo ? 'Guardar Cambios' : 'Crear Dojo'}</span>
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
