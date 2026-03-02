import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-surface text-text flex flex-col items-center justify-center p-6">
      <h1 className="text-5xl font-bold text-gold mb-4 font-display">
        BARBER
      </h1>
      <p className="text-textMuted text-center max-w-md mb-10">
        Para reservar, entra a la página de tu barbero: <strong className="text-goldLight">[nombre].barber.com</strong>
        <br />
        Ejemplo: dani.barber.com · carlos.barber.com
      </p>
      <Link
        href="/acceso"
        className="px-8 py-4 bg-gold hover:bg-goldLight text-surface font-bold rounded-lg transition-colors shadow-lg shadow-gold/20"
      >
        Acceso barberos
      </Link>
    </div>
  );
}
