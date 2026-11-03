import { ApplicationEvent, ApplicationEventType } from '@enonic/lib-admin-ui/application/ApplicationEvent';
import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type ApplicationChange, isSettledApplicationChange, onApplicationEvent } from './applicationEvents';

const fire = (type: ApplicationEventType, key: string | null = 'com.app'): void => {
    new ApplicationEvent(key == null ? null : ApplicationKey.fromString(key), type, false).fire();
};

const NAMES = Object.keys(ApplicationEventType).filter((key) => Number.isNaN(Number(key)));

describe('onApplicationEvent', () => {
    let unsubscribe: (() => void) | undefined;

    afterEach(() => unsubscribe?.());

    it('should hand out the key and the lower-cased kind of every event type', () => {
        const changes: ApplicationChange[] = [];
        unsubscribe = onApplicationEvent((change) => changes.push(change));

        for (const name of NAMES) {
            fire(ApplicationEventType[name as keyof typeof ApplicationEventType]);
        }

        expect(changes).toEqual(NAMES.map((name) => ({ applicationKey: 'com.app', kind: name.toLowerCase() })));
    });

    it('should hand out an empty key when the event has none', () => {
        const handler = vi.fn();
        unsubscribe = onApplicationEvent(handler);

        fire(ApplicationEventType.PROGRESS, null);

        expect(handler).toHaveBeenCalledWith({ applicationKey: '', kind: 'progress' });
    });

    it('should stop listening after unsubscribing', () => {
        const handler = vi.fn();
        onApplicationEvent(handler)();

        fire(ApplicationEventType.STARTED);

        expect(handler).not.toHaveBeenCalled();
    });
});

describe('isSettledApplicationChange', () => {
    it('should agree with the legacy isNeedToUpdateApplication for every event type', () => {
        for (const name of NAMES) {
            const type = ApplicationEventType[name as keyof typeof ApplicationEventType];
            const legacy = new ApplicationEvent(ApplicationKey.fromString('com.app'), type, false);
            const change: ApplicationChange = {
                applicationKey: 'com.app',
                kind: name.toLowerCase() as ApplicationChange['kind'],
            };

            expect(isSettledApplicationChange(change), name).toBe(legacy.isNeedToUpdateApplication());
        }
    });
});
