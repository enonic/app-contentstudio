import {useStore} from '@nanostores/preact';
import {ReactElement} from 'react';
import {ContentSummaryAndCompareStatus} from 'src/main/resources/assets/js/app/content/ContentSummaryAndCompareStatus';
import {useI18n} from '../../../../hooks/useI18n';
import {ContentIcon} from '../../../../shared/icons/ContentIcon';
import {DiffStatusBadge} from '../../../../shared/status/DiffStatusBadge';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {calcWorkflowStateStatus} from '../../../../utils/cms/content/workflow';

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

    const iconLabel = useI18n('field.contextPanel.details.sections.content.icon');
    const statusLabel = useI18n('field.contextPanel.details.sections.content.status');
    const displayNameLabel = useI18n('field.contextPanel.details.sections.content.displayName');
    const pathLabel = useI18n('field.contextPanel.details.sections.content.path');

    if (!content) return null;

    const contentSummary = content.getContentSummary();
    const workflowStatus = calcWorkflowStateStatus(contentSummary);
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
                    <dd className="flex gap-2 items-center">
                        <DiffStatusBadge
                            publishStatus={content.getPublishStatus()}
                            compareStatus={content.getCompareStatus()}
                            workflowStatus={workflowStatus}
                            wasPublished={!!contentSummary.getPublishFirstTime()} />
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
