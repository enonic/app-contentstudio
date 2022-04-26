import {EventJson} from 'lib-admin-ui/event/EventJson';

export interface CollaborationEventJson
    extends EventJson {
    data: CollaborationEventDataJson;
}

export interface CollaborationEventDataJson {
    collaborators: string[];
    contentId: string;
}
