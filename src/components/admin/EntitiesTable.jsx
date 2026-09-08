"use client";
import React, { useState } from 'react';
import EntityEditModal from './EntityEditModal';
import ConfirmModal from '../ui/ConfirmModal';
import AlertModal from '../ui/AlertModal';
import { deleteEntity } from '../../lib/actions/entities';
import { Plus, Globe, Edit2, Trash2 } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center p-6 border-b border-gray-200/90 gap-4 bg-gray-50/50">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Listado de Entidades</h2>
          <p className="text-xs text-gray-500 font-medium">Gestiona las federaciones y organizaciones marciales asociadas a los eventos oficiales.</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-5 py-2.5 bg-[#BE1622] hover:bg-[#9c0f1b] text-white rounded-2xl transition-all shadow-md shadow-[#BE1622]/20 font-bold text-xs sm:text-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Entidad</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-100/80 text-gray-700 uppercase font-bold text-xs border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Entidad Organizadora</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {entities.map((entity) => (
              <tr key={entity._id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={entity.logoUrl || '/images/dojos/default_logo.jpg'} 
                      alt={entity.name} 
                      className="w-11 h-11 rounded-xl bg-white border border-gray-200 object-contain p-1 shadow-xs" 
                    />
                    <div>
                      <div className="text-gray-900 font-bold text-sm sm:text-base">{entity.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(entity)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#2D2E83] bg-blue-50 hover:bg-blue-100 border border-blue-200/70 transition-colors cursor-pointer"
                      disabled={loading}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(entity._id)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#BE1622] bg-red-50 hover:bg-red-100 border border-red-200/70 transition-colors cursor-pointer"
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
                <td colSpan="2" className="px-6 py-12 text-center text-gray-400 font-medium">
                  No hay entidades registradas en el sistema.
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
