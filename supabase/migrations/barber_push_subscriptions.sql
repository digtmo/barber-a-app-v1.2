-- Tabla para suscripciones push del barbero (notificaciones de nuevas reservas)
CREATE TABLE IF NOT EXISTS barber_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barber_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_barber_push_subscriptions_barber_id ON barber_push_subscriptions(barber_id);
