import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {ProjectItem} from '../settings/data/ProjectItem';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import * as Q from 'q';
import {SettingsItem} from '../settings/data/SettingsItem';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';

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

    private projectViewer: ProjectsListItemViewer;

    protected project: ProjectItem;

    constructor(project: ProjectItem) {
        super('projects-list-item');

        this.project = project;

        this.initElements();
    }

    protected initElements() {
        this.projectViewer = new ProjectsListItemViewer('project-viewer');
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

class ProjectsListItemViewer
    extends NamesAndIconViewer<SettingsItem> {

    resolveDisplayName(item: SettingsItem): string {
        return item.getDisplayName();
    }

    resolveUnnamedDisplayName(object: SettingsItem): string {
        return '';
    }

    resolveSubName(item: SettingsItem, relativePath: boolean = false): string {
        return item.getId();
    }

    resolveIconClass(item: SettingsItem): string {
        return `icon-large ${item.getIconClass()}`;
    }
}
