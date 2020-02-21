import {ProjectCreateUpdateRequest} from './ProjectCreateUpdateRequest';

export class ProjectCreateRequest
    extends ProjectCreateUpdateRequest {
    constructor() {
        super();
        this.addRequestPathElements('create');
    }

}
