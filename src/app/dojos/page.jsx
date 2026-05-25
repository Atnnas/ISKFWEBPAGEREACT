import DojosSection from '../../components/sections/DojosSection';
import { getDojosPublic } from '../admin/actions';

export const metadata = {
  title: 'Dojos - ISKF Costa Rica',
  description: 'Explora nuestros Dojos en todo el país.',
};

export default async function DojosPage() {
  const dojos = await getDojosPublic();

  return (
    <div className="min-h-screen bg-white">
      <DojosSection dojos={dojos} />
    </div>
  );
}
