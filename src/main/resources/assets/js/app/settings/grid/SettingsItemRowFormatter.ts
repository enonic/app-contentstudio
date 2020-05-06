import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {SettingsItemViewer} from '../browse/viewer/SettingsItemViewer';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ProjectItemViewer} from '../browse/viewer/ProjectItemViewer';
import {FolderItemViewer} from '../browse/viewer/FolderItemViewer';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {ProjectViewItem} from '../view/ProjectViewItem';
import {FolderViewItem} from '../view/FolderViewItem';

export class SettingsItemRowFormatter {

    public static nameFormatter({}: any, {}: any, {}: any, {}: any, dataContext: TreeNode<SettingsViewItem>) {
        let viewer = <SettingsItemViewer>dataContext.getViewer('displayName');

        if (!viewer) {
            viewer = SettingsItemRowFormatter.getViewerForSettingsItem(dataContext.getData());
            viewer.setObject(dataContext.getData());
            dataContext.setViewer('displayName', viewer);
        }
        return viewer.toString();
    }

    private static getViewerForSettingsItem(item: SettingsViewItem): SettingsItemViewer {
        if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem)) {
            return new ProjectItemViewer();
        }

        if (ObjectHelper.iFrameSafeInstanceOf(item, FolderViewItem)) {
            return new FolderItemViewer();
        }

        return null;
    }
}
