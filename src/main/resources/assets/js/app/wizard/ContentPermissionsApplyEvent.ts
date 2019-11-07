import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {AccessControlList} from '../access/AccessControlList';

export class ContentPermissionsApplyEvent
    extends Event {

    private contentId: ContentId;

    private permissions: AccessControlList;

    private inheritPermissions: boolean;

    private overwritePermissions: boolean;

    constructor(builder: Builder) {
        super();
        this.contentId = builder.contentId;
        this.permissions = builder.permissions;
        this.inheritPermissions = builder.inheritPermissions;
        this.overwritePermissions = builder.overwritePermissions;
    }

    getContentId(): ContentId {
        return this.contentId;
    }

    getPermissions(): AccessControlList {
        return this.permissions;
    }

    isInheritPermissions(): boolean {
        return this.inheritPermissions;
    }

    isOverwritePermissions(): boolean {
        return this.overwritePermissions;
    }

    static create(): Builder {
        return new Builder();
    }

    static on(handler: (event: ContentPermissionsApplyEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ContentPermissionsApplyEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }

}
class Builder {

    contentId: ContentId;

    permissions: AccessControlList = null;

    inheritPermissions: boolean = true;

    overwritePermissions: boolean = false;

    public setContentId(value: ContentId): Builder {
        this.contentId = value;
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

    public build(): ContentPermissionsApplyEvent {
        return new ContentPermissionsApplyEvent(this);
    }
}
