import {ProjectAccess} from '../../../../access/ProjectAccess';
import {TabMenu} from 'lib-admin-ui/ui/tab/TabMenu';
import {TabMenuItem, TabMenuItemBuilder} from 'lib-admin-ui/ui/tab/TabMenuItem';
import {NavigatorEvent} from 'lib-admin-ui/ui/NavigatorEvent';
import {ProjectAccessValueChangedEvent} from '../../../../event/ProjectAccessValueChangedEvent';
import {i18n} from 'lib-admin-ui/util/Messages';

interface ProjectAccessSelectorOption {
    value: ProjectAccess;
    label: string;
}

export class ProjectAccessSelector
    extends TabMenu {

    private static OPTIONS: ProjectAccessSelectorOption[] = [
        {value: ProjectAccess.CONTRIBUTOR, label: i18n('settings.projects.access.contributor')},
        {value: ProjectAccess.AUTHOR, label: i18n('settings.projects.access.author')},
        {value: ProjectAccess.EDITOR, label: i18n('settings.projects.access.editor')},
        {value: ProjectAccess.OWNER, label: i18n('settings.projects.access.owner')}
    ];

    private value: ProjectAccess;
    private valueChangedListeners: { (event: ProjectAccessValueChangedEvent): void }[] = [];

    constructor() {
        super('access-selector');

        ProjectAccessSelector.OPTIONS.forEach((option: ProjectAccessSelectorOption) => {
            const menuItem: TabMenuItem = new TabMenuItemBuilder().setLabel(option.label).build();
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
                this.notifyValueChanged(new ProjectAccessValueChangedEvent(this.value, value));
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
