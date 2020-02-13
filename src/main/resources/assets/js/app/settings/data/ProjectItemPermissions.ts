import {ProjectPermissionsJson} from '../resource/json/ProjectPermissionsJson';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';

export class ProjectItemPermissions
    implements Equitable {

    private owners: PrincipalKey[] = [];

    private contributors: PrincipalKey[] = [];

    private experts: PrincipalKey[] = [];

    constructor(builder: ProjectItemPermissionsBuilder) {
        this.owners = builder.owners;
        this.contributors = builder.contributors;
        this.experts = builder.experts;
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

    isEmpty(): boolean {
        return (this.owners.length + this.contributors.length + this.experts.length) === 0;
    }

    toJson(): ProjectPermissionsJson {
        return {
            contributor: this.contributors.map((key: PrincipalKey) => key.toString()),
            owner: this.owners.map((key: PrincipalKey) => key.toString()),
            expert: this.experts.map((key: PrincipalKey) => key.toString()),
        };
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ProjectItemPermissions)) {
            return false;
        }

        const other = <ProjectItemPermissions>o;

        const thisOwners: string[] = this.getOwners().map((owner: PrincipalKey) => owner.toString()).sort();
        const otherOwners: string[] = other.getOwners().map((owner: PrincipalKey) => owner.toString()).sort();
        if (!ObjectHelper.stringArrayEquals(thisOwners, otherOwners)) {
            return false;
        }

        const thisExperts: string[] = this.getExperts().map((expert: PrincipalKey) => expert.toString()).sort();
        const otherExperts: string[] = other.getExperts().map((expert: PrincipalKey) => expert.toString()).sort();
        if (!ObjectHelper.stringArrayEquals(thisExperts, otherExperts)) {
            return false;
        }

        const thisContributors: string[] = this.getContributors().map((contributor: PrincipalKey) => contributor.toString()).sort();
        const otherContributors: string[] = other.getContributors().map((contributor: PrincipalKey) => contributor.toString()).sort();
        if (!ObjectHelper.stringArrayEquals(thisContributors, otherContributors)) {
            return false;
        }

        return true;
    }

    static fromJson(json: ProjectPermissionsJson): ProjectItemPermissions {
        if (json) {
            return new ProjectItemPermissionsBuilder()
                .setContributors(json.contributor.map(PrincipalKey.fromString))
                .setExperts(json.expert.map(PrincipalKey.fromString))
                .setOwners(json.owner.map(PrincipalKey.fromString))
                .build();
        }

        return new ProjectItemPermissionsBuilder().build();
    }
}

export class ProjectItemPermissionsBuilder {

    owners: PrincipalKey[] = [];

    contributors: PrincipalKey[] = [];

    experts: PrincipalKey[] = [];

    setOwners(value: PrincipalKey[]): ProjectItemPermissionsBuilder {
        this.owners = value;
        return this;
    }

    setContributors(value: PrincipalKey[]): ProjectItemPermissionsBuilder {
        this.contributors = value;
        return this;
    }

    setExperts(value: PrincipalKey[]): ProjectItemPermissionsBuilder {
        this.experts = value;
        return this;
    }

    build(): ProjectItemPermissions {
        return new ProjectItemPermissions(this);
    }
}
