import {Event} from 'lib-admin-ui/event/Event';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';
import {SettingsViewItem} from '../view/SettingsViewItem';

export class EditSettingsItemEvent
    extends Event {

    private items: SettingsViewItem[];

    constructor(items: SettingsViewItem[]) {
        super();

        this.items = items;
    }

    getItems(): SettingsViewItem[] {
        return this.items;
    }

    static on(handler: (event: EditSettingsItemEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EditSettingsItemEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
