import {Project} from '../../settings/data/project/Project';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {ProjectViewer} from '../../settings/wizard/viewer/ProjectViewer';
import {ProjectHelper} from '../../settings/data/project/ProjectHelper';

export class ProjectListItem
    extends AEl {

    private projectViewer: ProjectViewer;

    constructor(project: Project) {
        super('project-list-item');

        this.projectViewer = new ProjectViewer();
        this.projectViewer.setObject(project);
        this.projectViewer.removeTabbable();
    }

    getProject(): Project {
        return this.projectViewer.getObject();
    }

    isSelectable(): boolean {
        return ProjectHelper.isAvailable(this.getProject());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.projectViewer);
            this.toggleClass('selectable', this.isSelectable());

            return rendered;
        });
    }
}
