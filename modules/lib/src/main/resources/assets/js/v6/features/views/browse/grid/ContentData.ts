import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type PublishStatus} from 'src/main/resources/assets/js/app/publish/PublishStatus';
import {type ContentSummary} from '../../../../../app/content/ContentSummary';
import type {FlatNode} from '../../../lib/tree-store';
import {type ContentUploadData} from './ContentUploadData';
import type {ContentState} from '../../../../../app/content/ContentState';

export type ContentData = {
    id: string;
    displayName: string;
    name: string;
    publishStatus: PublishStatus;
    contentState: ContentState | null;
    contentType: ContentTypeName;
    iconUrl: string | null;
    hasChildren: boolean;
    item: ContentSummary; // Full content data from cache
};

export function isFlatTreeItemContentData(
    item: FlatNode<ContentData | ContentUploadData>
): item is FlatNode<ContentData> {
    return item.data !== null && 'displayName' in item.data;
}
