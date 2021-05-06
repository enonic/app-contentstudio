import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {ContentId} from '../content/ContentId';

export class ActiveContentVersionSetEvent
    extends Event {

    private contentId: ContentId;
    private versionId: string;

    constructor(contentId: ContentId, versionId: string) {
        super();
        this.contentId = contentId;
        this.versionId = versionId;
    }

    getContentId(): ContentId {
        return this.contentId;
    }

    getVersionId(): string {
        return this.versionId;
    }

    static on(handler: (event: ActiveContentVersionSetEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ActiveContentVersionSetEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
