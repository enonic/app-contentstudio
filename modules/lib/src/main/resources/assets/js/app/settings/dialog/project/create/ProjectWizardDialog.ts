import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectTypeDialogStep} from './step/ProjectTypeDialogStep';
import {ProjectLocaleDialogStep} from './step/ProjectLocaleDialogStep';
import {ProjectIdDialogStep} from './step/ProjectIdDialogStep';
import {NamesAndIconView} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {ProjectIconUrlResolver} from '../../../../project/ProjectIconUrlResolver';
import {Project} from '../../../data/project/Project';
import {ProjectDialogStep} from './step/ProjectDialogStep';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {ProjectCreateRequest} from '../../../resource/ProjectCreateRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ProjectReadAccess} from '../../../data/project/ProjectReadAccess';
import {ProjectAccessDialogStep} from './step/ProjectAccessDialogStep';
import {ProjectSummaryStep} from './step/summary/ProjectSummaryStep';
import {ProjectData} from './data/ProjectData';
import {ProjectAccessDialogStepData} from './data/ProjectAccessDialogStepData';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ProjectPermissionsDialogStep} from './step/ProjectPermissionsDialogStep';
import {ProjectPermissionsDialogStepData} from './data/ProjectPermissionsDialogStepData';
import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {MultiStepDialog, MultiStepDialogConfig} from '@enonic/lib-admin-ui/ui/dialog/multistep/MultiStepDialog';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {ProjectIdDialogStepData} from './data/ProjectIdDialogStepData';
import {UpdateProjectLanguageRequest} from '../../../resource/UpdateProjectLanguageRequest';
import {UpdateProjectPermissionsRequest} from '../../../resource/UpdateProjectPermissionsRequest';
import {ProjectReadAccessType} from '../../../data/project/ProjectReadAccessType';
import {ProjectApplication} from '../../../wizard/panel/form/element/ProjectApplication';
import {ProjectApplicationsDialogStep} from './step/ProjectApplicationsDialogStep';
import {ProjectContext} from '../../../../project/ProjectContext';

export interface ProjectWizardDialogConfig
    extends MultiStepDialogConfig {
    parentProject?: Project;
}

