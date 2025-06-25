import {Button, cn, ListItem, type ListItemProps} from '@enonic/ui';
import React, {type ReactNode} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../../app/event/EditContentEvent';
import {ContentLabel, ContentLabelVariant} from '../content/ContentLabel';
import {LegacyElement} from '../LegacyElement';
import {StatusBadge} from '../status/StatusBadge';

export type ContentItemProps = {
    content: ContentSummaryAndCompareStatus;
    variant?: ContentLabelVariant;
    rightSlotOrder?: 'before-status' | 'after-status';
    'data-component'?: string;
    children?: ReactNode;
} & Omit<ListItemProps, 'children'>;

const CONTENT_LIST_ITEM_NAME = 'ContentListItem';

export const ContentListItem = ({
                                    content,
                                    variant,
                                    rightSlotOrder = 'before-status',
                                    selected = false,
                                    className,
                                    children,
                                    'data-component': componentName = CONTENT_LIST_ITEM_NAME,
                                    ...props
                                }: ContentItemProps): React.ReactElement => {
    const isCompact = variant === 'compact';

    const handleClick = () => {
        new EditContentEvent([content]).fire();
    };

    return (
        <ListItem selected={selected} data-component={componentName} className={cn('pl-0 py-0', className)} {...props}>
            <ListItem.Content className='flex'>
                <Button onClick={handleClick} className={cn('box-content justify-start flex-1 px-2.5 py-1', isCompact && 'h-6')}>
                    <ContentLabel content={content} variant={variant}/>
                </Button>
            </ListItem.Content>
            <ListItem.Right>
                {rightSlotOrder === 'before-status' && children}
                <StatusBadge status={content.getPublishStatus()}/>
                {rightSlotOrder === 'after-status' && children}
            </ListItem.Right>
        </ListItem>
    )
};

ContentListItem.displayName = CONTENT_LIST_ITEM_NAME;

export class ContentListItemElement
    extends LegacyElement<typeof ContentListItem, ContentItemProps> {
    constructor(props: ContentItemProps) {
        super({...props}, ContentListItem);
    }

    getItem(): ContentSummaryAndCompareStatus {
        return this.props.get().content;
    }

    isSelected(): boolean {
        return this.props.get().selected === true;
    }

    isSelectable(): boolean {
        return true;
    }

    setSelected(selected: boolean): void {
        this.props.setKey('selected', selected);
    }

    onSelected(): void {
        // Backward compatibility
    }
}
