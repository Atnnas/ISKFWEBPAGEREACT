'use client';

import { useState } from 'react';
import { updateUserRole, updateUserStatus } from '../../app/admin/actions';
import AlertModal from '../ui/AlertModal';
import UserEditModal from './UserEditModal';
import { UserPlus, Shield, UserCheck, UserX } from 'lucide-react';

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
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center p-6 border-b border-gray-200/90 gap-4 bg-gray-50/50">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Listado de Usuarios</h2>
          <p className="text-xs text-gray-500 font-medium">Gestiona los permisos y roles de acceso para el personal técnico y administradores.</p>
        </div>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="px-5 py-2.5 bg-[#2D2E83] hover:bg-[#232468] text-white rounded-2xl transition-all shadow-md shadow-[#2D2E83]/20 font-bold text-xs sm:text-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm text-gray-600">
          <thead className="bg-gray-100/80 text-gray-700 uppercase font-bold text-xs border-b border-gray-200">
            <tr>
              <th scope="col" className="px-6 py-4">
                Usuario
              </th>
              <th scope="col" className="px-6 py-4">
                Rol
              </th>
              <th scope="col" className="px-6 py-4">
                Estado
              </th>
              <th scope="col" className="px-6 py-4 text-right">
                Fecha Registro
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        className="h-10 w-10 rounded-full border border-gray-200 object-cover shadow-xs" 
                        src={user.image || '/images/dojos/default_sensei.jpg'} 
                        alt="" 
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-gray-900">{user.name || 'Sin nombre'}</div>
                      <div className="text-xs text-gray-500 font-mono">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={loadingId === user.id}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-xs font-bold rounded-xl focus:ring-1 focus:ring-[#2D2E83] focus:border-[#2D2E83] block w-40 p-2 disabled:opacity-50 cursor-pointer"
                  >
                    <option value="visor">Visor (Lectura)</option>
                    <option value="editor">Editor (Técnico)</option>
                    <option value="admin">Administrador (Total)</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleStatusToggle(user.id, user.isActive)}
                      disabled={loadingId === user.id}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#2D2E83] focus:ring-offset-2 disabled:opacity-50 ${user.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      role="switch"
                      aria-checked={user.isActive}
                      title={user.isActive ? "Desactivar acceso" : "Activar acceso"}
                    >
                      <span className="sr-only">Cambiar estado</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${user.isActive ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                    <span className={`text-xs font-bold ${user.isActive ? 'text-emerald-700' : 'text-gray-400'}`}>
                      {user.isActive ? 'Activo' : 'Bloqueado'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono text-right">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-CR') : '—'}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-medium">
                  No hay usuarios registrados en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
    </div>
  );
}
