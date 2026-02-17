import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type ProjectReadAccessJson} from '../../resource/json/ProjectReadAccessJson';
import {ProjectReadAccessType} from './ProjectReadAccessType';

export class ProjectReadAccess
    implements Equitable {

    private readonly type: ProjectReadAccessType;

    private readonly principalsKeys: PrincipalKey[];

    constructor(type: ProjectReadAccessType, principals: PrincipalKey[] = []) {
        this.type = type;
        this.principalsKeys = principals;
    }

    getType(): ProjectReadAccessType {
        return this.type;
    }

    getPrincipalsKeys(): PrincipalKey[] {
        return this.principalsKeys.slice(0);
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

        const other: ProjectReadAccess = o as ProjectReadAccess;

        return ObjectHelper.objectEquals(this.type, other.type) &&
               ObjectHelper.arrayEquals(this.principalsKeys, other.getPrincipalsKeys());
    }
}
