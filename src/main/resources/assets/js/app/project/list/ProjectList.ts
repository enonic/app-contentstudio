import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {Project} from '../../settings/data/project/Project';
import {ProjectListItem} from './ProjectListItem';

export class ProjectList
    extends ListBox<Project> {

    constructor() {
        super('project-list-items');
    }

    protected createItemView(item: Project, readOnly: boolean): ProjectListItem {
        return new ProjectListItem(item);
    }

    protected getItemId(item: Project): string {
        return item.getName();
    }
}
