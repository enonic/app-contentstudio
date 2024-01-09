import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {ProjectApplicationsComboBox, ProjectApplicationsComboBoxWrapper} from './ProjectApplicationsComboBox';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectViewItem} from '../../../../view/ProjectViewItem';
import * as Q from 'q';
import {ProjectApplicationsFormParams} from './ProjectApplicationsFormParams';

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

    getComboBox(): ProjectApplicationsComboBox {
        return (this.getInput() as ProjectApplicationsComboBoxWrapper).getComboBox();
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        return this.getComboBox().layout(item);
    }
}

