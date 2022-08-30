import {BaseLoader} from '@enonic/lib-admin-ui/util/loader/BaseLoader';
import {ProjectApplication} from '../../wizard/panel/form/element/ProjectApplication';
import {ProjectApplicationsListRequest} from './ProjectApplicationsListRequest';
import Q from 'q';

export class ProjectApplicationsLoader
    extends BaseLoader<ProjectApplication> {

    protected createRequest(): ProjectApplicationsListRequest {
        return new ProjectApplicationsListRequest();
    }

    search(searchString: string): Q.Promise<ProjectApplication[]> {
        return super.search(searchString).then((result: ProjectApplication[]) => {
            this.notifyLoadedData(result);
            return result;
        });
    }

    filterFn(item: ProjectApplication): boolean {
        const searchString: string = this.getSearchString().toLowerCase().trim();

        return item.getDisplayName()?.toLowerCase().indexOf(searchString) > -1 ||
               item.getDescription()?.toLowerCase().indexOf(searchString) > -1 ||
               item.getName()?.toLowerCase().indexOf(searchString) > -1;
    }
}
