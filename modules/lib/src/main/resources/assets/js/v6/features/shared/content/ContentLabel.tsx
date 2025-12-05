import {ReactElement} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {ItemLabel} from '../ItemLabel';
import {WorkflowContentIcon} from '../icons/WorkflowContentIcon';
import {calcWorkflowStateStatus} from '../../utils/cms/content/workflow';

const CONTENT_LABEL_NAME = 'ContentLabel';

type ContentLabelProps = {
    content: ContentSummaryAndCompareStatus;
    compact?: boolean;
    hideStatus?: boolean;
    fullPath?: boolean;
    className?: string;
};

export const ContentLabel = ({content, compact, hideStatus, fullPath, className}: ContentLabelProps): ReactElement => {
    const Icon = (
        <WorkflowContentIcon
            status={hideStatus ? undefined : calcWorkflowStateStatus(content.getContentSummary())}
            contentType={content.getType().toString()}
            url={content.getContentSummary().getIconUrl()}
        />
    );

    const secondaryText = getSecondaryText(content, compact, fullPath);
    const primaryText = compact ? secondaryText : content.getDisplayName();

    return (
        <ItemLabel
            data-component={CONTENT_LABEL_NAME}
            icon={Icon}
            primary={primaryText}
            secondary={secondaryText}
            className={className}
        />
    );
};

ContentLabel.displayName = CONTENT_LABEL_NAME;

function getSecondaryText(
    content: ContentSummaryAndCompareStatus,
    compact: boolean,
    fullPath: boolean
): string | undefined {
    if (compact) return undefined;

    if (fullPath) return content.getPath().toString();

    return content.getPath().getName();
}
