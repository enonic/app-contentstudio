import {ProjectsComboBox} from '../../../../wizard/panel/form/element/ProjectsComboBox';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectDialogStep} from './ProjectDialogStep';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Project} from '../../../../data/project/Project';
import {ParentProjectFormItem} from '../../../../wizard/panel/form/element/ParentProjectFormItem';
import {ProjectParentDialogStepData} from '../data/ProjectParentDialogStepData';

export class ProjectParentDialogStep
    extends ProjectDialogStep {

    protected createFormItems(): FormItem[] {
        return [new ParentProjectFormItem()];
    }

    protected initEventListeners(): void {
        super.initEventListeners();

        this.getParentProjectComboBox().onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    isOptional(): boolean {
        return true;
    }

    getData(): ProjectParentDialogStepData {
        return new ProjectParentDialogStepData().setParentProject(this.getParentProjectComboBox().getSelectedDisplayValues()[0]);
    }

    hasData(): boolean {
        return !!this.getParentProjectComboBox().getValue();
    }

    setSelectedProject(value: Project): void {
        this.getParentProjectComboBox().selectProject(value);
    }

    getName(): string {
        return 'projectCreate';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.parent.description');
    }

    private getParentProjectComboBox(): ProjectsComboBox {
        return (<ParentProjectFormItem>this.formItems[0]).getProjectsComboBox();
    }
}
