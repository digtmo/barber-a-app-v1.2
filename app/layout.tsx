import './globals.css';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import PWARegister from '@/components/PWARegister';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TuBarber - Agenda de Reservas',
  description: 'Agenda de citas para tu barbería',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TuBarber',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#C9A84C',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        {/* PWA: Safari / iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TuBarber" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
      </head>
      <body className="antialiased font-sans">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
