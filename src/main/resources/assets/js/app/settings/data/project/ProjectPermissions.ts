import {ProjectPermissionsJson} from '../../resource/json/ProjectPermissionsJson';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';

export class ProjectPermissions {

    private owners: PrincipalKey[];

    private contributors: PrincipalKey[];

    private experts: PrincipalKey[];

    private constructor(owners: string[], contributors: string[], experts: string[]) {
        this.owners = owners.map(PrincipalKey.fromString);
        this.contributors = contributors.map(PrincipalKey.fromString);
        this.experts = experts.map(PrincipalKey.fromString);
    }

    static fromJson(json: ProjectPermissionsJson): ProjectPermissions {
        if (json) {
            return new ProjectPermissions(json.owner, json.contributor, json.expert);
        }

        return new ProjectPermissions([], [], []);
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

    isOwner(principalKey: PrincipalKey) {
        return this.owners.some(key => key.equals(principalKey));
    }

    isExpert(principalKey: PrincipalKey) {
        return this.experts.some(key => key.equals(principalKey));
    }

    isContributor(principalKey: PrincipalKey) {
        return this.contributors.some(key => key.equals(principalKey));
    }
}
