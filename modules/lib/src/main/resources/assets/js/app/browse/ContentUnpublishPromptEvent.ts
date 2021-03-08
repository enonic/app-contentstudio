import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {BaseContentModelEvent} from './BaseContentModelEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class ContentUnpublishPromptEvent extends BaseContentModelEvent {

    constructor(model: ContentSummaryAndCompareStatus[]) {
        super(model);
    }

    static on(handler: (event: ContentUnpublishPromptEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentUnpublishPromptEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
