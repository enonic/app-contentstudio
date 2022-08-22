import {BaseLoader} from '@enonic/lib-admin-ui/util/loader/BaseLoader';
import {ProjectApplication} from '../../wizard/panel/form/element/ProjectApplication';
import {ProjectApplicationsListRequest} from './ProjectApplicationsListRequest';

export class ProjectApplicationsLoader
    extends BaseLoader<ProjectApplication> {

    protected createRequest(): ProjectApplicationsListRequest {
        return new ProjectApplicationsListRequest();
    }

    filterFn(item: ProjectApplication): boolean {
        const searchString: string = this.getSearchString().toLowerCase();

        return item.getDisplayName()?.indexOf(searchString) > -1 ||
               item.getDescription()?.toLowerCase().indexOf(searchString) > -1 ||
               item.getName()?.toLowerCase().indexOf(searchString) > -1;
    }
}
