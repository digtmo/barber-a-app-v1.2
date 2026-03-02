'use client';

import { AppProvider } from '@/context/AppContext';
import ClientView from './ClientView';

function BarberAppContent({ slug }: { slug: string }) {
  return <ClientView />;
}

export default function BarberApp({ slug }: { slug: string }) {
  return (
    <AppProvider slug={slug}>
      <BarberAppContent slug={slug} />
    </AppProvider>
  );
}
