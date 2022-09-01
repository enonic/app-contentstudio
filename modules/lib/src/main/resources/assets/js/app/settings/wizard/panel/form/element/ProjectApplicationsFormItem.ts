import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {ProjectApplicationsComboBox} from './ProjectApplicationsComboBox';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class ProjectApplicationsFormItem
    extends ProjectFormItem {

    constructor() {
        super(
            <ProjectFormItemBuilder>new ProjectFormItemBuilder(new ProjectApplicationsComboBox())
                .setHelpText(i18n('settings.projects.applications.helptext'))
                .setLabel(i18n('settings.items.wizard.step.applications'))
        );

        this.addClass('project-applications-form-item');
    }

    getComboBox(): ProjectApplicationsComboBox {
        return <ProjectApplicationsComboBox>this.getInput();
    }
}

