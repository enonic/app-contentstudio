import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {BaseContentModelEvent} from './BaseContentModelEvent';

export class ContentDeletePromptEvent extends BaseContentModelEvent {

    private yesCallback: () => void;

    private noCallback: () => void;

    setYesCallback(callback: ()=>void): ContentDeletePromptEvent {
        this.yesCallback = callback;
        return this;
    }

    setNoCallback(callback: () => void): ContentDeletePromptEvent {
        this.noCallback = callback;
        return this;
    }

    getYesCallback(): () => void {
        return this.yesCallback;
    }

    getNoCallback(): () => void {
        return this.noCallback;
    }

    static on(handler: (event: ContentDeletePromptEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentDeletePromptEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
