import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';

export class SettingsItemsTreeGridHighlightEvent
    extends Event {

    private highlightedItem: any;

    constructor(highlightedItem?: any) {
        super();

        this.highlightedItem = highlightedItem;
    }

    getHighlightedItem(): any {
        return this.highlightedItem;
    }

    static on(handler: (event: SettingsItemsTreeGridHighlightEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SettingsItemsTreeGridHighlightEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
