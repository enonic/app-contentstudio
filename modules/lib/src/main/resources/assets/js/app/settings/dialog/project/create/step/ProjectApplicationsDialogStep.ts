import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectDialogStep} from './ProjectDialogStep';
import {ProjectApplicationsFormItem} from '../../../../wizard/panel/form/element/ProjectApplicationsFormItem';
import {ProjectApplicationsComboBox} from '../../../../wizard/panel/form/element/ProjectApplicationsComboBox';
import {ProjectApplicationsDialogStepData} from '../data/ProjectApplicationsDialogStepData';

export class ProjectApplicationsDialogStep
    extends ProjectDialogStep {

    protected createFormItems(): FormItem[] {
        return [new ProjectApplicationsFormItem()];
    }

    protected initEventListeners(): void {
        super.initEventListeners();

        this.getProjectApplicationsComboBox().onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    isOptional(): boolean {
        return true;
    }

    getData(): ProjectApplicationsDialogStepData {
        return new ProjectApplicationsDialogStepData().setApplications(this.getProjectApplicationsComboBox().getSelectedDisplayValues());
    }

    hasData(): boolean {
        return !!this.getProjectApplicationsComboBox().getValue();
    }

    protected getFormClass(): string {
        return 'project-applications-step';
    }

    getName(): string {
        return 'projectApplications';
    }

    getDescription(): string {
        return i18n('dialog.project.wizard.applications.description');
    }

    private getProjectApplicationsComboBox(): ProjectApplicationsComboBox {
        return this.getFormItem().getComboBox();
    }

    private getFormItem(): ProjectApplicationsFormItem {
        return <ProjectApplicationsFormItem>this.formItems[0];
    }
}
