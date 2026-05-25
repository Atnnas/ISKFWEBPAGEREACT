"use client";
import React, { useState } from 'react';
import EntityEditModal from './EntityEditModal';
import ConfirmModal from '../ui/ConfirmModal';
import AlertModal from '../ui/AlertModal';
import { deleteEntity } from '../../lib/actions/entities';

export default function EntitiesTable({ initialEntities }) {
  const [entities, setEntities] = useState(initialEntities);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, entityId: null });
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });

  const handleEdit = (entity) => {
    setSelectedEntity(entity);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedEntity(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setConfirmModal({ isOpen: true, entityId: id });
  };

  const confirmDelete = async () => {
    const id = confirmModal.entityId;
    if (!id) return;
    
    setLoading(true);
    try {
      await deleteEntity(id);
      setEntities(entities.filter(d => d._id !== id));
    } catch (error) {
      console.error(error);
      setAlertModal({ isOpen: true, message: "Error al eliminar la entidad. Por favor intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  const onSaveSuccess = (updatedEntity, isNew) => {
    if (isNew) {
      setEntities([updatedEntity, ...entities]);
    } else {
      setEntities(entities.map(d => (d._id === updatedEntity._id ? updatedEntity : d)));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center p-6 border-b border-neutral-700">
        <h2 className="text-xl font-bold text-white">Listado de Entidades Organizadoras</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-iskf-red hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Entidad
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-400">
          <thead className="bg-neutral-900/50 text-neutral-300 uppercase font-semibold text-xs">
            <tr>
              <th className="px-6 py-4">Entidad</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700">
            {entities.map((entity) => (
              <tr key={entity._id} className="hover:bg-neutral-700/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entity.logoUrl} alt={entity.name} className="w-10 h-10 rounded bg-white object-contain p-1" />
                    <div>
                      <div className="text-white font-medium">{entity.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(entity)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                      disabled={loading}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(entity._id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {entities.length === 0 && (
              <tr>
                <td colSpan="2" className="px-6 py-12 text-center text-neutral-500">
                  No hay entidades registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EntityEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entity={selectedEntity}
        onSaveSuccess={onSaveSuccess}
      />

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, entityId: null })}
        onConfirm={confirmDelete}
        title="Eliminar Entidad"
        message="¿Estás seguro de que deseas eliminar esta Entidad? Esta acción no se puede deshacer."
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
