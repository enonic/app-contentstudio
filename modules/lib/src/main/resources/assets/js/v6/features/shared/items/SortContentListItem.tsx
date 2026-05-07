import {ListItem, type ListItemProps, cn} from '@enonic/ui';
import {GripVertical} from 'lucide-react';
import {type ReactElement} from 'react';
import type {ContentSummary} from '../../../../app/content/ContentSummary';
import {ContentLabel, type ContentLabelVariant} from '../content/ContentLabel';

export type SortContentListItemProps = {
    content: ContentSummary;
    variant?: ContentLabelVariant;
    dragEnabled?: boolean;
    'data-component'?: string;
} & Omit<ListItemProps, 'children' | 'selected'>;

const SORT_CONTENT_LIST_ITEM_NAME = 'SortContentListItem';

export const SortContentListItem = ({
    content,
    variant,
    dragEnabled = false,
    className,
    'data-component': componentName = SORT_CONTENT_LIST_ITEM_NAME,
    ...props
}: SortContentListItemProps): ReactElement => {
    return (
        <ListItem data-component={componentName} className={cn('flex-1 pl-0 py-0 bg-unset', className)} {...props}>
            <ListItem.Content className='flex'>
                <div
                    className={cn(
                        'box-content flex items-center justify-start flex-1 px-2.5 py-1 gap-2.5',
                        dragEnabled && 'cursor-move',
                    )}
                >
                    {dragEnabled && <GripVertical className='size-4 shrink-0 text-subtle' />}
                    <ContentLabel content={content} variant={variant} />
                </div>
            </ListItem.Content>
        </ListItem>
    );
};

SortContentListItem.displayName = SORT_CONTENT_LIST_ITEM_NAME;
