import {Path} from 'lib-admin-ui/rest/Path';
import {UrlHelper} from '../util/UrlHelper';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {Project} from '../settings/data/project/Project';

export abstract class ProjectBasedResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    private project: Project;

    getRestPath(): Path {
        return Path.fromParent(super.getRestPath(), UrlHelper.getCMSPath(this.project));
    }

    setRequestProject(value: Project): ProjectBasedResourceRequest<PARSED_TYPE> {
        this.project = value;
        return this;
    }

}
