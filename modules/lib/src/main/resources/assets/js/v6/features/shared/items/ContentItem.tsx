import {Button, ListItem, type ListItemProps} from '@enonic/ui';
import {type ReactNode} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import type {Branch} from '../../../../app/versioning/Branch';
import {ContentReferencesLink} from '../ContentReferencesLink';
import {LegacyElement} from '../LegacyElement';
import {DiffStatusBadge} from '../status/DiffStatusBadge';
import {ContentLabel} from '../content/ContentLabel';

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
}: ContentItemProps): React.ReactElement => (
    <ListItem selected={selected}>
        <ListItem.Content>
            <Button onClick={onClick} className="block flex-1 w-[calc(100%+10px)] -mx-1.25 -my-0.75 px-1.25 py-1">
                <ContentLabel content={content} compact />
            </Button>
        </ListItem.Content>
        <ListItem.Right>
            {children}
            {showReferences && hasInbound && (
                <ContentReferencesLink
                    contentId={content.getContentSummary().getContentId().toString()}
                    target={target}
                />
            )}
            <DiffStatusBadge
                publishStatus={content.getPublishStatus()}
                compareStatus={content.getCompareStatus()}
                wasPublished={!!content.getContentSummary().getPublishFirstTime()}
            />
        </ListItem.Right>
    </ListItem>
);

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
