import {ProjectAccessControlEntry} from '../access/ProjectAccessControlEntry';
import {
    PrincipalContainerCombobox,
    PrincipalContainerComboboxBuilder
} from 'lib-admin-ui/ui/security/PrincipalContainerCombobox';
import {Principal} from 'lib-admin-ui/security/Principal';
import {PrincipalContainerSelectedOptionsView} from 'lib-admin-ui/ui/security/PrincipalContainerSelectedOptionsView';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {ProjectAccessControlEntryView} from './ProjectAccessControlEntryView';
import {FilterablePrincipalLoader} from 'lib-admin-ui/security/FilterablePrincipalLoader';

export class ProjectAccessControlComboBox
    extends PrincipalContainerCombobox<ProjectAccessControlEntry> {

    constructor(builder: ProjectAccessControlComboBoxBuilder = new ProjectAccessControlComboBoxBuilder()) {
        super(builder);
    }

    protected loadedItemToDisplayValue(value: Principal): ProjectAccessControlEntry {
        return new ProjectAccessControlEntry(value);
    }
}

class ProjectACESelectedOptionsView
    extends PrincipalContainerSelectedOptionsView<ProjectAccessControlEntry> {

    protected createSelectedEntryView(option: Option<ProjectAccessControlEntry>): ProjectAccessControlEntryView {
        return new ProjectAccessControlEntryView(option.displayValue, option.readOnly);
    }

}

export class ProjectAccessControlComboBoxBuilder
    extends PrincipalContainerComboboxBuilder<ProjectAccessControlEntry> {

    selectedOptionsView: ProjectACESelectedOptionsView = new ProjectACESelectedOptionsView();

    loader: FilterablePrincipalLoader = new FilterablePrincipalLoader();
}
