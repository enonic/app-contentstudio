import {GridList} from '@enonic/ui';
import type {ReactElement} from 'react';
import type {ContentRowCellProps} from './types';

const CONTENT_ROW_CELL_NAME = 'ContentRowCell';

export const ContentRowCell = ({
    children,
    interactive,
    className,
}: ContentRowCellProps): ReactElement => {
    return (
        <GridList.Cell
            data-component={CONTENT_ROW_CELL_NAME}
            interactive={interactive}
            className={className}
        >
            {children}
        </GridList.Cell>
    );
};

ContentRowCell.displayName = CONTENT_ROW_CELL_NAME;
