import {useSortable} from '@dnd-kit/sortable';
import {type KeyboardEvent, type ReactNode} from 'react';
import type {
    SortableListItemInteractionProps,
    SortableListItemRenderContext,
} from './SortableList';

type SortableItemId = string | number;

export type SortableListRowProps<Item> = {
    id: SortableItemId;
    item: Item;
    index: number;
    enabled: boolean;
    isListFocused: boolean;
    focusedItemIndex: number;
    pickedItemIndex: number | undefined;
    itemCount: number;
    getItemAriaLabel?: (item: Item, index: number) => string;
    renderItem: (item: Item, context: SortableListItemRenderContext) => ReactNode;
    handleItemFocus: (index: number) => () => void;
    handleItemClick: (index: number) => () => void;
    handleItemKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

function toTransformCSS(transform: {x: number; y: number; scaleX: number; scaleY: number} | null): string | undefined {
    if (transform == null) {
        return undefined;
    }

    return `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`;
}

export const SortableListRow = <Item,>({
    id,
    item,
    index,
    enabled,
    isListFocused,
    focusedItemIndex,
    pickedItemIndex,
    itemCount,
    getItemAriaLabel,
    renderItem,
    handleItemFocus,
    handleItemClick,
    handleItemKeyDown,
}: SortableListRowProps<Item>): ReactNode => {
    const {setNodeRef, transform, transition, listeners, isDragging} = useSortable({
        id,
        disabled: itemCount < 2,
    });

    const isFocused = enabled && isListFocused && focusedItemIndex === index;
    const isMovable = enabled && pickedItemIndex === index;

    const interactionProps: SortableListItemInteractionProps = {
        tabIndex: enabled ? (focusedItemIndex === index ? 0 : -1) : -1,
        role: enabled ? 'option' : undefined,
        'aria-selected': enabled ? focusedItemIndex === index : undefined,
        'aria-grabbed': enabled ? pickedItemIndex === index : undefined,
        'aria-label': getItemAriaLabel ? getItemAriaLabel(item, index) : undefined,
        'data-sort-index': index,
        onFocus: handleItemFocus(index),
        onClick: handleItemClick(index),
        onKeyDown: handleItemKeyDown,
    };

    return (
        <li
            ref={setNodeRef}
            role='presentation'
            style={{
                transform: toTransformCSS(transform),
                transition: transition ?? undefined,
                zIndex: isDragging ? 1 : undefined,
            }}
            {...listeners}
        >
            {renderItem(item, {
                index,
                isFocused,
                isMovable,
                interactionProps,
            })}
        </li>
    );
};
