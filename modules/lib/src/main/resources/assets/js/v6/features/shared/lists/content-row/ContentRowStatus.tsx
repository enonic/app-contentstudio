import { cn, GridList } from '@enonic/ui';
import { type ReactElement, useMemo } from 'react';
import { DiffStatusBadge } from '../../status/DiffStatusBadge';
import { StatusBadge } from '../../status/StatusBadge';
import { calcTreePublishStatus } from '../../../../shared/lib/cms/content/status';
import { useContentRow } from './ContentRowContext';
import type { ContentRowStatusProps } from './types';

const CONTENT_ROW_STATUS_NAME = 'ContentRowStatus';

export const ContentRowStatus = ({ variant = 'diff', className }: ContentRowStatusProps): ReactElement | null => {
    const { content, statusBelowLabelBelowSm, mainItemButtonLayoutBelowSm } = useContentRow();
    const publishStatus = useMemo(() => calcTreePublishStatus(content), [content]);

    if (variant === 'none') {
        return null;
    }

    return (
        <GridList.Cell
            data-component={CONTENT_ROW_STATUS_NAME}
            interactive={false}
            className={cn(
                className ?? 'shrink-0',
                statusBelowLabelBelowSm && 'max-sm:col-start-2 max-sm:row-start-2 max-sm:ml-8.5 max-sm:justify-start',
                mainItemButtonLayoutBelowSm &&
                    'max-sm:col-start-1 max-sm:row-start-2 max-sm:ml-8.5 max-sm:justify-start',
            )}
        >
            {variant === 'diff' ? <DiffStatusBadge contentSummary={content} /> : <StatusBadge status={publishStatus} />}
        </GridList.Cell>
    );
};

ContentRowStatus.displayName = CONTENT_ROW_STATUS_NAME;
