import ContactSection from '../../components/sections/ContactSection';

export const metadata = {
  title: 'Contacto - ISKF Costa Rica',
  description: 'Comunícate con ISKF Costa Rica y afíliate a nuestra organización.',
};

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-white">
      <ContactSection />
    </div>
  );
}
