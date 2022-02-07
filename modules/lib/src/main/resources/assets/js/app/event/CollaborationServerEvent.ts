import {Event} from 'lib-admin-ui/event/Event';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {CollaborationEventJson} from './CollaborationEventJson';
import {ContentId} from '../content/ContentId';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';

export enum CollaborationEventType {
    ADD, REMOVE
}

export class CollaborationServerEvent
    extends Event {

    public static TYPE_PREFIX: string = 'edit.content';

    public static ADD_EVENT_NAME = `${CollaborationServerEvent.TYPE_PREFIX}.new.collaborator`;

    public static REMOVE_EVENT_NAME = `${CollaborationServerEvent.TYPE_PREFIX}.remove.collaborator`;

    private readonly contentId: ContentId;

    private readonly collaborators: PrincipalKey[];

    private readonly newCollaborator?: PrincipalKey;

    private readonly type: CollaborationEventType;

    constructor(builder: CollaborationServerEventBuilder) {
        super();

        this.contentId = builder.contentId;
        this.collaborators = builder.collaborators;
        this.type = builder.type;
        this.newCollaborator = builder.newCollaborator;
    }

    getContentId(): ContentId {
        return this.contentId;
    }

    getCollaborators(): PrincipalKey[] {
        return this.collaborators.slice();
    }

    getType(): CollaborationEventType {
        return this.type;
    }

    getNewCollaborator(): PrincipalKey {
        return this.newCollaborator;
    }

    public static fromJson(json: CollaborationEventJson): CollaborationServerEvent {
        return new CollaborationServerEventBuilder().fromJson(json).build();
    }

    static on(handler: (event: CollaborationServerEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: CollaborationServerEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}

export class CollaborationServerEventBuilder {
    contentId: ContentId;
    collaborators: PrincipalKey[];
    newCollaborator?: PrincipalKey;
    type: CollaborationEventType;

    fromJson(json: CollaborationEventJson): CollaborationServerEventBuilder {
        this.contentId = new ContentId(json.data.contentId);
        this.collaborators = json.data.collaborators.map(PrincipalKey.fromString);

        if (json.type === CollaborationServerEvent.ADD_EVENT_NAME) {
            this.type = CollaborationEventType.ADD;
        } else if (json.type === CollaborationServerEvent.REMOVE_EVENT_NAME) {
            this.type = CollaborationEventType.REMOVE;
        }

        if (this.type === CollaborationEventType.ADD) {
            this.newCollaborator = !!json.data.newCollaborator ? PrincipalKey.fromString(json.data.newCollaborator.userKey) : null;
        }

        return this;
    }

    build(): CollaborationServerEvent {
        return new CollaborationServerEvent(this);
    }
}
