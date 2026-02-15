import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {type ContentId} from '../content/ContentId';

export class MaskContentWizardPanelEvent
    extends Event {

    private readonly contentId: ContentId;

    private readonly mask: boolean;

    constructor(contentId: ContentId, mask: boolean = true) {
        super();

        this.contentId = contentId;
        this.mask = mask;
    }

    static on(handler: (event: MaskContentWizardPanelEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: MaskContentWizardPanelEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

    isMask(): boolean {
        return this.mask;
    }

    getContentId(): ContentId {
        return this.contentId;
    }
}
