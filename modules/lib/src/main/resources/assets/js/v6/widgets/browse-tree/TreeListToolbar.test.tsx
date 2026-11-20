import { act, cleanup, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as contentSelection from '../../entities/content/model/content-selection.store';
import * as projectSelection from '../../pages/settings/model/settingsTreeSelection.store';
import { SettingsTreeListToolbar } from '../../pages/settings/ui/SettingsTreeListToolbar';
import { TreeListToolbar } from './TreeListToolbar';

vi.mock('@enonic/lib-admin-ui/ui2/LegacyElement', () => ({ LegacyElement: class {} }));
vi.mock('@enonic/ui', () => ({
    Checkbox: ({ label, checked, defaultChecked, ...props }) => (
        <button type="button" role="checkbox" aria-checked={checked} {...props}>
            {label}
        </button>
    ),
    IconButton: ({ icon, ...props }) => <button type="button" {...props} />,
}));
vi.mock('../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string, count?: number) => (key === 'wcag.selection.count' ? `Selected items: ${count}` : key),
}));
vi.mock('../../entities/content', async () => {
    const { atom } = await import('nanostores');
    const selection = await import('../../entities/content/model/content-selection.store');
    return {
        ...selection,
        $isReloading: atom(false),
        $rootLoadingState: atom('loaded'),
        reloadContentTree: vi.fn(),
    };
});
vi.mock('../../entities/project', async () => ({
    ...(await import('../../entities/project/activeProject.store')),
    reloadProjects: vi.fn(),
}));
vi.mock('../../pages/settings/model/settings-tree.store', async () => {
    const { atom } = await import('nanostores');
    return {
        $settingsTreeState: atom({ nodes: new Map() }),
        getSettingsItem: vi.fn(),
        resetSettingsTreeForReload: vi.fn(),
    };
});

beforeEach(() => vi.useFakeTimers());

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    contentSelection.clearSelection();
    contentSelection.setActive(null);
    projectSelection.clearSelection();
    projectSelection.setActive(null);
});

it.each([
    { name: 'content', Component: TreeListToolbar, selection: contentSelection },
    { name: 'settings', Component: SettingsTreeListToolbar, selection: projectSelection },
])('updates only the selected count in the $name toolbar', async ({ Component, selection }) => {
    render(<Component />);
    const checkbox = screen.getByRole('checkbox');
    const region = screen.getByRole('status');
    const expectAnnouncement = async (changeSelection: () => void, count: number): Promise<void> => {
        await act(async () => {
            changeSelection();
            vi.advanceTimersByTime(0);
        });
        expect(region.textContent).toBe('\u00a0');
        await act(async () => {
            vi.advanceTimersByTime(100);
        });
        expect(region.textContent).toBe(`Selected items: ${count}`);
    };
    checkbox.focus();
    expect(region.textContent).toBe('Selected items: 0');
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.getAttribute('aria-atomic')).toBe('true');
    expect(region.classList.contains('sr-only')).toBe(true);

    // An active row counts as one item without checking its checkbox.
    await expectAnnouncement(() => selection.setActive('active-item'), 1);
    expect(checkbox.getAttribute('aria-checked')).toBe('false');

    // Reannounce a new single selection and switching between row and checkbox.
    await expectAnnouncement(() => selection.setActive('first'), 1);
    await expectAnnouncement(() => selection.setSelection(['first']), 1);
    await expectAnnouncement(() => selection.clearSelection(), 1);
    await expectAnnouncement(() => selection.setSelection(['second']), 1);

    await expectAnnouncement(() => selection.setSelection(['first', 'second']), 2);
    expect(document.activeElement).toBe(checkbox);

    // Moving the active row under a checkbox selection does not change selection.
    const changes: MutationRecord[] = [];
    const observer = new MutationObserver((records) => changes.push(...records));
    observer.observe(region, { subtree: true, childList: true, characterData: true });
    await act(async () => {
        selection.setActive('another-item');
        vi.advanceTimersByTime(0);
    });
    observer.disconnect();
    expect(changes).toHaveLength(0);

    await expectAnnouncement(() => selection.setSelection(['third', 'fourth']), 2);
    await expectAnnouncement(() => selection.setSelection(['third']), 1);
    await expectAnnouncement(() => selection.clearSelection(), 1);
    await expectAnnouncement(() => selection.setActive(null), 0);

    // Rapid changes cancel the pending count and publish only the latest one.
    await act(async () => {
        selection.setSelection(['first', 'second']);
        vi.advanceTimersByTime(0);
    });
    await expectAnnouncement(() => selection.setSelection(['third']), 1);
    expect(screen.getByRole('status')).toBe(region);
    expect(document.activeElement).toBe(checkbox);
});
