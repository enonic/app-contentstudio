import {Button, cn, ListItem, type ListItemProps} from '@enonic/ui';
import React, {useMemo, type ReactNode} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import type {Branch} from '../../../../app/versioning/Branch';
import {ContentReferencesLink} from '../ContentReferencesLink';
import {StatusBadge} from '../StatusBadge';
import {OnlineBadge} from '../OnlineBadge';
import {calcWorkflowStateStatus} from '../../utils/cms/content/workflow';
import {WorkflowContentIcon} from '../icons/WorkflowContentIcon';
import {LegacyElement} from '../LegacyElement';

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
    showOnlineStatus?: boolean;
    mainItem?: boolean;
} & Pick<ListItemProps, 'className' | 'selected'>;

export const ContentItem = ({
    content,
    children,
    onClick,
    selected = false,
    showReferences = false,
    target,
    hasInbound = false,
    showOnlineStatus = false,
    mainItem = false,
}: ContentItemProps): React.ReactElement => {
    const name = String(content.getDisplayName());
    const path = String(content.getPath());
    const contentType = String(content.getType());
    const url = content.getContentSummary().getIconUrl();
    const contentId = content.getContentSummary().getContentId();
    const status = calcWorkflowStateStatus(content.getContentSummary());

    const Icon = useMemo(
        () => <WorkflowContentIcon status={status} contentType={contentType} url={url} />,
        [status, contentType, url]
    );

    return (
        <ListItem selected={selected}>
            <ListItem.Content>
                <Button onClick={onClick} className={cn('block flex-1 w-full h-8 -mx-1.25 -my-1 px-1.25 py-1', mainItem && "h-13")}>
                    <ListItem.DefaultContent label={mainItem ? name : path} description={mainItem && path} icon={Icon} />
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
                {showOnlineStatus ? <OnlineBadge status={content.getCompareStatus()} /> : <StatusBadge status={content.getCompareStatus()} wasPublished={!!content.getContentSummary().getPublishFirstTime()} />}

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
        // Backward compatibility
    }

    setHasInbound(hasInbound: boolean): void {
        this.props.setKey('hasInbound', hasInbound);
    }

}
