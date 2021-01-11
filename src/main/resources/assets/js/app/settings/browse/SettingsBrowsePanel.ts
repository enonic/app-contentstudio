import {BrowsePanel} from 'lib-admin-ui/app/browse/BrowsePanel';
import {SettingsItemsTreeGrid} from '../grid/SettingsItemsTreeGrid';
import {SettingsBrowseToolbar} from './SettingsBrowseToolbar';
import {SettingsTreeGridActions} from '../grid/SettingsTreeGridActions';
import {SettingsBrowseItemPanel} from './SettingsBrowseItemPanel';
import {BrowseItem} from 'lib-admin-ui/app/browse/BrowseItem';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {ProjectContext} from '../../project/ProjectContext';
import {DataChangedEvent, DataChangedType} from 'lib-admin-ui/ui/treegrid/DataChangedEvent';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';

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

    protected initListeners(): void {
        super.initListeners();

        this.treeGrid.onDataChanged(this.handleTreeGridDataChanged.bind(this));
        this.treeGrid.onLoaded(this.refreshTreeGridActions.bind(this));
    }

    private handleTreeGridDataChanged(event: DataChangedEvent<SettingsViewItem>) {
        this.refreshTreeGridActions();
        const previewItemId: string = this.getBrowseItemPanel().getStatisticsItem()?.getModel().getId();

        if (!previewItemId || event.getType() !== DataChangedType.UPDATED) {
            return;
        }

        const updatePreviewItemData: SettingsViewItem = event.getTreeNodes().map(
            (node: TreeNode<SettingsViewItem>) => node.getData()).find(
            (item: SettingsViewItem) => item.getId() === previewItemId);

        if (updatePreviewItemData) {
            this.getBrowseItemPanel().togglePreviewForItem(this.dataToBrowseItem(updatePreviewItemData));
        }
    }

    private refreshTreeGridActions() {
        this.getBrowseActions()
            .updateActionsEnabledState(this.dataItemsToBrowseItems(this.getSelectedOrHighlightedItems()));
    }

    private getSelectedOrHighlightedItems(): SettingsViewItem[] {
        if (this.treeGrid.hasSelectedItems()) {
            return this.treeGrid.getSelectedDataList();
        }

        if (this.treeGrid.hasHighlightedNode()) {
            return [this.treeGrid.getHighlightedItem()];
        }

        return [];
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

    hasChildren(id: string): boolean {
        const item: SettingsViewItem = this.treeGrid.getItemById(id);

        return !!item && this.treeGrid.hasChildren(item);
    }

    getItemById(id: string): SettingsViewItem {
        return this.treeGrid.getItemById(id);
    }

}
