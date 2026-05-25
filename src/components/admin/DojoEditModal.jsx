"use client";
import React, { useState, useEffect } from 'react';
import { createDojo, updateDojo } from '../../app/admin/actions';
import AlertModal from '../ui/AlertModal';

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
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-12 md:pt-24 bg-black/80 backdrop-blur-sm overflow-y-auto custom-scrollbar">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl w-full max-w-3xl mb-12 relative overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
          <h2 className="text-xl font-bold text-white">
            {dojo ? 'Editar Dojo' : 'Crear Nuevo Dojo'}
          </h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <form id="dojo-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider border-b border-neutral-800 pb-2">Información Principal</h3>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">ID Único (sin espacios)</label>
                  <input required type="text" name="idName" value={formData.idName} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors" placeholder="ej. kamae" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Nombre del Dojo</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Provincia</label>
                  <input required type="text" name="province" value={formData.province} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider border-b border-neutral-800 pb-2">Información del Sensei</h3>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Nombre del Sensei</label>
                  <input required type="text" name="sensei" value={formData.sensei} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Rango (Dan)</label>
                    <input type="text" name="rank" value={formData.rank} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Profesión</label>
                    <input type="text" name="profession" value={formData.profession} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider border-b border-neutral-800 pb-2">Contacto y Ubicación</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Teléfono</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Website</label>
                    <input type="text" name="website" value={formData.website} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Dirección Física</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} rows="2" className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">URL de Mapa (Waze/Google Maps)</label>
                  <input type="text" name="detailsUrl" value={formData.detailsUrl} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider border-b border-neutral-800 pb-2">Multimedia (Logos y Fotos)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Logo Upload */}
                  <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700">
                    <label className="block text-sm font-medium text-neutral-400 mb-3">Logo del Dojo</label>
                    <div className="flex items-start gap-4">
                      <div className="relative group shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formData.logo} alt="Logo" className="w-20 h-20 object-cover rounded-lg bg-white border border-neutral-600" />
                        <button 
                          type="button" 
                          onClick={() => clearImage('logo')}
                          className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg transition-transform hover:scale-110"
                          title="Eliminar logo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
                        </button>
                      </div>
                      <div className="flex-1 w-full overflow-hidden">
                        <label className="block w-full text-center px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg cursor-pointer transition-colors text-sm font-medium mb-2">
                          Subir Nuevo Logo
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" />
                        </label>
                        <input type="text" name="logo" value={formData.logo} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-400 focus:outline-none focus:border-red-500 transition-colors truncate" placeholder="O pega una URL aquí..." />
                      </div>
                    </div>
                  </div>

                  {/* Sensei Image Upload */}
                  <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700">
                    <label className="block text-sm font-medium text-neutral-400 mb-3">Foto del Sensei</label>
                    <div className="flex items-start gap-4">
                      <div className="relative group shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formData.senseiImage} alt="Sensei" className="w-20 h-20 object-cover rounded-lg bg-neutral-800 border border-neutral-600" />
                        <button 
                          type="button" 
                          onClick={() => clearImage('senseiImage')}
                          className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg transition-transform hover:scale-110"
                          title="Eliminar foto"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
                        </button>
                      </div>
                      <div className="flex-1 w-full overflow-hidden">
                        <label className="block w-full text-center px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg cursor-pointer transition-colors text-sm font-medium mb-2">
                          Subir Nueva Foto
                          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'senseiImage')} className="hidden" />
                        </label>
                        <input type="text" name="senseiImage" value={formData.senseiImage} onChange={handleChange} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-400 focus:outline-none focus:border-red-500 transition-colors truncate" placeholder="O pega una URL aquí..." />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-800 bg-neutral-950 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-6 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors font-medium">
            Cancelar
          </button>
          <button type="submit" form="dojo-form" disabled={loading} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors font-medium flex items-center gap-2 disabled:opacity-50">
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Guardar Dojo
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
