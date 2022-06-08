import {EventJson} from '@enonic/lib-admin-ui/event/EventJson';

export interface CollaborationEventJson
    extends EventJson {
    data: CollaborationEventDataJson;
}

export interface CollaborationEventDataJson {
    collaborators: string[];
    contentId: string;
    newCollaborator?: NewCollaboratorJson;
}

export interface NewCollaboratorJson {
    sessionId: string;
    userKey: string;
}
