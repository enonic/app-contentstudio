import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {type Application} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationViewer} from '@enonic/lib-admin-ui/application/ApplicationViewer';

export class ProjectApplicationsListBox extends ListBox<Application> {

    constructor() {
        super('project-applications-list-box');
    }

    protected createItemView(item: Application, readOnly: boolean): ApplicationViewer {
        const viewer = new ApplicationViewer();

        viewer.setObject(item);

        return viewer;
    }

    protected getItemId(item: Application): string {
        return item.getId();
    }

}
