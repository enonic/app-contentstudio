import { act, cleanup, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { WritableAtom } from 'nanostores';
import type { ContentSummary } from '../../../app/content/ContentSummary';
import { $contextContent } from '../../entities/content';
import { registerSiteConfigErrorAnnouncer } from '../../features/shared/form/input-types/site-configurator/siteConfigAnnouncement.store';
import { $hasInvalidSiteConfig } from '../../pages/wizard/model/wizardValidation.store';
import { $wizardContentState } from '../../pages/wizard/model/wizardContent.store';
import {
    resetWizardToolbar,
    setWizardToolbarContentName,
    showWizardSaveFeedback,
} from '../../pages/wizard/model/wizardToolbar.store';
import { ContentWizardToolbar, type ContentWizardToolbarProps } from './ContentWizardToolbar';

const { manager, setToastProps } = vi.hoisted(() => ({
    manager: { showFeedback: vi.fn(), getNotification: vi.fn() },
    setToastProps: vi.fn(),
}));

const contentState = $wizardContentState as WritableAtom<ReturnType<typeof $wizardContentState.get>>;

vi.mock('@enonic/lib-admin-ui/notify/NotifyManager', () => ({ NotifyManager: { get: () => manager } }));
vi.mock('@enonic/lib-admin-ui/ui2/LegacyElement', () => ({ LegacyElement: class {} }));
vi.mock('@enonic/ui', () => {
    const Container = ({ children, ...props }) => <div {...props}>{children}</div>;
    return {
        Toolbar: Object.assign(Container, { Container, Item: Container }),
        Tooltip: ({ children }) => children,
        Button: ({ children, ...props }) => <button {...props}>{children}</button>,
        IconButton: () => null,
        cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
    };
});
vi.mock('../../shared/lib/hooks/useI18n', () => ({ useI18n: (key: string) => key }));
vi.mock('../../shared/lib/hooks/useElementVisibility', () => ({ useElementVisibility: () => [null, false] }));
vi.mock('../../shared/config/config.store', async () => {
    const { atom } = await import('nanostores');
    return { $config: atom({}) };
});
vi.mock('../../pages/wizard/model/wizardContent.store', async () => {
    const { atom } = await import('nanostores');
    return {
        $contentType: atom(null),
        $wizardContentState: atom(null),
        $wizardDraftDisplayName: atom(''),
        $wizardDraftName: atom(null),
        $wizardPersistedDisplayName: atom(''),
        $wizardPersistedName: atom(null),
        $wizardContentPathExists: atom({ exists: false, fetching: false }),
        $wizardReadOnly: atom(false),
        setDraftName: vi.fn(),
    };
});
vi.mock('../../pages/wizard/model/wizardValidation.store', async () => {
    const { atom } = await import('nanostores');
    return { $hasInvalidSiteConfig: atom(false) };
});
vi.mock('../../entities/content', async () => {
    const { atom } = await import('nanostores');
    return { $contextContent: atom(null) };
});
vi.mock('../../features/ai', async () => {
    const { atom } = await import('nanostores');
    return { $aiAssignedPlugins: atom({}), $aiRegisteredPlugins: atom({}), $aiPluginDialogOpen: atom({}) };
});
vi.mock('../inspectors/model/inspect-panel.store', () => ({ setInspectSaveAction: vi.fn() }));
vi.mock('../../shared/ui/icons/ProjectIcon', () => ({ ProjectIcon: () => null }));
vi.mock('../../shared/ui/icons/StatusIcon', () => ({ StatusIcon: () => null }));
vi.mock('../../features/shared/icons/LayerIndicator', () => ({ LayerIndicator: () => null }));
vi.mock('../../features/shared/status/StatusBadge', () => ({ StatusBadge: () => null }));
vi.mock('./ContextToggle', () => ({ ContextToggle: () => null }));
vi.mock('./OverflowActionRow', () => ({ OverflowActionRow: () => null }));
vi.mock('./SplitActionButton', () => ({ SplitActionButton: () => null }));
vi.mock('./useLegacyToolbarActions', () => ({ useLegacyToolbarActions: () => [] }));

beforeEach(() => {
    vi.clearAllMocks();
    contentState.set(null);
    $hasInvalidSiteConfig.set(false);
    $contextContent.set({ getId: () => 'content' } as ContentSummary);
    resetWizardToolbar();
    manager.showFeedback.mockReturnValue('save-toast');
    manager.getNotification.mockReturnValue({ setProps: setToastProps });
});

it('announces a transition into Invalid once in the same region, without replaying stale save feedback', async () => {
    render(<ContentWizardToolbar {...({} as ContentWizardToolbarProps)} />);
    const region = screen.getByRole('status');
    await act(async () => contentState.set('in-progress'));
    await act(async () => showWizardSaveFeedback('Item saved.'));
    await waitFor(() => expect(region.textContent).toBe('Item saved.'));

    await act(async () => contentState.set('invalid'));
    await waitFor(() => expect(region.textContent).toBe('field.invalid'));
    expect(screen.getAllByRole('status')).toEqual([region]);
    const message = region.firstChild;

    await act(async () => {
        contentState.set('invalid');
        setWizardToolbarContentName('another-edit');
    });
    expect(region.firstChild).toBe(message);

    await act(async () => contentState.set('in-progress'));
    await waitFor(() => expect(region.textContent).toBe('\u00a0'));
    await act(async () => contentState.set('invalid'));
    await waitFor(() => expect(region.textContent).toBe('field.invalid'));
    await act(async () => showWizardSaveFeedback('Item saved.'));
    await waitFor(() => expect(region.textContent).toBe('Item saved.'));
});

it('does not announce initial Invalid state or replay it after resetting the toolbar', async () => {
    render(<ContentWizardToolbar {...({} as ContentWizardToolbarProps)} />);
    const region = screen.getByRole('status');
    await act(async () => contentState.set('invalid'));
    expect(region.textContent).toBe('\u00a0');
    await act(async () => contentState.set('ready'));
    await act(async () => contentState.set('invalid'));
    await waitFor(() => expect(region.textContent).toBe('field.invalid'));
    await act(async () => resetWizardToolbar());
    await waitFor(() => expect(region.textContent).toBe('\u00a0'));
});

afterEach(() => {
    cleanup();
    resetWizardToolbar();
});

it.each([undefined, 'other-content', 'content'])(
    'keeps the Invalid fallback unless a mounted announcer handles this content (owner: %s)',
    async (owner) => {
        const release = owner ? registerSiteConfigErrorAnnouncer(owner) : undefined;
        try {
            render(<ContentWizardToolbar {...({} as ContentWizardToolbarProps)} />);
            const region = screen.getByRole('status');
            await act(async () => contentState.set('in-progress'));
            await act(async () => {
                $hasInvalidSiteConfig.set(true);
                contentState.set('invalid');
            });
            if (owner === 'content') {
                expect(region.textContent).toBe('\u00a0');
            } else {
                await waitFor(() => expect(region.textContent).toBe('field.invalid'));
            }
        } finally {
            release?.();
        }
    },
);

it('updates an existing polite live region with the save toast message without moving focus', async () => {
    render(<ContentWizardToolbar {...({} as ContentWizardToolbarProps)} />);
    const region = screen.getByRole('status');
    const button = screen.getAllByRole('button')[0];
    button.focus();
    expect(region.textContent).toBe('\u00a0');
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.getAttribute('aria-atomic')).toBe('true');
    expect(region.classList.contains('sr-only')).toBe(true);

    await act(async () => setWizardToolbarContentName('edited-name'));
    expect(region.textContent).toBe('\u00a0');

    await act(async () => showWizardSaveFeedback('Item "article" saved.'));
    await waitFor(() => expect(region.textContent).toBe('Item "article" saved.'));
    expect(screen.getByRole('status')).toBe(region);
    expect(document.activeElement).toBe(button);
    expect(manager.showFeedback).toHaveBeenCalledExactlyOnceWith('Item "article" saved.');
    expect(manager.getNotification).toHaveBeenCalledWith('save-toast');
    expect(setToastProps).toHaveBeenCalledExactlyOnceWith({ role: 'none', 'aria-live': 'off' });
});

it('inserts fresh content for repeated saves, even when the visible toast is deduplicated', async () => {
    const { unmount } = render(<ContentWizardToolbar {...({} as ContentWizardToolbarProps)} />);
    const region = screen.getByRole('status');
    await act(async () => showWizardSaveFeedback('Item "article" saved.'));
    await waitFor(() => expect(region.textContent).toBe('Item "article" saved.'));
    const firstMessage = region.firstChild;

    manager.showFeedback.mockReturnValue(null);
    manager.getNotification.mockReturnValue(null);
    await act(async () => showWizardSaveFeedback('Item "article" saved.'));
    await waitFor(() => expect(region.firstChild).not.toBe(firstMessage));
    expect(region.textContent).toBe('Item "article" saved.');
    expect(screen.getByRole('status')).toBe(region);

    unmount();
    resetWizardToolbar();
    render(<ContentWizardToolbar {...({} as ContentWizardToolbarProps)} />);
    expect(screen.getByRole('status').textContent).toBe('\u00a0');
});
