import {Path} from 'lib-admin-ui/rest/Path';
import {UrlHelper} from '../util/UrlHelper';
import {Project} from '../settings/data/project/Project';
import {CmsResourceRequest} from '../resource/CmsResourceRequest';

export abstract class CmsProjectBasedResourceRequest<PARSED_TYPE>
    extends CmsResourceRequest<PARSED_TYPE> {

    private projectName: string;

    getRestPath(): Path {
        return Path.create().fromParent(super.getRestPath(), UrlHelper.getCMSPathWithProject(this.projectName)).build();
    }

    setRequestProject(value: Project): CmsProjectBasedResourceRequest<PARSED_TYPE> {
        this.projectName = value?.getName();
        return this;
    }

    setRequestProjectName(value: string): CmsProjectBasedResourceRequest<PARSED_TYPE> {
        this.projectName = value;
        return this;
    }

}
