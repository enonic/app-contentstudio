import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectDialogStep} from './ProjectDialogStep';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Project} from '../../../../data/project/Project';
import {ProjectParentDialogStepData} from '../data/ProjectParentDialogStepData';
import {ProjectTypeFormItem} from '../../../../wizard/panel/form/element/ProjectTypeFormItem';
import * as Q from 'q';

export class ProjectTypeDialogStep
    extends ProjectDialogStep {

    protected createFormItems(): FormItem[] {
        return [new ProjectTypeFormItem()];
    }

    protected initEventListeners(): void {
        super.initEventListeners();

        this.getFormItem().onRadioValueChanged(() => {
            this.notifyDataChanged();
        });

        this.getFormItem().onProjectValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    protected getFormClass(): string {
        return 'project-type-step';
    }

    isOptional(): boolean {
        return false;
    }

    getData(): ProjectParentDialogStepData {
        return new ProjectParentDialogStepData().setParentProject(this.getFormItem()?.getSelectedProject());
    }

    hasData(): boolean {
        return this.getFormItem()?.hasData();
    }

    isValid(): Q.Promise<boolean> {
        return Q.resolve(this.hasData());
    }

    setSelectedProject(value: Project): void {
        this.getFormItem().setSelectedProject(value);
    }

    getName(): string {
        return 'projectCreate';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.parent.description');
    }

    private getFormItem(): ProjectTypeFormItem {
        return this.formItems && <ProjectTypeFormItem>this.formItems[0];
    }
}
