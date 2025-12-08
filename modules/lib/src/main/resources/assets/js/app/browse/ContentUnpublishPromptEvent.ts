import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {BaseContentModelEvent} from './BaseContentModelEvent';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';

export class ContentUnpublishPromptEvent extends BaseContentModelEvent {

    private yesCallback?: () => void;

    private noCallback?: () => void;

    constructor(model: ContentSummaryAndCompareStatus[]) {
        super(model);
    }

    setYesCallback(callback: () => void): ContentUnpublishPromptEvent {
        this.yesCallback = callback;
        return this;
    }

    setNoCallback(callback: () => void): ContentUnpublishPromptEvent {
        this.noCallback = callback;
        return this;
    }

    getYesCallback(): (() => void) | undefined {
        return this.yesCallback;
    }

    getNoCallback(): (() => void) | undefined {
        return this.noCallback;
    }

    static on(handler: (event: ContentUnpublishPromptEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentUnpublishPromptEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
