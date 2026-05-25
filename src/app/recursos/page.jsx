import ResourcesSection from '../../components/sections/ResourcesSection';

export const metadata = {
  title: 'Recursos - ISKF Costa Rica',
  description: 'Documentación y Recursos Técnicos de ISKF Costa Rica.',
};

export default function RecursosPage() {
  return (
    <div className="min-h-screen bg-white">
      <ResourcesSection />
    </div>
  );
}
