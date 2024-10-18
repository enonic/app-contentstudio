import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {ProjectApplicationsComboBox, ProjectApplicationsComboBoxWrapper} from './ProjectApplicationsComboBox';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectViewItem} from '../../../../view/ProjectViewItem';
import {ProjectApplicationsFormParams} from './ProjectApplicationsFormParams';
import Q from 'q';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {ProjectApplication} from './ProjectApplication';

export class ProjectApplicationsFormItem
    extends ProjectFormItem {

    constructor(params?: ProjectApplicationsFormParams) {
        const comboBox: ProjectApplicationsComboBox = new ProjectApplicationsComboBox(params);
        const wrapper = new ProjectApplicationsComboBoxWrapper(comboBox);

        super(
            new ProjectFormItemBuilder(wrapper)
                .setHelpText(i18n('settings.projects.applications.helptext'))
                .setLabel(i18n('settings.items.wizard.step.applications')) as ProjectFormItemBuilder
        );

        this.addClass('project-applications-form-item');
    }

    getSiteConfigs(): ApplicationConfig[] {
        return this.getComboBox().getSelectedApplicationConfigs();
    }

    getNonInheritedApplicationConfigs(): ApplicationConfig[] {
        return this.getComboBox().getNonInheritedApplicationConfigs();
    }

    getComboBox(): ProjectApplicationsComboBox {
        return (this.getInput() as ProjectApplicationsComboBoxWrapper).getComboBox();
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        return this.getComboBox().layout(item);
    }
}

