import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type UploadItem} from '@enonic/lib-admin-ui/ui/uploader/UploadItem';
import {type Content} from '../content/Content';
import {type ContentSummary} from '../content/ContentSummary';

export class NewMediaUploadEvent
    extends Event {

    private readonly uploadItems: UploadItem<Content>[];

    private readonly parentContent: ContentSummary;

    constructor(items: UploadItem<Content>[], parentContent: ContentSummary) {
        super();
        this.uploadItems = items;
        this.parentContent = parentContent;
    }

    getUploadItems(): UploadItem<Content>[] {
        return this.uploadItems;
    }

    getParentContent(): ContentSummary {
        return this.parentContent;
    }

    static on(handler: (event: NewMediaUploadEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: NewMediaUploadEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
