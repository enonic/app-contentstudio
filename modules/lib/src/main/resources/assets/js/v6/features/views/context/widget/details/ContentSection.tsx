import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {ReactElement} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {WidgetItemViewInterface} from '../../../../../../app/view/context/WidgetItemView';
import {useI18n} from '../../../../hooks/useI18n';
import {Workflow} from '../../../../../../app/content/Workflow';
import {cn} from '@enonic/ui';
import {PublishStatusChecker} from '../../../../../../app/publish/PublishStatus';
import {HorizontalDivider, Subtitle} from './utils';
import Q from 'q';
import {StatusIcon} from '../../../../shared/icons/StatusIcon';
import {WorkflowState} from '../../../../../../app/content/WorkflowState';
import {capitalize} from '../../../../utils/format/capitalize';
import {ContentIcon} from '../../../../shared/icons/ContentIcon';

type Props = {
    content?: ContentSummaryAndCompareStatus;
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
    const workflow: Workflow = contentSummary.getWorkflow();
    const workflowState = workflow ? useI18n(`status.workflow.${workflow.getState()}`) : '';
    let status: 'info' | 'ready' | 'in-progress' | 'invalid';

    switch (workflow.getState()) {
        case WorkflowState.READY:
            status = 'ready';
            break;
        case WorkflowState.IN_PROGRESS:
            status = 'in-progress';
            break;
    }

    return (
        <div>
            <Subtitle text={useI18n('field.contextPanel.details.sections.content.status')} />
            <p className="flex gap-2 items-center text-sm">
                {publishStatus && (
                    <span
                        className={cn(
                            PublishStatusChecker.isOnline(publishStatus) && 'text-success'
                            //PublishStatusChecker.isScheduled(publishStatus) && 'text-green-600',
                            //PublishStatusChecker.isExpired(publishStatus) && 'text-green-600',
                        )}
                    >
                        {capitalize(publishStatus)}
                    </span>
                )}

                {publishStatus && workflowState && <HorizontalDivider />}

                <span className="flex items-center gap-1">
                    {status && <StatusIcon status={status} />}
                    {workflowState}
                </span>
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
        <div class="flex flex-col shrink-1">
            <Subtitle text={useI18n('field.contextPanel.details.sections.content.path')} />
            <p className="text-sm truncate">{content.getPath().toString()}</p>
        </div>
    );
};

const DetailsWidgetContentSection = ({content}: Props): ReactElement => {
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

export class DetailsWidgetContentSectionElement
    extends LegacyElement<typeof DetailsWidgetContentSection>
    implements WidgetItemViewInterface
{
    constructor(props: Props) {
        super(props, DetailsWidgetContentSection);
    }

    // Backwards compatibility

    public static debug: boolean = false;

    public layout(): Q.Promise<void> {
        return Q();
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<null | void> {
        if (!item) return;

        this.props.setKey('content', item);

        return Q();
    }

    public fetchWidgetContents(url: string, contentId: string): Q.Promise<void> {
        return Q();
    }

    public hide(): void {
        return;
    }

    public show(): void {
        return;
    }
}
