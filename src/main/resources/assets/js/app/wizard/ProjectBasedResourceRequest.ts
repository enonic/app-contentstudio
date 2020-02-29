import {Path} from 'lib-admin-ui/rest/Path';
import {ResourceRequestAdvanced} from './ResourceRequestAdvanced';
import {UrlHelper} from '../util/UrlHelper';

export abstract class ProjectBasedResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequestAdvanced<JSON_TYPE, PARSED_TYPE> {

    getRestPath(): Path {
        return Path.fromParent(super.getRestPath(), UrlHelper.getCMSPath());
    }

}
