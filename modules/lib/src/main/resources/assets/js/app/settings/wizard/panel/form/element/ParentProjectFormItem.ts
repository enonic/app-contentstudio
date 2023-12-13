import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectFormItem, ProjectFormItemBuilder} from './ProjectFormItem';
import {ProjectsComboBox, ProjectsDropdownBuilder} from './ProjectsComboBox';
import {ProjectConfigContext} from '../../../../data/project/ProjectConfigContext';

export class ParentProjectFormItem
    extends ProjectFormItem {

    constructor() {
        const maxParents: number = ProjectConfigContext.get().getProjectConfig()?.isMultiInheritance() ? 0 : 1;
        const builder = new ProjectsDropdownBuilder().setMaximumOccurrences(maxParents) as ProjectsDropdownBuilder;

        super(new ProjectFormItemBuilder(new ProjectsComboBox(builder))
            .setHelpText(i18n('settings.projects.parent.helptext'))
            .setLabel(i18n('settings.field.project.parent'))
            .setValidator(Validators.required) as ProjectFormItemBuilder);

        this.addClass('parent-project-form-item');
    }

    getProjectsComboBox(): ProjectsComboBox {
        return this.getInput() as ProjectsComboBox;
    }

}
