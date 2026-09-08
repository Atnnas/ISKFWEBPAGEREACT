import React from 'react';
import AdminCalendar from '../../../components/admin/AdminCalendar';
import { getEvents } from '../../../lib/actions/events';
import { getEntities } from '../../../lib/actions/entities';
import { getDojosAdmin } from '../../admin/actions';
import { Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
    title: 'Gestión de Calendario - Admin ISKF',
};

export default async function AdminEventsPage() {
    const events = await getEvents();
    const entities = await getEntities();
    const dojos = await getDojosAdmin();

    const organizers = [
        ...entities.map(e => ({ value: e.name, label: e.name, logoUrl: e.logoUrl })),
        ...dojos.map(d => ({ value: d.name, label: d.name, logoUrl: d.logo }))
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <div className="border-b border-gray-200/80 pb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200/80 text-[#BE1622] text-xs font-bold uppercase tracking-widest font-mono mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Cronograma Oficial
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-[#2D2E83] tracking-tight uppercase">
                    Gestión de Calendario
                </h1>
                <p className="mt-2 text-sm md:text-base text-gray-600 font-medium">
                    Programa torneos, seminarios, exámenes y actividades de la federación. Usa la cuadrícula para añadir eventos multi-día.
                </p>
            </div>

            <AdminCalendar initialEvents={events} organizers={organizers} />
        </div>
    );
}
