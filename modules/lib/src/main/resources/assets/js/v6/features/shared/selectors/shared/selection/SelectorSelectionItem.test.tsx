import { SortableGridList } from '@enonic/input-types';
import { Tooltip } from '@enonic/ui';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { ContentPath } from '../../../../../../app/content/ContentPath';
import { ContentSummaryBuilder, type ContentSummary } from '../../../../../../app/content/ContentSummary';
import { ContentStatusIcon } from '../../../../../shared/ui/icons/ContentStatusIcon';
import { SelectorSelectionItem } from './SelectorSelectionItem';

vi.unmock('@enonic/ui');
vi.mock('../../../../../shared/lib/hooks/useI18n', () => ({ useI18n: (key: string) => key }));
vi.mock('../../../../../../app/event/EditContentEvent', () => ({ EditContentEvent: vi.fn() }));

const contents = ['first', 'second'].map((id) =>
    new ContentSummaryBuilder()
        .setId(id)
        .setPath(ContentPath.create().fromString(`/${id}`).build())
        .build(),
);

const Selection = ({ items }: { items: ContentSummary[] }) => (
    <SortableGridList
        items={items}
        enabled
        fullRowDraggable
        keyExtractor={(content) => content.getId()}
        onMove={vi.fn()}
        renderItem={(context) => (
            <SelectorSelectionItem
                project={undefined}
                context={context}
                selection={items.map((content) => content.getId())}
                onSelectionChange={vi.fn()}
                renderContent={() => (
                    <div>
                        <ContentStatusIcon status="invalid" />
                        <Tooltip value="Path">
                            <span tabIndex={0}>Path</span>
                        </Tooltip>
                    </div>
                )}
            />
        )}
    />
);

const getItems = (): HTMLElement[] =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-component="SelectorSelectionItem"]'));
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

it.each(['keyboard', 'pointer'])(
    'makes a single item focusable and respects %s focus for its status',
    async (input) => {
        vi.useFakeTimers();
        render(<Selection items={contents.slice(0, 1)} />);
        const [item] = getItems();
        expect(item.tabIndex).toBe(0);
        await act(async () => {
            if (input === 'keyboard') fireEvent.keyDown(document.body, { key: 'Tab' });
            else fireEvent.pointerDown(item);
            item.focus();
        });
        expect(document.activeElement).toBe(item);
        await advance(499);
        expect(tooltip()).toBeNull();
        await advance(1);
        expect(tooltip()?.textContent ?? null).toBe(input === 'keyboard' ? 'field.invalid' : null);

        if (input === 'keyboard') {
            await act(async () => {
                fireEvent.keyDown(item, { key: 'Tab' });
                screen.getByRole('button', { name: 'action.edit' }).focus();
            });
            await advance(500);
            expect(
                [...document.querySelectorAll('[data-component="Tooltip.Content"]')].map((node) => node.textContent),
            ).toEqual(['action.edit']);
        }
    },
);

it('keeps the toolkit row navigation when the selection grows and restores the single-item Tab stop', async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Selection items={contents.slice(0, 1)} />);
    const [firstItem] = getItems();
    expect(firstItem.tabIndex).toBe(0);

    rerender(<Selection items={contents} />);
    const [first, second] = getItems();
    expect(first).toBe(firstItem);
    const firstRow = first.parentElement!;
    const secondRow = second.parentElement!;
    expect(
        [...document.querySelectorAll<HTMLElement>('[tabindex]')].filter((element) => element.tabIndex >= 0),
    ).toEqual([firstRow]);

    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        firstRow.focus();
        fireEvent.keyDown(firstRow, { key: 'ArrowDown' });
    });
    await advance(20);
    expect(document.activeElement).toBe(secondRow);

    rerender(<Selection items={contents.slice(0, 1)} />);
    expect(getItems()).toEqual([firstItem]);
    expect(firstItem.tabIndex).toBe(0);
    expect(firstRow.hasAttribute('tabindex')).toBe(false);
});

it('follows the current focus owner when the selection grows and shrinks without remounting the icon', async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Selection items={contents.slice(0, 1)} />);
    const [firstItem] = getItems();
    const icon = firstItem.querySelector('[data-component="StatusIcon"]');

    rerender(<Selection items={contents} />);
    expect(firstItem.querySelector('[data-component="StatusIcon"]')).toBe(icon);
    const firstRow = firstItem.parentElement!;
    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        firstRow.focus();
    });
    await advance(499);
    expect(tooltip()).toBeNull();
    await advance(1);
    expect(tooltip()?.textContent).toBe('field.invalid');

    await act(async () => firstRow.blur());
    expect(tooltip()).toBeNull();
    rerender(<Selection items={contents.slice(0, 1)} />);
    expect(firstItem.querySelector('[data-component="StatusIcon"]')).toBe(icon);
    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        firstItem.focus();
    });
    await advance(499);
    expect(tooltip()).toBeNull();
    await advance(1);
    expect(tooltip()?.textContent).toBe('field.invalid');
});

it('observes the new sortable ancestor while focus stays inside the selection item', async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Selection items={contents.slice(0, 1)} />);
    const [firstItem] = getItems();
    const icon = firstItem.querySelector('[data-component="StatusIcon"]');
    await act(async () => {
        fireEvent.keyDown(document.body, { key: 'Tab' });
        firstItem.focus();
    });
    await advance(500);
    expect(tooltip()?.textContent).toBe('field.invalid');

    rerender(<Selection items={contents} />);
    expect(firstItem.querySelector('[data-component="StatusIcon"]')).toBe(icon);
    expect(document.activeElement).toBe(firstItem);
    const firstRow = firstItem.parentElement!;
    await act(async () => {
        fireEvent.keyDown(firstItem, { key: 'ArrowLeft' });
    });
    expect(document.activeElement).toBe(firstItem);
    await act(async () => firstRow.setAttribute('aria-pressed', 'true'));
    expect(tooltip()).toBeNull();
    await advance(1500);
    expect(tooltip()).toBeNull();

    await act(async () => {
        fireEvent.keyDown(firstItem, { key: 'Escape' });
        firstRow.setAttribute('aria-pressed', 'false');
    });
    await advance(499);
    expect(tooltip()).toBeNull();
    await advance(1);
    expect(tooltip()?.textContent).toBe('field.invalid');
});
