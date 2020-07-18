import {Project} from '../../settings/data/project/Project';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {ProjectViewer} from '../../settings/wizard/viewer/ProjectViewer';

export class ProjectListItem
    extends AEl {

    private projectViewer: ProjectViewer;

    constructor(project: Project) {
        super('project-list-item');

        this.projectViewer = new ProjectViewer();
        this.projectViewer.setObject(project);
    }

    getProject(): Project {
        return this.projectViewer.getObject();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.projectViewer);

            return rendered;
        });
    }
}
