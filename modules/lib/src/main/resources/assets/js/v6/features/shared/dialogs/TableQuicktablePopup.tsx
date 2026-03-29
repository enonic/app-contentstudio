import {cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    type ReactElement,
    useCallback,
    useEffect,
    useRef,
} from 'react';
import {type CreateHtmlAreaDialogEvent, HtmlAreaDialogType} from '../../../../app/inputtype/ui/text/CreateHtmlAreaDialogEvent';
import type {TableQuicktablePopupParams} from '../../../../app/inputtype/ui/text/HtmlEditorTypes';
import type {DialogOverrides} from '../form/input-types/html-area/setupEditor';
import {clamp} from '../../store/dialogs/ckeditorDialogUtils';
import {useCkEditorFocusManager} from '../../hooks/htmlarea/useCkEditorFocusManager';
import {usePopupDismiss} from '../../hooks/htmlarea/usePopupDismiss';
import {usePopupPosition} from '../../hooks/htmlarea/usePopupPosition';
import {
    $tableQuicktablePopup,
    closeTableQuicktablePopup,
    getTableQuicktableTriggerElement,
    openTableQuicktableDialog,
    openTableQuicktablePopup,
    setTableQuicktablePreview,
    submitTableQuicktablePopup,
} from '../../store/dialogs/tableQuicktablePopup.store';

const TABLE_QUICKTABLE_POPUP_NAME = 'TableQuicktablePopup';

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

    const cellCount = gridRows * gridCols;
    const activeIndex = (previewRows - 1) * gridCols + previewCols - 1;
    const caption = `${previewRows} × ${previewCols} ${tableLabel}`;

    cellRefs.current.length = cellCount;

    const getAnchorElement = useCallback(
        () => getTableQuicktableTriggerElement(triggerButtonId, editor),
        [triggerButtonId, editor],
    );

    useCkEditorFocusManager(
        editor,
        [popupRef, moreButtonRef, ...cellRefs.current],
        [open, cellCount],
    );

    const position = usePopupPosition({
        open,
        popupRef,
        getAnchorElement,
        isRtl: editor?.lang.dir === 'rtl',
        deps: [triggerButtonId, gridRows, gridCols],
        onMissingAnchor: closeTableQuicktablePopup,
    });

    usePopupDismiss({
        open,
        popupRef,
        editor,
        getAnchorElement,
        onClose: closeTableQuicktablePopup,
        deps: [triggerButtonId],
    });

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
                'fixed z-50 flex flex-col gap-3 rounded-sm border border-bdr-subtle bg-surface-neutral p-3 shadow-lg outline-none',
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

export function createTableQuicktablePopupOverride(): DialogOverrides {
    return {
        [HtmlAreaDialogType.TABLE_QUICKTABLE]: (event: CreateHtmlAreaDialogEvent) => {
            openTableQuicktablePopup(event.getConfig() as TableQuicktablePopupParams);
        },
    };
}
