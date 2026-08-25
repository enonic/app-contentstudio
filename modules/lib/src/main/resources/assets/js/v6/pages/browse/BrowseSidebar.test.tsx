import { act, fireEvent, render, screen } from '@testing-library/preact';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { $isBrowseSidebarOpen, setBrowseSidebarOpen } from './model/browseSidebar.store';

const mocks = vi.hoisted(() => ({
    sm: false,
    setActiveWidget: vi.fn(),
    widgets: [] as ReadonlyArray<{
        getDescriptorKey: () => { toString: () => string };
        getDisplayName: () => string;
        getIconUrl: () => string | undefined;
        getFullIconUrl: () => string | undefined;
    }>,
}));

vi.mock('@enonic/lib-admin-ui/store/Store', () => ({
    Store: {
        instance: () => ({
            get: () => ({ getName: () => 'Content Studio' }),
        }),
    },
}));

vi.mock('@enonic/ui', () => ({
    cn: (...classes: unknown[]) => classes.filter(Boolean).join(' '),
    Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock('@nanostores/preact', () => ({
    useStore: (store: { get: () => unknown }) => store.get(),
}));

vi.mock('lucide-react', () => ({
    Pen: () => null,
    Settings: () => null,
}));

vi.mock('../../shared/lib/hooks/useBreakpoints', () => ({
    useBreakpoints: () => ({ sm: mocks.sm }),
}));

vi.mock('../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) => key,
}));

vi.mock('../../shared/ui/icons/DefaultProjectIcon', () => ({
    DefaultProjectIcon: () => <span />,
}));

vi.mock('../../shared/ui/icons/ProjectIcon', () => ({
    ProjectIcon: () => <span />,
}));

vi.mock('../../shared/ui/LegacyElement', () => ({
    LegacyElement: class {},
}));

vi.mock('../../shared/ui/WidgetButton', () => ({
    WidgetButton: ({ label, onClick }: { label: string; onClick?: () => void }) => (
        <button type="button" onClick={onClick}>
            {label}
        </button>
    ),
}));

vi.mock('../../entities/project', () => ({
    $activeProject: { get: () => undefined },
    $noProjectMode: { get: () => false },
}));

vi.mock('../../shared/config', () => ({
    $config: { get: () => ({ appVersion: '6.1.0-SNAPSHOT' }) },
}));

vi.mock('../../widgets/context-panel/model/sidebarWidgets.store', () => ({
    $sidebarWidgets: { get: () => ({ widgets: mocks.widgets, activeWidgetId: undefined }) },
    getSettingsWidget: (widgets: typeof mocks.widgets) =>
        widgets.find((widget) => widget.getDescriptorKey().toString().endsWith(':settings')),
    getWidgetKey: (widget?: (typeof mocks.widgets)[number]) => widget?.getDescriptorKey().toString(),
    isMainWidget: (widget: (typeof mocks.widgets)[number]) => widget.getDescriptorKey().toString().endsWith(':main'),
    isSettingsWidget: (widget: (typeof mocks.widgets)[number]) =>
        widget.getDescriptorKey().toString().endsWith(':settings'),
    setActiveWidget: mocks.setActiveWidget,
}));

import { BrowseSidebar } from './BrowseSidebar';

function createWidget(key: string, label: string): (typeof mocks.widgets)[number] {
    return {
        getDescriptorKey: () => ({ toString: () => key }),
        getDisplayName: () => label,
        getIconUrl: () => undefined,
        getFullIconUrl: () => undefined,
    };
}

describe('BrowseSidebar', () => {
    beforeEach(() => {
        mocks.sm = false;
        mocks.setActiveWidget.mockClear();
        mocks.widgets = [createWidget('studio:main', 'Content'), createWidget('studio:settings', 'Settings')];
        setBrowseSidebarOpen(false);
    });

    it('closes after selecting main or footer widget', () => {
        setBrowseSidebarOpen(true);
        const { rerender } = render(<BrowseSidebar />);

        fireEvent.click(screen.getByRole('button', { name: 'Content' }));
        expect(mocks.setActiveWidget).toHaveBeenCalledWith(mocks.widgets[0]);
        expect($isBrowseSidebarOpen.get()).toBe(false);

        setBrowseSidebarOpen(true);
        rerender(<BrowseSidebar />);
        fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
        expect(mocks.setActiveWidget).toHaveBeenCalledWith(mocks.widgets[1]);
        expect($isBrowseSidebarOpen.get()).toBe(false);
    });

    it('resets open state after crossing to desktop breakpoint', () => {
        setBrowseSidebarOpen(true);
        const { rerender } = render(<BrowseSidebar />);

        mocks.sm = true;
        act(() => rerender(<BrowseSidebar />));

        expect($isBrowseSidebarOpen.get()).toBe(false);
    });

    it('uses dialog backdrop styling', () => {
        setBrowseSidebarOpen(true);
        render(<BrowseSidebar />);

        const backdrop = document.querySelector('.bg-overlay');
        expect(backdrop).not.toBeNull();
        expect(backdrop?.classList.contains('backdrop-blur-xs')).toBe(true);
    });
});
