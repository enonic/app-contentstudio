import {describe, expect, it, vi} from 'vitest';
import {createGuardedSocketHandler} from './createGuardedSocketHandler';

describe('createGuardedSocketHandler', () => {
    it('runs the handler when the event is defined and active', () => {
        const handler = vi.fn();
        const guardedHandler = createGuardedSocketHandler(() => true)(handler);
        const event = {data: ['item-1']};

        guardedHandler(event);

        expect(handler).toHaveBeenCalledWith(event);
    });

    it('skips the handler when the event is nullish', () => {
        const handler = vi.fn();
        const guardedHandler = createGuardedSocketHandler(() => true)(handler);

        guardedHandler(undefined);
        guardedHandler(null);

        expect(handler).not.toHaveBeenCalled();
    });

    it('skips the handler when inactive', () => {
        const handler = vi.fn();
        const guardedHandler = createGuardedSocketHandler(() => false)(handler);

        guardedHandler({data: ['item-1']});

        expect(handler).not.toHaveBeenCalled();
    });
});
