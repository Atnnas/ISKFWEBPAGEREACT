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
            <div className="flex justify-between items-end border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-iskf-dark uppercase tracking-widest flex items-center gap-4">
                        <Calendar className="text-iskf-red w-10 h-10" />
                        Calendario
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm font-medium tracking-wide">
                        Gestiona los eventos oficiales. Usa la cuadrícula para añadir pastillas multi-día.
                    </p>
                </div>
            </div>

            <AdminCalendar initialEvents={events} organizers={organizers} />
        </div>
    );
}
