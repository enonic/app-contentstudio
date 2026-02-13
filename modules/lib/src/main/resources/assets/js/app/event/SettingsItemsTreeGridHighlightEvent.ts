import {ClassHelper} from '@enonic/lib-admin-ui/ClassHelper';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {type SettingsViewItem} from '../settings/view/SettingsViewItem';

export class SettingsItemsTreeGridHighlightEvent
    extends Event {

    private readonly highlightedItem: SettingsViewItem;

    constructor(highlightedItem?: SettingsViewItem) {
        super();

        this.highlightedItem = highlightedItem;
    }

    getHighlightedItem(): SettingsViewItem {
        return this.highlightedItem;
    }

    static on(handler: (event: SettingsItemsTreeGridHighlightEvent) => void, contextWindow: Window = window) {
        Event.bind(ClassHelper.getFullName(this), handler, contextWindow);
    }

    static un(handler?: (event: SettingsItemsTreeGridHighlightEvent) => void, contextWindow: Window = window) {
        Event.unbind(ClassHelper.getFullName(this), handler, contextWindow);
    }
}
