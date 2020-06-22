import {ProjectCreateUpdateRequest} from './ProjectCreateUpdateRequest';

export class ProjectCreateRequest
    extends ProjectCreateUpdateRequest {

    private parent: string;

    constructor() {
        super();
        this.addRequestPathElements('create');
    }

    setParent(value: string): ProjectCreateRequest {
        this.parent = value;
        return this;
    }

    getParams(): Object {
        const params: Object = super.getParams();

        if (this.parent) {
            params['parent'] = this.parent;
        }

        return params;
    }

}
