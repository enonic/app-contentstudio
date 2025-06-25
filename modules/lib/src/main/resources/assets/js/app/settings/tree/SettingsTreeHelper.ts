import {SettingsViewItem} from '../view/SettingsViewItem';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {FolderViewItem} from '../view/FolderViewItem';
import {$projects} from '../../../v6/features/store/projects.store';
import {Project} from '../data/project/Project';

export class SettingsTreeHelper {

    public static hasChildren(item: SettingsViewItem): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(item, FolderViewItem) ||
               $projects.get().projects.some((project: Project) => project.hasMainParentByName(item.getId()));
    }
}
