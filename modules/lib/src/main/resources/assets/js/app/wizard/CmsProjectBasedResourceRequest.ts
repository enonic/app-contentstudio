import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {UrlHelper} from '../util/UrlHelper';
import {Project} from '../settings/data/project/Project';
import {CmsResourceRequest} from '../resource/CmsResourceRequest';

export abstract class CmsProjectBasedResourceRequest<PARSED_TYPE>
    extends CmsResourceRequest<PARSED_TYPE> {

    private projectName: string;

    private contentRootPath: string;

    getRestPath(): Path {
        return Path.create().fromParent(super.getRestPath(),
            UrlHelper.getCMSPathWithProject(this.projectName, this.contentRootPath)).build();
    }

    setRequestProject(value: Readonly<Project> | undefined): this {
        this.projectName = value?.getName();
        return this;
    }

    setRequestProjectName(value: string): this {
        this.projectName = value;
        return this;
    }

    setContentRootPath(value: string): this {
        this.contentRootPath = value;
        return this;
    }

}
