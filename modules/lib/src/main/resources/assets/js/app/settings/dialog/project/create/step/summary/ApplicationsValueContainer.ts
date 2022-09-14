import {SummaryValueContainer} from './SummaryValueContainer';
import {ProjectApplication} from '../../../../../wizard/panel/form/element/ProjectApplication';
import {ProjectApplicationViewer} from '../../../../../wizard/panel/form/element/ProjectApplicationViewer';

export class ApplicationsValueContainer
    extends SummaryValueContainer {

    constructor() {
        super('applications-container');
    }

    updateValue(applications: ProjectApplication[]): ApplicationsValueContainer {
        this.removeChildren();

        applications.forEach((application: ProjectApplication) => {
            const viewer: ProjectApplicationViewer = new ProjectApplicationViewer();
            viewer.setObject(application);
            this.appendChild(viewer);
        });

        return this;
    }
}
