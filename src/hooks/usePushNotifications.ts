'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

const BASE = process.env.NEXT_PUBLIC_API_URL || '';

function getToken() {
  return useAuthStore.getState().token || '';
}

async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  return fetch(`${BASE}${url}`, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupported('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window);
    if ('Notification' in window) setPermission(Notification.permission);
    checkSubscribed();
  }, []);

  const checkSubscribed = async () => {
    try {
      if (!('serviceWorker' in navigator)) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {}
  };

  const subscribe = async () => {
    if (!supported) return;
    setLoading(true);
    try {
      // Get VAPID public key
      const keyRes = await authFetch('/api/push/vapid-key');
      const keyData = await keyRes.json();
      if (!keyData.enabled || !keyData.public_key) {
        alert('Push notifications not configured on server. Ask admin to set VAPID keys.');
        return;
      }

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      // Register service worker
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.public_key) as BufferSource,
      });

      const subJson = sub.toJSON() as any;
      await authFetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        }),
      });

      setSubscribed(true);
    } catch (err) {
      console.warn('push subscribe error:', err);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await authFetch('/api/push/unsubscribe', { method: 'DELETE' });
      setSubscribed(false);
    } catch {}
    finally { setLoading(false); }
  };

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}
