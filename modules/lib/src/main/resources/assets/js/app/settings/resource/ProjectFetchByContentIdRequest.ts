import {ProjectResourceRequest} from './ProjectResourceRequest';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {Project} from '../data/project/Project';
import {ProjectJson} from './json/ProjectJson';
import {ContentId} from 'lib-admin-ui/content/ContentId';

export class ProjectFetchByContentIdRequest
    extends ProjectResourceRequest<Project[]> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();

        this.contentId = contentId;
        this.addRequestPathElements('fetchByContentId');
    }

    getParams(): Object {
        return {
            contentId: this.contentId ? this.contentId.toString() : null
        };
    }

    protected parseResponse(response: JsonResponse<ProjectJson[]>): Project[] {
        return response.getResult()['projects'].map(Project.fromJson);
    }
}
