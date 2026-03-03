import webpush from "web-push";

let vapidConfigured = false;

function getVapidKeys() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return null;
  }
  return { publicKey, privateKey };
}

export function isPushConfigured(): boolean {
  const keys = getVapidKeys();
  if (!keys) return false;
  if (!vapidConfigured) {
    webpush.setVapidDetails(
      "mailto:app@tubarber.com",
      keys.publicKey,
      keys.privateKey
    );
    vapidConfigured = true;
  }
  return true;
}

export interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPushNotification(
  subscription: PushSubscriptionRow,
  payload: { title: string; body?: string; url?: string }
): Promise<boolean> {
  if (!isPushConfigured()) return false;
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
      { TTL: 60 }
    );
    return true;
  } catch {
    return false;
  }
}
