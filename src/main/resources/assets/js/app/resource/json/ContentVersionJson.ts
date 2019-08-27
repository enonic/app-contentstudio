import {ContentVersionPublishInfoJson} from './ContentVersionPublishInfoJson';
import WorkflowJson = api.content.json.WorkflowJson;

export interface ContentVersionJson {

    modifier: string;

    modifierDisplayName: string;

    displayName: string;

    modified: string;

    comment: string;

    id: string;

    publishInfo: ContentVersionPublishInfoJson;

    workflow: WorkflowJson;
}
