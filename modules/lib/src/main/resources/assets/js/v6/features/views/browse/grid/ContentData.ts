import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {TreeNode} from '@enonic/ui';
import {CS6ContentStatus} from '../../../../../app/content/ContentStatus';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {WorkflowStateStatus} from '../../../../../app/wizard/WorkflowStateManager';

export type ContentData = {
    displayName: string;
    name: string;
    workflowStatus: WorkflowStateStatus | null;
    contentType: ContentTypeName;
    iconUrl: string | null;
    contentStatus: CS6ContentStatus;
    item: ContentSummaryAndCompareStatus; // temporary, for backward compatibility
} & TreeNode;
