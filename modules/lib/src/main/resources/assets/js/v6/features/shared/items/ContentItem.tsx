import {Button, ListItem, type ListItemProps} from '@enonic/ui';
import {useMemo, type ReactNode} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import type {Branch} from '../../../../app/versioning/Branch';
import {calcWorkflowStateStatus} from '../../utils/cms/content/workflow';
import {ContentReferencesLink} from '../ContentReferencesLink';
import {WorkflowContentIcon} from '../icons/WorkflowContentIcon';
import {LegacyElement} from '../LegacyElement';
import {DiffStatusBadge} from '../status/DiffStatusBadge';

export type ContentItemProps = {
    content: ContentSummaryAndCompareStatus;
    children?: ReactNode;
    onClick?: () => void;
    clickable?: boolean;
    className?: string;
    selected?: boolean;
    showReferences?: boolean;
    target?: Branch;
    hasInbound?: boolean;
} & Pick<ListItemProps, 'className' | 'selected'>;

export const ContentItem = ({
    content,
    children,
    onClick,
    selected = false,
    showReferences = false,
    target,
    hasInbound = false,
}: ContentItemProps): React.ReactElement => {
    const label = String(content.getPath());
    const contentType = String(content.getType());
    const url = content.getContentSummary().getIconUrl();
    const contentId = content.getContentSummary().getContentId();
    const workflowStatus = calcWorkflowStateStatus(content.getContentSummary());

    const Icon = useMemo(
        () => <WorkflowContentIcon status={workflowStatus} contentType={contentType} url={url} />,
        [workflowStatus, contentType, url]
    );

    return (
        <ListItem selected={selected}>
            <ListItem.Content>
                <Button onClick={onClick} className="block flex-1 w-[calc(100%+10px)] h-8 -mx-1.25 -my-1 px-1.25 py-1">
                    <ListItem.DefaultContent label={label} icon={Icon} />
                </Button>
            </ListItem.Content>
            <ListItem.Right>
                {children}
                {showReferences && hasInbound && (
                    <ContentReferencesLink
                        contentId={contentId.toString()}
                        target={target}
                    />
                )}
                <DiffStatusBadge
                    publishStatus={content.getPublishStatus()}
                    compareStatus={content.getCompareStatus()}
                    wasPublished={!!content.getContentSummary().getPublishFirstTime()} />
            </ListItem.Right>
        </ListItem>
    );
};

ContentItem.displayName = 'ContentItem';

export class ContentItemElement extends LegacyElement<typeof ContentItem, ContentItemProps> {

    constructor(props: ContentItemProps) {
        super({clickable: true, ...props}, ContentItem);
    }

    getItem(): ContentSummaryAndCompareStatus {
        return this.props.get().content;
    }

    isSelected(): boolean {
        return this.props.get().selected === true;
    }

    isSelectable(): boolean {
        return this.props.get().clickable !== false;
    }

    setSelected(selected: boolean): void {
        this.props.setKey('selected', selected);
    }

    onSelected(): void {
        // Backwards compatibility
    }

    setHasInbound(hasInbound: boolean): void {
        this.props.setKey('hasInbound', hasInbound);
    }

}
