/**
 * desktopNotification.ts
 *
 * Reusable utility for OS-level desktop / system notifications.
 * Uses Browser Notification API only — no PWA, no Service Workers, no Firebase.
 */

// ─── Logging ──────────────────────────────────────────────────────────────────
function log(...args: any[]) {
  // Only log in development
  if ((import.meta as any).env.DEV) {
    console.log('[esparkPM Notifications]', ...args);
  }
}

// ─── Support ──────────────────────────────────────────────────────────────────
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export function isDesktopNotificationGranted(): boolean {
  return isNotificationSupported() && Notification.permission === 'granted';
}

// ─── Permission ───────────────────────────────────────────────────────────────
/**
 * MUST be called from a real click handler — useEffect calls are silently
 * blocked by all modern browsers.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    log('Browser does not support Notification API');
    return 'denied';
  }
  const current = Notification.permission;
  log('Current permission:', current);
  if (current !== 'default') return current;
  try {
    log('Requesting OS permission…');
    const result = await Notification.requestPermission();
    log('Permission result:', result);
    return result;
  } catch (err) {
    log('requestPermission() threw:', err);
    return 'denied';
  }
}

// ─── Click routing ────────────────────────────────────────────────────────────
/**
 * Derives the navigation path from the notification payload.
 * Priority order: entityType+entityId → link → actionUrl → /inbox
 */
function resolveLink(payload: DesktopNotificationPayload): string {
  // Explicit link always wins
  if (payload.link) return payload.link.startsWith('/') ? payload.link : `/${payload.link}`;

  // Route by entity type
  if (payload.entityType && payload.entityId) {
    switch (payload.entityType) {
      case 'task':      return `/tasks/${payload.entityId}`;
      case 'subtask':   return `/tasks/${payload.entityId}`;  // Opens parent task page
      case 'project':   return `/projects/${payload.entityId}`;
      case 'comment':   return payload.link ?? '/inbox';
      case 'communication': return '/communications';
      case 'sprint':    return `/projects/${payload.entityId}`;
      case 'milestone': return `/projects/${payload.entityId}`;
    }
  }

  if (payload.actionUrl) return payload.actionUrl.startsWith('/') ? payload.actionUrl : `/${payload.actionUrl}`;
  return '/inbox';
}

// ─── Payload ──────────────────────────────────────────────────────────────────
export interface DesktopNotificationPayload {
  _id?: string;
  title: string;
  message: string;
  type?: string;
  priority?: 'high' | 'medium' | 'low';
  link?: string;
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
}

// ─── Show Notification ────────────────────────────────────────────────────────
/**
 * Fire a native OS notification.
 * Returns the Notification instance on success, null on failure.
 */
export function showDesktopNotification(
  payload: DesktopNotificationPayload
): Notification | null {
  if (!isNotificationSupported()) { log('API not supported'); return null; }
  if (Notification.permission !== 'granted') {
    log('Permission not granted:', Notification.permission);
    return null;
  }

  try {
    const iconUrl = `${window.location.origin}/logo.png`;
    const navPath = resolveLink(payload);

    log(`Firing OS notification [${payload.priority ?? 'medium'}]:`, payload.title);

    const notification = new Notification(payload.title || 'esparkPM Update', {
      body: payload.message || '',
      icon: iconUrl,
      badge: iconUrl,
      tag: payload._id ?? String(Date.now()),  // deduplication
      // Note: `requireInteraction` makes the popup persist until dismissed
      // Enable for HIGH priority
      requireInteraction: payload.priority === 'high',
    } as any);

    notification.onclick = () => {
      log('Notification clicked → navigating to:', navPath);
      window.focus();
      notification.close();
      window.location.href = navPath;
    };

    notification.onerror = (e) => log('Notification.onerror:', e);

    return notification;
  } catch (err) {
    log('new Notification() threw:', err);
    return null;
  }
}

// ─── Test helper ─────────────────────────────────────────────────────────────
/**
 * Fires a test OS notification immediately, regardless of tab state.
 * Used by the "Send Test Notification" button in Delivery Preferences.
 */
export function sendTestDesktopNotification(): Notification | null {
  return showDesktopNotification({
    title: '✅ esparkPM Notifications Active',
    message: 'Desktop notifications are working correctly. You will be alerted on any task or project update.',
    type: 'system:announcement',
    priority: 'medium',
    link: '/inbox',
  });
}
