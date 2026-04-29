import {type ReactElement} from 'react';
import type {ContentSummary} from '../../../../app/content/ContentSummary';
import {resolveDisplayName, resolvePath} from '../../utils/cms/content/prettify';
import {calcContentState} from '../../utils/cms/content/workflow';
import {ItemLabel, type ItemLabelProps} from '../ItemLabel';
import {WorkflowContentIcon} from '../icons/WorkflowContentIcon';

const CONTENT_LABEL_NAME = 'ContentLabel';

export type ContentLabelVariant = 'compact' | 'normal' | 'detailed';

export type ContentLabelProps = {
    content: ContentSummary;
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

    const statusHidden = hideStatus || !!content.getPublishTime();
    const status = statusHidden ? null : calcContentState(content);
    const Icon = (
        <WorkflowContentIcon
            status={status}
            contentType={content.getType().toString()}
            url={content.getIconUrl()}
        />
    );

    const pathStr = resolvePath(content, showFullPath);

    const primaryText = isCompact
        ? pathStr
        : resolveDisplayName(content);
    const secondaryText = isCompact
        ? undefined
        : pathStr;

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
