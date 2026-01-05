import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {FlatTreeNode, TreeData} from '@enonic/ui';
import {PublishStatus} from 'src/main/resources/assets/js/app/publish/PublishStatus';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {WorkflowStateStatus} from '../../../../../app/wizard/WorkflowStateManager';
import {ContentUploadData} from './ContentUploadData';

export type ContentData = {
    displayName: string;
    name: string;
    publishStatus: PublishStatus;
    workflowStatus: WorkflowStateStatus | null;
    contentType: ContentTypeName;
    iconUrl: string | null;
    item: ContentSummaryAndCompareStatus; // temporary, for backward compatibility
} & TreeData;

export function isFlatTreeItemContentData(
    item: FlatTreeNode<ContentData | ContentUploadData>
): item is FlatTreeNode<ContentData> {
    return 'displayName' in item.data;
}
