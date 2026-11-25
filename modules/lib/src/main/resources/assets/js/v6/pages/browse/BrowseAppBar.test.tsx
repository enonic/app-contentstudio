import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    projectName: 'My project',
    projectKey: 'my-project',
    projectIconHash: undefined as string | undefined,
    projectLanguage: undefined as string | undefined,
    projectIsLayer: false,
    sm: false,
    showIssues: vi.fn(),
    stats: undefined as { open: number; openAssignedToMe: number } | undefined,
    phrases: {} as Record<string, string>,
}));

vi.mock('@enonic/ui', async (importOriginal) => importOriginal<typeof import('@enonic/ui')>());

vi.mock('lucide-react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('lucide-react')>()),
    Layers: () => <svg data-testid="layer-icon" aria-hidden="true" />,
}));

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
        fire(): void {
            mocks.showIssues();
        }
    },
}));

vi.mock('../../shared/lib/hooks/useBreakpoints', () => ({
    useBreakpoints: () => ({ sm: mocks.sm }),
}));

vi.mock('../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string, ...values: string[]) =>
        (mocks.phrases[key] ?? key).replace(/\{(\d+)\}/g, (_match, index) => values[Number(index)] ?? ''),
}));

vi.mock('../../shared/i18n', () => ({
    translate: (_key: string, { defaultValue }: { defaultValue: string }) => defaultValue,
}));

vi.mock('../../entities/project', () => ({
    $activeProject: {
        get: () => ({
            getName: () => mocks.projectKey,
            getDisplayName: () => mocks.projectName,
            getLanguage: () => mocks.projectLanguage,
            hasParents: () => mocks.projectIsLayer,
            getIcon: () => (mocks.projectIconHash ? { getSha512: () => mocks.projectIconHash } : undefined),
        }),
    },
    $activeProjectName: { get: () => mocks.projectName },
    $hasMultipleProjects: { get: () => mocks.hasMultipleProjects },
    $noProjectMode: { get: () => mocks.noProjectMode },
}));

vi.mock('../../shared/lib/url/projects', () => ({
    resolveProjectIconUrl: (name: string, hash: string) => `/project/icon/${name}?ts=${hash}`,
}));

vi.mock('../../shared/ui/icons/FlagIcon', () => ({
    FlagIcon: ({ language }: { language: string }) => <span data-language={language} />,
}));

vi.mock('../../shared/dialogs/dialogs.store', () => ({
    setProjectSelectionDialogOpen: vi.fn(),
}));

vi.mock('../../entities/issue', () => ({
    $issuesStats: { get: () => ({ stats: mocks.stats }) },
}));

vi.mock('../../widgets/context-panel/model/sidebarWidgets.store', () => ({
    $activeWidget: { get: () => mocks.activeWidget },
    isContentBrowseWidget: (widget: typeof mocks.activeWidget) =>
        widget?.getDescriptorKey().toString().endsWith('studio:main') ?? false,
    isSettingsWidget: (widget: typeof mocks.activeWidget) =>
        widget?.getDescriptorKey().toString().endsWith('studio:settings') ?? false,
}));

