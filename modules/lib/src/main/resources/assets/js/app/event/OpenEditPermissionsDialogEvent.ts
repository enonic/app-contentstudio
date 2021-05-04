import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {Content} from '../content/Content';
import {AccessControlList} from '../access/AccessControlList';
import {ContentId} from '../content/ContentId';

export class OpenEditPermissionsDialogEvent
    extends Event {

    private contentId: ContentId;

    private contentPath: ContentPath;

    private displayName: string;

    private permissions: AccessControlList;

    private inheritPermissions: boolean;

    private overwritePermissions: boolean;

    constructor(builder: Builder) {
        super();
        this.contentId = builder.contentId;
        this.contentPath = builder.contentPath;
        this.displayName = builder.displayName;
        this.permissions = builder.permissions;
        this.inheritPermissions = builder.inheritPermissions;
        this.overwritePermissions = builder.overwritePermissions;
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

    public isInheritPermissions(): boolean {
        return this.inheritPermissions;
    }

    public isOverwritePermissions(): boolean {
        return this.overwritePermissions;
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

    inheritPermissions: boolean = true;

    overwritePermissions: boolean = false;

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

    public setInheritPermissions(value: boolean): Builder {
        this.inheritPermissions = value;
        return this;
    }

    public setOverwritePermissions(value: boolean): Builder {
        this.overwritePermissions = value;
        return this;
    }

    public applyContent(content: Content): Builder {
        this.contentId = content.getContentId();
        this.contentPath = content.getPath();
        this.displayName = content.getDisplayName();
        this.permissions = content.getPermissions();
        this.inheritPermissions = content.isInheritPermissionsEnabled();
        return this;
    }

    public build(): OpenEditPermissionsDialogEvent {
        return new OpenEditPermissionsDialogEvent(this);
    }
}
