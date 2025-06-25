import {GridList} from '@enonic/ui';
import type {ReactElement} from 'react';
import {ContentLabel} from '../../content/ContentLabel';
import {ContentButton} from '../../content/ContentButton';
import {useContentRow} from './ContentRowContext';
import type {ContentRowLabelProps} from './types';

const CONTENT_ROW_LABEL_NAME = 'ContentRowLabel';

export const ContentRowLabel = ({
    action = 'none',
    variant = 'compact',
    className,
}: ContentRowLabelProps): ReactElement => {
    const {content, disabled} = useContentRow();
    const labelVariant = variant === 'default' ? 'normal' : variant;

    return (
        <GridList.Cell data-component={CONTENT_ROW_LABEL_NAME} className={className ?? 'flex-1 min-w-0'}>
            {action === 'edit' ? (
                <GridList.Action>
                    <ContentButton content={content} disabled={disabled} />
                </GridList.Action>
            ) : (
                <ContentLabel content={content} variant={labelVariant} />
            )}
        </GridList.Cell>
    );
};

ContentRowLabel.displayName = CONTENT_ROW_LABEL_NAME;
