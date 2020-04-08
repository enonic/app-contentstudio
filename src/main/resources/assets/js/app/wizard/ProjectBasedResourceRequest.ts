import {Path} from 'lib-admin-ui/rest/Path';
import {UrlHelper} from '../util/UrlHelper';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';

export abstract class ProjectBasedResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    getRestPath(): Path {
        return Path.fromParent(super.getRestPath(), UrlHelper.getCMSPath());
    }

}
