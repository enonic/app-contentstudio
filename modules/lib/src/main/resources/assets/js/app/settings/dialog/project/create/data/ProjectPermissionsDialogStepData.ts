import {type Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ProjectDialogStepData} from './ProjectDialogStepData';
import {ProjectItemPermissionsBuilder, type ProjectPermissions} from '../../../../data/project/ProjectPermissions';
import {type PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';

export class ProjectPermissionsDialogStepData extends ProjectDialogStepData {

    private readonly owners: Principal[];

    private readonly contributors: Principal[];

    private readonly editors: Principal[];

    private readonly authors: Principal[];

    constructor(builder: ProjectPermissionsDataBuilder) {
        super();
        this.owners = builder.owners || [];
        this.contributors = builder.contributors || [];
        this.editors = builder.editors || [];
        this.authors = builder.authors || [];
    }

    getOwners(): Principal[] {
        return this.owners;
    }

    getContributors(): Principal[] {
        return this.contributors;
    }

    getEditors(): Principal[] {
        return this.editors;
    }

    getAuthors(): Principal[] {
        return this.authors;
    }

    isEmpty(): boolean {
        return (this.owners.length + this.contributors.length + this.editors.length + this.authors.length) === 0;
    }

    toProjectPermissions(): ProjectPermissions {
        return new ProjectItemPermissionsBuilder()
            .setOwners(this.owners.map(this.principalToKey))
            .setContributors(this.contributors.map(this.principalToKey))
            .setEditors(this.editors.map(this.principalToKey))
            .setAuthors(this.authors.map(this.principalToKey))
            .build();
    }

    private principalToKey(p: Principal): PrincipalKey {
        return p.getKey();
    }
}

export class ProjectPermissionsDataBuilder {

    owners: Principal[] = [];

    contributors: Principal[] = [];

    editors: Principal[] = [];

    authors: Principal[] = [];

    setOwners(value: Principal[]): ProjectPermissionsDataBuilder {
        this.owners = value;
        return this;
    }

    setContributors(value: Principal[]): ProjectPermissionsDataBuilder {
        this.contributors = value;
        return this;
    }

    setEditors(value: Principal[]): ProjectPermissionsDataBuilder {
        this.editors = value;
        return this;
    }

    setAuthors(value: Principal[]): ProjectPermissionsDataBuilder {
        this.authors = value;
        return this;
    }

    build(): ProjectPermissionsDialogStepData {
        return new ProjectPermissionsDialogStepData(this);
    }
}
