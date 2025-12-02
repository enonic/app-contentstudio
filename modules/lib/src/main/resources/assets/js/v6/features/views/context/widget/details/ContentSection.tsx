import {cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement} from 'react';
import {PublishStatusChecker, PublishStatusFormatter} from '../../../../../../app/publish/PublishStatus';
import {useI18n} from '../../../../hooks/useI18n';
import {ContentIcon} from '../../../../shared/icons/ContentIcon';
import {StatusIcon} from '../../../../shared/icons/StatusIcon';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {calcWorkflowStateStatus} from '../../../../utils/cms/content/workflow';

export function DetailsWidgetContentSection(): ReactElement {
    const content = useStore($contextContent);

    const iconLabel = useI18n('field.contextPanel.details.sections.content.icon');
    const statusLabel = useI18n('field.contextPanel.details.sections.content.status');
    const displayNameLabel = useI18n('field.contextPanel.details.sections.content.displayName');
    const pathLabel = useI18n('field.contextPanel.details.sections.content.path');
    const readyLabel = useI18n('field.contextPanel.details.sections.content.status.ready');
    const inProgressLabel = useI18n('field.contextPanel.details.sections.content.status.in-progress');
    const invalidLabel = useI18n('field.contextPanel.details.sections.content.status.invalid');

    if (!content) return null;

    const contentSummary = content.getContentSummary();
    const publishStatus = content.getPublishStatus();
    const workflowStatus = calcWorkflowStateStatus(contentSummary);

    const workflowStatusLabelMap: Record<string, string> = {
        ready: readyLabel,
        'in-progress': inProgressLabel,
        invalid: invalidLabel,
    };
    const workflowStatusLabel = workflowStatus ? workflowStatusLabelMap[workflowStatus] : '';

    const displayName = content.hasContentSummary()
        ? contentSummary.getDisplayName()
        : content.hasUploadItem()
            ? content.getUploadItem().getName()
            : '';

    return (
        <dl className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
                <dt className="text-xs text-subtle">{iconLabel}</dt>
                <dd>
                    <ContentIcon contentType={String(content.getType())} url={contentSummary.getIconUrl()} />
                </dd>
            </div>

            <div className="flex flex-col gap-1">
                <dt className="text-xs text-subtle">{statusLabel}</dt>
                <dd className="flex gap-2 items-center text-sm">
                    {publishStatus && (
                        <span className={cn(PublishStatusChecker.isOnline(publishStatus) && 'text-success')}>
                            {PublishStatusFormatter.formatStatusText(publishStatus)}
                        </span>
                    )}

                    {publishStatus && workflowStatus && <span className="text-gray-300"> | </span>}

                    {workflowStatus && (
                        <span className="flex items-center gap-1 overflow-hidden">
                            <StatusIcon status={workflowStatus} aria-label={workflowStatusLabel} className="shrink-0" />
                            <span className="truncate">{workflowStatusLabel}</span>
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
    );
}
