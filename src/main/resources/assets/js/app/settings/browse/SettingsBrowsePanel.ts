import {BrowsePanel} from 'lib-admin-ui/app/browse/BrowsePanel';
import {SettingsItemsTreeGrid} from '../grid/SettingsItemsTreeGrid';
import {SettingsBrowseToolbar} from './SettingsBrowseToolbar';
import {SettingsTreeGridActions} from '../grid/SettingsTreeGridActions';
import {SettingsBrowseItemPanel} from './SettingsBrowseItemPanel';
import {BrowseItem} from 'lib-admin-ui/app/browse/BrowseItem';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {ProjectContext} from '../../project/ProjectContext';

export class SettingsBrowsePanel
    extends BrowsePanel<SettingsViewItem> {

    protected treeGrid: SettingsItemsTreeGrid;

    protected initElements(): void {
        super.initElements();

        if (!ProjectContext.get().isInitialized()) {
            this.handleProjectNotSet();
        }
    }

    private handleProjectNotSet() {
        this.treeGrid.disableKeys();

        const projectSetHandler = () => {
            this.treeGrid.enableKeys();
            ProjectContext.get().unProjectChanged(projectSetHandler);
        };

        ProjectContext.get().onProjectChanged(projectSetHandler);
    }

    protected createTreeGrid(): SettingsItemsTreeGrid {
        return new SettingsItemsTreeGrid();
    }

    protected createToolbar(): SettingsBrowseToolbar {
        return new SettingsBrowseToolbar(<SettingsTreeGridActions>this.getBrowseActions());
    }

    protected createBrowseItemPanel(): SettingsBrowseItemPanel {
        return new SettingsBrowseItemPanel();
    }

    dataToBrowseItem(data: SettingsViewItem): BrowseItem<SettingsViewItem> | null {
        return !data ? null : <BrowseItem<SettingsViewItem>>new BrowseItem<SettingsViewItem>(data)
            .setId(data.getId())
            .setDisplayName(data.getDisplayName())
            .setIconClass(`icon-large ${data.getIconClass()}`)
            .setIconUrl(data.getIconUrl());
    }

    hasItemWithId(id: string) {
        return this.treeGrid.hasItemWithId(id);
    }

    addSettingsItem(item: SettingsViewItem) {
        this.treeGrid.appendSettingsItemNode(item);
    }

    updateSettingsItem(item: SettingsViewItem) {
        this.treeGrid.updateNodeByData(item);
    }

    deleteSettingsItem(id: string) {
        this.treeGrid.deleteSettingsItem(id);
    }

    hasItemsLoaded(): boolean {
        return this.treeGrid.getFullTotal() > 1;
    }

    getSelectedItem(): SettingsViewItem {
        const selectedItems: SettingsViewItem[] = this.treeGrid.getSelectedDataList();

        if (selectedItems.length === 1) {
            return selectedItems[0];
        }

        return null;
    }

}
