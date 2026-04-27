# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

No test suite is configured.

## Architecture Overview

**TuBarber** is a multi-tenant barber scheduling SaaS built with Next.js 14 (App Router). Barbers get unique subdomain URLs (`dani.tubarber.com`) to share with clients for booking appointments.

### Multi-tenant Subdomain Routing

`middleware.ts` is the core of the routing logic:
- Detects `[slug].tubarber.com` and rewrites internally to `/[slug]` — the user never sees a redirect.
- On the root domain, paths like `/dani` redirect to `dani.tubarber.com`.
- In development (localhost), path-based routing is used (`localhost:3000/dani`).
- JWT verification happens here for protected API routes (`/api/barbers/[slug]/*`), except GET barber data and POST reservations.

### Two User Roles, Two Views

**Client view** (`app/[slug]/page.tsx` → `ClientView.tsx`): Public booking interface. Clients pick a time slot and fill out their info.

**Barber view** (`app/[slug]/acceso/page.tsx` → `BarberView.tsx`): Protected dashboard. Barbers log in, manage their schedule (working hours, slot duration, blocked dates), view reservations, and configure push notifications.

### State Management

`context/AppContext.tsx` is the single source of truth on the client. It holds barber config, appointments, auth state, and exposes functions like `addAppointment()`, `updateBarberConfig()`, `blockDate()`, etc. The barber's JWT token is stored in `localStorage` under `barber_token`.

`lib/barberApiClient.ts` handles all HTTP calls to the API routes, attaching the JWT where needed.

### API Routes (`app/api/`)

- **Public**: `GET /api/barbers/[slug]` (barber data + schedule + reservations), `POST /api/barbers/[slug]/reservations` (client books), `POST /api/auth/login`, `POST /api/auth/register`
- **Protected (JWT)**: `PUT /api/barbers/[slug]/config`, blocked-dates CRUD, reservations DELETE, `POST /api/barbers/[slug]/push-subscription`
- **Webhook**: `POST /api/webhooks/stripe` — handles `customer.subscription.updated/deleted` and `invoice.payment_failed`

Protected routes also check subscription status via `lib/check-subscription.ts` — returns 402 if the barber's subscription is not `trialing` or `active`.

### Database (Supabase/PostgreSQL)

Key tables: `barbers`, `barber_schedule`, `reservations`, `blocked_dates`, `subscriptions`, `barber_push_subscriptions`. The Supabase admin client (service role key) is used server-side only.

### Authentication

JWT tokens use `lib/jwt.ts` (Node.js) for signing/verification in API routes and `lib/jwt-edge.ts` (Web Crypto API) for the Edge middleware. Payload: `{ barberId, slug }`, 7-day expiry.

### Push Notifications

When a client books, the API sends a Web Push notification to the barber's registered endpoint using the `web-push` library and VAPID keys. The barber subscribes via `BarberPushNotifications.tsx` using the service worker.

### Payments (Stripe)

Barbers start with a 14-day trial. Stripe webhooks update the `subscriptions` table. Schedule configuration is blocked (402) if the subscription is inactive.

## Environment Variables

See `.env.example` for all required variables:
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (min 32 chars)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `BARBER_DOMAIN`, `NEXT_PUBLIC_BARBER_DOMAIN` (e.g. `tubarber.com`)
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

## Deployment

Hosted on Vercel with a wildcard DNS record (`*.tubarber.com` CNAME → `cname.vercel-dns.com`). The `BARBER_DOMAIN` env var controls subdomain behavior — in development it is unused and path-based routing applies automatically.
