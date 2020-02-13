import {ProjectCreateUpdateRequest} from './ProjectCreateUpdateRequest';

export class ProjectUpdateRequest
    extends ProjectCreateUpdateRequest {

    constructor() {
        super();
        this.addRequestPathElements('modify');
    }

}
