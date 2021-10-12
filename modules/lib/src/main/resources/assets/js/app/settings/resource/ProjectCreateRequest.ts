import {ProjectCreateUpdateRequest} from './ProjectCreateUpdateRequest';
import {ProjectReadAccess} from '../data/project/ProjectReadAccess';

export class ProjectCreateRequest
    extends ProjectCreateUpdateRequest {

    private parent: string;

    private readAccess: ProjectReadAccess;

    constructor() {
        super();
        this.addRequestPathElements('create');
    }

    setParent(value: string): ProjectCreateRequest {
        this.parent = value;
        return this;
    }

    setReadAccess(value: ProjectReadAccess): ProjectCreateRequest {
        this.readAccess = value;
        return this;
    }

    getParams(): Object {
        const params: Object = super.getParams();

        if (this.parent) {
            params['parent'] = this.parent;
        }

        if (this.readAccess) {
            params['readAccess'] = this.readAccess.toJson();
        }

        return params;
    }

}
