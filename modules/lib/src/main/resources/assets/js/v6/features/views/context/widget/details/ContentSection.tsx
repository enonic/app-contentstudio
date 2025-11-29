import {ReactElement} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {useI18n} from '../../../../hooks/useI18n';
import {cn} from '@enonic/ui';
import {PublishStatusChecker} from '../../../../../../app/publish/PublishStatus';
import {StatusIcon} from '../../../../shared/icons/StatusIcon';
import {capitalize} from '../../../../utils/format/capitalize';
import {ContentIcon} from '../../../../shared/icons/ContentIcon';
import {useStore} from '@nanostores/preact';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {Subtitle} from './utils';
import {calcWorkflowStateStatus} from '../../../../utils/cms/content/workflow';

type Props = {
    content: ContentSummaryAndCompareStatus;
};

const Icon = ({content}: Props): ReactElement => {
    return (
        <div>
            <Subtitle text={useI18n('field.contextPanel.details.sections.content.icon')} />
            <ContentIcon contentType={String(content.getType())} url={content.getContentSummary().getIconUrl()} />
        </div>
    );
};

const Status = ({content}: Props): ReactElement => {
    const contentSummary = content.getContentSummary();
    const publishStatus = content.getPublishStatus();
    const status = calcWorkflowStateStatus(contentSummary);
    const statusLabel = status ? useI18n(`field.contextPanel.details.sections.content.status.${status}`) : '';

    return (
        <div>
            <Subtitle text={useI18n('field.contextPanel.details.sections.content.status')} />
            <p className="flex gap-2 items-center text-sm">
                {publishStatus && (
                    <span className={cn(PublishStatusChecker.isOnline(publishStatus) && 'text-success')}>
                        {capitalize(publishStatus)}
                    </span>
                )}

                {publishStatus && status && <span className="text-gray-300"> | </span>}

                <div className="flex items-center gap-1 overflow-hidden">
                    {status && <StatusIcon status={status} aria-label={statusLabel} className="shrink-0" />}
                    <span className="truncate">{statusLabel}</span>
                </div>
            </p>
        </div>
    );
};

const DisplayName = ({content}: Props): ReactElement => {
    const displayName = content.hasContentSummary()
        ? content.getContentSummary().getDisplayName()
        : content.hasUploadItem()
          ? content.getUploadItem().getName()
          : '';

    if (!displayName) return undefined;

    return (
        <div className="flex flex-col shrink-1">
            <Subtitle text={useI18n('field.contextPanel.details.sections.content.displayName')} />
            <p className="text-sm truncate">{displayName}</p>
        </div>
    );
};

const Path = ({content}: Props): ReactElement => {
    return (
        <div className="flex flex-col shrink-1">
            <Subtitle text={useI18n('field.contextPanel.details.sections.content.path')} />
            <p className="text-sm truncate">{content.getPath().toString()}</p>
        </div>
    );
};

export const DetailsWidgetContentSection = (): ReactElement => {
    const content = useStore($contextContent);

    if (!content) return undefined;

    return (
        <div className="flex flex-col gap-5">
            <Icon content={content} />
            <Status content={content} />
            <DisplayName content={content} />
            <Path content={content} />
        </div>
    );
};

DetailsWidgetContentSection.displayName = 'DetailsWidgetContentSection';
