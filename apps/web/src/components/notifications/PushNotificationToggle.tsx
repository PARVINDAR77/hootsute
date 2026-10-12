'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Bell, BellOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setIsSupported(false);
      setIsLoading(false);
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch (err) {
      console.warn('Could not read push subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!isSupported) return;
    setIsLoading(true);
    setStatusMsg(null);

    try {
      const reg = await navigator.serviceWorker.ready;

      if (isSubscribed) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await apiClient('notifications/push/unsubscribe', {
            method: 'POST',
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        setIsSubscribed(false);
        setStatusMsg('Push notifications disabled.');
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setStatusMsg('Notification permission was denied.');
          setIsLoading(false);
          return;
        }

        const { publicKey } = await apiClient<{ publicKey: string }>(
          'notifications/push/vapid-public-key',
        );

        const newSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        const subJson = newSub.toJSON();

        await apiClient('notifications/push/subscribe', {
          method: 'POST',
          body: JSON.stringify({
            endpoint: newSub.endpoint,
            keys: {
              p256dh: subJson.keys?.p256dh,
              auth: subJson.keys?.auth,
            },
            deviceType: navigator.userAgent.slice(0, 100),
          }),
        });

        setIsSubscribed(true);
        setStatusMsg('Push notifications enabled!');
      }
    } catch (err: any) {
      setStatusMsg(err.message || 'Push registration failed');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        aria-label={isSubscribed ? 'Disable push notifications' : 'Enable push notifications'}
        title={isSubscribed ? 'Disable desktop push notifications' : 'Enable desktop push notifications'}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          isSubscribed
            ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
            : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
        } disabled:opacity-50`}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="w-3.5 h-3.5 text-indigo-600" />
        ) : (
          <BellOff className="w-3.5 h-3.5 text-slate-500" />
        )}
        <span>{isSubscribed ? 'Push Enabled' : 'Enable Push'}</span>
      </button>

      {statusMsg && (
        <span className="text-[11px] text-slate-500 animate-fade-in flex items-center gap-1">
          {statusMsg.includes('enabled') ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          ) : (
            <AlertCircle className="w-3 h-3 text-amber-500" />
          )}
          {statusMsg}
        </span>
      )}
    </div>
  );
}
