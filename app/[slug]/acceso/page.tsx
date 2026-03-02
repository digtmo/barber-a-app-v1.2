import BarberAccesoApp from '@/components/BarberAccesoApp';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BarberAccesoPage({ params }: PageProps) {
  const { slug } = await params;
  return <BarberAccesoApp slug={slug} />;
}
