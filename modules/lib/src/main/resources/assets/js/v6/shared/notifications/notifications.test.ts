import { AppError } from '@enonic/ui-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleError, notifications, notifyError, notifyInfo, notifySuccess, notifyWarning } from './notifications';

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

    describe('handleError', () => {
        it('should log the error and show it as an error toast', () => {
            const error = new Error('Failed');
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

            handleError(error);

            expect(consoleError).toHaveBeenCalledWith(error);
            expect(notifications.notifications.get()).toMatchObject([{ tone: 'error', message: 'Failed' }]);
        });

        it('should show the message of an AppError', () => {
            vi.spyOn(console, 'error').mockImplementation(() => undefined);

            handleError(new AppError('Not allowed'));

            expect(notifications.notifications.get()).toMatchObject([{ tone: 'error', message: 'Not allowed' }]);
        });
    });
});
