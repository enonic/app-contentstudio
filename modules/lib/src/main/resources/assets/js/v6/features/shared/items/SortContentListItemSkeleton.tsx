import {ListItem, Skeleton, cn} from '@enonic/ui';
import {GripVertical} from 'lucide-react';
import {type ReactElement} from 'react';

export type SortContentListItemSkeletonProps = {
    dragEnabled?: boolean;
    className?: string;
    'data-component'?: string;
};

const SORT_CONTENT_LIST_ITEM_SKELETON_NAME = 'SortContentListItemSkeleton';

export const SortContentListItemSkeleton = ({
    dragEnabled = false,
    className,
    'data-component': componentName = SORT_CONTENT_LIST_ITEM_SKELETON_NAME,
}: SortContentListItemSkeletonProps): ReactElement => {
    return (
        <ListItem data-component={componentName} className={cn('flex-1 pl-0 py-0 bg-unset', className)}>
            <ListItem.Content className='flex'>
                <div className='box-content flex items-center justify-start flex-1 px-2.5 py-1 gap-2.5'>
                    {dragEnabled && <GripVertical className='size-4 shrink-0 text-subtle' />}
                    <Skeleton.Group className='grid grid-cols-[auto_1fr] gap-2.5 items-center flex-1 min-w-0'>
                        <Skeleton shape='circle' className='size-6' />
                        <div className='flex flex-col gap-1'>
                            <Skeleton shape='rectangle' className='h-5 w-40' />
                            <Skeleton shape='rectangle' className='h-4 w-28' />
                        </div>
                    </Skeleton.Group>
                </div>
            </ListItem.Content>
        </ListItem>
    );
};

SortContentListItemSkeleton.displayName = SORT_CONTENT_LIST_ITEM_SKELETON_NAME;
