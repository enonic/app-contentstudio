import '../../api.ts';
import {BaseContentModelEvent} from './BaseContentModelEvent';

export class ContentDuplicatePromptEvent
    extends BaseContentModelEvent {

    private yesCallback: () => void;

    private noCallback: () => void;

    setYesCallback(callback: () => void): ContentDuplicatePromptEvent {
        this.yesCallback = callback;
        return this;
    }

    setNoCallback(callback: () => void): ContentDuplicatePromptEvent {
        this.noCallback = callback;
        return this;
    }

    getYesCallback(): () => void {
        return this.yesCallback;
    }

    getNoCallback(): () => void {
        return this.noCallback;
    }

    static on(handler: (event: ContentDuplicatePromptEvent) => void) {
        api.event.Event.bind(api.ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentDuplicatePromptEvent) => void) {
        api.event.Event.unbind(api.ClassHelper.getFullName(this), handler);
    }
}
