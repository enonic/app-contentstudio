import {SummaryValueContainer} from './SummaryValueContainer';
import {ProjectApplicationViewer} from '../../../../../wizard/panel/form/element/ProjectApplicationViewer';
import {type ProjectApplication} from '../../../../../wizard/panel/form/element/ProjectApplication';

export class ApplicationsValueContainer
    extends SummaryValueContainer {

    constructor() {
        super('applications-container');
    }

    updateValue(applications: ProjectApplication[]): ApplicationsValueContainer {
        this.removeChildren();

        applications.forEach((projectApplication: ProjectApplication) => {
            const viewer: ProjectApplicationViewer = new ProjectApplicationViewer();
            viewer.setObject(projectApplication.getApplication());
            this.appendChild(viewer);
        });

        return this;
    }
}
