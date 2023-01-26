import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {ProjectApplicationsComboBox} from './ProjectApplicationsComboBox';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectViewItem} from '../../../../view/ProjectViewItem';
import * as Q from 'q';
import {ProjectApplicationsFormParams} from './ProjectApplicationsFormParams';

export class ProjectApplicationsFormItem
    extends ProjectFormItem {

    constructor(params?: ProjectApplicationsFormParams) {
        super(
            <ProjectFormItemBuilder>new ProjectFormItemBuilder(new ProjectApplicationsComboBox(params))
                .setHelpText(i18n('settings.projects.applications.helptext'))
                .setLabel(i18n('settings.items.wizard.step.applications'))
        );

        this.addClass('project-applications-form-item');
    }

    getComboBox(): ProjectApplicationsComboBox {
        return <ProjectApplicationsComboBox>this.getInput();
    }

    layout(item: ProjectViewItem): Q.Promise<void> {
        return this.getComboBox().layout(item);
    }
}

