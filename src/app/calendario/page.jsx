import EventsRoadmap from '../../components/sections/EventsRoadmap';
import { getEvents } from '../../lib/actions/events';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Calendario Oficial - ISKF Costa Rica',
  description: 'Roadmap de eventos oficiales de ISKF Costa Rica.',
};

export default async function CalendarioPage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-white">
      {/* Vista de Hoja de Ruta */}
      <EventsRoadmap events={events} />
    </div>
  );
}
