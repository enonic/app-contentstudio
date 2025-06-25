import {type ContentVersionActionJson} from './ContentVersionActionJson';
import {type ContentVersionPublishInfoJson} from './ContentVersionPublishInfoJson';
import {type WorkflowJson} from '@enonic/lib-admin-ui/content/json/WorkflowJson';
import {type ChildOrderJson} from './ChildOrderJson';

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
