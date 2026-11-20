import { Dialog, GridList, Tooltip } from '@enonic/ui';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { ContentStatusIcon } from './ContentStatusIcon';

vi.unmock('@enonic/ui');
vi.mock('../../lib/hooks/useI18n', () => ({ useI18n: (key: string) => key }));
// Dialog handles Escape itself; omit its focus trap in Happy DOM.
vi.mock('focus-trap-react', () => ({ FocusTrap: ({ children }: { children: ReactNode }) => children }));

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
    vi.restoreAllMocks();
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
    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        tree.focus();
    });
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

    await act(async () => {
        fireEvent.keyDown(tree, { key: 'ArrowDown' });
        tree.setAttribute('aria-activedescendant', 'content-b');
    });
    await advance(500);
    expect(tooltip()?.textContent).toBe('tooltip.state.ready');
    expect(secondRow.getAttribute('aria-describedby')).toBeNull();
    expect(iconState('tooltip.state.ready')).toBe('ready');
    await act(async () => screen.getByRole('button', { name: 'Outside' }).focus());
    expect(tooltip()).toBeNull();
});

it.each([
    ['pending', 250],
    ['visible', 500],
] as const)('handles Escape with a %s status tooltip inside a dialog', async (state, delay) => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn();
    const onEscapeKeyDown = vi.fn();
    render(
        <Dialog defaultOpen onOpenChange={onOpenChange}>
            <Dialog.Content
                aria-label="Status dialog"
                onEscapeKeyDown={onEscapeKeyDown}
                onOpenAutoFocus={(event) => event.preventDefault()}
            >
                <GridList>
                    <GridList.Row id="dialog-content">
                        <GridList.Cell>
                            <ContentStatusIcon status="invalid" />
                        </GridList.Cell>
                    </GridList.Row>
                </GridList>
            </Dialog.Content>
        </Dialog>,
    );
    const cell = screen.getByRole('gridcell');
    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        cell.focus();
    });
    await advance(delay);
    expect(tooltip()?.textContent ?? null).toBe(state === 'visible' ? 'field.invalid' : null);

    await act(async () => {
        fireEvent.keyDown(cell, { key: 'Escape' });
    });
    expect(tooltip()).toBeNull();
    if (state === 'visible') {
        expect(screen.getByRole('dialog', { name: 'Status dialog' })).toBeDefined();
        expect(document.activeElement).toBe(cell);
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(onEscapeKeyDown).not.toHaveBeenCalled();
        await advance(1000);
        expect(tooltip()).toBeNull();

        await act(async () => {
            fireEvent.keyDown(cell, { key: 'Escape' });
        });
    }
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onEscapeKeyDown).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    await advance(1000);
    expect(tooltip()).toBeNull();
});

it('shows the status tooltip on its GridList cell and hides it on a sibling cell', async () => {
    vi.useFakeTimers();
    render(
        <GridList>
            <GridList.Row id="content">
                <GridList.Cell>
                    <ContentStatusIcon status="invalid" />
                </GridList.Cell>
                <GridList.Cell>Other cell</GridList.Cell>
            </GridList.Row>
        </GridList>,
    );
    const [contentCell, otherCell] = screen.getAllByRole('gridcell');
    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        contentCell.focus();
    });
    await advance(499);
    expect(tooltip()).toBeNull();
    await advance(1);
    expect(tooltip()?.textContent).toBe('field.invalid');
    expect(document.activeElement).toBe(contentCell);

    await act(async () => {
        fireEvent.keyDown(contentCell, { key: 'ArrowRight' });
    });
    await advance(500);
    expect(document.activeElement).toBe(otherCell);
    expect(tooltip()).toBeNull();
});

it('shows the status tooltip on a Duplicate-style content button and hides it on the sibling checkbox', async () => {
    vi.useFakeTimers();
    render(
        <ul>
            <li role="row">
                <button type="button" aria-label="Content">
                    <ContentStatusIcon status="invalid" />
                </button>
                <label>
                    <input type="checkbox" />
                    Include children
                </label>
            </li>
        </ul>,
    );
    const contentButton = screen.getByRole('button', { name: 'Content' });
    const checkbox = screen.getByRole('checkbox', { name: 'Include children' });
    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        contentButton.focus();
    });
    await advance(499);
    expect(tooltip()).toBeNull();
    await advance(1);
    expect(tooltip()?.textContent).toBe('field.invalid');
    expect(document.activeElement).toBe(contentButton);

    await act(async () => {
        fireEvent.keyDown(contentButton, { key: 'Tab' });
        checkbox.focus();
    });
    await advance(500);
    expect(tooltip()).toBeNull();
    expect(document.activeElement).toBe(checkbox);
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
    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        screen.getByRole('tree').focus();
    });
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
    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        row.focus();
    });
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

