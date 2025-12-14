import {ContentVersionActionJson} from './ContentVersionActionJson';
import {ContentVersionPublishInfoJson} from './ContentVersionPublishInfoJson';
import {WorkflowJson} from '@enonic/lib-admin-ui/content/json/WorkflowJson';
import {ChildOrderJson} from './ChildOrderJson';

export interface ContentVersionJson {

    modifier: string;

    modifierDisplayName: string;

    displayName: string;

    modified: string;

    timestamp: string;

    comment: string;

    id: string;

    childOrder: ChildOrderJson;

    publishInfo: ContentVersionPublishInfoJson;

    workflow: WorkflowJson;

    permissionsChanged: boolean;

    path: string;

    actions: ContentVersionActionJson[];
}
