import {ProjectResourceRequest} from './ProjectResourceRequest';
import {ProjectConfigJson} from './json/ProjectConfigJson';
import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ProjectConfig} from '../data/project/ProjectConfig';

export class ProjectConfigRequest extends ProjectResourceRequest<ProjectConfig>  {

    constructor() {
        super();
        this.addRequestPathElements('config');
    }

    protected parseResponse(response: JsonResponse<ProjectConfigJson>): ProjectConfig {
        return ProjectConfig.create()
            .setMultiInheritance(!!response.getResult().multiInheritance)
            .build();
    }
}
