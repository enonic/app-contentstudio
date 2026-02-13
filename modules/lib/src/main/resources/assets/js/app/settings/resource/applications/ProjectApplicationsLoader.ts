import {BaseLoader} from '@enonic/lib-admin-ui/util/loader/BaseLoader';
import type Q from 'q';
import {ListSiteApplicationsRequest} from '../../../resource/ListSiteApplicationsRequest';
import {type Application} from '@enonic/lib-admin-ui/application/Application';

export class ProjectApplicationsLoader
    extends BaseLoader<Application> {

    protected createRequest(): ListSiteApplicationsRequest {
        return new ListSiteApplicationsRequest();
    }

    search(searchString: string): Q.Promise<Application[]> {
        return super.search(searchString).then((result: Application[]) => {
            this.notifyLoadedData(result);
            return result;
        });
    }

    filterFn(item: Application): boolean {
        const searchString: string = this.getSearchString().toLowerCase().trim();

        return item.getDisplayName()?.toLowerCase().indexOf(searchString) > -1 ||
               item.getDescription()?.toLowerCase().indexOf(searchString) > -1 ||
               item.getName()?.toLowerCase().indexOf(searchString) > -1;
    }
}