it('keeps mouse-selected tree rows quiet and resumes tooltips on keyboard navigation', async () => {
    vi.useFakeTimers();
    render(
        <div role="tree" tabIndex={0} aria-activedescendant="pointer-row">
            <div role="treeitem" id="pointer-row">
                <ContentStatusIcon status="invalid" />
            </div>
        </div>,
    );
    const tree = screen.getByRole('tree');
    const row = screen.getByRole('treeitem');
    const anchor = screen.getByRole('img', { name: 'field.invalid' }).parentElement!;
    await act(async () => {
        fireEvent.pointerDown(row);
        tree.focus();
        fireEvent.click(row);
    });
    await advance(1000);
    expect(tooltip()).toBeNull();

    await act(async () => {
        fireEvent.mouseEnter(anchor);
    });
    await advance(300);
    expect(tooltip()?.textContent).toBe('field.invalid');
    await act(async () => {
        fireEvent.keyDown(tree, { key: 'Escape' });
    });
    await advance(1000);
    expect(tooltip()).toBeNull();
    await act(async () => {
        fireEvent.mouseLeave(anchor);
    });
    await advance(100);
    expect(tooltip()).toBeNull();

    await act(async () => {
        fireEvent.keyDown(tree, { key: 'ArrowDown' });
    });
    await advance(500);
    expect(tooltip()?.textContent).toBe('field.invalid');
    expect(document.activeElement).toBe(tree);

    // Clicking the already-focused row must also end virtual keyboard focus.
    await act(async () => {
        fireEvent.pointerDown(row);
    });
    await advance(1000);
    expect(tooltip()).toBeNull();
});

it.each(['pointer', 'keyboard'])('respects %s focus when a virtualized status icon mounts', async (input) => {
    vi.useFakeTimers();
    const view = (withIcon: boolean) => (
        <div role="tree" tabIndex={0} aria-activedescendant="late-row">
            <div role="treeitem" id="late-row">
                {withIcon && <ContentStatusIcon status="invalid" />}
            </div>
        </div>
    );
    const { rerender } = render(view(false));
    const tree = screen.getByRole('tree');
    await act(async () => {
        if (input === 'pointer') fireEvent.pointerDown(tree);
        else fireEvent.keyDown(document.body, { key: 'Tab' });
        tree.focus();
    });
    // Happy DOM treats :focus-visible as :focus; supply the browser's modality result.
    const matches = tree.matches.bind(tree);
    vi.spyOn(tree, 'matches').mockImplementation((selector) =>
        selector === ':focus-visible' ? input === 'keyboard' : matches(selector),
    );
    rerender(view(true));
    await advance(500);
    expect(tooltip()?.textContent ?? null).toBe(input === 'keyboard' ? 'field.invalid' : null);
});

it.each([
    [250, false],
    [500, false],
    [500, true],
] as const)('dismisses active-row tooltips on scroll after %i ms (hovered: %s)', async (delay, hovered) => {
    vi.useFakeTimers();
    render(
        <div data-testid="scroller">
            <div role="tree" tabIndex={0} aria-activedescendant="scroll-row">
                <div role="treeitem" id="scroll-row">
                    <ContentStatusIcon status="invalid" />
                </div>
            </div>
        </div>,
    );
    const tree = screen.getByRole('tree');
    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        tree.focus();
    });
    const anchor = screen.getByRole('img', { name: 'field.invalid' }).parentElement!;
    if (hovered) {
        await act(async () => {
            fireEvent.mouseEnter(anchor);
        });
    }
    await advance(delay);
    await act(async () => {
        fireEvent.wheel(screen.getByTestId('scroller'));
        fireEvent.scroll(screen.getByTestId('scroller'));
    });
    await advance(1000);
    expect(tooltip()).toBeNull();
    expect(document.activeElement).toBe(tree);

    if (hovered) {
        await act(async () => {
            fireEvent.mouseLeave(anchor);
            fireEvent.mouseEnter(anchor);
        });
        await advance(300);
        expect(tooltip()?.textContent).toBe('field.invalid');
        await act(async () => {
            fireEvent.mouseLeave(anchor);
        });
        await advance(100);
        expect(tooltip()).toBeNull();
    }
    await act(async () => {
        fireEvent.keyDown(tree, { key: 'ArrowDown' });
    });
    await advance(500);
    expect(tooltip()?.textContent).toBe('field.invalid');
});

