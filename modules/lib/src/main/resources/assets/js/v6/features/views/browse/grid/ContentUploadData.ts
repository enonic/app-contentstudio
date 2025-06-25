import type {FlatNode} from '../../../lib/tree-store';
import {ContentData} from './ContentData';

export type ContentUploadData = {
    id: string;
    name: string;
    progress: number;
    parentId: string;
    hasChildren: boolean;
};

export function isFlatTreeItemContentUploadData(
    item: FlatNode<ContentData | ContentUploadData>
): item is FlatNode<ContentUploadData> {
    return item.data !== null && 'progress' in item.data;
}
