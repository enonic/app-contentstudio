import { atom } from 'nanostores';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const stores = vi.hoisted(
    () =>
        ({}) as {
            $mode: ReturnType<typeof atom<string>>;
            $measured: ReturnType<typeof atom<boolean>>;
            $viewMode: ReturnType<typeof atom<string>>;
            $expanded: ReturnType<typeof atom<boolean>>;
            $activeWidgetId: ReturnType<typeof atom<string | null>>;
        },
);

const mocks = vi.hoisted(() => ({ setContextOpen: vi.fn(), collapseInitially: false }));

vi.mock('../../../widgets/context-panel/model/contextWidgets.store', async () => {
    const { atom: createAtom } = await import('nanostores');
    stores.$activeWidgetId = createAtom<string | null>('details');

    return { $activeWidgetId: stores.$activeWidgetId, setContextOpen: mocks.setContextOpen };
});

vi.mock('./wizardContent.store', async () => {
    const { atom: createAtom } = await import('nanostores');
    stores.$expanded = createAtom(true);

    return {
        $isContentFormExpanded: stores.$expanded,
        setContentFormExpanded: (value: boolean) => stores.$expanded.set(value),
    };
});

vi.mock('./wizardLayout.store', async () => {
    const { atom: createAtom } = await import('nanostores');
    stores.$mode = createAtom('docked');
    stores.$measured = createAtom(false);
    stores.$viewMode = createAtom('form');

    return {
        $isWizardLayoutMeasured: stores.$measured,
        $wizardContextPanelMode: stores.$mode,
        $wizardViewMode: stores.$viewMode,
        setWizardViewMode: (mode: string) => stores.$viewMode.set(mode),
        shouldCollapseWizardContextInitially: () => mocks.collapseInitially,
    };
});

import {
    openWizardLiveEdit,
    showWizardForm,
    showWizardLiveEdit,
    startWizardLayout,
    toggleWizardFormMinimized,
} from './wizardLayout.service';

describe('wizardLayout.service', () => {
    const host = { applyLiveEdit: vi.fn(), applyMinimized: vi.fn() };
    let stop: () => void = () => undefined;

    const start = (hasContentType = true): void => {
        stop();
        stop = startWizardLayout(host, { hasContentType });
    };

    beforeEach(() => {
        stop();
        stores.$mode.set('docked');
        stores.$measured.set(false);
        stores.$viewMode.set('form');
        stores.$expanded.set(true);
        stores.$activeWidgetId.set('details');
        mocks.collapseInitially = false;
        mocks.setContextOpen.mockReset();
        host.applyLiveEdit.mockReset();
        host.applyMinimized.mockReset();
        start();
    });

    describe('first measurement', () => {
        it('should open the editor beside the form and the context panel', () => {
            stores.$measured.set(true);

            expect(stores.$viewMode.get()).toBe('split');
            expect(host.applyLiveEdit).toHaveBeenCalledExactlyOnceWith(true);
            expect(mocks.setContextOpen).toHaveBeenCalledExactlyOnceWith(true);
        });

        it('should keep the form alone in the mobile range', () => {
            stores.$mode.set('mobile');
            host.applyLiveEdit.mockReset();

            stores.$measured.set(true);

            expect(stores.$viewMode.get()).toBe('form');
            expect(host.applyLiveEdit).toHaveBeenCalledExactlyOnceWith(false);
        });

        it('should leave the context panel closed when it would not fit or has no widget', () => {
            mocks.collapseInitially = true;
            stores.$measured.set(true);
            expect(mocks.setContextOpen).not.toHaveBeenCalled();

            start();
            mocks.collapseInitially = false;
            stores.$activeWidgetId.set(null);
            stores.$measured.set(false);
            stores.$measured.set(true);
            expect(mocks.setContextOpen).not.toHaveBeenCalled();
        });

        it('should open only once', () => {
            stores.$measured.set(true);
            stores.$measured.set(false);
            stores.$measured.set(true);

            expect(host.applyLiveEdit).toHaveBeenCalledTimes(1);
        });
    });

    describe('minimizing the form', () => {
        it('should minimize beside the editor and restore', () => {
            showWizardLiveEdit();

            toggleWizardFormMinimized();
            expect(host.applyMinimized).toHaveBeenLastCalledWith(true);
            expect(stores.$expanded.get()).toBe(false);
            expect(stores.$viewMode.get()).toBe('split');

            toggleWizardFormMinimized();
            expect(host.applyMinimized).toHaveBeenLastCalledWith(false);
            expect(stores.$expanded.get()).toBe(true);
            expect(stores.$viewMode.get()).toBe('split');
        });

        it('should bring the editor in when the form is minimized alone, and take it away again', () => {
            toggleWizardFormMinimized();
            expect(stores.$viewMode.get()).toBe('split');

            toggleWizardFormMinimized();
            expect(stores.$viewMode.get()).toBe('form');
        });

        it('should follow the expanded state of the form set elsewhere', () => {
            showWizardLiveEdit();

            stores.$expanded.set(false);
            expect(host.applyMinimized).toHaveBeenLastCalledWith(true);

            stores.$expanded.set(true);
            expect(host.applyMinimized).toHaveBeenLastCalledWith(false);
            expect(host.applyMinimized).toHaveBeenCalledTimes(2);
        });

        it('should expand the form when the editor is hidden', () => {
            showWizardLiveEdit();
            toggleWizardFormMinimized();

            showWizardForm();

            expect(stores.$viewMode.get()).toBe('form');
            expect(stores.$expanded.get()).toBe(true);
            expect(host.applyLiveEdit).toHaveBeenLastCalledWith(false);
        });
    });

    describe('mobile range', () => {
        it('should hide the editor on entering and restore it on leaving', () => {
            showWizardLiveEdit();

            stores.$mode.set('mobile');
            expect(stores.$viewMode.get()).toBe('form');

            stores.$mode.set('docked');
            expect(stores.$viewMode.get()).toBe('split');
        });

        it('should not bring an editor that was not shown', () => {
            stores.$mode.set('mobile');
            stores.$mode.set('floating');

            expect(stores.$viewMode.get()).toBe('form');
        });

        it('should show the editor alone when opened in the mobile range', () => {
            stores.$mode.set('mobile');

            showWizardLiveEdit();

            expect(stores.$viewMode.get()).toBe('live');
        });

        it('should restore the editor after a mobile start only for content with a type', () => {
            stores.$mode.set('mobile');
            openWizardLiveEdit();
            stores.$mode.set('docked');
            expect(stores.$viewMode.get()).toBe('split');

            start(false);
            stores.$viewMode.set('form');
            stores.$mode.set('mobile');
            openWizardLiveEdit();
            stores.$mode.set('docked');
            expect(stores.$viewMode.get()).toBe('form');
        });

        it('should ignore changes between the non-mobile modes', () => {
            stores.$mode.set('floating');

            expect(host.applyLiveEdit).not.toHaveBeenCalled();
        });
    });

    it('should stop following the stores when stopped', () => {
        stop();

        stores.$measured.set(true);
        stores.$expanded.set(false);
        stores.$mode.set('mobile');

        expect(host.applyLiveEdit).not.toHaveBeenCalled();
        expect(host.applyMinimized).not.toHaveBeenCalled();
    });
});
