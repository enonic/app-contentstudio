import {BrowsePanel} from 'lib-admin-ui/app/browse/BrowsePanel';
import {SettingsItemsTreeGrid} from '../grid/SettingsItemsTreeGrid';
import {SettingsBrowseToolbar} from './SettingsBrowseToolbar';
import {SettingsTreeGridActions} from '../grid/SettingsTreeGridActions';
import {SettingsBrowseItemPanel} from './SettingsBrowseItemPanel';
import {SettingsItem} from '../SettingsItem';
import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {BrowseItem} from 'lib-admin-ui/app/browse/BrowseItem';

export class SettingsBrowsePanel
    extends BrowsePanel<SettingsItem> {

    constructor() {
        super();
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

    treeNodeToBrowseItem(node: TreeNode<SettingsItem>): BrowseItem<SettingsItem> | null {
        const data: SettingsItem = node ? node.getData() : null;
        return !data ? null : <BrowseItem<SettingsItem>>new BrowseItem<SettingsItem>(data)
            .setId(data.getId())
            .setDisplayName(data.getDisplayName())
            .setIconClass(`icon-large ${data.getIconClass()}`);
    }

    treeNodesToBrowseItems(nodes: TreeNode<SettingsItem>[]): BrowseItem<SettingsItem>[] {
        let browseItems: BrowseItem<SettingsItem>[] = [];

        // do not proceed duplicated content. still, it can be selected
        nodes.forEach((node: TreeNode<SettingsItem>) => {
            const item = this.treeNodeToBrowseItem(node);
            if (item) {
                browseItems.push(item);
            }
        });
        return browseItems;
    }

}
