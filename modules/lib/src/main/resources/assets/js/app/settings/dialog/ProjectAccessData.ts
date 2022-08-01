import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ProjectReadAccessType} from '../data/project/ProjectReadAccessType';

export class ProjectAccessData {

    private readonly type: ProjectReadAccessType;

    private readonly principals: Principal[];

    constructor(type: ProjectReadAccessType, principals: Principal[] = []) {
        this.type = type;
        this.principals = principals;
    }

    getType(): ProjectReadAccessType {
        return this.type;
    }

    getPrincipals(): Principal[] {
        return this.principals.slice(0);
    }
}
