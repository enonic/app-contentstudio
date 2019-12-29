import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {SettingsItem} from '../data/SettingsItem';
import {SettingsItemViewer} from '../data/viewer/SettingsItemViewer';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ProjectItem} from '../data/ProjectItem';
import {ProjectItemViewer} from '../data/viewer/ProjectItemViewer';

export class SettingsItemsRowFormatter {

    public static nameFormatter({}: any, {}: any, {}: any, {}: any, dataContext: TreeNode<SettingsItem>) {
        let viewer = <SettingsItemViewer>dataContext.getViewer('displayName');
        if (!viewer) {
            viewer = SettingsItemsRowFormatter.getViewerForSettingsItem(dataContext.getData());
            viewer.setObject(dataContext.getData(), dataContext.calcLevel() > 1);
            dataContext.setViewer('displayName', viewer);
        }
        return viewer.toString();
    }

    private static getViewerForSettingsItem(item: SettingsItem): SettingsItemViewer {
        if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectItem)) {
            return new ProjectItemViewer();
        }

        return new SettingsItemViewer();
    }

}
