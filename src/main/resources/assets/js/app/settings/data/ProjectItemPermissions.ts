import {ProjectPermissionsJson} from '../resource/json/ProjectPermissionsJson';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';

export class ProjectItemPermissions {

    private owners: PrincipalKey[];

    private contributors: PrincipalKey[];

    private experts: PrincipalKey[];

    private constructor(owners: string[], contributors: string[], experts: string[]) {
        this.owners = owners.map(PrincipalKey.fromString);
        this.contributors = contributors.map(PrincipalKey.fromString);
        this.experts = experts.map(PrincipalKey.fromString);
    }

    getOwners(): PrincipalKey[] {
        return this.owners;
    }

    getContributors(): PrincipalKey[] {
        return this.contributors;
    }

    getExperts(): PrincipalKey[] {
        return this.experts;
    }

    static fromJson(json: ProjectPermissionsJson): ProjectItemPermissions {
        if (json) {
            return new ProjectItemPermissions(json.owner, json.contributor, json.expert);
        }

        return new ProjectItemPermissions([], [], []);
    }
}
