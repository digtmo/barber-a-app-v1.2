'use client';

import Link from 'next/link';
import { AppProvider } from '@/context/AppContext';
import ClientView from './ClientView';
import { Scissors } from 'lucide-react';

function BarberAppContent({ slug }: { slug: string }) {
  return (
    <div className="relative">
      <ClientView />
      <Link
        href={slug ? `/${slug}/acceso` : '/acceso'}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gold hover:bg-goldLight text-surface rounded-full shadow-lg shadow-gold/20 flex items-center justify-center transition-all hover:scale-110"
        title="Acceso Barbero"
      >
        <Scissors className="w-6 h-6" />
      </Link>
    </div>
  );
}

export default function BarberApp({ slug }: { slug: string }) {
  return (
    <AppProvider slug={slug}>
      <BarberAppContent slug={slug} />
    </AppProvider>
  );
}
