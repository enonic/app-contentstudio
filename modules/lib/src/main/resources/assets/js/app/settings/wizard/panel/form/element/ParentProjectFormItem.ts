import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {ParentProjectFormInputWrapper, ProjectsSelector} from './ProjectsSelector';

export class ParentProjectFormItem
    extends ProjectFormItem {

    constructor() {
        super(new ProjectFormItemBuilder(new ParentProjectFormInputWrapper(new ProjectsSelector()))
            .setHelpText(i18n('settings.projects.parent.helptext'))
            .setLabel(i18n('settings.field.project.parent'))
            .setValidator(Validators.required) as ProjectFormItemBuilder);

        this.addClass('parent-project-form-item');
    }

    getProjectsSelector(): ParentProjectFormInputWrapper {
        return this.getInput() as ParentProjectFormInputWrapper;
    }

}
