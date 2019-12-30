import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {UploadItem} from 'lib-admin-ui/ui/uploader/UploadItem';
import {Content} from '../content/Content';

export class NewMediaUploadEvent
    extends Event {

    private uploadItems: UploadItem<Content>[];

    private parentContent: Content;

    constructor(items: UploadItem<Content>[], parentContent: Content) {
        super();
        this.uploadItems = items;
        this.parentContent = parentContent;
    }

    getUploadItems(): UploadItem<Content>[] {
        return this.uploadItems;
    }

    getParentContent(): Content {
        return this.parentContent;
    }

    static on(handler: (event: NewMediaUploadEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: NewMediaUploadEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
