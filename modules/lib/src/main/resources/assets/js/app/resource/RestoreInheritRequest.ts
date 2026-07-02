import { HttpMethod } from '@enonic/lib-admin-ui/rest/HttpMethod';
import { type JsonResponse } from '@enonic/lib-admin-ui/rest/JsonResponse';
import { ContentInheritType } from '../content/ContentInheritType';
import { type ContentId } from '../content/ContentId';
import { CmsContentResourceRequest } from './CmsContentResourceRequest';
import { getActiveProjectName } from '../../v6/entities/project/activeProject.store';

export class RestoreInheritRequest extends CmsContentResourceRequest<void> {
    private contentId: ContentId;

    private projectToUpdate: string;

    private inherit: string[];

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('restoreInherit');
    }

    setContentId(value: ContentId): RestoreInheritRequest {
        this.contentId = value;
        return this;
    }

    setProjectToUpdate(value: string): RestoreInheritRequest {
        this.projectToUpdate = value;
        return this;
    }

    setInherit(value: ContentInheritType[]): RestoreInheritRequest {
        this.inherit = value.map((inheritType: ContentInheritType) => ContentInheritType[inheritType]);
        return this;
    }

    getParams(): object {
        return {
            contentId: this.contentId.toString(),
            project: this.projectToUpdate ? this.projectToUpdate : getActiveProjectName(),
            inherit: this.inherit,
        };
    }

    protected parseResponse(response: JsonResponse<void>): void {
        return;
    }
}
