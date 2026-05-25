'use client';

import { useState } from 'react';
import { updateUserRole, updateUserStatus } from '../../app/admin/actions';
import AlertModal from '../ui/AlertModal';
import UserEditModal from './UserEditModal';

export default function UsersTable({ initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingId, setLoadingId] = useState(null);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setLoadingId(userId);
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      setAlertModal({ isOpen: true, message: "Error al cambiar el rol. Por favor intenta de nuevo." });
    } finally {
      setLoadingId(null);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      setLoadingId(userId);
      const newStatus = !currentStatus;
      await updateUserStatus(userId, newStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, isActive: newStatus } : u));
    } catch (error) {
      setAlertModal({ isOpen: true, message: "Error al cambiar el estado. Por favor intenta de nuevo." });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-700">
        <thead className="bg-neutral-800/50">
          <tr>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Usuario
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Rol
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Estado
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Registrado
            </th>
          </tr>
        </thead>
        <tbody className="bg-neutral-800 divide-y divide-neutral-700">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-neutral-700/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img className="h-10 w-10 rounded-full border border-neutral-600 object-cover" src={user.image} alt="" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-white">{user.name}</div>
                    <div className="text-sm text-neutral-400">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  disabled={loadingId === user.id}
                  className="bg-neutral-900 border border-neutral-600 text-white text-sm rounded-lg focus:ring-iskf-red focus:border-iskf-red block w-full p-2.5 disabled:opacity-50"
                >
                  <option value="visor">Visor</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Administrador</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => handleStatusToggle(user.id, user.isActive)}
                  disabled={loadingId === user.id}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-iskf-red focus:ring-offset-2 focus:ring-offset-neutral-800 disabled:opacity-50 ${user.isActive ? 'bg-green-500' : 'bg-neutral-600'}`}
                  role="switch"
                  aria-checked={user.isActive}
                >
                  <span className="sr-only">Toggle status</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${user.isActive ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
                <span className="ml-3 text-sm text-neutral-300">
                  {user.isActive ? 'Activo' : 'Bloqueado'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan="4" className="px-6 py-8 text-center text-neutral-400">
                No hay usuarios registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <AlertModal 
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: '' })}
        title="Atención"
        message={alertModal.message}
        isError={true}
      />

      <UserEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaveSuccess={(newUser) => {
          if (newUser) {
             setUsers([newUser, ...users]);
          } else {
             window.location.reload();
          }
        }}
      />

      {/* Floating Action Button */}
      <button
        onClick={() => setIsEditModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-iskf-red hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-300 hover:scale-110 z-50 group"
        title="Agregar Nuevo Usuario"
      >
        <svg className="w-7 h-7 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
