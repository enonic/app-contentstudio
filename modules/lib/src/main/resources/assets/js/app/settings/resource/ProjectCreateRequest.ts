import {ProjectCreateUpdateRequest} from './ProjectCreateUpdateRequest';
import {ProjectReadAccess} from '../data/project/ProjectReadAccess';
import {Project} from '../data/project/Project';

export class ProjectCreateRequest
    extends ProjectCreateUpdateRequest {

    private parents: Project[];

    private readAccess: ProjectReadAccess;

    constructor() {
        super();
        this.addRequestPathElements('create');
    }

    setParents(value: Project[]): ProjectCreateRequest {
        this.parents = value;
        return this;
    }

    setReadAccess(value: ProjectReadAccess): ProjectCreateRequest {
        this.readAccess = value;
        return this;
    }

    getParams(): object {
        const params: object = super.getParams();

        if (this.parents?.length > 0) {
            params['parents'] = this.parents.map((p) => p.getName());
        }

        if (this.readAccess) {
            params['readAccess'] = this.readAccess.toJson();
        }

        return params;
    }

}
