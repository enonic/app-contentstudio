import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {TreeNode} from '@enonic/lib-admin-ui/ui/treegrid/TreeNode';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {FolderItemViewer} from '../browse/viewer/FolderItemViewer';
import {Project} from '../data/project/Project';
import {FolderViewItem} from '../view/FolderViewItem';
import {ProjectViewItem} from '../view/ProjectViewItem';
import {SettingsViewItem} from '../view/SettingsViewItem';
import {ProjectViewer} from '../wizard/viewer/ProjectViewer';

export class SettingsItemRowFormatter {

    public static nameFormatter(_row: number, _cell: number, value: number, _columnDef: object,
                                dataContext: TreeNode<SettingsViewItem>): string {
        const viewer = SettingsItemRowFormatter.getViewerForSettingsItem(dataContext).toString();
        return viewer ? viewer.toString() : '';
    }

    private static getViewerForSettingsItem(dataContext: TreeNode<SettingsViewItem>): Viewer<any> | null {
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
