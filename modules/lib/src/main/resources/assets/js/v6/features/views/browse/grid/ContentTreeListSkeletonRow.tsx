import {Skeleton, VirtualizedTreeList} from '@enonic/ui';
import type {ReactElement} from 'react';

type ContentTreeListSkeletonRowProps = {
    level: number;
};

const CONTENT_TREE_LIST_SKELETON_ROW_NAME = 'ContentTreeListSkeletonRow';

export const ContentTreeListSkeletonRow = ({level}: ContentTreeListSkeletonRowProps): ReactElement => (
    <VirtualizedTreeList.Row active={false} selected={false} data-component={CONTENT_TREE_LIST_SKELETON_ROW_NAME}>
        <VirtualizedTreeList.RowLeft>
            <span className="w-3.5" />
            <VirtualizedTreeList.RowLevelSpacer level={level} />
            <span className="size-5 shrink-0" />
        </VirtualizedTreeList.RowLeft>
        <VirtualizedTreeList.RowContent>
            <Skeleton.Group className="flex items-center justify-between gap-2.5 w-full">
                <div className="grid grid-cols-[auto_1fr] gap-2.5 items-center flex-1 min-w-0">
                    <Skeleton shape="circle" className="size-6" />
                    <div className="flex flex-col gap-1">
                        <Skeleton shape="rectangle" className="h-5 w-36" />
                        <Skeleton shape="rectangle" className="h-4 w-24" />
                    </div>
                </div>
                <Skeleton shape="rectangle" className="h-5 w-12 shrink-0" />
            </Skeleton.Group>
        </VirtualizedTreeList.RowContent>
    </VirtualizedTreeList.Row>
);

ContentTreeListSkeletonRow.displayName = CONTENT_TREE_LIST_SKELETON_ROW_NAME;