export class ProjectWizardDialog
    extends MultiStepDialog {

    protected config: ProjectWizardDialogConfig;

    private isNameAutoGenerated: boolean;

    constructor(config: ProjectWizardDialogConfig) {
        super(config);
    }

    protected getSubmitActionLabel(): string {
        return i18n('dialog.project.wizard.action.submit');
    }

    protected initListeners() {
        super.initListeners();

        this.getParentProjectStep()?.onDataChanged(() => this.isNameAutoGenerated = true);
    }

    protected postInitElements() {
        super.postInitElements();

        this.toggleHeaderIcon(true);
    }

    protected displayStep(step: ProjectDialogStep) {
        super.displayStep(step);

        if (this.isNameAutoGenerated && this.isProjectIdStep()) {
            this.setNameFromParentProject();
        } else if (this.config.parentProject && this.isParentProjectStep()) {
            this.setParentProject();
        } else if (this.isLocaleDialogStep()) {
            (<ProjectLocaleDialogStep>this.currentStep).setParentProject(this.getParentProject());
        } else if (this.isAccessDialogStep()) {
            (<ProjectAccessDialogStep>this.currentStep).setParentProject(this.getParentProject());
        } else if (this.isPermissionsStep()) {
            (<ProjectPermissionsDialogStep>this.currentStep).setParentProject(this.getParentProject());
        } else if (this.isSummaryStep()) {
            this.setSummaryStepData();
        }
    }

    private isProjectIdStep(): boolean {
        return this.currentStep instanceof ProjectIdDialogStep;
    }

    private setNameFromParentProject(): void {
        const parentProject: Project = this.getParentProject();
        const locale: Locale = this.getSelectedLocale();

        if (parentProject && locale) {
            const newName: string = `${parentProject.getName()}-${locale.getId().toLowerCase()}`;
            const description: string =
                parentProject.getDescription() ? `${parentProject.getDescription()} (${locale.getDisplayName()})` : '';
            (<ProjectIdDialogStep>this.currentStep).setDescription(description, true);
            (<ProjectIdDialogStep>this.currentStep).setDisplayName(newName, true);
            (<ProjectIdDialogStep>this.currentStep).setName(newName);
        }

        this.isNameAutoGenerated = false;
    }

    private getParentProject(): Project {
        return this.getParentProjectStep()?.getData().getParentProject();
    }

    private getParentProjectStep(): ProjectTypeDialogStep {
        return <ProjectTypeDialogStep>this.steps.find((step: DialogStep) => step instanceof ProjectTypeDialogStep);
    }

    private getSelectedLocale(): Locale {
        return this.getSelectedLocaleStep()?.getData().getLocale();
    }

    private getSelectedLocaleStep(): ProjectLocaleDialogStep {
        return <ProjectLocaleDialogStep>this.steps.find((step: DialogStep) => step instanceof ProjectLocaleDialogStep);
    }

    private isParentProjectStep(): boolean {
        return this.currentStep instanceof ProjectTypeDialogStep;
    }

    private setParentProject(): void {
        (<ProjectTypeDialogStep>this.currentStep).setSelectedProject(this.config.parentProject);

        this.config.parentProject = null;
    }

    private isLocaleDialogStep(): boolean {
        return this.currentStep instanceof ProjectLocaleDialogStep;
    }

    private isAccessDialogStep(): boolean {
        return this.currentStep instanceof ProjectAccessDialogStep;
    }

    private isPermissionsStep(): boolean {
        return this.currentStep instanceof ProjectPermissionsDialogStep;
    }

    private isSummaryStep(): boolean {
        return this.currentStep instanceof ProjectSummaryStep;
    }

    private setSummaryStepData(): void {
        this.getSummaryStep()?.setData(this.collectData());
    }

    private getSummaryStep(): ProjectSummaryStep {
        return <ProjectSummaryStep>this.steps.find((step: DialogStep) => step instanceof ProjectSummaryStep);
    }

    protected submit() {
        this.lock();

        this.produceCreateItemRequest().sendAndParse().then((project: Project) => {
            return this.updateLocale(project.getName()).then(() => {
                return this.updatePermissions(project.getName()).then(() => {
                    if (!ProjectContext.get().isInitialized()) {
                        ProjectContext.get().setProject(project);
                    }

                    this.close();

                    showFeedback(i18n('notify.settings.project.created', project.getName()));
                    return Q.resolve();
                });
            });
        }).catch(DefaultErrorHandler.handle).finally(() => this.unlock());
    }

    private produceCreateItemRequest(): ProjectCreateRequest {
        const idData: ProjectIdDialogStepData = this.getProjectIdData();
        const access: ProjectAccessDialogStepData = this.getReadAccess();

        return <ProjectCreateRequest>new ProjectCreateRequest()
            .setParent(this.getParentProject()?.getName())
            .setReadAccess(new ProjectReadAccess(access.getAccess(), access.getPrincipals().map((p: Principal) => p.getKey())))
            .setDescription(idData.getDescription())
            .setName(idData.getName())
            .setDisplayName(idData.getDisplayName())
            .setApplications(this.getProjectApplications()?.map((app: ProjectApplication) => app.getApplicationKey().toString()));
    }

    private updateLocale(projectName: string): Q.Promise<void> {
        const locale: Locale = this.getSelectedLocale();

        return !!locale ? this.sendUpdateLocaleRequest(projectName, locale.getId()) : Q.resolve();
    }

    private sendUpdateLocaleRequest(projectName: string, language: string): Q.Promise<void> {
        return new UpdateProjectLanguageRequest()
            .setName(projectName)
            .setLanguage(language)
            .sendAndParse()
            .thenResolve(null);
    }

    private updatePermissions(projectName: string): Q.Promise<void> {
        const permissions: ProjectPermissionsDialogStepData = this.getPermissions();
        const readAccess: ProjectAccessDialogStepData = this.getReadAccess();

        if (permissions.isEmpty() && readAccess.getAccess() !== ProjectReadAccessType.CUSTOM) {
            return Q.resolve();
        }

        return this.updateProjectPermissions(projectName, permissions, readAccess);
    }

    private updateProjectPermissions(projectName: string, permissions: ProjectPermissionsDialogStepData,
                                     readAccess: ProjectAccessDialogStepData): Q.Promise<void> {
        return new UpdateProjectPermissionsRequest()
            .setName(projectName)
            .setPermissions(permissions.toProjectPermissions())
            .setViewers(readAccess.getPrincipals().map((p: Principal) => p.getKey()))
            .sendAndParse()
            .thenResolve(null);
    }

    private collectData(): ProjectData {
        const data: ProjectData = new ProjectData();
        const idData: ProjectIdDialogStepData = this.getProjectIdData();

        Object.assign(data, {
            description: idData.getDescription(),
            name: idData.getName(),
            displayName: idData.getDisplayName(),
            locale: this.getSelectedLocale(),
            parent: this.getParentProject(),
            access: this.getReadAccess(),
            permissions: this.getPermissions(),
            applications: this.getProjectApplications()
        });

        return data;
    }

    private getReadAccess(): ProjectAccessDialogStepData {
        return this.getProjectReadAccessStep()?.getData();
    }

    private getProjectReadAccessStep(): ProjectAccessDialogStep {
        return <ProjectAccessDialogStep>this.steps.find((step: DialogStep) => step instanceof ProjectAccessDialogStep);
    }

    private getProjectIdData(): ProjectIdDialogStepData {
        return this.getProjectIdStep()?.getData();
    }

    private getProjectIdStep(): ProjectIdDialogStep {
        return <ProjectIdDialogStep>this.steps.find((step: DialogStep) => step instanceof ProjectIdDialogStep);
    }

    private getPermissions(): ProjectPermissionsDialogStepData {
        return this.getProjectPermissionsStep()?.getData();
    }

    private getProjectPermissionsStep(): ProjectPermissionsDialogStep {
        return <ProjectPermissionsDialogStep>this.steps.find((step: DialogStep) => step instanceof ProjectPermissionsDialogStep);
    }

    private getProjectApplications(): ProjectApplication[] {
        return this.getProjectApplicationsStep()?.getData().getApplications();
    }

    private getProjectApplicationsStep(): ProjectApplicationsDialogStep {
        return <ProjectApplicationsDialogStep>this.steps.find((step: DialogStep) => step instanceof ProjectApplicationsDialogStep);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('project-wizard-dialog');

            return rendered;
        });
    }

    protected createHeaderContent(): NamesAndIconView {
        return super.createHeaderContent().setIconClass(ProjectIconUrlResolver.getDefaultProjectIcon());
    }
}
