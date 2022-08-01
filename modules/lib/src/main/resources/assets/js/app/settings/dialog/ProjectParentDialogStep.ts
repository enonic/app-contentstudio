import {ProjectsComboBox} from '../wizard/panel/form/element/ProjectsComboBox';
import {ProjectFormItem, ProjectFormItemBuilder} from '../wizard/panel/form/element/ProjectFormItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectDialogStep} from './ProjectDialogStep';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Project} from '../data/project/Project';

export class ProjectParentDialogStep
    extends ProjectDialogStep {

    private parentProjectDropdown: ProjectsComboBox;

    protected createFormItems(): FormItem[] {
        return [this.createParentProjectFormItem()];
    }

    private createParentProjectFormItem(): FormItem {
        this.parentProjectDropdown = new ProjectsComboBox();

        return <ProjectFormItem>new ProjectFormItemBuilder(this.parentProjectDropdown)
            .setHelpText(i18n('settings.projects.parent.helptext'))
            .setLabel(i18n('dialog.project.wizard.parent.inherit'))
            .build();
    }

    protected listenItemsEvents(): void {
        super.listenItemsEvents();

        this.parentProjectDropdown.onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    isOptional(): boolean {
        return true;
    }

    getData(): Object {
        return {
            parentProject: this.parentProjectDropdown.getValue()
        }
    }

    hasData(): boolean {
        return !!this.parentProjectDropdown.getValue();
    }

    getSelectedProject(): Project {
        return this.parentProjectDropdown?.getSelectedDisplayValues()[0];
    }

    setSelectedProject(value: Project): void {
        this.parentProjectDropdown.selectProject(value);
    }

    getName(): string {
        return 'projectCreate';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.parent.description');
    }
}
