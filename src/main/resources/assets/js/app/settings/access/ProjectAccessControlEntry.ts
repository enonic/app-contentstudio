import {Principal} from 'lib-admin-ui/security/Principal';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {Equitable} from 'lib-admin-ui/Equitable';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ProjectAccess} from './ProjectAccess';

export class ProjectAccessControlEntry
    implements Equitable {

    private principal: Principal;

    private access: ProjectAccess;

    constructor(principal: Principal, access?: ProjectAccess) {
        this.principal = principal;
        this.access = access;
    }

    getPrincipal(): Principal {
        return this.principal;
    }

    getAccess(): ProjectAccess {
        return this.access;
    }

    getPrincipalKey(): PrincipalKey {
        return this.principal.getKey();
    }

    getPrincipalDisplayName(): string {
        return this.principal.getDisplayName();
    }

    getPrincipalTypeName(): string {
        return this.principal.getTypeName();
    }

    setAccess(value: string): ProjectAccessControlEntry {
        this.access = ProjectAccess[value];
        return this;
    }

    getId(): string {
        return this.principal.getKey().toString();
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ProjectAccessControlEntry)) {
            return false;
        }
        let other = <ProjectAccessControlEntry>o;
        return this.principal.equals(other.getPrincipal()) &&
               this.access === other.access;
    }

    toString(): string {
        return this.principal.getKey().toString() + '[' + ProjectAccess[this.access] + ']';
    }

}
