import { AppError } from '@enonic/ui-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    errorMessage,
    handleError,
    notifications,
    notifyError,
    notifyInfo,
    notifySuccess,
    notifyWarning,
} from './notifications';

describe('notifications', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        notifications.clear();
        vi.restoreAllMocks();
    });

    describe('shorthands', () => {
        it.each([
            ['notifySuccess', notifySuccess, 'success'],
            ['notifyInfo', notifyInfo, 'info'],
            ['notifyWarning', notifyWarning, 'warning'],
            ['notifyError', notifyError, 'error'],
        ] as const)('%s should raise a toast with its tone', (_, raise, tone) => {
            raise('Hello');

            expect(notifications.notifications.get()).toMatchObject([{ tone, message: 'Hello', autoHide: true }]);
        });

        it('should pass the options through and return the dismiss', () => {
            const onClose = vi.fn();

            const dismiss = notifyInfo('Working', { autoHide: false, onClose });
            expect(notifications.notifications.get()).toMatchObject([{ autoHide: false }]);

            dismiss();

            expect(notifications.notifications.get()).toEqual([]);
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('errorMessage', () => {
        it('should take the message of an Error', () => {
            expect(errorMessage(new Error('Broken'))).toBe('Broken');
        });

        it('should take the message of an AppError', () => {
            expect(errorMessage(new AppError('Not allowed'))).toBe('Not allowed');
        });

        it('should stringify anything else', () => {
            expect(errorMessage('plain')).toBe('plain');
            expect(errorMessage(42)).toBe('42');
        });
    });

    describe('handleError', () => {
        it('should log the error and show it as an error toast', () => {
            const error = new Error('Failed');
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

            handleError(error);

            expect(consoleError).toHaveBeenCalledWith(error);
            expect(notifications.notifications.get()).toMatchObject([{ tone: 'error', message: 'Failed' }]);
        });

        it('should not throw for a non-Error value', () => {
            vi.spyOn(console, 'error').mockImplementation(() => undefined);

            expect(() => handleError({ reason: 'odd' })).not.toThrow();
            expect(notifications.notifications.get()).toMatchObject([{ tone: 'error', message: '[object Object]' }]);
        });
    });
});
