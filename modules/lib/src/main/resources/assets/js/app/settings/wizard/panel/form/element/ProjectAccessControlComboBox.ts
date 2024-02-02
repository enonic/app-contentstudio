import {ProjectAccessControlEntry} from '../../../../access/ProjectAccessControlEntry';
import {PrincipalContainerCombobox, PrincipalContainerComboboxBuilder} from '@enonic/lib-admin-ui/ui/security/PrincipalContainerCombobox';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalContainerSelectedOptionsView} from '@enonic/lib-admin-ui/ui/security/PrincipalContainerSelectedOptionsView';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {ProjectAccessControlEntryView} from './ProjectAccessControlEntryView';
import {PrincipalLoader} from '@enonic/lib-admin-ui/security/PrincipalLoader';
import {UrlHelper} from '../../../../../util/UrlHelper';
import {CSPrincipalLoader} from '../../../../../security/CSPrincipalLoader';

export class ProjectAccessControlComboBox
    extends PrincipalContainerCombobox<ProjectAccessControlEntry> {

    constructor(builder: ProjectAccessControlComboBoxBuilder) {
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

    loader: PrincipalLoader = new CSPrincipalLoader();

    build(): ProjectAccessControlComboBox {
        return new ProjectAccessControlComboBox(this);
    }
}
