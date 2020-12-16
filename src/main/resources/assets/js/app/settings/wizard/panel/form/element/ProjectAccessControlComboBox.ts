import {ProjectAccessControlEntry} from '../../../../access/ProjectAccessControlEntry';
import {PrincipalContainerCombobox, PrincipalContainerComboboxBuilder} from 'lib-admin-ui/ui/security/PrincipalContainerCombobox';
import {Principal} from 'lib-admin-ui/security/Principal';
import {PrincipalContainerSelectedOptionsView} from 'lib-admin-ui/ui/security/PrincipalContainerSelectedOptionsView';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {ProjectAccessControlEntryView} from './ProjectAccessControlEntryView';

export class ProjectAccessControlComboBox
    extends PrincipalContainerCombobox<ProjectAccessControlEntry> {

    constructor(builder: ProjectAccessControlComboBoxBuilder = new ProjectAccessControlComboBoxBuilder()) {
        super(builder);
        this.addClass('project-access-combobox');
    }

    protected loadedItemToDisplayValue(value: Principal): ProjectAccessControlEntry {
        return new ProjectAccessControlEntry(value);
    }
}

export class ProjectACESelectedOptionsView
    extends PrincipalContainerSelectedOptionsView<ProjectAccessControlEntry> {

    protected createSelectedEntryView(option: Option<ProjectAccessControlEntry>): ProjectAccessControlEntryView {
        return new ProjectAccessControlEntryView(option.getDisplayValue(), option.isReadOnly());
    }

}

export class ProjectAccessControlComboBoxBuilder
    extends PrincipalContainerComboboxBuilder<ProjectAccessControlEntry> {

    selectedOptionsView: ProjectACESelectedOptionsView = new ProjectACESelectedOptionsView();

}
