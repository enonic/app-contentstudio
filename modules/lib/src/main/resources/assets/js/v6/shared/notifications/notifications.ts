import type { ToastTone } from '@enonic/ui-types';
import type { NotificationOptions } from '@enonic/ui-utils';
import { createNotifications } from '@enonic/ui-utils';

/** The one v6 toast stack: the app roots render it, commands and models raise on it. */
export const notifications = createNotifications();

export function notify(tone: ToastTone, message: string, options?: NotificationOptions): () => void {
    return notifications.notify(tone, message, options);
}

export function notifySuccess(message: string, options?: NotificationOptions): () => void {
    return notify('success', message, options);
}

export function notifyInfo(message: string, options?: NotificationOptions): () => void {
    return notify('info', message, options);
}

export function notifyWarning(message: string, options?: NotificationOptions): () => void {
    return notify('warning', message, options);
}

export function notifyError(message: string, options?: NotificationOptions): () => void {
    return notify('error', message, options);
}

export function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/** Logs the error and shows it as an error toast. Never throws. */
export function handleError(error: unknown): void {
    console.error(error);
    notifyError(errorMessage(error));
}