vi.mock('@enonic/ui-kit', () => ({
    ThemeSwitcher: () => null,
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

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe('BrowseAppBar', () => {
    beforeEach(() => {
        mocks.activeWidget = undefined;
        mocks.hasMultipleProjects = false;
        mocks.noProjectMode = false;
        mocks.projectName = 'My project';
        mocks.projectKey = 'my-project';
        mocks.projectIconHash = undefined;
        mocks.projectLanguage = undefined;
        mocks.projectIsLayer = false;
        mocks.sm = false;
        mocks.showIssues.mockClear();
        mocks.stats = undefined;
        mocks.phrases = {
            'wcag.appbar.project.label': 'Switch project',
            'wcag.appbar.issues.label': 'View project issues',
            'field.noOpenIssues': 'No open issues',
            'field.openIssuesCount': 'Open issues ({0})',
            'field.assignedToMeCount': 'Assigned to me ({0})',
        };
    });

    it('uses the configured project icon or the default while keeping the mobile title non-clickable', () => {
        mocks.projectIconHash = 'custom-icon';
        const { rerender } = render(<BrowseAppBar />);

        const projectTitle = screen.getByRole('heading', { name: 'My project' });
        expect(projectTitle.getAttribute('title')).toBeNull();
        expect(projectTitle.tabIndex).toBe(0);
        expect(projectTitle.querySelector('button')).toBeNull();
        expect(projectTitle.querySelector('img')?.getAttribute('src')).toBe('/project/icon/my-project?ts=custom-icon');
        expect(projectTitle.querySelector('img')?.closest('[aria-hidden="true"]')).not.toBeNull();

        mocks.projectIconHash = undefined;
        rerender(<BrowseAppBar />);

        expect(projectTitle.querySelector('img')).toBeNull();
        expect(projectTitle.querySelector('svg')).not.toBeNull();
        expect(screen.getByRole('heading', { name: 'My project' })).toBe(projectTitle);
    });

    it('keeps the mobile project title while preserving the desktop project selector', () => {
        mocks.activeWidget = createWidget('studio:main', 'Content', 'project');
        mocks.noProjectMode = false;
        const { rerender } = render(<BrowseAppBar />);

        const projectTitle = screen.getByRole('heading', { name: 'My project' });
        expect(projectTitle.classList.contains('sm:hidden')).toBe(true);
        expect(screen.getByRole('button', { name: 'tooltip.sidebar.open' }).classList.contains('max-sm:mr-auto')).toBe(
            true,
        );
        const projectName = screen.getByText('My project', { selector: 'span[tabindex="0"]' });
        expect(projectName.className).toContain('mr-auto');
        expect(projectName.className).toContain('max-sm:hidden');
        expect(projectName.tabIndex).toBe(0);
        expect(projectName.getAttribute('data-project-display-name')).toBe('My project');
        expect(screen.queryByRole('button', { name: 'My project' })).toBeNull();

        mocks.activeWidget = undefined;
        rerender(<BrowseAppBar />);
        expect(screen.getByRole('heading', { name: 'My project' })).toBeDefined();

        mocks.activeWidget = createWidget('plus:archive', 'Archive', 'project');
        mocks.hasMultipleProjects = true;
        rerender(<BrowseAppBar />);
        expect(screen.getByRole('heading', { name: 'Archive' }).classList.contains('sm:hidden')).toBe(true);
        const archiveProjectSelector = screen.getByRole<HTMLButtonElement>('button', {
            name: 'My project, Switch project',
        });
        expect(archiveProjectSelector.className).toContain('mr-auto');
        expect(archiveProjectSelector.className).toContain('max-sm:hidden');
        expect(archiveProjectSelector.disabled).toBe(false);
        expect(archiveProjectSelector.getAttribute('data-project-display-name')).toBe('My project');
        expect(archiveProjectSelector.getAttribute('data-component')).toBe('Tooltip');

        mocks.activeWidget = createWidget('studio:settings', 'Settings');
        mocks.noProjectMode = true;
        rerender(<BrowseAppBar />);
        expect(screen.getAllByRole('heading', { name: 'Settings' })).toHaveLength(2);

        const header = screen.getByRole('banner');
        expect(header.classList.contains('h-15')).toBe(true);
        expect(header.classList.contains('border-b')).toBe(true);
        expect(header.classList.contains('border-bdr-soft')).toBe(true);
    });

    it('uses language and layer icons with the same precedence as the project selector', () => {
        mocks.projectIsLayer = true;
        const { rerender } = render(<BrowseAppBar />);
        const projectTitle = screen.getByRole('heading', { name: 'My project' });

        expect(projectTitle.querySelector('[data-testid="layer-icon"]')).not.toBeNull();

        mocks.projectLanguage = 'nb';
        rerender(<BrowseAppBar />);
        expect(projectTitle.querySelector('[data-language="nb"]')).not.toBeNull();
        expect(projectTitle.querySelector('[data-testid="layer-icon"]')).toBeNull();

        mocks.projectIconHash = 'custom-icon';
        rerender(<BrowseAppBar />);
        expect(projectTitle.querySelector('img')?.getAttribute('src')).toBe('/project/icon/my-project?ts=custom-icon');
        expect(projectTitle.querySelector('[data-language]')).toBeNull();
    });

    it.each([false, true])(
        'keeps only the visible project tooltip description when multiple projects is %s',
        (multiple) => {
            mocks.hasMultipleProjects = multiple;
            const { rerender } = render(<BrowseAppBar />);
            const projectTitle = screen.getByRole('heading', { name: 'My project' });
            const desktopProject = document.querySelector('[data-project-display-name]');
            const projectTooltips = () =>
                screen.getAllByRole('tooltip').filter((tooltip) => tooltip.textContent === 'My project');

            expect(projectTooltips()).toHaveLength(1);
            expect(projectTitle.getAttribute('aria-describedby')).not.toBeNull();
            expect(desktopProject?.getAttribute('aria-describedby')).toBeNull();

            mocks.sm = true;
            rerender(<BrowseAppBar />);
            expect(projectTooltips()).toHaveLength(1);
            expect(projectTitle.getAttribute('aria-describedby')).toBeNull();
            expect(desktopProject?.getAttribute('aria-describedby')).not.toBeNull();
        },
    );

    it('includes the current project name in the selector name after project and language changes', () => {
        mocks.hasMultipleProjects = true;
        mocks.projectName = 'Enonic Homepage (en)';
        const { rerender } = render(<BrowseAppBar />);

        expect(screen.getByRole('button', { name: 'Enonic Homepage (en), Switch project' }).textContent).toBe(
            'Enonic Homepage (en)',
        );

        mocks.projectName = 'Nyheter (nb)';
        mocks.phrases['wcag.appbar.project.label'] = 'Bytt prosjekt';
        rerender(<BrowseAppBar />);

        expect(screen.getByRole('button', { name: 'Nyheter (nb), Bytt prosjekt' }).textContent).toBe('Nyheter (nb)');
    });

    it('includes the current issues label and count in the accessible name', () => {
        const { rerender } = render(<BrowseAppBar />);
        expect(screen.getByRole('button', { name: 'No open issues, View project issues' }).textContent).toBe(
            'No open issues',
        );
        const issuesButton = screen.getByRole('button', { name: 'No open issues, View project issues' });
        expect(issuesButton.getAttribute('title')).toBeNull();
        expect(issuesButton.getAttribute('aria-describedby')).toBeNull();
        fireEvent.click(issuesButton);
        expect(mocks.showIssues).toHaveBeenCalledOnce();

        mocks.stats = { open: 3, openAssignedToMe: 0 };
        rerender(<BrowseAppBar />);
        expect(screen.getByRole('button', { name: 'Open issues (3), View project issues' }).textContent).toBe(
            'Open issues (3)',
        );

        mocks.stats = { open: 3, openAssignedToMe: 2 };
        mocks.phrases['field.assignedToMeCount'] = 'Tildelt meg ({0})';
        mocks.phrases['wcag.appbar.issues.label'] = 'Vis prosjektsaker';
        rerender(<BrowseAppBar />);
        expect(screen.getByRole('button', { name: 'Tildelt meg (2), Vis prosjektsaker' }).textContent).toBe(
            'Tildelt meg (2)',
        );
    });

    it('opens project and issues tooltips on keyboard focus and dismisses them with Escape', async () => {
        mocks.stats = { open: 3, openAssignedToMe: 0 };
        const { rerender } = render(<BrowseAppBar />);
        const triggers = [
            { element: screen.getByRole('heading', { name: 'My project' }), label: 'My project' },
            {
                element: screen.getByRole('button', { name: 'Open issues (3), View project issues' }),
                label: 'Open issues (3)',
            },
        ];

        for (const { element, label } of triggers) {
            await act(() => element.focus());
            expect(document.querySelector('[data-component="Tooltip.Content"]')?.textContent).toBe(label);
            fireEvent.keyDown(element, { key: 'Escape' });
            expect(document.querySelector('[data-component="Tooltip.Content"]')).toBeNull();
            expect(document.activeElement).toBe(element);
        }

        mocks.sm = true;
        rerender(<BrowseAppBar />);
        const projectName = screen.getByText('My project', { selector: 'span[tabindex="0"]' });
        await act(() => projectName.focus());
        expect(document.querySelector('[data-component="Tooltip.Content"]')?.textContent).toBe('My project');
        fireEvent.keyDown(projectName, { key: 'Escape' });
        expect(document.querySelector('[data-component="Tooltip.Content"]')).toBeNull();

        mocks.hasMultipleProjects = true;
        rerender(<BrowseAppBar />);
        const selector = screen.getByRole('button', { name: 'My project, Switch project' });
        await act(() => selector.focus());
        expect(document.querySelector('[data-component="Tooltip.Content"]')?.textContent).toBe('My project');
        fireEvent.keyDown(selector, { key: 'Escape' });
        expect(document.querySelector('[data-component="Tooltip.Content"]')).toBeNull();
    });

    it('keeps the project tooltip open while the pointer moves onto it', async () => {
        vi.useFakeTimers();
        render(<BrowseAppBar />);
        const projectTitle = screen.getByRole('heading', { name: 'My project' });

        fireEvent.mouseEnter(projectTitle);
        await act(() => {
            vi.advanceTimersByTime(300);
        });
        const tooltip = document.querySelector('[data-component="Tooltip.Content"]');
        expect(tooltip?.textContent).toBe('My project');

        fireEvent.mouseLeave(projectTitle);
        fireEvent.mouseEnter(tooltip);
        await act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(document.querySelector('[data-component="Tooltip.Content"]')).toBe(tooltip);

        fireEvent.keyDown(projectTitle, { key: 'Escape' });
        expect(document.querySelector('[data-component="Tooltip.Content"]')).toBeNull();
    });
});
