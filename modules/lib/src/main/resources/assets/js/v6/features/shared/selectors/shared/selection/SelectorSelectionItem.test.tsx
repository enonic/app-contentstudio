import { SortableGridList } from '@enonic/input-types';
import { Tooltip } from '@enonic/ui';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ContentPath } from '../../../../../../app/content/ContentPath';
import { ContentSummaryBuilder, type ContentSummary } from '../../../../../../app/content/ContentSummary';
import { ContentId } from '../../../../../../app/content/ContentId';
import { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import type { ContentState } from '../../../../../shared/lib/cms/content/ContentState';
import { ContentStatusIcon } from '../../../../../shared/ui/icons/ContentStatusIcon';
import { setPhrases } from '../../../../../shared/i18n';
import { ImageSelectorItemView } from '../../image/ImageSelectorItemView';
import { MediaSelectorItemView } from '../../media/MediaSelectorItemView';
import { getMediaSelectorStatus } from '../../media/media-selector.utils';
import { SelectorSelectionItem } from './SelectorSelectionItem';

vi.unmock('@enonic/ui');
vi.mock('../../../../../../app/event/EditContentEvent', () => ({ EditContentEvent: vi.fn() }));
vi.mock('../../../form/FormScopeContext', () => ({ useFormScope: () => ({ project: undefined }) }));

const contents = ['first', 'second'].map((id) =>
    new ContentSummaryBuilder()
        .setId(id)
        .setContentId(new ContentId(id))
        .setDisplayName(id)
        .setType(new ContentTypeName('media:image'))
        .setPath(ContentPath.create().fromString(`/${id}`).build())
        .build(),
);

type SelectionProps = {
    items: ContentSummary[];
    disabled?: boolean;
    status?: ContentState | null;
    variant?: 'status' | 'image' | 'media';
    hideStatus?: boolean;
};

const Selection = ({ items, disabled = false, status = 'invalid', variant = 'status', hideStatus }: SelectionProps) => (
    <SortableGridList
        items={items}
        enabled={!disabled}
        fullRowDraggable
        keyExtractor={(content) => content.getId()}
        onMove={vi.fn()}
        renderItem={(context) => (
            <SelectorSelectionItem
                project={undefined}
                context={{ ...context, itemCount: items.length }}
                disabled={disabled}
                status={
                    variant === 'media'
                        ? getMediaSelectorStatus(context.item, hideStatus)
                        : variant === 'status'
                          ? status
                          : null
                }
                selection={items.map((content) => content.getId())}
                onSelectionChange={vi.fn()}
                renderContent={(content) =>
                    variant === 'media' ? (
                        <MediaSelectorItemView content={content} hideStatus={hideStatus} />
                    ) : variant === 'image' ? (
                        <ImageSelectorItemView content={content} />
                    ) : (
                        <div>
                            {status && <ContentStatusIcon status={status} />}
                            <Tooltip value="Path">
                                <span tabIndex={0}>Path</span>
                            </Tooltip>
                        </div>
                    )
                }
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

beforeEach(() => {
    setPhrases({
        'action.edit': 'action.edit',
        'action.remove': 'action.remove',
        'field.invalid': 'field.invalid',
    });
});

afterEach(() => {
    cleanup();
    setPhrases({});
    vi.useRealTimers();
});

it.each(['keyboard', 'pointer'])(
    'makes a single item focusable and respects %s focus for its status',
    async (input) => {
        vi.useFakeTimers();
        render(<Selection items={contents.slice(0, 1)} />);
        const [item] = getItems();
        expect(item.tabIndex).toBe(0);
        expect(screen.getByRole('group', { name: 'first', description: 'field.invalid' })).toBe(item);
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

it.each([
    { name: 'image', variant: 'image' as const, item: contents[0] },
    {
        name: 'published media',
        variant: 'media' as const,
        item: new ContentSummaryBuilder(contents[0]).setPublishTime(new Date()).build(),
    },
    { name: 'removed media', variant: 'media' as const, item: new ContentSummaryBuilder().setId('removed').build() },
    { name: 'hidden status', variant: 'media' as const, item: contents[0], hideStatus: true },
    {
        name: 'no workflow status',
        variant: 'media' as const,
        item: new ContentSummaryBuilder(contents[0]).setValid(true).build(),
    },
])('does not add a row Tab stop for $name', ({ variant, item, hideStatus }) => {
    render(<Selection items={[item]} variant={variant} hideStatus={hideStatus} />);
    const [row] = getItems();
    expect(row.hasAttribute('tabindex')).toBe(false);
    expect(row.hasAttribute('role')).toBe(false);
    expect(row.hasAttribute('aria-describedby')).toBe(false);
    expect(row.querySelector('[data-component="StatusIcon"]')).toBeNull();
});

it('names and describes a single media row only while its status is available and the selector is enabled', () => {
    const { rerender } = render(<Selection items={[contents[0]]} variant="media" />);
    const [row] = getItems();
    expect(screen.getByRole('group', { name: 'first', description: 'field.invalid' })).toBe(row);
    expect(row.tabIndex).toBe(0);

    rerender(<Selection items={[contents[0]]} variant="media" disabled />);
    expect(row.hasAttribute('tabindex')).toBe(false);
    expect(row.hasAttribute('role')).toBe(false);
    expect(row.hasAttribute('aria-describedby')).toBe(false);
    expect(screen.getByRole('button', { name: 'action.edit' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'action.remove' }).hasAttribute('disabled')).toBe(true);

    rerender(<Selection items={[contents[0]]} variant="media" />);
    expect(row.tabIndex).toBe(0);
    expect(screen.getByRole('group', { name: 'first', description: 'field.invalid' })).toBe(row);

    const published = new ContentSummaryBuilder(contents[0]).setPublishTime(new Date()).build();
    rerender(<Selection items={[published]} variant="media" />);
    expect(row.hasAttribute('tabindex')).toBe(false);
    expect(row.hasAttribute('aria-describedby')).toBe(false);
});

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
