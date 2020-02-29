import {ValueChangedEvent} from 'lib-admin-ui/ValueChangedEvent';
import {ProjectAccess} from '../access/ProjectAccess';
import {TabMenu} from 'lib-admin-ui/ui/tab/TabMenu';
import {TabMenuItem, TabMenuItemBuilder} from 'lib-admin-ui/ui/tab/TabMenuItem';
import {NavigatorEvent} from 'lib-admin-ui/ui/NavigatorEvent';

interface ProjectAccessSelectorOption {
    value: ProjectAccess;
    name: string;
}

export class ProjectAccessSelector
    extends TabMenu {

    private static OPTIONS: ProjectAccessSelectorOption[] = [
        {value: ProjectAccess.CONTRIBUTOR, name: 'Contributor'},
        {value: ProjectAccess.EXPERT, name: 'Expert'},
        {value: ProjectAccess.OWNER, name: 'Owner'}
    ];

    private value: ProjectAccess;
    private valueChangedListeners: { (event: ValueChangedEvent): void }[] = [];

    constructor() {
        super('access-selector');

        ProjectAccessSelector.OPTIONS.forEach((option: ProjectAccessSelectorOption) => {
            let menuItem = (<TabMenuItemBuilder>new TabMenuItemBuilder().setLabel(option.name)).build();
            this.addNavigationItem(menuItem);
        });

        this.onNavigationItemSelected((event: NavigatorEvent) => {
            let item: TabMenuItem = <TabMenuItem> event.getItem();
            this.setValue(ProjectAccessSelector.OPTIONS[item.getIndex()].value);
        });

    }

    getValue(): ProjectAccess {
        return this.value;
    }

    setValue(value: ProjectAccess, silent?: boolean): ProjectAccessSelector {
        let option = this.findOptionByValue(value);
        if (option) {
            this.selectNavigationItem(ProjectAccessSelector.OPTIONS.indexOf(option));
            if (!silent) {
                this.notifyValueChanged(new ValueChangedEvent(ProjectAccess[this.value], ProjectAccess[value]));
            }
            this.value = value;
        }
        return this;
    }

    private findOptionByValue(value: ProjectAccess): ProjectAccessSelectorOption {
        for (let i = 0; i < ProjectAccessSelector.OPTIONS.length; i++) {
            let option = ProjectAccessSelector.OPTIONS[i];
            if (option.value === value) {
                return option;
            }
        }
        return undefined;
    }

    onValueChanged(listener: (event: ValueChangedEvent) => void) {
        this.valueChangedListeners.push(listener);
    }

    unValueChanged(listener: (event: ValueChangedEvent) => void) {
        this.valueChangedListeners = this.valueChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyValueChanged(event: ValueChangedEvent) {
        this.valueChangedListeners.forEach((listener) => {
            listener(event);
        });
    }

}
