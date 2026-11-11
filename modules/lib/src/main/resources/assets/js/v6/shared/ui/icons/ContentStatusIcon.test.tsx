import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { ContentStatusIcon } from './ContentStatusIcon';

vi.unmock('@enonic/ui');
vi.mock('../../lib/hooks/useI18n', () => ({ useI18n: (key: string) => key }));

const tooltip = (): Element | null => document.querySelector('[data-component="Tooltip.Content"]');
const iconState = (label: string): string | null =>
    screen.getByRole('img', { name: label }).getAttribute('data-status');
const advance = async (ms: number): Promise<void> => {
    await act(async () => {
        vi.advanceTimersByTime(ms);
    });
};

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

it('waits 500 ms on the active tree row, respects Escape and follows focus changes', async () => {
    vi.useFakeTimers();
    render(
        <>
            <div role="tree" tabIndex={0} aria-activedescendant="content-a">
                <div role="treeitem" id="content-a">
                    <ContentStatusIcon status="invalid" />
                </div>
                <div role="treeitem" id="content-b">
                    <ContentStatusIcon status="ready" />
                </div>
            </div>
            <button type="button">Outside</button>
        </>,
    );
    const tree = screen.getByRole('tree');
    const [firstRow, secondRow] = screen.getAllByRole('treeitem');
    expect(iconState('field.invalid')).toBe('invalid');
    await act(async () => tree.focus());
    await advance(499);
    expect(tooltip()).toBeNull();
    await advance(1);
    expect(tooltip()?.textContent).toBe('field.invalid');
    expect(firstRow.getAttribute('aria-describedby')).toBeNull();
    expect(firstRow.querySelector('[role="tooltip"]')?.textContent).toBe('field.invalid');
    expect(iconState('field.invalid')).toBe('invalid');
    expect(document.activeElement).toBe(tree);
    expect(document.querySelector('[data-component="StatusIcon"]')?.hasAttribute('tabindex')).toBe(false);
    await act(async () => {
        fireEvent.keyDown(tree, { key: 'Escape' });
    });
    await advance(500);
    expect(tooltip()).toBeNull();
    expect(iconState('field.invalid')).toBe('invalid');

    await act(async () => tree.setAttribute('aria-activedescendant', 'content-b'));
    await advance(500);
    expect(tooltip()?.textContent).toBe('tooltip.state.ready');
    expect(secondRow.getAttribute('aria-describedby')).toBeNull();
    expect(iconState('tooltip.state.ready')).toBe('ready');
    await act(async () => screen.getByRole('button', { name: 'Outside' }).focus());
    expect(tooltip()).toBeNull();
});

it('keeps the original keyboard delay when the status icon is hovered', async () => {
    vi.useFakeTimers();
    render(
        <div role="tree" tabIndex={0} aria-activedescendant="content-hover">
            <div role="treeitem" id="content-hover">
                <ContentStatusIcon status="invalid" />
            </div>
        </div>,
    );
    await act(async () => screen.getByRole('tree').focus());
    await advance(300);
    await act(async () => {
        fireEvent.mouseEnter(screen.getByRole('img', { name: 'field.invalid' }).parentElement);
    });
    await advance(199);
    expect(tooltip()).toBeNull();
    await advance(1);
    expect(tooltip()?.textContent).toBe('field.invalid');
});

it('closes the tooltip during sorting so Escape can cancel the drag', async () => {
    vi.useFakeTimers();
    render(
        <div role="button" tabIndex={0} aria-roledescription="sortable" aria-pressed={false}>
            <ContentStatusIcon status="invalid" />
        </div>,
    );
    const row = screen.getByRole('button');
    await act(async () => row.focus());
    await advance(500);
    expect(tooltip()).not.toBeNull();

    await act(async () => row.setAttribute('aria-pressed', 'true'));
    expect(tooltip()).toBeNull();
    await advance(1500);
    expect(tooltip()).toBeNull();
    expect(iconState('field.invalid')).toBe('invalid');
    expect(fireEvent.keyDown(row, { key: 'Escape' })).toBe(true);

    await act(async () => row.setAttribute('aria-pressed', 'false'));
    await advance(499);
    expect(tooltip()).toBeNull();
    await advance(1);
    expect(tooltip()).not.toBeNull();
});
