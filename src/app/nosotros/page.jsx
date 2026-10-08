import AboutSection from '../../components/sections/About';

export const metadata = {
  title: 'Nosotros - ISKF Costa Rica',
  description: 'Conoce sobre la ISKF Costa Rica, nuestra misión, visión y estructura.',
};

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-iskf-dark">
      <AboutSection />
    </div>
  );
}
