import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {ProjectAccessControlComboBox, ProjectAccessControlComboBoxBuilder} from './ProjectAccessControlComboBox';
import {PrincipalLoader} from '@enonic/lib-admin-ui/security/PrincipalLoader';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class ProjectRolesFormItem
    extends ProjectFormItem {

    constructor() {
        const accessCombobox: ProjectAccessControlComboBox = new ProjectAccessControlComboBoxBuilder().build();

        const loader: PrincipalLoader = <PrincipalLoader>accessCombobox.getLoader();
        loader.setAllowedTypes([PrincipalType.USER, PrincipalType.GROUP]);
        loader.skipPrincipal(PrincipalKey.ofAnonymous());

        super(new ProjectFormItemBuilder(accessCombobox)
            .setHelpText(i18n('settings.projects.roles.helptext')));

        this.addClass('project-roles-form-item');
    }

    getAccessCombobox(): ProjectAccessControlComboBox {
        return <ProjectAccessControlComboBox>this.getInput();
    }
}
