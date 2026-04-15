import {GridList} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement, useMemo} from 'react';
import {DiffStatusBadge} from '../../status/DiffStatusBadge';
import {calcSecondaryStatus, calcTreePublishStatus} from '../../../utils/cms/content/status';
import {formatCompareResult} from '../../../utils/cms/content/formatCompareResult';
import {useContentRow} from '../../lists/content-row/ContentRowContext';
import {$isCompareStatusesLoading, $publishCompareStatuses} from '../../../store/dialogs/publishDialog.store';
import {useI18n} from '../../../hooks/useI18n';

const COMPONENT_NAME = 'PublishDialogItemStatus';

export const PublishDialogItemStatus = (): ReactElement => {
    const {content} = useContentRow();
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
        <GridList.Cell data-component={COMPONENT_NAME} interactive={false} className="shrink-0">
            <DiffStatusBadge contentSummary={content} secondaryStatusOverride={secondaryOverride} />
        </GridList.Cell>
    );
};

PublishDialogItemStatus.displayName = COMPONENT_NAME;
