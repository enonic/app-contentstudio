import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectDialogStep} from './ProjectDialogStep';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectParentDialogStepData} from '../data/ProjectParentDialogStepData';
import {ParentProjectFormItem} from '../../../../wizard/panel/form/element/ParentProjectFormItem';

export class ParentProjectDialogStep
    extends ProjectDialogStep {

    private projectTypeFormItem: ParentProjectFormItem;

    createFormItems(): FormItem[] {
        this.projectTypeFormItem = new ParentProjectFormItem();
        if (this.hasParentProjects()) {
            this.projectTypeFormItem.setSelectedProjects(this.getParentProjects());
        }
        return [this.projectTypeFormItem];
    }

    protected initEventListeners(): void {
        super.initEventListeners();

        this.projectTypeFormItem.onProjectValueChanged(() => this.notifyDataChanged());
    }

    protected getFormClass(): string {
        return 'project-type-step';
    }

    getData(): ProjectParentDialogStepData {
        return new ProjectParentDialogStepData().setParentProjects(this.projectTypeFormItem?.getSelectedProjects());
    }

    hasData(): boolean {
        return this.projectTypeFormItem?.hasData();
    }

    getName(): string {
        return 'projectCreate';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.parent.description');
    }
}
