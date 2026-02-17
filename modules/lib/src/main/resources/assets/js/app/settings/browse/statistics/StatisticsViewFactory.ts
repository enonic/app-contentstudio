import {type SettingsStatisticsView} from './view/SettingsStatisticsView';
import {type SettingsViewItem} from '../../view/SettingsViewItem';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {FolderViewItem} from '../../view/FolderViewItem';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {FolderStatisticsView} from './view/folder/FolderStatisticsView';
import {ProjectStatisticsView} from './view/project/ProjectStatisticsView';

export class StatisticsViewFactory {

    private static INSTANCE: StatisticsViewFactory;

    private folderView: FolderStatisticsView;

    private projectView: ProjectStatisticsView;

    private constructor() {
    }

    static get(): StatisticsViewFactory {
        if (!StatisticsViewFactory.INSTANCE) {
            StatisticsViewFactory.INSTANCE = new StatisticsViewFactory();
        }

        return StatisticsViewFactory.INSTANCE;
    }

    getViewForSettingsItem(item: SettingsViewItem): SettingsStatisticsView<SettingsViewItem> {
        if (ObjectHelper.iFrameSafeInstanceOf(item, ProjectViewItem)) {
            if (!this.projectView) {
                this.projectView = new ProjectStatisticsView();
            }

            return this.projectView;
        }

        if (ObjectHelper.iFrameSafeInstanceOf(item, FolderViewItem)) {
            if (!this.folderView) {
                this.folderView = new FolderStatisticsView();
            }

            return this.folderView;
        }

        return null;
    }
}
