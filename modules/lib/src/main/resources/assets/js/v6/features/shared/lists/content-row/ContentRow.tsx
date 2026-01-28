import {GridList} from '@enonic/ui';
import type {ReactElement} from 'react';
import {useMemo} from 'react';
import {ContentRowCell} from './ContentRowCell';
import {ContentRowCheckbox} from './ContentRowCheckbox';
import {ContentRowContext} from './ContentRowContext';
import {ContentRowLabel} from './ContentRowLabel';
import {ContentRowStatus} from './ContentRowStatus';
import type {
    ContentRowCellProps,
    ContentRowCheckboxProps,
    ContentRowLabelProps,
    ContentRowProps,
    ContentRowStatusProps,
} from './types';

const ContentRowRoot = ({
    content,
    id,
    disabled = false,
    className,
    children,
}: ContentRowProps): ReactElement => {
    const contextValue = useMemo(() => ({content, disabled}), [content, disabled]);

    return (
        <ContentRowContext.Provider value={contextValue}>
            <GridList.Row
                data-component="ContentRow"
                id={id}
                disabled={disabled}
                className={className ?? 'gap-3 px-2.5'}
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
});

export type {
    ContentRowProps,
    ContentRowCheckboxProps,
    ContentRowLabelProps,
    ContentRowStatusProps,
    ContentRowCellProps,
};
