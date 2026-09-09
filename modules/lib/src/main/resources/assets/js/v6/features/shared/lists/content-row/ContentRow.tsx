import { cn, GridList } from '@enonic/ui';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { ContentRowCell } from './ContentRowCell';
import { ContentRowCheckbox } from './ContentRowCheckbox';
import { ContentRowContext } from './ContentRowContext';
import { ContentRowLabel } from './ContentRowLabel';
import { ContentRowRemoveButton } from './ContentRowRemoveButton';
import { ContentRowStatus } from './ContentRowStatus';
import type {
    ContentRowCellProps,
    ContentRowCheckboxProps,
    ContentRowLabelProps,
    ContentRowProps,
    ContentRowRemoveButtonProps,
    ContentRowStatusProps,
} from './types';

const ContentRowRoot = ({
    content,
    id,
    disabled = false,
    statusBelowLabelBelowSm = false,
    mainItemButtonLayoutBelowSm = false,
    className,
    children,
}: ContentRowProps): ReactElement => {
    const contextValue = useMemo(
        () => ({ content, disabled, statusBelowLabelBelowSm, mainItemButtonLayoutBelowSm }),
        [content, disabled, statusBelowLabelBelowSm, mainItemButtonLayoutBelowSm],
    );

    return (
        <ContentRowContext.Provider value={contextValue}>
            <GridList.Row
                data-component="ContentRow"
                id={id}
                disabled={disabled}
                className={cn(
                    className ?? 'gap-3 px-2.5',
                    statusBelowLabelBelowSm && 'max-sm:grid max-sm:grid-cols-[auto_minmax(0,1fr)] max-sm:gap-y-0',
                    mainItemButtonLayoutBelowSm &&
                        'max-sm:grid max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:gap-x-1 max-sm:gap-y-0',
                )}
            >
                {children}
            </GridList.Row>
        </ContentRowContext.Provider>
    );
};
ContentRowRoot.displayName = 'ContentRow';

export const ContentRow = Object.assign(ContentRowRoot, {
    Checkbox: ContentRowCheckbox,
    Label: ContentRowLabel,
    Status: ContentRowStatus,
    Cell: ContentRowCell,
    RemoveButton: ContentRowRemoveButton,
});

export type {
    ContentRowProps,
    ContentRowCheckboxProps,
    ContentRowLabelProps,
    ContentRowStatusProps,
    ContentRowCellProps,
    ContentRowRemoveButtonProps,
};
