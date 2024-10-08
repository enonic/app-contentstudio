import {SettingsViewItem} from '../view/SettingsViewItem';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {FolderViewItem} from '../view/FolderViewItem';
import {Projects} from '../resource/Projects';
import {Project} from '../data/project/Project';

export class SettingsTreeHelper {

    public static hasChildren(item: SettingsViewItem): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(item, FolderViewItem) ||
               Projects.get().getProjects().some((project: Project) => project.hasMainParentByName(item.getId()));
    }
}
