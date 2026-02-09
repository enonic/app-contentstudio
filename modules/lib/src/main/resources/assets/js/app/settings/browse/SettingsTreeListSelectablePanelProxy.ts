import {SelectableListBoxPanel} from '@enonic/lib-admin-ui/ui/panel/SelectableListBoxPanel';
import {ListBoxToolbar} from '@enonic/lib-admin-ui/ui/selector/list/ListBoxToolbar';
import {SelectableListBoxWrapper, SelectionMode} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {DataChangedEvent} from '@enonic/lib-admin-ui/ui/treegrid/DataChangedEvent';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import Q from 'q';
import {SettingsTreeListElement} from '../../../v6/features/views/browse/settings/SettingsTreeListElement';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {getSettingsItem, $settingsTreeState} from '../../../v6/features/store/settings-tree.store';
import {getCurrentItems as getCurrentSettingsItems} from '../../../v6/features/store/settingsTreeSelection.store';
import {SettingsTreeListToolbarElement} from '../../../v6/features/views/browse/settings/SettingsTreeListToolbar';

export class SettingsTreeListSelectablePanelProxy extends SelectableListBoxPanel<SettingsViewItem> {
    private readonly settingsTreeList: SettingsTreeListElement;
    private readonly toolbar: SettingsTreeListToolbarElement;

    constructor(
        listBoxWrapper: SelectableListBoxWrapper<SettingsViewItem>,
        settingsTreeList: SettingsTreeListElement,
        toolbar: ListBoxToolbar<SettingsViewItem>
    ) {
        super(listBoxWrapper, toolbar);
        this.settingsTreeList = settingsTreeList;
        this.toolbar = new SettingsTreeListToolbarElement();
    }

    onDataChanged(listener: (event: DataChangedEvent<SettingsViewItem>) => void): void {
        this.listBoxWrapper.onDataChanged(listener);
    }

    onSelectionChanged(listener: (selectionChange: SelectionChange<SettingsViewItem>) => void): void {
        this.settingsTreeList.onSelectionChanged(listener);
    }

    getSelectedItems(): SettingsViewItem[] {
        return [...getCurrentSettingsItems()];
    }

    getLastSelectedItem(): SettingsViewItem | undefined {
        return this.getSelectedItems().at(-1);
    }

    getSelectionMode(): SelectionMode {
        return SelectionMode.SELECT;
    }

    doRender(): Q.Promise<boolean> {
        this.addClass('selectable-list-box-panel flex flex-col');

        this.appendChild(this.toolbar);
        this.appendChild(this.settingsTreeList);

        return Q(true);
    }

    getItem(id: string): SettingsViewItem | undefined {
        return getSettingsItem(id);
    }

    getWrapper(): SelectableListBoxWrapper<SettingsViewItem> {
        return this.listBoxWrapper;
    }

    getToolbar(): ListBoxToolbar<SettingsViewItem> {
        return this.listToolbar;
    }

    getTotalItems(): number {
        return $settingsTreeState.get().nodes.size;
    }
}
