import {cn} from '@enonic/ui';
import {closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors,} from '@dnd-kit/core';
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';
import {type FocusEvent, type KeyboardEvent, type ReactNode, useEffect, useLayoutEffect, useRef, useState,} from 'react';
import {SortableListRow} from './SortableListRow';

export type SortableListItemInteractionProps = {
    tabIndex: number;
    role?: 'option';
    'aria-selected'?: boolean;
    'aria-grabbed'?: boolean;
    'aria-label'?: string;
    'data-sort-index': number;
    onFocus: (event: FocusEvent<HTMLElement>) => void;
    onClick: () => void;
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

export type SortableListItemRenderContext = {
    index: number;
    isFocused: boolean;
    isMovable: boolean;
    interactionProps: SortableListItemInteractionProps;
};

type SortableItemId = string | number;

export type SortableListProps<Item> = {
    items: readonly Item[];
    enabled: boolean;
    onDragIntent?: () => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    getItemId: (item: Item, index: number) => SortableItemId;
    getItemAriaLabel?: (item: Item, index: number) => string;
    renderItem: (item: Item, context: SortableListItemRenderContext) => ReactNode;
    className?: string;
};

const SORTABLE_LIST_NAME = 'SortableList';

export const SortableList = <Item, >({
                                         items,
                                         enabled,
                                         onDragIntent,
                                         getItemId,
                                         onReorder,
                                         getItemAriaLabel,
                                         className,
                                         renderItem,
                                     }: SortableListProps<Item>): ReactNode => {
    const [focusedItemIndex, setFocusedItemIndex] = useState(0);
    const [pickedItemIndex, setPickedItemIndex] = useState<number | undefined>(undefined);
    const [isListFocused, setIsListFocused] = useState(false);

    const ids = items.map((item, index) => getItemId(item, index));
    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 5}}));

    const listRef = useRef<HTMLUListElement | null>(null);
    const focusedItemIndexRef = useRef(0);
    const pickedItemIndexRef = useRef<number | null>(null);
    const pendingFocusIndexRef = useRef<number | null>(null);
    const blurTimeoutIdRef = useRef<number | null>(null);

    const setFocusedIndex = (index: number): void => {
        focusedItemIndexRef.current = index;
        setFocusedItemIndex(index);
    };

    const setPickedIndex = (index: number | undefined): void => {
        pickedItemIndexRef.current = index ?? null;
        setPickedItemIndex(index);
    };

    const requestFocusByIndex = (index: number): void => {
        pendingFocusIndexRef.current = index;
    };

    const focusItemByIndex = (index: number): void => {
        requestAnimationFrame(() => {
            const element = listRef.current?.querySelector<HTMLElement>(`[data-sort-index="${index}"]`);
            element?.focus();
            if (element) {
                setIsListFocused(true);
            }
        });
    };

    const moveFocusTo = (nextIndex: number, afterItemsUpdate: boolean = false): void => {
        setFocusedIndex(nextIndex);
        if (afterItemsUpdate) {
            requestFocusByIndex(nextIndex);
            return;
        }

        focusItemByIndex(nextIndex);
    };

    useEffect(() => {
        if (items.length === 0) {
            setFocusedIndex(0);
            setPickedIndex(undefined);
            return;
        }

        const nextFocusedIndex = Math.min(focusedItemIndexRef.current, items.length - 1);
        if (nextFocusedIndex !== focusedItemIndexRef.current) {
            setFocusedIndex(nextFocusedIndex);
        }

        const nextPickedIndex = pickedItemIndexRef.current === null
                                ? undefined
                                : Math.min(pickedItemIndexRef.current, items.length - 1);
        if (nextPickedIndex !== pickedItemIndexRef.current) {
            setPickedIndex(nextPickedIndex);
        }
    }, [items.length]);

    useEffect(() => {
        if (!enabled) {
            setPickedIndex(undefined);
        }
    }, [enabled]);

    useLayoutEffect(() => {
        const focusIndex = pendingFocusIndexRef.current;
        if (focusIndex === null) {
            return;
        }

        const element = listRef.current?.querySelector<HTMLElement>(`[data-sort-index="${focusIndex}"]`);
        if (!element) {
            return;
        }

        element.focus();
        setIsListFocused(true);
        pendingFocusIndexRef.current = null;
    }, [items]);

    useEffect(() => {
        return () => {
            if (blurTimeoutIdRef.current !== null) {
                window.clearTimeout(blurTimeoutIdRef.current);
            }
        };
    }, []);

    const handleDndDragStart = (): void => {
        onDragIntent?.();
    };

    const handleDndDragEnd = (event: DragEndEvent): void => {
        const {active, over} = event;
        if (over == null || active.id === over.id) {
            return;
        }

        const fromIndex = ids.indexOf(active.id);
        const toIndex = ids.indexOf(over.id);
        if (fromIndex === -1 || toIndex === -1) {
            return;
        }

        onReorder(fromIndex, toIndex);
        if (pickedItemIndexRef.current === fromIndex) {
            setPickedIndex(toIndex);
        }
        moveFocusTo(toIndex, true);
    };

    const handleItemFocus = (index: number) => () => {
        if (enabled) {
            setFocusedIndex(index);
        }
    };

    const handleItemClick = (index: number) => () => {
        if (!enabled) {
            return;
        }

        setFocusedIndex(index);
        setPickedIndex(pickedItemIndexRef.current === index ? undefined : index);
        focusItemByIndex(index);
    };

    const handleItemKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (!enabled || items.length === 0) {
            return;
        }

        const index = focusedItemIndexRef.current;
        const pickedIndex = pickedItemIndexRef.current;
        const lastIndex = items.length - 1;
        const moveBy = (offset: -1 | 1): void => {
            const nextIndex = index + offset;
            if (nextIndex < 0 || nextIndex > lastIndex) {
                return;
            }

            if (pickedIndex === index) {
                onReorder(index, nextIndex);
                setPickedIndex(nextIndex);
                moveFocusTo(nextIndex, true);
                return;
            }

            moveFocusTo(nextIndex);
        };

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveBy(1);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveBy(-1);
            return;
        }

        if (event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
            setPickedIndex(pickedIndex === index ? undefined : index);
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            setPickedIndex(undefined);
        }
    };

    if (items.length === 0) {
        return null;
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDndDragStart}
            onDragEnd={handleDndDragEnd}
        >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <ul
                    ref={listRef}
                    data-component={SORTABLE_LIST_NAME}
                    className={cn('flex flex-col gap-y-2.5', className)}
                    role={enabled ? 'listbox' : undefined}
                    aria-orientation={enabled ? 'vertical' : undefined}
                    onFocusCapture={() => {
                        if (enabled) {
                            setIsListFocused(true);
                        }
                    }}
                    onBlurCapture={() => {
                        if (blurTimeoutIdRef.current !== null) {
                            window.clearTimeout(blurTimeoutIdRef.current);
                        }

                        blurTimeoutIdRef.current = window.setTimeout(() => {
                            const activeElement = document.activeElement;
                            if (!activeElement || !listRef.current?.contains(activeElement)) {
                                setIsListFocused(false);
                            }
                        }, 0);
                    }}
                >
                    {items.map((item, index) => (
                        <SortableListRow
                            key={ids[index]}
                            id={ids[index]}
                            item={item}
                            index={index}
                            enabled={enabled}
                            isListFocused={isListFocused}
                            focusedItemIndex={focusedItemIndex}
                            pickedItemIndex={pickedItemIndex}
                            itemCount={items.length}
                            getItemAriaLabel={getItemAriaLabel}
                            renderItem={renderItem}
                            handleItemFocus={handleItemFocus}
                            handleItemClick={handleItemClick}
                            handleItemKeyDown={handleItemKeyDown}
                        />
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    );
};

SortableList.displayName = SORTABLE_LIST_NAME;
