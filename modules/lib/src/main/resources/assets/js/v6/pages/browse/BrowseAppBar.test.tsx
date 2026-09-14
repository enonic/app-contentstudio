import { render, screen } from '@testing-library/preact';
import type { ComponentPropsWithoutRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    activeWidget: undefined as
        | {
              getDescriptorKey: () => { toString: () => string };
              getDisplayName: () => string;
              getConfig: () => { getProperty: (name: string) => string | undefined };
          }
        | undefined,
    hasMultipleProjects: false,
    noProjectMode: false,
}));

vi.mock('@enonic/lib-admin-ui/store/Store', () => ({
    Store: {
        instance: () => ({
            get: () => ({ getName: () => 'Content Studio' }),
        }),
    },
}));

vi.mock('@enonic/ui', () => {
    const Control = ({ children, label, ...props }: ComponentPropsWithoutRef<'button'> & { label?: string }) => (
        <button type="button" {...props}>
            {children}
            {label}
        </button>
    );

    return { Button: Control, Toggle: Control, cn: (...classes: unknown[]) => classes.filter(Boolean).join(' ') };
});

vi.mock('@nanostores/preact', () => ({
    useStore: (store: { get: () => unknown }) => store.get(),
}));

vi.mock('nanostores', () => ({
    computed: <T, U>(store: { get: () => T }, callback: (value: T) => U) => ({
        get: () => callback(store.get()),
    }),
}));

vi.mock('../../../app/browse/ShowIssuesDialogEvent', () => ({
    ShowIssuesDialogEvent: class {
        fire(): void {}
    },
}));

vi.mock('../../shared/lib/hooks/useBreakpoints', () => ({
    useBreakpoints: () => ({ sm: false }),
}));

vi.mock('../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) => key,
}));

vi.mock('../../entities/project', () => ({
    $activeProjectName: { get: () => 'My project' },
    $hasMultipleProjects: { get: () => mocks.hasMultipleProjects },
    $noProjectMode: { get: () => mocks.noProjectMode },
}));

vi.mock('../../shared/dialogs/dialogs.store', () => ({
    setProjectSelectionDialogOpen: vi.fn(),
}));

vi.mock('../../entities/issue', () => ({
    $issuesStats: { get: () => ({ stats: undefined }) },
}));

vi.mock('../../widgets/context-panel/model/sidebarWidgets.store', () => ({
    $activeWidget: { get: () => mocks.activeWidget },
    isContentBrowseWidget: (widget: typeof mocks.activeWidget) =>
        widget?.getDescriptorKey().toString().endsWith('studio:main') ?? false,
}));

vi.mock('../../shared/ui/LegacyElement', () => ({
    LegacyElement: class {},
}));

vi.mock('./model/browseSidebar.store', () => ({
    $isBrowseSidebarOpen: { get: () => false },
    setBrowseSidebarOpen: vi.fn(),
}));

import { BrowseAppBar } from './BrowseAppBar';

function createWidget(key: string, label: string, context?: string): NonNullable<typeof mocks.activeWidget> {
    return {
        getDescriptorKey: () => ({ toString: () => key }),
        getDisplayName: () => label,
        getConfig: () => ({ getProperty: (name: string) => (name === 'context' ? context : undefined) }),
    };
}

describe('BrowseAppBar', () => {
    it('keeps project title stable and uses widget titles outside content browse', () => {
        mocks.activeWidget = createWidget('studio:main', 'Content', 'project');
        mocks.noProjectMode = false;
        const { rerender } = render(<BrowseAppBar />);

        const projectTitle = screen.getByRole('heading', { name: 'My project' });
        expect(projectTitle.classList.contains('mr-auto')).toBe(false);
        expect(screen.getByRole('button', { name: 'tooltip.sidebar.open' }).classList.contains('max-sm:mr-auto')).toBe(
            true,
        );
        expect(screen.getByRole<HTMLButtonElement>('button', { name: 'My project' }).disabled).toBe(true);

        mocks.activeWidget = undefined;
        rerender(<BrowseAppBar />);
        expect(screen.getByRole('heading', { name: 'My project' })).toBeDefined();

        mocks.activeWidget = createWidget('plus:archive', 'Archive', 'project');
        mocks.hasMultipleProjects = true;
        rerender(<BrowseAppBar />);
        expect(screen.getByRole('heading', { name: 'Archive' })).toBeDefined();
        const projectSelector = screen.getByRole<HTMLButtonElement>('button', {
            name: 'wcag.appbar.project.label',
        });
        expect(projectSelector.className).toContain('max-sm:hidden');
        expect(projectSelector.disabled).toBe(false);

        mocks.activeWidget = createWidget('studio:settings', 'Settings');
        mocks.noProjectMode = true;
        rerender(<BrowseAppBar />);
        expect(screen.getByRole('heading', { name: 'Settings' })).toBeDefined();
    });
});
