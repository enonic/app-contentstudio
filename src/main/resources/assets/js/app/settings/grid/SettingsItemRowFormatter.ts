import {TreeNode} from 'lib-admin-ui/ui/treegrid/TreeNode';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {FolderItemViewer} from '../browse/viewer/FolderItemViewer';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {ProjectViewItem} from '../view/ProjectViewItem';
import {FolderViewItem} from '../view/FolderViewItem';
import {ProjectViewer} from '../wizard/viewer/ProjectViewer';
import {Viewer} from 'lib-admin-ui/ui/Viewer';

export class SettingsItemRowFormatter {

    public static nameFormatter({}: any, {}: any, {}: any, {}: any, dataContext: TreeNode<SettingsViewItem>) {
        let viewer = <any>dataContext.getViewer('displayName');

        if (!viewer) {
            viewer = SettingsItemRowFormatter.getViewerForSettingsItem(dataContext.getData());
            dataContext.setViewer('displayName', viewer);
        }

        return viewer.toString();
    }

    private static getViewerForSettingsItem(item: SettingsViewItem): Viewer<any> {
        if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem)) {
            const viewer: ProjectViewer = new ProjectViewer();
            viewer.setObject((<ProjectViewItem>item).getData());
            return viewer;
        }

        if (ObjectHelper.iFrameSafeInstanceOf(item, FolderViewItem)) {
            const viewer: FolderItemViewer = new FolderItemViewer();
            viewer.setObject(item);
            return viewer;
        }

        return null;
    }
}
