import {ProjectPermissionsJson} from '../../resource/json/ProjectPermissionsJson';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';

export class ProjectPermissions
    implements Equitable {

    private owners: PrincipalKey[] = [];

    private contributors: PrincipalKey[] = [];

    private editors: PrincipalKey[] = [];

    constructor(builder: ProjectItemPermissionsBuilder) {
        this.owners = builder.owners;
        this.contributors = builder.contributors;
        this.editors = builder.editors;
    }

    getOwners(): PrincipalKey[] {
        return this.owners;
    }

    getContributors(): PrincipalKey[] {
        return this.contributors;
    }

    getEditors(): PrincipalKey[] {
        return this.editors;
    }

    isEmpty(): boolean {
        return (this.owners.length + this.contributors.length + this.editors.length) === 0;
    }

    toJson(): ProjectPermissionsJson {
        return {
            contributor: this.contributors.map((key: PrincipalKey) => key.toString()),
            owner: this.owners.map((key: PrincipalKey) => key.toString()),
            editor: this.editors.map((key: PrincipalKey) => key.toString()),
        };
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ProjectPermissions)) {
            return false;
        }

        const other = <ProjectPermissions>o;

        const thisOwners: string[] = this.getOwners().map((owner: PrincipalKey) => owner.toString()).sort();
        const otherOwners: string[] = other.getOwners().map((owner: PrincipalKey) => owner.toString()).sort();
        if (!ObjectHelper.stringArrayEquals(thisOwners, otherOwners)) {
            return false;
        }

        const thisEditors: string[] = this.getEditors().map((editor: PrincipalKey) => editor.toString()).sort();
        const otherEditors: string[] = other.getEditors().map((editor: PrincipalKey) => editor.toString()).sort();
        if (!ObjectHelper.stringArrayEquals(thisEditors, otherEditors)) {
            return false;
        }

        const thisContributors: string[] = this.getContributors().map((contributor: PrincipalKey) => contributor.toString()).sort();
        const otherContributors: string[] = other.getContributors().map((contributor: PrincipalKey) => contributor.toString()).sort();
        if (!ObjectHelper.stringArrayEquals(thisContributors, otherContributors)) {
            return false;
        }

        return true;
    }

    isOwner(principalKey: PrincipalKey) {
        return this.owners.some(key => key.equals(principalKey));
    }

    isEditor(principalKey: PrincipalKey) {
        return this.editors.some(key => key.equals(principalKey));
    }

    isContributor(principalKey: PrincipalKey) {
        return this.contributors.some(key => key.equals(principalKey));
    }

    static fromJson(json: ProjectPermissionsJson): ProjectPermissions {
        if (json) {
            return new ProjectItemPermissionsBuilder()
                .setContributors(json.contributor.map(PrincipalKey.fromString))
                .setEditors(json.editor.map(PrincipalKey.fromString))
                .setOwners(json.owner.map(PrincipalKey.fromString))
                .build();
        }

        return new ProjectItemPermissionsBuilder().build();
    }
}

export class ProjectItemPermissionsBuilder {

    owners: PrincipalKey[] = [];

    contributors: PrincipalKey[] = [];

    editors: PrincipalKey[] = [];

    setOwners(value: PrincipalKey[]): ProjectItemPermissionsBuilder {
        this.owners = value;
        return this;
    }

    setContributors(value: PrincipalKey[]): ProjectItemPermissionsBuilder {
        this.contributors = value;
        return this;
    }

    setEditors(value: PrincipalKey[]): ProjectItemPermissionsBuilder {
        this.editors = value;
        return this;
    }

    build(): ProjectPermissions {
        return new ProjectPermissions(this);
    }
}
