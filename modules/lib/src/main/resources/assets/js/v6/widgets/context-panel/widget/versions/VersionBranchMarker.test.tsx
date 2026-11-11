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
    vi.restoreAllMocks();
    vi.useRealTimers();
});

const renderVersions = () =>
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

it('shows the branch after 500 ms and follows keyboard navigation in version history', async () => {
    vi.useFakeTimers();
    renderVersions();
    const list = screen.getByRole('listbox');
    const [draftRow, masterRow] = screen.getAllByRole('option');
    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        list.focus();
    });
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

it('keeps pointer-selected versions quiet and dismisses the branch on scroll', async () => {
    vi.useFakeTimers();
    renderVersions();
    const list = screen.getByRole('listbox');
    const [draftRow] = screen.getAllByRole('option');
    await act(async () => {
        fireEvent.pointerDown(draftRow);
        list.focus();
        fireEvent.click(draftRow);
    });
    await advance(1000);
    expect(tooltip()).toBeNull();

    await act(async () => {
        fireEvent.keyDown(list, { key: 'ArrowDown' });
    });
    await act(async () => {});
    await advance(500);
    expect(tooltip()?.textContent).toBe('master');
    await act(async () => {
        fireEvent.wheel(list);
        fireEvent.scroll(list);
    });
    await advance(1000);
    expect(tooltip()).toBeNull();
    expect(document.activeElement).toBe(list);

    await act(async () => {
        fireEvent.keyDown(list, { key: 'ArrowUp' });
    });
    await act(async () => {});
    await advance(500);
    expect(tooltip()?.textContent).toBe('draft');
});

it.each([250, 500])('restarts the branch tooltip delay on scroll without a wheel event after %i ms', async (delay) => {
    vi.useFakeTimers();
    renderVersions();
    const list = screen.getByRole('listbox');
    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        list.focus();
    });
    await advance(delay);
    await act(async () => {
        fireEvent.scroll(list);
    });
    expect(tooltip()).toBeNull();
    await advance(16);
    await advance(499);
    expect(tooltip()).toBeNull();
    await advance(1);
    expect(tooltip()?.textContent).toBe('draft');
    expect(document.activeElement).toBe(list);
});

it('shows the keyboard-selected branch after automatic scrolling', async () => {
    vi.useFakeTimers();
    renderVersions();
    const list = screen.getByRole('listbox');
    const [, masterRow] = screen.getAllByRole('option');
    const autoScroll = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(function (
        this: HTMLElement,
    ) {
        if (this === masterRow) {
            window.setTimeout(() => fireEvent.scroll(list), 0);
        }
    });
    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        list.focus();
    });
    await advance(500);
    expect(tooltip()?.textContent).toBe('draft');
    await act(async () => {
        fireEvent.keyDown(list, { key: 'ArrowDown' });
    });
    await act(async () => {});
    expect(autoScroll).toHaveBeenCalled();
    await advance(0);
    await advance(16);
    expect(tooltip()).toBeNull();
    await advance(499);
    expect(tooltip()).toBeNull();
    await advance(1);
    expect(tooltip()?.textContent).toBe('master');
    expect(document.activeElement).toBe(list);
    expect(list.getAttribute('aria-activedescendant')).toBe(masterRow.id);

    await act(async () => {
        fireEvent.keyDown(list, { key: 'Escape' });
        fireEvent.scroll(list);
    });
    await advance(16);
    await advance(1000);
    expect(tooltip()).toBeNull();
});
