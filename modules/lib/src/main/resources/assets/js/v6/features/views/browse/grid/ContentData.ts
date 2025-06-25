import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type PublishStatus} from 'src/main/resources/assets/js/app/publish/PublishStatus';
import {type ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {type WorkflowStateStatus} from '../../../../../app/wizard/WorkflowStateManager';
import type {FlatNode} from '../../../lib/tree-store';
import {type ContentUploadData} from './ContentUploadData';

export type ContentData = {
    id: string;
    displayName: string;
    name: string;
    publishStatus: PublishStatus;
    workflowStatus: WorkflowStateStatus | null;
    contentType: ContentTypeName;
    iconUrl: string | null;
    hasChildren: boolean;
    item: ContentSummaryAndCompareStatus; // Full content data from cache
};

export function isFlatTreeItemContentData(
    item: FlatNode<ContentData | ContentUploadData>
): item is FlatNode<ContentData> {
    return item.data !== null && 'displayName' in item.data;
}
