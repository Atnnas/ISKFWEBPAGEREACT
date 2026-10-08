export default function manifest() {
  return {
    name: 'ISKF Costa Rica',
    short_name: 'ISKF CR',
    description: 'International Shotokan Karate Federation - Costa Rica. Karate Do Tradicional.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0a0a',
    theme_color: '#2D2E83',
    icons: [
      {
        src: '/images/dojos/escudo.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/images/dojos/escudo.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  };
}
