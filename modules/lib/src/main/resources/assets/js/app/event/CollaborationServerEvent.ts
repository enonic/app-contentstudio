import {Event} from '@enonic/lib-admin-ui/event/Event';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {CollaborationEventJson} from './CollaborationEventJson';
import {ContentId} from '../content/ContentId';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class CollaborationServerEvent
    extends Event {

    public static EVENT_NAME: string = 'custom.edit.content.collaborators.update';

    private readonly contentId: ContentId;

    private readonly collaborators: PrincipalKey[];

    private readonly project: string;

    constructor(builder: CollaborationServerEventBuilder) {
        super();

        this.contentId = builder.contentId;
        this.collaborators = builder.collaborators;
        this.project = builder.project;
    }

    getContentId(): ContentId {
        return this.contentId;
    }

    getCollaborators(): PrincipalKey[] {
        return this.collaborators.slice();
    }

    getProject(): string {
        return this.project;
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
    project: string;
    collaborators: PrincipalKey[];

    fromJson(json: CollaborationEventJson): CollaborationServerEventBuilder {
        this.contentId = new ContentId(json.data.contentId);
        this.project = json.data.project;
        this.collaborators = json.data.collaborators.map(PrincipalKey.fromString);

        return this;
    }

    build(): CollaborationServerEvent {
        return new CollaborationServerEvent(this);
    }
}
