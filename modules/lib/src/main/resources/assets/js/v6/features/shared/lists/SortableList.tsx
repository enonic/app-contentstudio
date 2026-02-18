import {cn} from '@enonic/ui';
import {
    type DragEvent,
    type FocusEvent,
    type KeyboardEvent,
    type ReactNode,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

export type SortableListItemInteractionProps = {
    draggable: boolean;
    tabIndex: number;
    role?: 'option';
    'aria-selected'?: boolean;
    'aria-grabbed'?: boolean;
    'aria-label'?: string;
    'data-sort-index': number;
    onFocus: (event: FocusEvent<HTMLElement>) => void;
    onClick: () => void;
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    onDragStart: (event: DragEvent<HTMLElement>) => void;
    onDragOver: (event: DragEvent<HTMLElement>) => void;
    onDrop: (event: DragEvent<HTMLElement>) => void;
    onDragEnd: () => void;
};

export type SortableListItemRenderContext = {
    index: number;
    isFocused: boolean;
    isMovable: boolean;
    interactionProps: SortableListItemInteractionProps;
};

export type SortableListProps<Item> = {
    items: readonly Item[];
    enabled: boolean;
    onDragIntent?: () => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    getItemAriaLabel?: (item: Item, index: number) => string;
    className?: string;
    renderItem: (item: Item, context: SortableListItemRenderContext) => ReactNode;
};

const SORTABLE_LIST_NAME = 'SortableList';

export const SortableList = <Item,>({
    items,
    enabled,
    onDragIntent,
    onReorder,
    getItemAriaLabel,
    className,
    renderItem,
}: SortableListProps<Item>): ReactNode => {
    const [focusedItemIndex, setFocusedItemIndex] = useState(0);
    const [pickedItemIndex, setPickedItemIndex] = useState<number | null>(null);
    const [isListFocused, setIsListFocused] = useState(false);

    const listRef = useRef<HTMLUListElement>(null);
    const dragSourceIndexRef = useRef<number | null>(null);
    const focusedItemIndexRef = useRef(0);
    const pickedItemIndexRef = useRef<number | null>(null);
    const pendingFocusIndexRef = useRef<number | null>(null);
    const blurTimeoutIdRef = useRef<number | null>(null);

    const setFocusedIndex = (index: number): void => {
        focusedItemIndexRef.current = index;
        setFocusedItemIndex(index);
    };

    const setPickedIndex = (index: number | null): void => {
        pickedItemIndexRef.current = index;
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
            setPickedIndex(null);
            return;
        }

        const nextFocusedIndex = Math.min(focusedItemIndexRef.current, items.length - 1);
        if (nextFocusedIndex !== focusedItemIndexRef.current) {
            setFocusedIndex(nextFocusedIndex);
        }

        const nextPickedIndex = pickedItemIndexRef.current === null
            ? null
            : Math.min(pickedItemIndexRef.current, items.length - 1);
        if (nextPickedIndex !== pickedItemIndexRef.current) {
            setPickedIndex(nextPickedIndex);
        }
    }, [items.length]);

    useEffect(() => {
        if (!enabled) {
            setPickedIndex(null);
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

    const handleDragStart = (index: number) => (event: DragEvent<HTMLElement>) => {
        dragSourceIndexRef.current = index;
        onDragIntent?.();
        event.dataTransfer.effectAllowed = 'move';
        // Required for cross-browser HTML DnD activation.
        event.dataTransfer.setData('text/plain', String(index));
    };

    const handleDragOver = (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (targetIndex: number) => (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        const sourceIndex = dragSourceIndexRef.current;
        dragSourceIndexRef.current = null;
        if (sourceIndex === null) {
            return;
        }

        const isWithinBounds = sourceIndex >= 0
            && targetIndex >= 0
            && sourceIndex < items.length
            && targetIndex < items.length;
        if (!isWithinBounds || sourceIndex === targetIndex) {
            return;
        }

        onReorder(sourceIndex, targetIndex);
        if (pickedItemIndexRef.current === sourceIndex) {
            setPickedIndex(targetIndex);
        }
        moveFocusTo(targetIndex, true);
    };

    const handleDragEnd = () => {
        dragSourceIndexRef.current = null;
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
        setPickedIndex(pickedItemIndexRef.current === index ? null : index);
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
            setPickedIndex(pickedIndex === index ? null : index);
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            setPickedIndex(null);
        }
    };

    if (items.length === 0) {
        return null;
    }

    return (
        <ul
            ref={listRef}
            data-component={SORTABLE_LIST_NAME}
            className={cn(
                'flex flex-col gap-y-2.5',
                className,
            )}
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
            {items.map((item, index) => {
                const isFocused = enabled && isListFocused && focusedItemIndex === index;
                const isMovable = enabled && pickedItemIndex === index;

                const interactionProps: SortableListItemInteractionProps = {
                    draggable: items.length > 1,
                    tabIndex: enabled ? (focusedItemIndex === index ? 0 : -1) : -1,
                    role: enabled ? 'option' : undefined,
                    'aria-selected': enabled ? focusedItemIndex === index : undefined,
                    'aria-grabbed': enabled ? pickedItemIndex === index : undefined,
                    'aria-label': getItemAriaLabel ? getItemAriaLabel(item, index) : undefined,
                    'data-sort-index': index,
                    onFocus: handleItemFocus(index),
                    onClick: handleItemClick(index),
                    onKeyDown: handleItemKeyDown,
                    onDragStart: handleDragStart(index),
                    onDragOver: handleDragOver,
                    onDrop: handleDrop(index),
                    onDragEnd: handleDragEnd,
                };

                return renderItem(item, {
                    index,
                    isFocused,
                    isMovable,
                    interactionProps,
                });
            })}
        </ul>
    );
};

SortableList.displayName = SORTABLE_LIST_NAME;
