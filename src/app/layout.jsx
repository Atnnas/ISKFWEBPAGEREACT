import React from 'react';
import '../index.css'; // Make sure global css is imported
import Navbar from '../components/layout/Navbar';
import SocialSidebar from '../components/layout/SocialSidebar';
import Footer from '../components/layout/Footer';
import { Providers } from '../components/Providers';

export const metadata = {
  metadataBase: new URL('https://www.iskfcostarica.com'),
  title: 'ISKF Costa Rica | International Shotokan Karate Federation',
  description: 'Sitio oficial de la International Shotokan Karate Federation (ISKF) en Costa Rica. Karate Do tradicional, Dojos, recursos técnicos y afiliación.',
  keywords: ['Karate', 'Shotokan', 'Costa Rica', 'ISKF', 'Artes Marciales', 'Dojo', 'Karate Do', 'Teruyuki Okazaki'],
  authors: [{ name: 'ISKF Costa Rica' }],
  openGraph: {
    title: 'ISKF Costa Rica | Karate Shotokan',
    description: 'Únete a la familia ISKF en Costa Rica y aprende Karate Do tradicional.',
    url: 'https://www.iskfcostarica.com',
    siteName: 'ISKF Costa Rica',
    images: [
      {
        url: '/images/dojos/Fondo-inicio.jpg',
        width: 1200,
        height: 630,
        alt: 'ISKF Costa Rica Logo',
      },
    ],
    locale: 'es_CR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ISKF Costa Rica | Karate Shotokan',
    description: 'Únete a la familia ISKF en Costa Rica y aprende Karate Do tradicional.',
    images: ['/images/dojos/Fondo-inicio.jpg'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased text-gray-900 bg-gray-50 font-sans flex flex-col min-h-screen">
        <Providers>
          <Navbar />
          <SocialSidebar />
          <main className="w-full flex-grow">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
