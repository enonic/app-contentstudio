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
/*
        this.getFormItem().onRadioValueChanged(() => {
            this.notifyDataChanged();
        });
*/
        this.getFormItem().onProjectValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    protected getFormClass(): string {
        return 'project-type-step';
    }

    getData(): ProjectParentDialogStepData {
        return new ProjectParentDialogStepData().setParentProjects(this.getFormItem()?.getSelectedProjects());
    }

    hasData(): boolean {
        return this.getFormItem()?.hasData();
    }

    getName(): string {
        return 'projectCreate';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.parent.description');
    }

    private getFormItem(): ProjectTypeFormItem {
        return this.formItems?.[0] as ProjectTypeFormItem;
    }
}
