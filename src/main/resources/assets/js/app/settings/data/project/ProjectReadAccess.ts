import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
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
        return this.principals;
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
            principals: this.principals.map((key: PrincipalKey) => key.toString())
        };
    }

    static fromJson(json: ProjectReadAccessJson): ProjectReadAccess {
        if (!json) {
            return new ProjectReadAccess(ProjectReadAccessType.PRIVATE);
        }

        if (json.type === ProjectReadAccessType.PUBLIC) {
            return new ProjectReadAccess(ProjectReadAccessType.PUBLIC);
        }

        if (json.type === ProjectReadAccessType.CUSTOM) {
            if (json.principals) {
                const principals: PrincipalKey[] = json.principals.map(PrincipalKey.fromString);

                return new ProjectReadAccess(ProjectReadAccessType.CUSTOM, principals);
            }

            return new ProjectReadAccess(ProjectReadAccessType.CUSTOM);
        }

        return new ProjectReadAccess(ProjectReadAccessType.PRIVATE);
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
