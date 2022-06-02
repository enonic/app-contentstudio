import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectReadAccessJson} from '../../resource/json/ProjectReadAccessJson';

export enum ProjectReadAccessType {
    PRIVATE = 'private', PUBLIC = 'public', CUSTOM = 'custom'
}

export class ProjectReadAccess
    implements Equitable {

    private type: ProjectReadAccessType;

    private principals: PrincipalKey[];

    constructor(type: ProjectReadAccessType, principals: PrincipalKey[] = []) {
        this.type = type;
        this.principals = principals;
    }

    getType(): ProjectReadAccessType {
        return this.type;
    }

    getPrincipals(): PrincipalKey[] {
        return this.principals.slice(0);
    }

    isPublic(): boolean {
        return this.type === ProjectReadAccessType.PUBLIC;
    }

    isPrivate(): boolean {
        return this.type === ProjectReadAccessType.PRIVATE;
    }

    isCustom(): boolean {
        return this.type === ProjectReadAccessType.CUSTOM;
    }

    toJson(): ProjectReadAccessJson {
        return {
            type: this.type,
        };
    }

    static fromJson(json: ProjectReadAccessJson): ProjectReadAccess {
        const projectType: ProjectReadAccessType = (!!json && !!json.type) ? ProjectReadAccessType[json.type.toUpperCase()] : null;

        if (!projectType) {
            return new ProjectReadAccess(ProjectReadAccessType.PRIVATE);
        }

        if (projectType === ProjectReadAccessType.CUSTOM && json.principals) {
            return new ProjectReadAccess(projectType, json.principals.map(PrincipalKey.fromString));
        }

        return new ProjectReadAccess(projectType);
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ProjectReadAccess)) {
            return false;
        }

        const other: ProjectReadAccess = <ProjectReadAccess>o;

        return ObjectHelper.objectEquals(this.type, other.type) &&
               ObjectHelper.arrayEquals(this.principals, other.getPrincipals());
    }
}
