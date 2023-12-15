import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {ProjectsSelector, ProjectsDropdownBuilder} from './ProjectsSelector';
import {ProjectConfigContext} from '../../../../data/project/ProjectConfigContext';

export class ParentProjectFormItem
    extends ProjectFormItem {

    constructor() {
        const builder = new ProjectsDropdownBuilder().setMaximumOccurrences(0) as ProjectsDropdownBuilder;

        super(new ProjectFormItemBuilder(new ProjectsSelector(builder))
            .setHelpText(i18n('settings.projects.parent.helptext'))
            .setLabel(i18n('settings.field.project.parent'))
            .setValidator(Validators.required) as ProjectFormItemBuilder);

        this.addClass('parent-project-form-item');
    }

    getProjectsSelector(): ProjectsSelector {
        return this.getInput() as ProjectsSelector;
    }

}
