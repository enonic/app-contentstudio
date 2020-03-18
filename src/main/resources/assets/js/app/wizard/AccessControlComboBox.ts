import {Option} from 'lib-admin-ui/ui/selector/Option';
import {AccessControlEntryView} from '../view/AccessControlEntryView';
import {AccessControlEntry} from '../access/AccessControlEntry';
import {Permission} from '../access/Permission';
import {
    PrincipalContainerCombobox,
    PrincipalContainerComboboxBuilder
} from 'lib-admin-ui/ui/security/PrincipalContainerCombobox';
import {PrincipalContainerSelectedOptionsView} from 'lib-admin-ui/ui/security/PrincipalContainerSelectedOptionsView';
import {Principal} from 'lib-admin-ui/security/Principal';
import {FilterablePrincipalLoader} from '../security/FilterablePrincipalLoader';

export class AccessControlComboBox
    extends PrincipalContainerCombobox<AccessControlEntry> {

    constructor() {
        super(new AccessControlComboBoxBuilder());
    }

    protected loadedItemToDisplayValue(value: Principal): AccessControlEntry {
        return new AccessControlEntry(value);
    }
}

class ACESelectedOptionsView
    extends PrincipalContainerSelectedOptionsView<AccessControlEntry> {

    constructor() {
        super('access-control-list');
    }

    protected createSelectedEntryView(option: Option<AccessControlEntry>): AccessControlEntryView {
        const ace: AccessControlEntry = option.displayValue;
        if (ace.getAllowedPermissions().length === 0 && ace.getDeniedPermissions().length === 0) {
            // allow read by default
            ace.allow(Permission.READ);
        }

        return new AccessControlEntryView(ace, option.readOnly);
    }

}

export class AccessControlComboBoxBuilder
    extends PrincipalContainerComboboxBuilder<AccessControlEntry> {

    selectedOptionsView: ACESelectedOptionsView = new ACESelectedOptionsView();

    loader: FilterablePrincipalLoader = new FilterablePrincipalLoader();
}
