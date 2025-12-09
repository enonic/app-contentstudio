import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {TreeData} from '@enonic/ui';
import {PublishStatus} from 'src/main/resources/assets/js/app/publish/PublishStatus';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {WorkflowStateStatus} from '../../../../../app/wizard/WorkflowStateManager';

export type ContentData = {
    displayName: string;
    name: string;
    publishStatus: PublishStatus;
    workflowStatus: WorkflowStateStatus | null;
    contentType: ContentTypeName;
    iconUrl: string | null;
    item: ContentSummaryAndCompareStatus; // temporary, for backward compatibility
} & TreeData;
