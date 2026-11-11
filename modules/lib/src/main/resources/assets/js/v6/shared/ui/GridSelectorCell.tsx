import { GridList, useGridList, useSelector } from '@enonic/ui';
import { type ReactElement, type ReactNode } from 'react';

export const GridSelectorCell = ({ children }: { children: ReactNode }): ReactElement => {
    const { open, setOpen, triggerRef } = useSelector();
    const { handleKeyDown } = useGridList();

    return (
        <GridList.Cell
            onClickCapture={(event) => {
                // GridList activates buttons with .click(), which does not move focus.
                if (triggerRef.current?.contains(event.target as Node)) {
                    triggerRef.current.focus();
                }
            }}
            onFocusCapture={(event) => {
                // Keep the open selector's keyboard handler in control if GridList focuses its cell.
                if (open && event.target === event.currentTarget) {
                    triggerRef.current?.focus();
                }
            }}
            onPointerDown={(event) => {
                // Selecting an option must not blur the trigger and close the popup before click.
                if ((event.target as Element).closest('[role="option"]')) {
                    event.preventDefault();
                }
            }}
            onKeyDownCapture={(event) => {
                // Closed selectors leave vertical navigation to the grid instead of reopening.
                if (!open && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
                    event.stopPropagation();
                    handleKeyDown(event);
                }
            }}
            onKeyDown={(event) => {
                if (open && event.key === 'Tab') {
                    setOpen(false);
                }
                if (open || event.defaultPrevented) {
                    event.stopPropagation();
                }
            }}
            onBlur={(event) => {
                if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setOpen(false);
                }
            }}
        >
            {children}
        </GridList.Cell>
    );
};

GridSelectorCell.displayName = 'GridSelectorCell';
