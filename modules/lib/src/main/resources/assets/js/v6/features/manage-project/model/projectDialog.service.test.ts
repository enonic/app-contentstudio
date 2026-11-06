import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRefresh } = vi.hoisted(() => ({ mockRefresh: vi.fn() }));

vi.mock('./projectDialog.store', () => ({ refreshProjectDialogApplications: mockRefresh }));

vi.mock('../../../entities/application', async () => {
    const { map } = await import('nanostores');
    return { $applications: map({ applications: [], loading: false, loaded: false }) };
});

import { $applications } from '../../../entities/application';
import { start, stop } from './projectDialog.service';

describe('projectDialog.service', () => {
    beforeEach(() => {
        start();
    });

    afterEach(() => {
        stop();
        $applications.set({ applications: [], loading: false, loaded: false });
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('should refresh the listed apps once when the installed ones reload', () => {
        $applications.set({ applications: [], loading: false, loaded: true });

        expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('should ignore the loading flips', () => {
        $applications.setKey('loading', true);
        $applications.setKey('loading', false);

        expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('should subscribe once across repeated starts and not at all after stop', () => {
        start();
        $applications.set({ applications: [], loading: false, loaded: true });
        expect(mockRefresh).toHaveBeenCalledTimes(1);

        stop();
        $applications.set({ applications: [], loading: false, loaded: false });
        expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
});
