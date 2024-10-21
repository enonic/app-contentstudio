import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectAccess} from './ProjectAccess';
import {PrincipalContainer} from '@enonic/lib-admin-ui/ui/security/PrincipalContainer';

export class ProjectAccessControlEntry
    extends PrincipalContainer
    implements Equitable {

    private access: ProjectAccess;

    constructor(principal: Principal, access: ProjectAccess = ProjectAccess.CONTRIBUTOR) {
        super(principal);
        this.access = access;
    }

    getAccess(): ProjectAccess {
        return this.access;
    }

    setAccess(value: string): ProjectAccessControlEntry {
        this.access = ProjectAccess[value.toUpperCase()];
        return this;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, ProjectAccessControlEntry)) {
            return false;
        }
        let other = o as ProjectAccessControlEntry;
        return this.principal.equals(other.getPrincipal()) &&
               this.access === other.access;
    }

    toString(): string {
        return this.principal.getKey().toString() + '[' + ProjectAccess[this.access] + ']';
    }

}
