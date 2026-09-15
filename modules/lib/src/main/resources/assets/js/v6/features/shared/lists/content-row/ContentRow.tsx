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

const MOBILE_SELECTABLE_STATUS_BELOW_CLASS = [
    'max-sm:grid max-sm:grid-cols-[auto_minmax(0,1fr)] max-sm:gap-y-0',
    'max-sm:[&_[data-slot=selection]]:col-start-1 max-sm:[&_[data-slot=selection]]:row-start-1',
    'max-sm:[&_[data-slot=label]]:col-start-2 max-sm:[&_[data-slot=label]]:row-start-1',
    'max-sm:[&_[data-slot=status]]:col-start-2 max-sm:[&_[data-slot=status]]:row-start-2 max-sm:[&_[data-slot=status]]:ml-8.5 max-sm:[&_[data-slot=status]]:justify-start',
];

const MOBILE_STATUS_BELOW_CLASS = [
    'max-sm:grid max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:gap-x-1 max-sm:gap-y-0',
    'max-sm:[&_[data-slot=label]]:col-start-1 max-sm:[&_[data-slot=label]]:row-start-1 max-sm:[&_[data-slot=label]]:self-stretch',
    'max-sm:[&_[data-slot=status]]:col-start-1 max-sm:[&_[data-slot=status]]:row-start-2 max-sm:[&_[data-slot=status]]:ml-8.5 max-sm:[&_[data-slot=status]]:justify-start',
    'max-sm:[&_[data-slot=action]]:col-start-2 max-sm:[&_[data-slot=action]]:row-start-1 max-sm:[&_[data-slot=action]]:self-start',
    'max-sm:[&_[data-slot=action]_button]:size-6',
];

const ContentRowRoot = ({
    content,
    id,
    disabled = false,
    layout = 'default',
    className,
    children,
}: ContentRowProps): ReactElement => {
    const contextValue = useMemo(() => ({ content, disabled }), [content, disabled]);

    return (
        <ContentRowContext.Provider value={contextValue}>
            <GridList.Row
                data-component="ContentRow"
                id={id}
                disabled={disabled}
                className={cn(
                    className ?? 'gap-3 px-2.5',
                    layout === 'mobile-selectable-status-below' && MOBILE_SELECTABLE_STATUS_BELOW_CLASS,
                    layout === 'mobile-status-below' && MOBILE_STATUS_BELOW_CLASS,
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
