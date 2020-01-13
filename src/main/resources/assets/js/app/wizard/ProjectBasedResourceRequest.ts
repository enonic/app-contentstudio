import {Path} from 'lib-admin-ui/rest/Path';
import {ProjectContext} from '../project/ProjectContext';
import {ResourceRequestAdvanced} from './ResourceRequestAdvanced';

export abstract class ProjectBasedResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequestAdvanced<JSON_TYPE, PARSED_TYPE> {

    getRestPath(): Path {
        return Path.fromParent(super.getRestPath(), `cms/${ProjectContext.get().getProject()}`);
    }

}
