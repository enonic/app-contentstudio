import PrincipalType = api.security.PrincipalType;
import {AccessControlEntry} from '../access/AccessControlEntry';

export class AccessControlEntryViewer
    extends api.ui.NamesAndIconViewer<AccessControlEntry> {

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
