import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Content} from '../content/Content';
import {AccessControlList} from '../access/AccessControlList';
import {ContentId} from '../content/ContentId';
import {ContentPath} from '../content/ContentPath';

export class OpenEditPermissionsDialogEvent
    extends Event {

    private readonly contentId: ContentId;

    private readonly contentPath: ContentPath;

    private readonly displayName: string;

    private readonly permissions: AccessControlList;

    constructor(builder: Builder) {
        super();
        this.contentId = builder.contentId;
        this.contentPath = builder.contentPath;
        this.displayName = builder.displayName;
        this.permissions = builder.permissions;
    }

    public getContentId(): ContentId {
        return this.contentId;
    }

    public getContentPath(): ContentPath {
        return this.contentPath;
    }

    public getDisplayName(): string {
        return this.displayName;
    }

    public getPermissions(): AccessControlList {
        return this.permissions;
    }

    public static create(): Builder {
        return new Builder();
    }

    static on(handler: (event: OpenEditPermissionsDialogEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: OpenEditPermissionsDialogEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}

export class Builder {

    contentId: ContentId;

    contentPath: ContentPath;

    displayName: string;

    permissions: AccessControlList = null;

    public setContentId(value: ContentId): Builder {
        this.contentId = value;
        return this;
    }

    public setContentPath(value: ContentPath): Builder {
        this.contentPath = value;
        return this;
    }

    public setDisplayName(value: string): Builder {
        this.displayName = value;
        return this;
    }

    public setPermissions(value: AccessControlList): Builder {
        this.permissions = value;
        return this;
    }

    public applyContent(content: Content): Builder {
        this.contentId = content.getContentId();
        this.contentPath = content.getPath();
        this.displayName = content.getDisplayName();
        this.permissions = content.getPermissions();
        return this;
    }

    public build(): OpenEditPermissionsDialogEvent {
        return new OpenEditPermissionsDialogEvent(this);
    }
}
