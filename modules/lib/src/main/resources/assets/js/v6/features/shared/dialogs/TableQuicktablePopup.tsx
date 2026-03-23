import {cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    type ReactElement,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import {
    $tableQuicktablePopup,
    closeTableQuicktablePopup,
    getTableQuicktableTriggerElement,
    openTableQuicktableDialog,
    setTableQuicktablePreview,
    submitTableQuicktablePopup,
} from '../../store/dialogs/tableQuicktablePopup.store';

const TABLE_QUICKTABLE_POPUP_NAME = 'TableQuicktablePopup';
const POPUP_OFFSET = 8;
const VIEWPORT_OFFSET = 8;

type PopupPosition = {
    top: number;
    left: number;
    side: 'top' | 'bottom';
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(value, max));

export const TableQuicktablePopup = (): ReactElement | null => {
    const {
        open,
        editor,
        triggerButtonId,
        gridRows,
        gridCols,
        previewRows,
        previewCols,
        previewSize,
        previewBorder,
        previewBackground,
        tableLabel,
        moreLabel,
    } = useStore($tableQuicktablePopup, {
        keys: [
            'open',
            'editor',
            'triggerButtonId',
            'gridRows',
            'gridCols',
            'previewRows',
            'previewCols',
            'previewSize',
            'previewBorder',
            'previewBackground',
            'tableLabel',
            'moreLabel',
        ],
    });
    const popupRef = useRef<HTMLDivElement | null>(null);
    const moreButtonRef = useRef<HTMLButtonElement | null>(null);
    const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [position, setPosition] = useState<PopupPosition | null>(null);

    const cellCount = gridRows * gridCols;
    const activeIndex = (previewRows - 1) * gridCols + previewCols - 1;
    const caption = `${previewRows} × ${previewCols} ${tableLabel}`;

    cellRefs.current.length = cellCount;

    useLayoutEffect(() => {
        if (!open || !popupRef.current || !editor || editor['destroyed']) {
            return;
        }

        const elements = [
            popupRef.current,
            moreButtonRef.current,
            ...cellRefs.current,
        ].filter((element): element is HTMLDivElement | HTMLButtonElement => !!element);

        const ckElements = elements.map((element) => new CKEDITOR.dom.element(element));

        ckElements.forEach((element) => editor.focusManager.add(element, true));

        return () => {
            if (editor['destroyed']) {
                return;
            }

            ckElements.forEach((element) => editor.focusManager.remove(element));
        };
    }, [open, editor, cellCount]);

    useEffect(() => {
        if (!open) {
            setPosition(null);
            return;
        }

        const popupElement = popupRef.current;
        const anchorElement = getTableQuicktableTriggerElement(triggerButtonId, editor);

        if (!popupElement || !anchorElement) {
            closeTableQuicktablePopup();
            return;
        }

        const updatePosition = (): void => {
            if (!popupRef.current) {
                return;
            }

            const nextAnchorElement = getTableQuicktableTriggerElement(triggerButtonId, editor);

            if (!nextAnchorElement) {
                closeTableQuicktablePopup();
                return;
            }

            const popupRect = popupRef.current.getBoundingClientRect();
            const anchorRect = nextAnchorElement.getBoundingClientRect();
            const maxLeft = Math.max(VIEWPORT_OFFSET, window.innerWidth - popupRect.width - VIEWPORT_OFFSET);
            const left = clamp(
                editor?.lang.dir === 'rtl' ? anchorRect.right - popupRect.width : anchorRect.left,
                VIEWPORT_OFFSET,
                maxLeft,
            );
            const placeAbove =
                window.innerHeight - anchorRect.bottom < popupRect.height + POPUP_OFFSET &&
                anchorRect.top > popupRect.height + POPUP_OFFSET;
            const top = placeAbove
                ? Math.max(VIEWPORT_OFFSET, anchorRect.top - popupRect.height - POPUP_OFFSET)
                : Math.min(window.innerHeight - popupRect.height - VIEWPORT_OFFSET, anchorRect.bottom + POPUP_OFFSET);

            setPosition({
                top,
                left,
                side: placeAbove ? 'top' : 'bottom',
            });
        };

        updatePosition();

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open, editor, triggerButtonId, gridRows, gridCols]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const editable = editor?.editable();

        const handleClose = (): void => {
            closeTableQuicktablePopup();
        };

        const handleFocusIn = (event: FocusEvent): void => {
            const target = event.target as Node | null;
            const popupElement = popupRef.current;
            const anchorElement = getTableQuicktableTriggerElement(triggerButtonId, editor);

            if (!target || popupElement?.contains(target) || anchorElement?.contains(target)) {
                return;
            }

            handleClose();
        };

        const handlePointerDown = (event: PointerEvent): void => {
            const target = event.target as Node | null;
            const popupElement = popupRef.current;
            const anchorElement = getTableQuicktableTriggerElement(triggerButtonId, editor);

            if (!target || popupElement?.contains(target) || anchorElement?.contains(target)) {
                return;
            }

            handleClose();
        };

        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('blur', handleClose);
        editable?.on('mousedown', handleClose);
        editor?.on('destroy', handleClose);

        return () => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('blur', handleClose);
            editable?.removeListener('mousedown', handleClose);
            editor?.removeListener('destroy', handleClose);
        };
    }, [open, editor, triggerButtonId]);

    useEffect(() => {
        if (!open) {
            return;
        }

        requestAnimationFrame(() => {
            cellRefs.current[0]?.focus({preventScroll: true});
        });
    }, [open]);

    const moveFocusTo = (row: number, col: number): void => {
        const nextRow = clamp(row, 1, gridRows);
        const nextCol = clamp(col, 1, gridCols);

        setTableQuicktablePreview(nextRow, nextCol);

        requestAnimationFrame(() => {
            const nextIndex = (nextRow - 1) * gridCols + nextCol - 1;

            cellRefs.current[nextIndex]?.focus({focusVisible: true});
        });
    };

    const handleCellKeyDown = (row: number, col: number) => (event: KeyboardEvent<HTMLButtonElement>): void => {
        const baseRow = previewRows === row && previewCols === col ? row : previewRows;
        const baseCol = previewRows === row && previewCols === col ? col : previewCols;

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            moveFocusTo(baseRow, baseCol + 1);
            return;
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            moveFocusTo(baseRow, baseCol - 1);
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveFocusTo(baseRow + 1, baseCol);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveFocusTo(baseRow - 1, baseCol);
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            submitTableQuicktablePopup(row, col);
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            closeTableQuicktablePopup({focusTrigger: true});
        }
    };

    const handleMoreKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeTableQuicktablePopup({focusTrigger: true});
        }
    };

    const handleCellMouseEnter = (row: number, col: number) => (event: MouseEvent<HTMLButtonElement>): void => {
        setTableQuicktablePreview(row, col);
        event.currentTarget.focus({preventScroll: true});
    };

    if (!open) {
        return null;
    }

    return (
        <div
            ref={popupRef}
            role='dialog'
            aria-label={tableLabel}
            tabIndex={-1}
            data-component={TABLE_QUICKTABLE_POPUP_NAME}
            data-side={position?.side}
            className={cn(
                'fixed z-40 flex flex-col gap-3 rounded-sm border border-bdr-subtle bg-surface-neutral p-3 shadow-lg outline-none',
                'data-[side=top]:origin-bottom data-[side=bottom]:origin-top',
                'data-[side=top]:animate-in data-[side=bottom]:animate-in',
                'data-[side=top]:fade-in-0 data-[side=bottom]:fade-in-0',
                'data-[side=top]:zoom-in-95 data-[side=bottom]:zoom-in-95',
                !position && 'pointer-events-none opacity-0',
            )}
            style={position ? ({top: position.top, left: position.left} as CSSProperties) : undefined}
        >
            <div className='text-center text-sm font-medium text-main'>{caption}</div>
            <div
                className='grid justify-center gap-0.5 rounded-xs p-px'
                style={{gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`}}
            >
                {Array.from({length: cellCount}, (_, index) => {
                    const row = Math.floor(index / gridCols) + 1;
                    const col = (index % gridCols) + 1;
                    const isActive = index === activeIndex;
                    const isSelected = row <= previewRows && col <= previewCols;

                    return (
                        <button
                            key={`${row}-${col}`}
                            ref={(button) => {
                                cellRefs.current[index] = button;
                            }}
                            type='button'
                            tabIndex={isActive ? 0 : -1}
                            aria-label={`${row} × ${col} ${tableLabel}`}
                            className={cn(
                                'block shrink-0 bg-surface-primary transition-colors outline-none',
                                'focus-visible:none',
                            )}
                            style={{
                                width: previewSize,
                                height: previewSize,
                                border: previewBorder,
                                backgroundColor: isSelected ? previewBackground : undefined,
                            }}
                            onFocus={() => {
                                setTableQuicktablePreview(row, col);
                            }}
                            onMouseEnter={handleCellMouseEnter(row, col)}
                            onKeyDown={handleCellKeyDown(row, col)}
                            onClick={() => {
                                submitTableQuicktablePopup(row, col);
                            }}
                        />
                    );
                })}
            </div>
            <button
                ref={moreButtonRef}
                type='button'
                className='min-h-10 rounded-xs border border-transparent px-3 text-center text-sm text-main outline-none transition-colors hover:bg-surface-neutral-hover focus-visible:border-bdr-subtle focus-visible:bg-surface-neutral-hover'
                onKeyDown={handleMoreKeyDown}
                onClick={openTableQuicktableDialog}
            >
                {moreLabel}
            </button>
        </div>
    );
};

TableQuicktablePopup.displayName = TABLE_QUICKTABLE_POPUP_NAME;
