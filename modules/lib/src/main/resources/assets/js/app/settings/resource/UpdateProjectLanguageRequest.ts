import {ProjectResourceRequest} from './ProjectResourceRequest';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {Response} from '@enonic/lib-admin-ui/rest/Response';
import {ProjectReadAccessJson} from './json/ProjectReadAccessJson';
import {ProjectJson} from './json/ProjectJson';
import {ProjectPermissionsJson} from './json/ProjectPermissionsJson';

export class UpdateProjectLanguageRequest extends ProjectResourceRequest<string> {

    private name: string;

    private language: string;

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('modifyLanguage');
        this.setIsJsonResponse(false);
    }

    setName(value: string): UpdateProjectLanguageRequest {
        this.name = value;
        return this;
    }

    setLanguage(value: string): UpdateProjectLanguageRequest {
        this.language = value;
        return this;
    }

    getParams(): object {

        const params: {name: string, language?: string} = {
            name: this.name
        };

        if (this.language) {
            params.language = this.language;
        }

        return params;
    }

    protected parseResponse(response: Response): string {
        return response.getResult();
    }
}
