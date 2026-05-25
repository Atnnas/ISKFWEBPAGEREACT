import KataDetailPage from '../../../../components/pages/KataDetailPage';
import { getKataById } from '../../../admin/actions';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const kata = await getKataById(resolvedParams.id);
  
  if (!kata) return { title: 'Kata No Encontrada' };
  
  return {
    title: `${kata.title} | ISKF Costa Rica`,
    description: `Detalles del kata ${kata.title} (${kata.meaning}).`,
  };
}

export default async function Page({ params }) {
  const resolvedParams = await params;
  const kataData = await getKataById(resolvedParams.id);
  return <KataDetailPage initialData={kataData} />;
}
