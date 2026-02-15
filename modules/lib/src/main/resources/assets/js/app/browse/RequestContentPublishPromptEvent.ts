import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {BaseContentModelEvent} from './BaseContentModelEvent';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class RequestContentPublishPromptEvent
    extends BaseContentModelEvent {

    private includeChildItems: boolean;

    constructor(model: ContentSummaryAndCompareStatus[], includeChildItems: boolean = false) {
        super(model);
        this.includeChildItems = includeChildItems;
    }

    isIncludeChildItems(): boolean {
        return this.includeChildItems;
    }

    static on(handler: (event: RequestContentPublishPromptEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: RequestContentPublishPromptEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
