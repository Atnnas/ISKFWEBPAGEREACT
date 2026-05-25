import EventDetailPage from '../../../components/pages/EventDetailPage';
import { getEventById } from '../../../lib/actions/events';

export default async function Page({ params }) {
  // En Next.js 15, params es asíncrono
  const resolvedParams = await params;
  const event = await getEventById(resolvedParams.id);
  
  return <EventDetailPage eventData={event} />;
}
