import {type ProjectPermissionsJson} from '../../resource/json/ProjectPermissionsJson';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class ProjectPermissions
    implements Equitable {

    private readonly owners: PrincipalKey[] = [];

    private readonly contributors: PrincipalKey[] = [];

    private readonly editors: PrincipalKey[] = [];

    private readonly authors: PrincipalKey[] = [];

    constructor(builder: ProjectItemPermissionsBuilder) {
        this.owners = builder.owners;
        this.contributors = builder.contributors;
        this.editors = builder.editors;
        this.authors = builder.authors;
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

    getAuthors(): PrincipalKey[] {
        return this.authors;
    }

    isEmpty(): boolean {
        return (this.owners.length + this.contributors.length + this.editors.length + this.authors.length) === 0;
    }

    toJson(): ProjectPermissionsJson {
        return {
            contributor: this.contributors.map((key: PrincipalKey) => key.toString()),
            author: this.authors.map((key: PrincipalKey) => key.toString()),
            owner: this.owners.map((key: PrincipalKey) => key.toString()),
            editor: this.editors.map((key: PrincipalKey) => key.toString())
        };
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ProjectPermissions)) {
            return false;
        }

        const other = o as ProjectPermissions;

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

        const thisAuthors: string[] = this.getAuthors().map((author: PrincipalKey) => author.toString()).sort();
        const otherAuthors: string[] = other.getAuthors().map((author: PrincipalKey) => author.toString()).sort();
        if (!ObjectHelper.stringArrayEquals(thisAuthors, otherAuthors)) {
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

    isAuthor(principalKey: PrincipalKey) {
        return this.authors.some(key => key.equals(principalKey));
    }

    static fromJson(json: ProjectPermissionsJson): ProjectPermissions {
        if (json) {
            return new ProjectItemPermissionsBuilder()
                .setContributors(json.contributor ? json.contributor.map(PrincipalKey.fromString) : [])
                .setEditors(json.editor ? json.editor.map(PrincipalKey.fromString) : [])
                .setOwners(json.owner ? json.owner.map(PrincipalKey.fromString) : [])
                .setAuthors(json.author ? json.author.map(PrincipalKey.fromString) : [])
                .build();
        }

        return new ProjectItemPermissionsBuilder().build();
    }
}

export class ProjectItemPermissionsBuilder {

    owners: PrincipalKey[] = [];

    contributors: PrincipalKey[] = [];

    editors: PrincipalKey[] = [];

    authors: PrincipalKey[] = [];

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

    setAuthors(value: PrincipalKey[]): ProjectItemPermissionsBuilder {
        this.authors = value;
        return this;
    }

    build(): ProjectPermissions {
        return new ProjectPermissions(this);
    }
}
