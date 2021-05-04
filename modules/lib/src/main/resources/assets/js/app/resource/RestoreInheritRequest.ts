import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {ContentResourceRequest} from './ContentResourceRequest';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ProjectContext} from '../project/ProjectContext';
import {ContentInheritType} from '../content/ContentInheritType';
import {ContentId} from '../content/ContentId';

export class RestoreInheritRequest extends ContentResourceRequest<void> {

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

    getParams(): Object {
        return {
            contentId: this.contentId.toString(),
            project: !!this.projectToUpdate ? this.projectToUpdate : ProjectContext.get().getProject().getName(),
            inherit: this.inherit
        };
    }

    protected parseResponse(response: JsonResponse<void>): void {
        return;
    }
}
