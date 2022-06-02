import {ProjectAccess} from '../../../../access/ProjectAccess';
import {TabMenu} from '@enonic/lib-admin-ui/ui/tab/TabMenu';
import {TabMenuItem, TabMenuItemBuilder} from '@enonic/lib-admin-ui/ui/tab/TabMenuItem';
import {NavigatorEvent} from '@enonic/lib-admin-ui/ui/NavigatorEvent';
import {ProjectAccessValueChangedEvent} from '../../../../event/ProjectAccessValueChangedEvent';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class ProjectAccessSelector
    extends TabMenu {

    private options: ProjectAccess[] = [ProjectAccess.CONTRIBUTOR, ProjectAccess.AUTHOR, ProjectAccess.EDITOR, ProjectAccess.OWNER];
    private value: ProjectAccess;
    private valueChangedListeners: { (event: ProjectAccessValueChangedEvent): void }[] = [];

    constructor() {
        super('access-selector');

        this.options.forEach((option: ProjectAccess) => {
            const menuItem: TabMenuItem = new TabMenuItemBuilder().setLabel(i18n(`settings.projects.access.${option}`)).build();
            this.addNavigationItem(menuItem);
        });

        this.onNavigationItemSelected((event: NavigatorEvent) => {
            const item: TabMenuItem = <TabMenuItem>event.getItem();
            this.setValue(this.options[item.getIndex()]);
        });

    }

    getValue(): ProjectAccess {
        return this.value;
    }

    setValue(value: ProjectAccess, silent?: boolean) {
        this.selectNavigationItem(this.options.indexOf(value));

        if (!silent) {
            this.notifyValueChanged(new ProjectAccessValueChangedEvent(this.value, value));
        }

        this.value = value;
    }

    onValueChanged(listener: (event: ProjectAccessValueChangedEvent) => void) {
        this.valueChangedListeners.push(listener);
    }

    unValueChanged(listener: (event: ProjectAccessValueChangedEvent) => void) {
        this.valueChangedListeners = this.valueChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyValueChanged(event: ProjectAccessValueChangedEvent) {
        this.valueChangedListeners.forEach((listener) => {
            listener(event);
        });
    }

}
