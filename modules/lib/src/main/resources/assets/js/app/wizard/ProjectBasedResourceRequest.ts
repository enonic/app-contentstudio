import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {UrlHelper} from '../util/UrlHelper';
import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {type Project} from '../settings/data/project/Project';

export abstract class ProjectBasedResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    private projectName: string;

    getRestPath(): Path {
        return Path.create().fromParent(super.getRestPath(), UrlHelper.getCMSPathWithProject(this.projectName)).build();
    }

    setRequestProject(value: Project): ProjectBasedResourceRequest<PARSED_TYPE> {
        this.projectName = value ? value.getName() : null;
        return this;
    }

    setRequestProjectName(value: string): ProjectBasedResourceRequest<PARSED_TYPE> {
        this.projectName = value;
        return this;
    }

}
