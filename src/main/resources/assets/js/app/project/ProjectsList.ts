import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {ProjectItem} from '../settings/data/ProjectItem';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ProjectItemViewer} from '../settings/data/viewer/ProjectItemViewer';
import * as Q from 'q';

export class ProjectsList
    extends ListBox<ProjectItem> {

    constructor() {
        super('projects-list-items');
    }

    protected createItemView(item: ProjectItem, readOnly: boolean): ProjectsListItem {
        return new ProjectsListItem(item);
    }

    protected getItemId(item: ProjectItem): string {
        return item.getId();
    }
}

export class ProjectsListItem
    extends DivEl {

    private projectViewer: ProjectItemViewer;

    protected project: ProjectItem;

    constructor(project: ProjectItem) {
        super('projects-list-item');

        this.project = project;

        this.initElements();
    }

    protected initElements() {
        this.projectViewer = new ProjectItemViewer();
        this.projectViewer.setObject(this.project);
    }

    getProject(): ProjectItem {
        return this.project;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.projectViewer);

            return rendered;
        });
    }

}
