import {FlatTreeNode, TreeData} from '@enonic/ui';
import {ContentData} from './ContentData';
import {ContentSummaryAndCompareStatus} from 'src/main/resources/assets/js/app/content/ContentSummaryAndCompareStatus';

export type ContentUploadData = {
    id: string;
    name: string;
    progress: number;
    parentId: string;
    item?: ContentSummaryAndCompareStatus; // hack, to avoid breaking types since we use this type as union type in content tree data.
} & TreeData;

export function isFlatTreeItemContentUploadData(
    item: FlatTreeNode<ContentData | ContentUploadData>
): item is FlatTreeNode<ContentUploadData> {
    return 'progress' in item.data;
}
