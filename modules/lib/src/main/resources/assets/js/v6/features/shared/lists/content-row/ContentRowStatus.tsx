import {GridList} from '@enonic/ui';
import {type ReactElement, useMemo} from 'react';
import {DiffStatusBadge} from '../../status/DiffStatusBadge';
import {StatusBadge} from '../../status/StatusBadge';
import {calcTreePublishStatus} from '../../../utils/cms/content/status';
import {useContentRow} from './ContentRowContext';
import type {ContentRowStatusProps} from './types';

const CONTENT_ROW_STATUS_NAME = 'ContentRowStatus';

export const ContentRowStatus = ({
    variant = 'diff',
    className,
}: ContentRowStatusProps): ReactElement | null => {
    const {content} = useContentRow();
    const publishStatus = useMemo(() => calcTreePublishStatus(content), [content]);

    if (variant === 'none') {
        return null;
    }

    return (
        <GridList.Cell data-component={CONTENT_ROW_STATUS_NAME} interactive={false} className={className ?? 'shrink-0'}>
            {variant === 'diff' ? (
                <DiffStatusBadge contentSummary={content} />
            ) : (
                <StatusBadge status={publishStatus} />
            )}
        </GridList.Cell>
    );
};

ContentRowStatus.displayName = CONTENT_ROW_STATUS_NAME;
