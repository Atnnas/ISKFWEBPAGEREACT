"use client";
import React, { useState } from 'react';
import DojoEditModal from './DojoEditModal';
import ConfirmModal from '../ui/ConfirmModal';
import AlertModal from '../ui/AlertModal';
import { deleteDojo } from '../../app/admin/actions';

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
      <div className="flex justify-between items-center p-6 border-b border-neutral-700">
        <h2 className="text-xl font-bold text-white">Listado de Dojos</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Dojo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-400">
          <thead className="bg-neutral-900/50 text-neutral-300 uppercase font-semibold text-xs">
            <tr>
              <th className="px-6 py-4">Dojo</th>
              <th className="px-6 py-4">Sensei</th>
              <th className="px-6 py-4">Provincia</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700">
            {dojos.map((dojo) => (
              <tr key={dojo._id} className="hover:bg-neutral-700/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={dojo.logo} alt={dojo.name} className="w-10 h-10 rounded bg-white object-contain p-1" />
                    <div>
                      <div className="text-white font-medium">{dojo.name}</div>
                      <div className="text-xs">{dojo.idName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-white">{dojo.sensei}</div>
                  <div className="text-xs">{dojo.rank}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-neutral-700 text-neutral-300 rounded-full text-xs font-medium">
                    {dojo.province}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(dojo)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                      disabled={loading}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(dojo._id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
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
                <td colSpan="4" className="px-6 py-12 text-center text-neutral-500">
                  No hay dojos registrados
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
