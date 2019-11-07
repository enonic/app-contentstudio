import {PrincipalType} from 'lib-admin-ui/security/PrincipalType';
import {AccessControlEntry} from '../access/AccessControlEntry';
import {NamesAndIconViewer} from 'lib-admin-ui/ui/NamesAndIconViewer';

export class AccessControlEntryViewer
    extends NamesAndIconViewer<AccessControlEntry> {

    constructor() {
        super();
    }

    resolveDisplayName(object: AccessControlEntry): string {
        return object.getPrincipalDisplayName();
    }

    resolveUnnamedDisplayName(object: AccessControlEntry): string {
        return object.getPrincipalTypeName();
    }

    resolveSubName(object: AccessControlEntry): string {
        return object.getPrincipalKey().toPath();
    }

    resolveIconClass(object: AccessControlEntry): string {
        switch (object.getPrincipalKey().getType()) {
        case PrincipalType.USER:
            return 'icon-user';
        case PrincipalType.GROUP:
            return 'icon-users';
        case PrincipalType.ROLE:
            return 'icon-masks';
        }

        return '';
    }
}
