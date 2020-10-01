import {Path} from 'lib-admin-ui/rest/Path';
import {UrlHelper} from '../util/UrlHelper';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {Project} from '../settings/data/project/Project';

export abstract class ProjectBasedResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    private projectName: string;

    getRestPath(): Path {
        return Path.fromParent(super.getRestPath(), UrlHelper.getCMSPathWithProject(this.projectName));
    }

    setRequestProject(value: Project): ProjectBasedResourceRequest<PARSED_TYPE> {
        this.projectName = !!value ? value.getName() : null;
        return this;
    }

    setRequestProjectName(value: string): ProjectBasedResourceRequest<PARSED_TYPE> {
        this.projectName = value;
        return this;
    }

}
