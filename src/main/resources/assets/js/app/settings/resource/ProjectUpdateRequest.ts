import {ProjectResourceRequest} from './ProjectResourceRequest';
import {ProjectItemJson} from './json/ProjectItemJson';
import {ProjectItem} from '../data/ProjectItem';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class ProjectUpdateRequest
    extends ProjectResourceRequest<ProjectItemJson, ProjectItem> {

    private name: string;

    private displayName: string;

    private description: string;

    private thumbnail: File;

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.setIsFormRequest(true);
        this.addRequestPathElements('modify');
    }

    setName(value: string): ProjectUpdateRequest {
        this.name = value;
        return this;
    }

    setDisplayName(value: string): ProjectUpdateRequest {
        this.displayName = value;
        return this;
    }

    setDescription(value: string): ProjectUpdateRequest {
        this.description = value;
        return this;
    }

    setThumbnail(value: File): ProjectUpdateRequest {
        this.thumbnail = value;
        return this;
    }

    getParams(): Object {
        const params: any = {
            name: this.name,
            displayName: this.displayName,
            description: this.description
        };

        if (this.thumbnail) {
            params.icon = this.thumbnail;
        }

        return params;
    }

    protected processResponse(response: JsonResponse<ProjectItemJson>): ProjectItem {
        return ProjectItem.fromJson(response.getResult());
    }
}
