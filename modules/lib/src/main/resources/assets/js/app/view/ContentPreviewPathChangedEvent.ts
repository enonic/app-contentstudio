import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';

export class ContentPreviewPathChangedEvent
    extends IframeEvent {

    private previewPath: string;

    constructor(previewPath: string) {
        super();
        this.previewPath = previewPath;
    }

    getPreviewPath() {
        return this.previewPath;
    }

    static on(handler: (event: ContentPreviewPathChangedEvent) => void, contextWindow: Window = window) {
        IframeEvent.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: ContentPreviewPathChangedEvent) => void, contextWindow: Window = window) {
        IframeEvent.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
