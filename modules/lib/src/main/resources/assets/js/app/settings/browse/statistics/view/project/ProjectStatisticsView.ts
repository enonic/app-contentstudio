import {SettingsStatisticsView} from '../SettingsStatisticsView';
import {type ProjectViewItem} from '../../../../view/ProjectViewItem';
import {ProjectStatisticsViewer} from './ProjectStatisticsViewer';
import {ProjectMetaStatisticsBlock} from './ProjectMetaStatisticsBlock';
import {ProjectRolesStatisticsBlock} from './ProjectRolesStatisticsBlock';

export class ProjectStatisticsView extends SettingsStatisticsView<ProjectViewItem> {

    private projectMetaBlock: ProjectMetaStatisticsBlock;

    private projectRolesBlock: ProjectRolesStatisticsBlock;

    constructor() {
        super();

        this.projectMetaBlock = new ProjectMetaStatisticsBlock();
        this.projectRolesBlock = new ProjectRolesStatisticsBlock();
    }

    setItem(item: ProjectViewItem) {
        super.setItem(item);
        this.projectMetaBlock.setItem(item);
        this.projectRolesBlock.setItem(item);
    }

    createViewer(): ProjectStatisticsViewer {
        return new ProjectStatisticsViewer();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.projectMetaBlock);
            this.appendChild(this.projectRolesBlock);
            return rendered;
        });
    }

}
