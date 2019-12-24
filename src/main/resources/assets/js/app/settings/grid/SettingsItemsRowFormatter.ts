import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {SettingsTreeGridItemViewer} from './SettingsTreeGridItemViewer';
import {SettingsItem} from '../SettingsItem';
import {ProjectTreeGridItemViewer} from './ProjectTreeGridItemViewer';

export class SettingsItemsRowFormatter {

    public static nameFormatter({}: any, {}: any, {}: any, {}: any, dataContext: TreeNode<SettingsItem>) {
        let viewer = <SettingsTreeGridItemViewer>dataContext.getViewer('displayName');
        if (!viewer) {
            viewer = SettingsItemsRowFormatter.getViewerForSettingsItem(dataContext.getData());
            viewer.setObject(dataContext.getData(), dataContext.calcLevel() > 1);
            dataContext.setViewer('displayName', viewer);
        }
        return viewer.toString();
    }

    private static getViewerForSettingsItem(item: SettingsItem): SettingsTreeGridItemViewer {
        return item.getId() === 'projects' ? new SettingsTreeGridItemViewer() : new ProjectTreeGridItemViewer();
    }

}
