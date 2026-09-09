import { cn, GridList } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useMemo } from 'react';
import { DiffStatusBadge } from '../../shared/status/DiffStatusBadge';
import { calcSecondaryStatus, calcTreePublishStatus } from '../../../shared/lib/cms/content/status';
import { formatCompareResult } from '../../../entities/content';
import { useContentRow } from '../../shared/lists/content-row/ContentRowContext';
import { $isCompareStatusesLoading, $publishCompareStatuses } from '../model/publishDialog.store';
import { useI18n } from '../../../shared/lib/hooks/useI18n';

const COMPONENT_NAME = 'PublishDialogItemStatus';

export const PublishDialogItemStatus = (): ReactElement => {
    const { content, statusBelowLabelBelowSm, mainItemButtonLayoutBelowSm } = useContentRow();
    const compareStatuses = useStore($publishCompareStatuses);
    const compareLoading = useStore($isCompareStatusesLoading);

    const needsCompareVerification = useMemo(() => {
        const publishStatus = calcTreePublishStatus(content);
        return calcSecondaryStatus(publishStatus, content) === 'modified';
    }, [content]);

    const compareResult = compareStatuses.get(content.getId());
    const isItemLoading = needsCompareVerification && compareLoading && !compareResult;

    const loadingLabel = useI18n('action.loading');
    const movedLabel = useI18n('status.moved');
    const modifiedLabel = useI18n('status.modified');

    let secondaryOverride: string | undefined;
    if (needsCompareVerification) {
        if (isItemLoading) {
            secondaryOverride = loadingLabel;
        } else if (compareResult) {
            secondaryOverride = formatCompareResult(compareResult, movedLabel, modifiedLabel);
        }
    }

    return (
        <GridList.Cell
            data-component={COMPONENT_NAME}
            interactive={false}
            className={cn(
                'shrink-0',
                statusBelowLabelBelowSm && 'max-sm:col-start-2 max-sm:row-start-2 max-sm:ml-8.5 max-sm:justify-start',
                mainItemButtonLayoutBelowSm &&
                    'max-sm:col-start-1 max-sm:row-start-2 max-sm:ml-8.5 max-sm:justify-start',
            )}
        >
            <DiffStatusBadge contentSummary={content} secondaryStatusOverride={secondaryOverride} />
        </GridList.Cell>
    );
};

PublishDialogItemStatus.displayName = COMPONENT_NAME;
