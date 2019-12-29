import {Event} from 'lib-admin-ui/event/Event';
import {SettingsItem} from '../data/SettingsItem';
import {ClassHelper} from 'lib-admin-ui/ClassHelper';

export class EditSettingsItemEvent
    extends Event {

    private items: SettingsItem[];

    constructor(items: SettingsItem[]) {
        super();

        this.items = items;
    }

    getItems(): SettingsItem[] {
        return this.items;
    }

    static on(handler: (event: EditSettingsItemEvent) => void) {
        Event.bind(ClassHelper.getFullName(this), handler);
    }

    static un(handler?: (event: EditSettingsItemEvent) => void) {
        Event.unbind(ClassHelper.getFullName(this), handler);
    }

}
