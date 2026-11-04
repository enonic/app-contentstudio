import type { FocusContainerRegistry } from '@enonic/ui';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { chainFocusContainerRegistry } from './ConfirmFocusTrap';

vi.mock('@enonic/ui', () => ({}));

function registry(): FocusContainerRegistry {
    return {
        register: vi.fn<(element: HTMLElement) => void>(),
        unregister: vi.fn<(element: HTMLElement) => void>(),
    };
}

describe('chainFocusContainerRegistry', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should hand a registration to the enclosing registry as well as its own', () => {
        const parent = registry();
        const own = registry();
        const element = {} as HTMLElement;

        const chained = chainFocusContainerRegistry(parent, own);
        chained.register(element);
        chained.unregister(element);

        expect(parent.register).toHaveBeenCalledWith(element);
        expect(own.register).toHaveBeenCalledWith(element);
        expect(parent.unregister).toHaveBeenCalledWith(element);
        expect(own.unregister).toHaveBeenCalledWith(element);
    });

    it('should be the own registry alone outside any enclosing one', () => {
        const own = registry();

        expect(chainFocusContainerRegistry(null, own)).toBe(own);
    });
});
