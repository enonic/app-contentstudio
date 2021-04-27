import {ContentVersionPublishInfoJson} from './ContentVersionPublishInfoJson';
import {WorkflowJson} from '@enonic/lib-admin-ui/content/json/WorkflowJson';

export interface ContentVersionJson {

    modifier: string;

    modifierDisplayName: string;

    displayName: string;

    modified: string;

    timestamp: string;

    comment: string;

    id: string;

    publishInfo: ContentVersionPublishInfoJson;

    workflow: WorkflowJson;
}
