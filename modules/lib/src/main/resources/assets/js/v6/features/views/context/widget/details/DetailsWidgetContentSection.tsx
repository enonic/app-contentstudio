import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {CompareStatus, CompareStatusChecker} from '../../../../../../app/content/CompareStatus';
import {PublishStatus} from '../../../../../../app/publish/PublishStatus';
import {type ContentSummaryAndCompareStatus} from 'src/main/resources/assets/js/app/content/ContentSummaryAndCompareStatus';
import {useI18n} from '../../../../hooks/useI18n';
import {ContentIcon} from '../../../../shared/icons/ContentIcon';
import {StatusIcon} from '../../../../shared/icons/StatusIcon';
import {DiffStatusBadge} from '../../../../shared/status/DiffStatusBadge';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {createContentStateKey} from '../../../../utils/cms/content/status';
import {calcContentState} from '../../../../utils/cms/content/workflow';

function createDisplayName(content: ContentSummaryAndCompareStatus): string {
    const contentSummary = content.getContentSummary();
    if (contentSummary) {
        return contentSummary.getDisplayName();
    }
    return content.getUploadItem()?.getName() ?? '';
}

const DETAILS_WIDGET_CONTENT_SECTION_NAME = 'DetailsWidgetContentSection';

export const DetailsWidgetContentSection = (): ReactElement => {
    const content = useStore($contextContent);

    const contentSummary = content?.getContentSummary();
    const publishStatus = content?.getPublishStatus();
    const compareStatus = content?.getCompareStatus();
    const contentState = calcContentState(contentSummary);
    const isMovedAndModified = CompareStatusChecker.isMovedAndModified(compareStatus, contentState);
    const shouldHideReadyState = publishStatus === PublishStatus.ONLINE
        && contentState === 'ready'
        && compareStatus !== CompareStatus.NEWER
        && !isMovedAndModified;
    const showContentState = contentState != null && !shouldHideReadyState;

    const iconLabel = useI18n('field.contextPanel.details.sections.content.icon');
    const statusLabel = useI18n('field.contextPanel.details.sections.content.status');
    const displayNameLabel = useI18n('field.contextPanel.details.sections.content.displayName');
    const pathLabel = useI18n('field.contextPanel.details.sections.content.path');
    const contentStateLabel = useI18n(showContentState ? createContentStateKey(contentState) : '');

    if (!content) return null;

    const displayName = createDisplayName(content);

    return (
        <section data-component={DETAILS_WIDGET_CONTENT_SECTION_NAME}>
            <dl className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                    <dt className="text-xs text-subtle">{iconLabel}</dt>
                    <dd>
                        <ContentIcon contentType={String(content.getType())} url={contentSummary.getIconUrl()} />
                    </dd>
                </div>

                <div className="flex flex-col gap-1">
                    <dt className="text-xs text-subtle">{statusLabel}</dt>
                    <dd className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <DiffStatusBadge
                            publishStatus={publishStatus}
                            compareStatus={compareStatus}
                            contentState={contentState}
                            wasPublished={!!contentSummary.getPublishFirstTime()} />
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
