import {BrowsePanel} from 'lib-admin-ui/app/browse/BrowsePanel';
import {SettingsItemsTreeGrid} from '../grid/SettingsItemsTreeGrid';
import {SettingsBrowseToolbar} from './SettingsBrowseToolbar';
import {SettingsTreeGridActions} from '../grid/SettingsTreeGridActions';
import {SettingsBrowseItemPanel} from './SettingsBrowseItemPanel';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {ProjectContext} from '../../project/ProjectContext';

export class SettingsBrowsePanel
    extends BrowsePanel {

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

    protected initListeners(): void {
        super.initListeners();

        this.treeGrid.onLoaded(this.updateBrowseActions.bind(this));
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

    hasChildren(id: string): boolean {
        const item: SettingsViewItem = this.treeGrid.getItemById(id);

        return !!item && this.treeGrid.hasChildren(item);
    }

    getItemById(id: string): SettingsViewItem {
        return this.treeGrid.getItemById(id);
    }

}
