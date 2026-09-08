"use client";
import React, { useState } from 'react';
import DojoEditModal from './DojoEditModal';
import ConfirmModal from '../ui/ConfirmModal';
import AlertModal from '../ui/AlertModal';
import { deleteDojo } from '../../app/admin/actions';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';

export default function DojosTable({ initialDojos }) {
  const [dojos, setDojos] = useState(initialDojos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDojo, setSelectedDojo] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, dojoId: null });
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });

  const handleEdit = (dojo) => {
    setSelectedDojo(dojo);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedDojo(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setConfirmModal({ isOpen: true, dojoId: id });
  };

  const confirmDelete = async () => {
    const id = confirmModal.dojoId;
    if (!id) return;
    
    setLoading(true);
    try {
      await deleteDojo(id);
      setDojos(dojos.filter(d => d._id !== id));
    } catch (error) {
      console.error(error);
      setAlertModal({ isOpen: true, message: "Error al eliminar el Dojo. Por favor intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  const onSaveSuccess = (updatedDojo, isNew) => {
    if (isNew) {
      setDojos([updatedDojo, ...dojos]);
    } else {
      setDojos(dojos.map(d => (d._id === updatedDojo._id ? updatedDojo : d)));
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center p-6 border-b border-gray-200/90 gap-4 bg-gray-50/50">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Listado de Dojos</h2>
          <p className="text-xs text-gray-500 font-medium">Gestiona y actualiza los dojos oficiales de ISKF Costa Rica.</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-5 py-2.5 bg-[#BE1622] hover:bg-[#9c0f1b] text-white rounded-2xl transition-all shadow-md shadow-[#BE1622]/20 font-bold text-xs sm:text-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Dojo</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-100/80 text-gray-700 uppercase font-bold text-xs border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Dojo</th>
              <th className="px-6 py-4">Sensei</th>
              <th className="px-6 py-4">Provincia</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dojos.map((dojo) => (
              <tr key={dojo._id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={dojo.logo || '/images/dojos/escudo.jpg'} 
                      alt={dojo.name} 
                      className="w-11 h-11 rounded-xl bg-white border border-gray-200 object-contain p-1 shadow-xs" 
                    />
                    <div>
                      <div className="text-gray-900 font-bold text-sm sm:text-base leading-snug">{dojo.name}</div>
                      <div className="text-xs text-gray-500 font-mono">ID: {dojo.idName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-900 font-bold">{dojo.sensei}</div>
                  <div className="text-xs text-gray-500 font-medium">{dojo.rank || 'Sensei'}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-bold">
                    <MapPin className="w-3 h-3 text-[#BE1622]" />
                    {dojo.province}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(dojo)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#2D2E83] bg-blue-50 hover:bg-blue-100 border border-blue-200/70 transition-colors cursor-pointer"
                      disabled={loading}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(dojo._id)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#BE1622] bg-red-50 hover:bg-red-100 border border-red-200/70 transition-colors cursor-pointer"
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {dojos.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-medium">
                  No hay dojos registrados actualmente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DojoEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dojo={selectedDojo}
        onSaveSuccess={onSaveSuccess}
      />

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, dojoId: null })}
        onConfirm={confirmDelete}
        title="Eliminar Dojo"
        message="¿Estás seguro de que deseas eliminar este Dojo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        isDanger={true}
      />

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
