import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import type {ContentSummary} from '../../../../../../app/content/ContentSummary';
import {PublishStatus} from '../../../../../../app/publish/PublishStatus';
import {useI18n} from '../../../../hooks/useI18n';
import {ContentIcon} from '../../../../shared/icons/ContentIcon';
import {StatusIcon} from '../../../../shared/icons/StatusIcon';
import {DiffStatusBadge} from '../../../../shared/status/DiffStatusBadge';
import {$contextContent, $contextContentCompareResult, $isContextCompareLoading} from '../../../../store/context/contextContent.store';
import {formatCompareResult} from '../../../../utils/cms/content/formatCompareResult';
import {calcSecondaryStatus, calcTreePublishStatus, createContentStateKey} from '../../../../utils/cms/content/status';
import {calcContentState} from '../../../../utils/cms/content/workflow';

function createDisplayName(content: ContentSummary): string {
    return content.getDisplayName() ?? '';
}

const DETAILS_WIDGET_CONTENT_SECTION_NAME = 'DetailsWidgetContentSection';

export const DetailsWidgetContentSection = (): ReactElement => {
    const content = useStore($contextContent);
    const compareResult = useStore($contextContentCompareResult);
    const compareLoading = useStore($isContextCompareLoading);
    const contentState = calcContentState(content);

    const iconLabel = useI18n('field.contextPanel.details.sections.content.icon');
    const statusLabel = useI18n('field.contextPanel.details.sections.content.status');
    const displayNameLabel = useI18n('field.contextPanel.details.sections.content.displayName');
    const pathLabel = useI18n('field.contextPanel.details.sections.content.path');
    const loadingLabel = useI18n('action.loading');
    const movedLabel = useI18n('status.moved');
    const modifiedLabel = useI18n('status.modified');
    const contentStateLabel = useI18n(createContentStateKey(contentState));

    if (!content) return null;

    const displayName = createDisplayName(content);
    const publishStatus = calcTreePublishStatus(content);
    const secondaryStatus = calcSecondaryStatus(publishStatus, content);
    const showContentState = contentState != null && !(publishStatus === PublishStatus.ONLINE && contentState === 'ready' && !secondaryStatus);

    let secondaryOverride: string | undefined;
    if (secondaryStatus === 'modified') {
        if (compareLoading && !compareResult) {
            secondaryOverride = loadingLabel;
        } else if (compareResult) {
            secondaryOverride = formatCompareResult(compareResult, movedLabel, modifiedLabel);
        }
    }

    return (
        <section data-component={DETAILS_WIDGET_CONTENT_SECTION_NAME}>
            <dl className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                    <dt className="text-xs text-subtle">{iconLabel}</dt>
                    <dd>
                        <ContentIcon contentType={String(content.getType())} url={content.getIconUrl()} />
                    </dd>
                </div>

                <div className="flex flex-col gap-1">
                    <dt className="text-xs text-subtle">{statusLabel}</dt>
                    <dd className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <DiffStatusBadge contentSummary={content} secondaryStatusOverride={secondaryOverride} />
                        {showContentState && (
                            <span className="inline-flex max-w-full items-center gap-x-1 overflow-hidden border-l-1 border-bdr-subtle pl-2 text-nowrap">
                                <StatusIcon status={contentState} aria-label={contentStateLabel} className="shrink-0" />
                                <span className="text-sm text-nowrap truncate">{contentStateLabel}</span>
                            </span>
                        )}
                    </dd>
                </div>

                {displayName && (
                    <div className="flex flex-col gap-1">
                        <dt className="text-xs text-subtle">{displayNameLabel}</dt>
                        <dd className="text-sm truncate">{displayName}</dd>
                    </div>
                )}

                <div className="flex flex-col gap-1">
                    <dt className="text-xs text-subtle">{pathLabel}</dt>
                    <dd className="text-sm truncate">{content.getPath().toString()}</dd>
                </div>
            </dl>
        </section>
    );
};

DetailsWidgetContentSection.displayName = DETAILS_WIDGET_CONTENT_SECTION_NAME;
