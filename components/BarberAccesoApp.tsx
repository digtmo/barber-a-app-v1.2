'use client';

import { AppProvider, useApp } from '@/context/AppContext';
import BarberView from './BarberView';
import BarberLogin from './BarberLogin';

function BarberAccesoContent({ slug }: { slug: string }) {
  const { isBarberAuthenticated } = useApp();
  const goToClient = () => { window.location.href = '/'; };
  if (isBarberAuthenticated) {
    return <BarberView onBackToClient={goToClient} />;
  }
  return <BarberLogin onBackToClient={goToClient} />;
}

export default function BarberAccesoApp({ slug }: { slug: string }) {
  return (
    <AppProvider slug={slug}>
      <BarberAccesoContent slug={slug} />
    </AppProvider>
  );
}
