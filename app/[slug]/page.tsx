import BarberApp from '@/components/BarberApp';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BarberPage({ params }: PageProps) {
  const { slug } = await params;
  return <BarberApp slug={slug} />;
}
