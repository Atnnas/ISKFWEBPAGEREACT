"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { createEvent, updateEvent, deleteEvent } from '../../lib/actions/events';
import CustomSelect from '../ui/CustomSelect';
import ConfirmModal from '../ui/ConfirmModal';
import AlertModal from '../ui/AlertModal';

const countries = [
    { name: 'Costa Rica', flagName: 'costaRicaFlag', emoji: '🇨🇷', isNational: true },
    { name: 'México', flagName: 'mexicoFlag', emoji: '🇲🇽', isNational: false },
    { name: 'Nicaragua', flagName: 'nicaraguaFlag', emoji: '🇳🇮', isNational: false },
    { name: 'Brasil', flagName: 'brazilFlag', emoji: '🇧🇷', isNational: false },
    { name: 'República Dominicana', flagName: 'dominicanaFlag', emoji: '🇩🇴', isNational: false },
    { name: 'Italia', flagName: 'italiaFlag', emoji: '🇮🇹', isNational: false },
    { name: 'Polonia', flagName: 'polandFlag', emoji: '🇵🇱', isNational: false }
];

export default function AdminCalendar({ initialEvents, organizers = [], isAdmin = true }) {
    const [events, setEvents] = useState(initialEvents);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedCountry, setSelectedCountry] = useState('costaRicaFlag');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, eventId: null });
    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', isError: false });

    // Handle Form Submission
    const handleSubmit = async (e) => {
        if (!isAdmin) return;
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.target);
        
        let res;
        if (selectedEvent) {
            res = await updateEvent(selectedEvent.id, formData);
        } else {
            res = await createEvent(formData);
        }

        if (res?.success) {
            window.location.reload();
        } else {
            setAlertModal({ 
                isOpen: true, 
                message: 'Error al guardar el evento: ' + (res?.error || 'Desconocido'), 
                isError: true 
            });
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmModal({ isOpen: true, eventId: id });
    };

    const confirmDelete = async () => {
        const id = confirmModal.eventId;
        if (!id) return;
        setIsSubmitting(true);
        const res = await deleteEvent(id);
        if (res?.success) {
            window.location.reload();
        } else {
            setAlertModal({ isOpen: true, message: 'Error al eliminar el evento.', isError: true });
            setIsSubmitting(false);
        }
    };

    const openEditModal = (e, event) => {
        if (!isAdmin) return;
        e.stopPropagation();
        setSelectedEvent(event);
        setSelectedCountry(event.flagName || 'costaRicaFlag');
        setSelectedDate(null);
        setIsModalOpen(true);
    };



    return (
        <div className="w-full">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-gray-100">
                <h2 className="text-2xl font-black text-iskf-dark uppercase tracking-widest flex items-center gap-3">
                    <CalendarIcon className="text-iskf-red w-8 h-8" />
                    Gestión de Eventos
                </h2>
                {isAdmin && (
                    <button 
                        onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            setSelectedDate(today);
                            setSelectedEvent(null);
                            setSelectedCountry('costaRicaFlag');
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-iskf-dark text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-iskf-red transition-colors shadow-md"
                    >
                        <Plus size={18} />
                        Nuevo Evento
                    </button>
                )}
            </div>

            {/* Lista de Eventos */}
            {isAdmin && (
                <div className="bg-white p-6 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.05)] border border-gray-100">
                    <h3 className="text-xl font-black text-iskf-dark uppercase tracking-widest mb-6 flex items-center gap-2">
                        <CalendarIcon className="text-iskf-red w-6 h-6" />
                        Lista de Todos los Eventos
                    </h3>
                    
                    {events.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 font-medium">
                            No hay eventos registrados aún. Usa el botón "Nuevo Evento" para comenzar.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-gray-100">
                                        <th className="py-3 px-4 font-bold text-gray-400 uppercase tracking-widest text-xs">Título</th>
                                        <th className="py-3 px-4 font-bold text-gray-400 uppercase tracking-widest text-xs">Organizador</th>
                                        <th className="py-3 px-4 font-bold text-gray-400 uppercase tracking-widest text-xs">Fechas</th>
                                        <th className="py-3 px-4 font-bold text-gray-400 uppercase tracking-widest text-xs">Tipo</th>
                                        <th className="py-3 px-4 font-bold text-gray-400 uppercase tracking-widest text-xs">Ubicación</th>
                                        <th className="py-3 px-4 font-bold text-gray-400 uppercase tracking-widest text-xs text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map(ev => {
                                        const start = new Date(ev.startDate).toLocaleDateString('es-ES', { timeZone: 'UTC' });
                                        const end = new Date(ev.endDate).toLocaleDateString('es-ES', { timeZone: 'UTC' });
                                        
                                        return (
                                            <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-4 font-bold text-gray-900">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${ev.color || 'bg-iskf-red'}`}></div>
                                                        <span>{ev.title}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2.5">
                                                        <img 
                                                            src={ev.logoName || '/images/dojos/iskf.jpg'} 
                                                            alt={ev.organizer || 'ISKF'} 
                                                            className="w-7 h-7 rounded-full object-contain border border-gray-200 bg-white p-0.5 flex-shrink-0 shadow-sm"
                                                            onError={(e) => { e.target.onerror = null; e.target.src = '/images/dojos/iskf.jpg'; }}
                                                        />
                                                        <span className="font-semibold text-gray-800">{ev.organizer || 'ISKF Costa Rica'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-600 font-medium">
                                                    {start === end ? start : `${start} - ${end}`}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-600">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit">
                                                            {ev.type}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                                            {ev.locationScope}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base">{countries.find(c => c.flagName === ev.flagName)?.emoji || '🇨🇷'}</span>
                                                        <span>{ev.location || <span className="text-gray-400 italic">No especificada</span>}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => openEditModal(e, ev)}
                                                            className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors inline-flex items-center"
                                                            title="Editar Evento"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleDeleteClick(ev.id)}
                                                            className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors inline-flex items-center"
                                                            title="Eliminar Evento"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isAdmin && isModalOpen && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-iskf-dark/60 backdrop-blur-sm"
                            onClick={() => !isSubmitting && setIsModalOpen(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-lg relative z-10 shadow-2xl"
                        >
                            <h3 className="text-2xl font-black text-iskf-dark uppercase tracking-widest mb-6 border-b pb-4">
                                {selectedEvent ? 'Editar Evento' : 'Crear Evento'}
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Título del Evento</label>
                                    <input 
                                        type="text" 
                                        name="title" 
                                        defaultValue={selectedEvent?.title || ''}
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-iskf-red/50 focus:border-iskf-red transition-all"
                                        placeholder="Ej: Seminario Internacional"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Fecha Inicio</label>
                                        <input 
                                            type="date" 
                                            name="startDate" 
                                            defaultValue={selectedEvent ? selectedEvent.startDate.split('T')[0] : selectedDate}
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-iskf-red/50 focus:border-iskf-red transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Fecha Fin</label>
                                        <input 
                                            type="date" 
                                            name="endDate" 
                                            defaultValue={selectedEvent ? selectedEvent.endDate.split('T')[0] : selectedDate}
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-iskf-red/50 focus:border-iskf-red transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">País del Evento</label>
                                                        <select 
                                                            name="flagName" 
                                                            value={selectedCountry}
                                                            onChange={(e) => setSelectedCountry(e.target.value)}
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-iskf-red/50 focus:border-iskf-red transition-all"
                                                        >
                                                            {countries.map((c) => (
                                                                <option key={c.flagName} value={c.flagName}>
                                                                    {c.emoji} {c.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Alcance (Auto-determinado)</label>
                                                        <input type="hidden" name="locationScope" value={countries.find(c => c.flagName === selectedCountry)?.isNational ? 'Nacional' : 'Internacional'} />
                                                        <select 
                                                            disabled
                                                            value={countries.find(c => c.flagName === selectedCountry)?.isNational ? 'Nacional' : 'Internacional'}
                                                            className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-500 cursor-not-allowed"
                                                        >
                                                            <option value="Nacional">Nacional</option>
                                                            <option value="Internacional">Internacional</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tipo de Evento</label>
                                                        <select 
                                                            name="type" 
                                                            defaultValue={selectedEvent?.type || 'Torneo'}
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-iskf-red/50 focus:border-iskf-red transition-all"
                                                        >
                                                            <option value="Torneo">Torneo</option>
                                                            <option value="Seminario">Seminario</option>
                                                            <option value="Examen">Examen</option>
                                                            <option value="Campamento">Campamento</option>
                                                            <option value="Otro">Otro</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Organizador</label>
                                                        <CustomSelect 
                                                            name="organizer" 
                                                            defaultValue={selectedEvent?.organizer || (organizers.length > 0 ? organizers[0].value : '')}
                                                            options={organizers}
                                                            placeholder="Seleccionar organizador..."
                                                        />
                                                    </div>
                                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Ubicación</label>
                                    <div className="relative">
                                        <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="text" 
                                            name="location" 
                                            defaultValue={selectedEvent?.location || ''}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-iskf-red/50 focus:border-iskf-red transition-all"
                                            placeholder="Ej: Honbu Dojo, San José"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 mt-6 border-t border-gray-100">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 font-bold uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 px-4 bg-iskf-red text-white font-black uppercase tracking-widest rounded-xl shadow-md hover:bg-red-700 hover:shadow-lg transition-all disabled:opacity-50 text-sm"
                                    >
                                        {isSubmitting ? 'Guardando...' : 'Guardar Evento'}
                                    </button>
                                </div>
                            </form>

                            {selectedEvent && (
                                <button 
                                    onClick={() => handleDeleteClick(selectedEvent.id)}
                                    disabled={isSubmitting}
                                    className="absolute top-8 right-8 text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                                    title="Eliminar Evento"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, eventId: null })}
                onConfirm={confirmDelete}
                title="Eliminar Evento"
                message="¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer y lo borrará permanentemente de la base de datos."
                confirmText="Eliminar"
                isDanger={true}
            />

            <AlertModal 
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                title={alertModal.isError ? "Error" : "Atención"}
                message={alertModal.message}
                isError={alertModal.isError}
            />
        </div>
    );
}
