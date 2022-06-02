import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {FolderItemViewer} from '../browse/viewer/FolderItemViewer';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {ProjectViewItem} from '../view/ProjectViewItem';
import {FolderViewItem} from '../view/FolderViewItem';
import {ProjectViewer} from '../wizard/viewer/ProjectViewer';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {Project} from '../data/project/Project';

export class SettingsItemRowFormatter {

    public static nameFormatter({}: any, {}: any, {}: any, {}: any, dataContext: TreeNode<SettingsViewItem>) {
        return SettingsItemRowFormatter.getViewerForSettingsItem(dataContext).toString();
    }

    private static getViewerForSettingsItem(dataContext: TreeNode<SettingsViewItem>): Viewer<any> {
        if (ObjectHelper.iFrameSafeInstanceOf(dataContext.getData(), ProjectViewItem)) {
            const viewer: Viewer<Project> = dataContext.getViewer('displayName') || new ProjectViewer();
            viewer.setObject((<ProjectViewItem>dataContext.getData()).getData());
            return viewer;
        }

        if (ObjectHelper.iFrameSafeInstanceOf(dataContext.getData(), FolderViewItem)) {
            const viewer: Viewer<SettingsViewItem> = dataContext.getViewer('displayName') || new FolderItemViewer();
            viewer.setObject(dataContext.getData());
            return viewer;
        }

        return null;
    }
}
