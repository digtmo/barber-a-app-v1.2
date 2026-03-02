import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-surface text-text flex flex-col items-center justify-center p-6">
      <h1 className="text-5xl font-bold text-gold mb-4 font-display">
        BARBER
      </h1>
      <p className="text-textMuted text-center max-w-md mb-10">
        Para reservar, entra a la página de tu barbero: <strong className="text-goldLight">[nombre].tubarber.com</strong>
        <br />
        Ejemplo: dani.tubarber.com · carlos.tubarber.com
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/registro"
          className="px-8 py-4 bg-gold hover:bg-goldLight text-surface font-bold rounded-lg transition-colors shadow-lg shadow-gold/20 text-center"
        >
          Registrarme como barbero
        </Link>
        <Link
          href="/acceso"
          className="px-8 py-4 bg-card border border-gold hover:bg-input text-text font-bold rounded-lg transition-colors text-center"
        >
          Acceso barberos
        </Link>
      </div>
    </div>
  );
}
