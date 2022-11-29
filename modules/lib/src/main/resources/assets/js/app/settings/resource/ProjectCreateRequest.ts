import {ProjectCreateUpdateRequest} from './ProjectCreateUpdateRequest';
import {ProjectReadAccess} from '../data/project/ProjectReadAccess';

export class ProjectCreateRequest
    extends ProjectCreateUpdateRequest {

    private parents: string[];

    private readAccess: ProjectReadAccess;

    constructor() {
        super();
        this.addRequestPathElements('create');
    }

    setParents(value: string[]): ProjectCreateRequest {
        this.parents = value;
        return this;
    }

    setReadAccess(value: ProjectReadAccess): ProjectCreateRequest {
        this.readAccess = value;
        return this;
    }

    getParams(): Object {
        const params: Object = super.getParams();

        if (this.parents) {
            params['parents'] = this.parents;
        }

        if (this.readAccess) {
            params['readAccess'] = this.readAccess.toJson();
        }

        return params;
    }

}