it.each([250, 500])(
    'restarts the keyboard tooltip delay on scroll without a wheel event after %i ms',
    async (delay) => {
        vi.useFakeTimers();
        render(
            <div data-testid="scroller">
                <div role="tree" tabIndex={0} aria-activedescendant="scroll-only-row">
                    <div role="treeitem" id="scroll-only-row">
                        <ContentStatusIcon status="invalid" />
                    </div>
                </div>
            </div>,
        );
        const tree = screen.getByRole('tree');
        await act(async () => {
            fireEvent.keyDown(document.body, { key: 'Tab' });
            tree.focus();
        });
        await advance(delay);
        await act(async () => {
            fireEvent.scroll(screen.getByTestId('scroller'));
        });
        expect(tooltip()).toBeNull();
        await advance(16);
        await advance(499);
        expect(tooltip()).toBeNull();
        await advance(1);
        expect(tooltip()?.textContent).toBe('field.invalid');
        expect(document.activeElement).toBe(tree);
    },
);

it.each([150, 300])('dismisses a hover-only tooltip on scroll without a wheel event after %i ms', async (delay) => {
    vi.useFakeTimers();
    render(
        <div data-testid="scroller">
            <div role="treeitem">
                <ContentStatusIcon status="invalid" />
            </div>
        </div>,
    );
    const anchor = screen.getByRole('img', { name: 'field.invalid' }).parentElement!;
    await act(async () => {
        fireEvent.mouseEnter(anchor);
    });
    await advance(delay);
    if (delay === 300) {
        const content = tooltip()!;
        expect(content.textContent).toBe('field.invalid');
        await act(async () => {
            fireEvent.mouseLeave(anchor, { relatedTarget: content });
            fireEvent.mouseEnter(content);
        });
        await advance(150);
        expect(tooltip()).not.toBeNull();
    }
    await act(async () => {
        fireEvent.scroll(screen.getByTestId('scroller'));
    });
    expect(tooltip()).toBeNull();
    await advance(1000);
    expect(tooltip()).toBeNull();
});

it('still dismisses a hovered tooltip on scroll after Escape closes a different keyboard tooltip', async () => {
    vi.useFakeTimers();
    render(
        <div data-testid="scroller">
            <div role="tree" tabIndex={0} aria-activedescendant="keyboard-row">
                <div role="treeitem" id="keyboard-row">
                    <ContentStatusIcon status="invalid" />
                </div>
                <div role="treeitem">
                    <ContentStatusIcon status="ready" />
                </div>
            </div>
        </div>,
    );
    const tree = screen.getByRole('tree');
    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        tree.focus();
    });
    await advance(500);
    await act(async () => {
        fireEvent.mouseEnter(screen.getByRole('img', { name: 'tooltip.state.ready' }).parentElement!);
    });
    await advance(300);
    expect(document.querySelectorAll('[data-component="Tooltip.Content"]')).toHaveLength(2);

    await act(async () => {
        fireEvent.keyDown(tree, { key: 'Escape' });
    });
    expect(tooltip()?.textContent).toBe('tooltip.state.ready');
    await act(async () => {
        fireEvent.scroll(screen.getByTestId('scroller'));
    });
    expect(tooltip()).toBeNull();
    await advance(1000);
    expect(tooltip()).toBeNull();
});

it.each(['Path', 'Edit', 'Remove'])('shows only the nested %s tooltip in a selection item', async (label) => {
    vi.useFakeTimers();
    render(
        <div data-component="SelectorSelectionItem" tabIndex={0}>
            <ContentStatusIcon status="invalid" />
            <Tooltip value={label}>
                {label === 'Path' ? <span tabIndex={0}>Path</span> : <button type="button">{label}</button>}
            </Tooltip>
        </div>,
    );
    const control = screen.getByText(label, { selector: label === 'Path' ? 'span' : 'button' });
    const owner = control.closest<HTMLElement>('[data-component="SelectorSelectionItem"]')!;
    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        owner.focus();
    });
    await advance(500);
    expect(tooltip()?.textContent).toBe('field.invalid');

    await act(async () => {
        fireEvent.keyDown(owner, { key: 'Tab' });
        control.focus();
    });
    await advance(500);
    expect(
        [...document.querySelectorAll('[data-component="Tooltip.Content"]')].map((node) => node.textContent),
    ).toEqual([label]);
    await act(async () => {
        fireEvent.keyDown(control, { key: 'Escape' });
    });
    await advance(1000);
    expect(tooltip()).toBeNull();
});
