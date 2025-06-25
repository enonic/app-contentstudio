import {ReactElement} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {calcWorkflowStateStatus} from '../../utils/cms/content/workflow';
import {ItemLabel, ItemLabelProps} from '../ItemLabel';
import {WorkflowContentIcon} from '../icons/WorkflowContentIcon';

const CONTENT_LABEL_NAME = 'ContentLabel';

export type ContentLabelVariant = 'compact' | 'normal' | 'detailed';

export type ContentLabelProps = {
    content: ContentSummaryAndCompareStatus;
    /**
     * Display variant:
     * - `compact` - Single line showing full path (for list items, space-constrained contexts)
     * - `normal` - Display name with short path below (default)
     * - `detailed` - Display name with full path below (when hierarchy context matters)
     */
    variant?: ContentLabelVariant;
    /** Hide the workflow status icon. @default false */
    hideStatus?: boolean;
} & Omit<ItemLabelProps, 'icon' | 'primary' | 'secondary'>;

export const ContentLabel = ({
    content,
    variant = 'normal',
    hideStatus = false,
    'data-component': dataComponent = CONTENT_LABEL_NAME,
    ...props
}: ContentLabelProps): ReactElement => {
    const isCompact = variant === 'compact';
    const showFullPath = variant === 'compact' || variant === 'detailed';

    const path = content.getPath();
    const pathText = showFullPath ? path.toString() : path.getName();

    const status = hideStatus ? null : calcWorkflowStateStatus(content.getContentSummary());
    const Icon = (
        <WorkflowContentIcon
            status={status}
            contentType={content.getType().toString()}
            url={content.getContentSummary().getIconUrl()}
        />
    );

    const primaryText = isCompact ? pathText : content.getDisplayName();
    const secondaryText = isCompact ? undefined : pathText;

    return (
        <ItemLabel
            data-component={dataComponent}
            icon={Icon}
            primary={primaryText}
            secondary={secondaryText}
            {...props}
        />
    );
};

ContentLabel.displayName = CONTENT_LABEL_NAME;
