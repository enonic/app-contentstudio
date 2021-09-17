import {Path} from 'lib-admin-ui/rest/Path';
import {UrlHelper} from '../util/UrlHelper';
import {Project} from '../settings/data/project/Project';
import {CmsResourceRequest} from '../resource/CmsResourceRequest';

export abstract class CmsProjectBasedResourceRequest<PARSED_TYPE>
    extends CmsResourceRequest<PARSED_TYPE> {

    private projectName: string;

    private contentRootPath: string;

    getRestPath(): Path {
        return Path.fromParent(super.getRestPath(), UrlHelper.getCMSPathWithProject(this.projectName, this.contentRootPath));
    }

    setRequestProject(value: Project): CmsProjectBasedResourceRequest<PARSED_TYPE> {
        this.projectName = value?.getName();
        return this;
    }

    setRequestProjectName(value: string): CmsProjectBasedResourceRequest<PARSED_TYPE> {
        this.projectName = value;
        return this;
    }

    setContentRootPath(value: string) {
        this.contentRootPath = value;
        return this;
    }

}
