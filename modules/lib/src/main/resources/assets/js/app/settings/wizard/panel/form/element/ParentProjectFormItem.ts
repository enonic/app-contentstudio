import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {ProjectsComboBox} from './ProjectsComboBox';

export class ParentProjectFormItem
    extends ProjectFormItem {

    constructor() {
        super(new ProjectFormItemBuilder(new ProjectsComboBox())
            .setHelpText(i18n('settings.projects.parent.helptext'))
            .setLabel(i18n('settings.field.project.parent'))
            .setValidator(Validators.required) as ProjectFormItemBuilder);

        this.addClass('parent-project-form-item');
    }

    getProjectsComboBox(): ProjectsComboBox {
        return this.getInput() as ProjectsComboBox;
    }

}