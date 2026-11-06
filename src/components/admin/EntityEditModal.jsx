"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createEntity, updateEntity } from '../../lib/actions/entities';
import AlertModal from '../ui/AlertModal';
import { X, Upload, Image as ImageIcon, Trash2, Check, FolderOpen, RefreshCw, Link as LinkIcon } from 'lucide-react';

const DEFAULT_LOGO = '/images/dojos/default_logo.jpg';

// Helper para procesar, redimensionar y optimizar la imagen cargada desde el equipo
function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type || !file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen válida (JPG, PNG, WEBP, etc.).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo desde el equipo.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo decodificar el formato de la imagen.'));
      img.onload = () => {
        // Redimensionar suavemente a un máximo de 800x800 px para máxima nitidez y peso ultra liviano (<100KB)
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const isPng = file.type === 'image/png' || file.type === 'image/svg+xml';
        const dataUrl = isPng 
          ? canvas.toDataURL('image/png') 
          : canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function EntityEditModal({ isOpen, onClose, entity, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: DEFAULT_LOGO,
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ isOpen: false, message: '', isError: false });
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (entity) {
      setFormData({
        name: entity.name || '',
        logoUrl: entity.logoUrl || DEFAULT_LOGO,
      });
      setFileName('');
      setShowUrlFallback(false);
    } else {
      setFormData({
        name: '',
        logoUrl: DEFAULT_LOGO,
      });
      setFileName('');
      setShowUrlFallback(false);
    }
  }, [entity, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const dataUrl = await processImageFile(file);
      setFormData(prev => ({ ...prev, logoUrl: dataUrl }));
      setFileName(file.name);
    } catch (err) {
      setAlert({
        isOpen: true,
        message: err.message || 'Error al procesar la imagen seleccionada.',
        isError: true
      });
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, logoUrl: DEFAULT_LOGO }));
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const hasCustomLogo = formData.logoUrl && formData.logoUrl !== DEFAULT_LOGO;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-gray-900">
        
        {/* Header */}
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

        {/* Form Body */}
        <div className="overflow-y-auto p-6 custom-scrollbar">
          <form id="entity-form" onSubmit={handleSubmit} className="space-y-6">
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

            {/* Subida Directa de Foto / Logotipo desde el Equipo */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Foto o Logotipo de la Entidad
                </label>
                <span className="text-[10px] font-semibold text-[#2D2E83] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Subida directa desde el equipo
                </span>
              </div>

              {/* Input de archivo nativo oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />

              {!hasCustomLogo ? (
                /* Zona Drag & Drop cuando no hay imagen cargada */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-[#2D2E83] bg-blue-50/80 scale-[1.01]'
                      : 'border-gray-300 bg-gray-50/70 hover:bg-gray-100/80 hover:border-gray-400'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-[#2D2E83] shadow-xs">
                    {isProcessingImage ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-[#2D2E83]" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      {isProcessingImage
                        ? 'Procesando imagen...'
                        : 'Haz clic aquí para buscar la foto en tu equipo'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      o arrastra y suelta el archivo aquí (PNG, JPG, WEBP o SVG)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={isProcessingImage}
                    className="mt-1 px-4 py-2 bg-[#2D2E83] hover:bg-[#212261] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Seleccionar Archivo del Equipo</span>
                  </button>
                </div>
              ) : (
                /* Tarjeta de previsualización cuando ya hay imagen seleccionada */
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-4 shadow-2xs">
                  <div className="flex items-center gap-4">
                    <div className="relative group shrink-0">
                      <img 
                        src={formData.logoUrl} 
                        alt="Logotipo de la entidad" 
                        className="w-20 h-20 rounded-2xl bg-white p-2 object-contain shadow-xs border border-gray-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_LOGO;
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold mb-0.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>Foto lista para guardar</span>
                      </div>
                      <p className="text-xs font-medium text-gray-700 truncate" title={fileName || 'Logotipo oficial'}>
                        {fileName || 'Logotipo oficial cargado'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Guardado directamente en el sistema de la entidad
                      </p>

                      <div className="flex items-center gap-2 mt-2.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isProcessingImage}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2D2E83] border border-blue-200 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <FolderOpen className="w-3 h-3" />
                          <span>Cambiar Foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Quitar foto"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Quitar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Opción secundaria para pegar URL si se requiere */}
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => setShowUrlFallback(!showUrlFallback)}
                  className="text-[11px] text-gray-400 hover:text-gray-600 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LinkIcon className="w-2.5 h-2.5" />
                  <span>{showUrlFallback ? 'Ocultar opción de URL' : 'O pegar URL externa manual'}</span>
                </button>
              </div>

              {showUrlFallback && (
                <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    URL externa del Logotipo
                  </label>
                  <input
                    type="text"
                    name="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900 text-xs font-mono focus:outline-none focus:border-[#2D2E83]"
                    placeholder="https://... o /images/..."
                  />
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
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
            disabled={loading || isProcessingImage}
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
