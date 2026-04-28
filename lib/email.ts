import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export interface ReservationEmailData {
  clientName: string;
  clientEmail: string;
  barberName: string;
  barberSlug: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:mm
}

function formatDateEs(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

function buildEmailHtml(data: ReservationEmailData): string {
  const domain = process.env.NEXT_PUBLIC_BARBER_DOMAIN ?? 'tubarber.com';
  const barberUrl = `https://${data.barberSlug}.${domain}`;
  const dateFormatted = formatDateEs(data.date);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reserva confirmada - TuBarber</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0D0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0D0D;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <p style="margin:0;font-size:28px;font-weight:800;color:#C9A84C;letter-spacing:3px;text-transform:uppercase;">
                TUBARBER
              </p>
              <p style="margin:4px 0 0;font-size:13px;color:#888888;letter-spacing:1px;text-transform:uppercase;">
                Agenda de turnos
              </p>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background-color:#1A1A1A;border:1px solid #C9A84C;border-radius:12px;padding:32px;">

              <!-- Icono confirmación -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="width:64px;height:64px;background-color:rgba(201,168,76,0.12);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(201,168,76,0.3);">
                      <span style="font-size:28px;">✂️</span>
                    </div>
                  </td>
                </tr>

                <!-- Título -->
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <p style="margin:0;font-size:22px;font-weight:800;color:#F5F5F0;letter-spacing:1px;text-transform:uppercase;">
                      ¡Reserva confirmada!
                    </p>
                  </td>
                </tr>

                <!-- Subtítulo -->
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <p style="margin:0;font-size:14px;color:#999999;">
                      Hola <strong style="color:#F5F5F0;">${data.clientName}</strong>, tu turno está agendado.
                    </p>
                  </td>
                </tr>

                <!-- Separador -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <div style="height:1px;background-color:rgba(201,168,76,0.2);"></div>
                  </td>
                </tr>

                <!-- Detalles del turno -->
                <tr>
                  <td style="padding-bottom:24px;">

                    <!-- Barbero -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                      <tr>
                        <td style="padding:14px 16px;background-color:rgba(255,255,255,0.04);border-radius:8px;border-left:3px solid #C9A84C;">
                          <p style="margin:0 0 3px;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Barbero</p>
                          <p style="margin:0;font-size:16px;font-weight:700;color:#F5F5F0;">${data.barberName}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Fecha -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                      <tr>
                        <td style="padding:14px 16px;background-color:rgba(255,255,255,0.04);border-radius:8px;border-left:3px solid #C9A84C;">
                          <p style="margin:0 0 3px;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Fecha</p>
                          <p style="margin:0;font-size:16px;font-weight:700;color:#F5F5F0;">${dateFormatted}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Hora -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:14px 16px;background-color:rgba(255,255,255,0.04);border-radius:8px;border-left:3px solid #C9A84C;">
                          <p style="margin:0 0 3px;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Hora</p>
                          <p style="margin:0;font-size:16px;font-weight:700;color:#F5F5F0;">${data.time} hrs</p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Separador -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <div style="height:1px;background-color:rgba(201,168,76,0.2);"></div>
                  </td>
                </tr>

                <!-- Aviso cancelación -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <p style="margin:0;font-size:13px;color:#888888;line-height:1.6;">
                      Si necesitas cancelar o reprogramar, contacta directamente con tu barbero.
                    </p>
                  </td>
                </tr>

                <!-- Botón -->
                <tr>
                  <td align="center">
                    <a href="${barberUrl}" style="display:inline-block;padding:14px 36px;background-color:#C9A84C;color:#0D0D0D;font-size:14px;font-weight:800;text-decoration:none;border-radius:8px;letter-spacing:1px;text-transform:uppercase;">
                      Ver agenda
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#555555;">
                Este correo fue enviado automáticamente por
                <a href="https://${domain}" style="color:#C9A84C;text-decoration:none;">TuBarber</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface WelcomeEmailData {
  displayName: string;
  email: string;
  slug: string;
  trialDays: number;
}

function buildWelcomeEmailHtml(data: WelcomeEmailData): string {
  const domain = process.env.NEXT_PUBLIC_BARBER_DOMAIN ?? 'tubarber.com';
  const panelUrl = `https://${data.slug}.${domain}/acceso`;
  const publicUrl = `https://${data.slug}.${domain}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a TuBarber</title>
</head>
<body style="margin:0;padding:0;background-color:#0D0D0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D0D0D;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <p style="margin:0;font-size:28px;font-weight:800;color:#C9A84C;letter-spacing:3px;text-transform:uppercase;">
                TUBARBER
              </p>
              <p style="margin:4px 0 0;font-size:13px;color:#888888;letter-spacing:1px;text-transform:uppercase;">
                Agenda de turnos
              </p>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background-color:#1A1A1A;border:1px solid #C9A84C;border-radius:12px;padding:32px;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Icono -->
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="width:64px;height:64px;background-color:rgba(201,168,76,0.12);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(201,168,76,0.3);">
                      <span style="font-size:28px;">✂️</span>
                    </div>
                  </td>
                </tr>

                <!-- Título -->
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <p style="margin:0;font-size:22px;font-weight:800;color:#F5F5F0;letter-spacing:1px;text-transform:uppercase;">
                      ¡Bienvenido, ${data.displayName}!
                    </p>
                  </td>
                </tr>

                <!-- Subtítulo -->
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <p style="margin:0;font-size:14px;color:#999999;">
                      Tu barbería online ya está lista. Empieza a recibir reservas hoy.
                    </p>
                  </td>
                </tr>

                <!-- Separador -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <div style="height:1px;background-color:rgba(201,168,76,0.2);"></div>
                  </td>
                </tr>

                <!-- Tu URL personal -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:14px 16px;background-color:rgba(255,255,255,0.04);border-radius:8px;border-left:3px solid #C9A84C;">
                          <p style="margin:0 0 3px;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Tu link de reservas</p>
                          <a href="${publicUrl}" style="margin:0;font-size:15px;font-weight:700;color:#C9A84C;text-decoration:none;">${data.slug}.${domain}</a>
                          <p style="margin:4px 0 0;font-size:12px;color:#888888;">Comparte este link con tus clientes</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Período de prueba -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:14px 16px;background-color:rgba(255,255,255,0.04);border-radius:8px;border-left:3px solid #C9A84C;">
                          <p style="margin:0 0 3px;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Período de prueba</p>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#F5F5F0;">${data.trialDays} días gratis</p>
                          <p style="margin:4px 0 0;font-size:12px;color:#888888;">Sin tarjeta de crédito requerida</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Pasos rápidos -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0 0 12px;font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">Primeros pasos</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                          <p style="margin:0;font-size:13px;color:#F5F5F0;"><span style="color:#C9A84C;font-weight:700;margin-right:8px;">1.</span>Ingresa a tu panel y configura tu horario</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
                          <p style="margin:0;font-size:13px;color:#F5F5F0;"><span style="color:#C9A84C;font-weight:700;margin-right:8px;">2.</span>Comparte tu link con tus clientes</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;">
                          <p style="margin:0;font-size:13px;color:#F5F5F0;"><span style="color:#C9A84C;font-weight:700;margin-right:8px;">3.</span>Activa las notificaciones push para recibir alertas</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Separador -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <div style="height:1px;background-color:rgba(201,168,76,0.2);"></div>
                  </td>
                </tr>

                <!-- Botón -->
                <tr>
                  <td align="center">
                    <a href="${panelUrl}" style="display:inline-block;padding:14px 36px;background-color:#C9A84C;color:#0D0D0D;font-size:14px;font-weight:800;text-decoration:none;border-radius:8px;letter-spacing:1px;text-transform:uppercase;">
                      Ir a mi panel
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:12px;color:#555555;">
                Este correo fue enviado automáticamente por
                <a href="https://${domain}" style="color:#C9A84C;text-decoration:none;">TuBarber</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  if (!isEmailConfigured()) return;

  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'TuBarber <noreply@tubarber.com>';

  await resend.emails.send({
    from: fromAddress,
    to: data.email,
    subject: `✂ ¡Bienvenido a TuBarber, ${data.displayName}! Tu agenda ya está lista`,
    html: buildWelcomeEmailHtml(data),
  });
}

export async function sendReservationConfirmation(data: ReservationEmailData): Promise<void> {
  if (!isEmailConfigured()) return;
  if (!data.clientEmail) return;

  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'TuBarber <noreply@tubarber.com>';

  await resend.emails.send({
    from: fromAddress,
    to: data.clientEmail,
    subject: `✂ Reserva confirmada con ${data.barberName} — ${data.time} hs`,
    html: buildEmailHtml(data),
  });
}
