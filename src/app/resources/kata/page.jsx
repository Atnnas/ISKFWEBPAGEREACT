import KataListPage from '../../../components/pages/KataListPage';
import { getKatasPublic } from '../../admin/actions';

export const metadata = {
  title: 'Katas | ISKF Costa Rica',
  description: 'Lista oficial de Katas de la ISKF Costa Rica.',
};

export default async function Page() {
  const katasData = await getKatasPublic();
  return <KataListPage initialData={katasData} />;
}
