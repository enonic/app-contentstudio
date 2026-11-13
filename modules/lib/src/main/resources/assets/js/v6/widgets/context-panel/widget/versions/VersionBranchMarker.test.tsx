import { Listbox } from '@enonic/ui';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { VersionBranchMarker } from './VersionBranchMarker';

vi.unmock('@enonic/ui');

const tooltip = (): Element | null => document.querySelector('[data-component="Tooltip.Content"]');
const advance = async (ms: number): Promise<void> => {
    await act(async () => {
        vi.advanceTimersByTime(ms);
    });
};

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

it('shows the branch after 500 ms and follows keyboard navigation in version history', async () => {
    vi.useFakeTimers();
    render(
        <Listbox focusMode="activedescendant" defaultActive="draft" autoActiveOnOpen={false}>
            <Listbox.Content>
                <Listbox.Item value="draft">
                    <VersionBranchMarker branch="draft" />
                </Listbox.Item>
                <Listbox.Item value="master">
                    <VersionBranchMarker branch="master" />
                </Listbox.Item>
            </Listbox.Content>
        </Listbox>,
    );
    const list = screen.getByRole('listbox');
    const [draftRow, masterRow] = screen.getAllByRole('option');
    await act(async () => list.focus());
    await advance(499);
    expect(tooltip()).toBeNull();
    await advance(1);
    expect(tooltip()?.textContent).toBe('draft');
    expect(draftRow.getAttribute('aria-describedby')).toBeNull();
    expect(draftRow.querySelector('[role="tooltip"]')?.textContent).toBe('draft');
    expect(screen.getByText('(D)').hasAttribute('tabindex')).toBe(false);

    await act(async () => {
        fireEvent.keyDown(list, { key: 'ArrowDown' });
    });
    // Flush the active-descendant observer and the tooltip's focus-target update before advancing time.
    await act(async () => {});
    await advance(499);
    expect(tooltip()).toBeNull();
    await advance(1);
    expect(tooltip()?.textContent).toBe('master');
    expect(masterRow.getAttribute('aria-describedby')).toBeNull();
    expect(document.activeElement).toBe(list);
});
