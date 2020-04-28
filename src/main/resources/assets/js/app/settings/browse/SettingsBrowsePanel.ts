import {BrowsePanel} from 'lib-admin-ui/app/browse/BrowsePanel';
import {SettingsItemsTreeGrid} from '../grid/SettingsItemsTreeGrid';
import {SettingsBrowseToolbar} from './SettingsBrowseToolbar';
import {SettingsTreeGridActions} from '../grid/SettingsTreeGridActions';
import {SettingsBrowseItemPanel} from './SettingsBrowseItemPanel';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {BrowseItem} from 'lib-admin-ui/app/browse/BrowseItem';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {ProjectContext} from '../../project/ProjectContext';
import {ProjectChangedEvent} from '../../project/ProjectChangedEvent';

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
            ProjectChangedEvent.un(projectSetHandler);
        };

        ProjectChangedEvent.on(projectSetHandler);
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

    treeNodeToBrowseItem(node: TreeNode<SettingsViewItem>): BrowseItem<SettingsViewItem> | null {
        const data: SettingsViewItem = node ? node.getData() : null;
        return !data ? null : <BrowseItem<SettingsViewItem>>new BrowseItem<SettingsViewItem>(data)
            .setId(data.getId())
            .setDisplayName(data.getDisplayName())
            .setIconClass(`icon-large ${data.getIconClass()}`)
            .setIconUrl(data.getIconUrl());
    }

    treeNodesToBrowseItems(nodes: TreeNode<SettingsViewItem>[]): BrowseItem<SettingsViewItem>[] {
        let browseItems: BrowseItem<SettingsViewItem>[] = [];

        // do not proceed duplicated content. still, it can be selected
        nodes.forEach((node: TreeNode<SettingsViewItem>) => {
            const item = this.treeNodeToBrowseItem(node);
            if (item) {
                browseItems.push(item);
            }
        });
        return browseItems;
    }

    hasItemWithId(id: string) {
        return this.treeGrid.hasItemWithId(id);
    }

    addSettingsItem(item: SettingsViewItem) {
        this.treeGrid.appendSettingsItemNode(item);
    }

    updateSettingsItem(item: SettingsViewItem) {
        this.treeGrid.updateSettingsItemNode(item);
    }

    deleteSettingsItem(id: string) {
        this.treeGrid.deleteSettingsItemNode(id);
    }

}
