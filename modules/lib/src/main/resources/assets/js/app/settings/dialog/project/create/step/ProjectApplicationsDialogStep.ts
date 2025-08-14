import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {ProjectDialogStep} from './ProjectDialogStep';
import {ProjectApplicationsFormItem} from '../../../../wizard/panel/form/element/ProjectApplicationsFormItem';
import {ProjectApplicationsComboBox} from '../../../../wizard/panel/form/element/ProjectApplicationsComboBox';
import {ProjectApplicationsDialogStepData} from '../data/ProjectApplicationsDialogStepData';
import {ProjectApplicationsFormParams} from '../../../../wizard/panel/form/element/ProjectApplicationsFormParams';
import {Project} from '../../../../data/project/Project';
import Q from 'q';

export class ProjectApplicationsDialogStep
    extends ProjectDialogStep {

    private projectApplicationsFormItem: ProjectApplicationsFormItem;

    createFormItems(): FormItem[] {
        this.projectApplicationsFormItem = new ProjectApplicationsFormItem(this.getConfigForProjectApplicationsFormItem());
        return [this.projectApplicationsFormItem];
    }

    protected initEventListeners(): void {
        super.initEventListeners();

        this.getProjectApplicationsComboBox().onSelectionChanged(() => {
            this.notifyDataChanged();
        });
    }

    isOptional(): boolean {
        return true;
    }

    getData(): ProjectApplicationsDialogStepData {
        return new ProjectApplicationsDialogStepData().setProjectApplications(this.getProjectApplicationsComboBox()?.getSelectedApplications());
    }

    hasData(): boolean {
        return this.getProjectApplicationsComboBox()?.getSelectedApplications().length > 0;
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

    setParentProjects(projects: Project[]): Q.Promise<void> {
        super.setParentProjects(projects);

        if (!this.getProjectApplicationsComboBox()) {
            return Q();
        }

        return this.getProjectApplicationsComboBox().setParentProjects(projects);
    }

    private getConfigForProjectApplicationsFormItem(): ProjectApplicationsFormParams {
        return new ProjectApplicationsFormParams()
            .setConfigEditable(false)
            .setParentProjects(this.getParentProjects());
    }

    private getProjectApplicationsComboBox(): ProjectApplicationsComboBox {
        return this.projectApplicationsFormItem?.getComboBox();
    }
}
