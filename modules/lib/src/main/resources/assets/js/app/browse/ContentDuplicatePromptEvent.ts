import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {BaseContentModelEvent} from './BaseContentModelEvent';

export class ContentDuplicatePromptEvent
    extends BaseContentModelEvent {

    private yesCallback: () => void;

    private noCallback: () => void;

    private openTabAfterDuplicate: boolean;

    setYesCallback(callback: () => void): ContentDuplicatePromptEvent {
        this.yesCallback = callback;
        return this;
    }

    setNoCallback(callback: () => void): ContentDuplicatePromptEvent {
        this.noCallback = callback;
        return this;
    }

    setOpenActionAfterDuplicate(value: boolean): ContentDuplicatePromptEvent {
        this.openTabAfterDuplicate = value;
        return this;
    }

    getYesCallback(): () => void {
        return this.yesCallback;
    }

    getNoCallback(): () => void {
        return this.noCallback;
    }

    getOpenActionAfterDuplicate(): boolean {
        return this.openTabAfterDuplicate;
    }

    static on(handler: (event: ContentDuplicatePromptEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: ContentDuplicatePromptEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }
}
