import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ParentProjectDialogStep} from './step/ParentProjectDialogStep';
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
import {ProjectApplicationsDialogStep} from './step/ProjectApplicationsDialogStep';
import {ProjectContext} from '../../../../project/ProjectContext';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {ProjectApplication} from '../../../wizard/panel/form/element/ProjectApplication';

export interface ProjectWizardDialogConfig
    extends MultiStepDialogConfig {
    parentProjects?: Project[];
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

    private setParentProjectsInDialogStep(step: ProjectDialogStep): Q.Promise<void> {
        if (!(step instanceof ProjectDialogStep)) {
            return Q();
        }

        if (step instanceof ProjectApplicationsDialogStep) {
            return step.setParentProjects(this.getParentProjects());
        }

        step.setParentProjects(this.getParentProjects());
        if (this.isParentProjectStep(step)) {
            this.config.parentProjects = null;
        }
        return Q();
    }

    protected displayStep(step: ProjectDialogStep): Q.Promise<void> {
        return this.setParentProjectsInDialogStep(step).then(() => {
            super.displayStep(step);

            if (step instanceof ProjectIdDialogStep && this.isNameAutoGenerated) {
                this.setNameFromParentProjects();
            } else if (step instanceof ProjectSummaryStep) {
                this.setSummaryStepData();
            }
        });
    }

    private setNameFromParentProjects(): void {
        const parents = this.getParentProjects();
        const hasParents = parents?.length > 0;

        if (hasParents) {
            const locale = this.getSelectedLocale();

            const names = parents.map(p => p.getName()).join('-');
            const newName = locale ? `${names}-${locale.getId().toLowerCase()}` : names;

            const parentDescription = parents.length === 1 ? parents[0].getDescription() : null;
            const description = parentDescription ? `${parentDescription}${locale ? ` (${locale.getDisplayName()})` : ''}` : '';

            (this.currentStep as ProjectIdDialogStep).setDescription(description, true);
            (this.currentStep as ProjectIdDialogStep).setDisplayName(newName, true);
            (this.currentStep as ProjectIdDialogStep).setName(newName);
        }

        this.isNameAutoGenerated = false;
    }

    private getParentProjects(): Project[] | undefined {
        return this.config?.parentProjects || this.getParentProjectStep()?.getData().getParentProjects() || [];
    }

    private getParentProjectStep(): ParentProjectDialogStep {
        return this.steps.find((step: DialogStep) => step instanceof ParentProjectDialogStep);
    }

    private getSelectedLocale(): Locale {
        return this.getSelectedLocaleStep()?.getData().getLocale();
    }

    private getSelectedLocaleStep(): ProjectLocaleDialogStep {
        return this.steps.find((step: DialogStep) => step instanceof ProjectLocaleDialogStep);
    }

    private setSummaryStepData(): void {
        this.getSummaryStep()?.setData(this.collectData());
    }

    private getSummaryStep(): ProjectSummaryStep {
        return this.steps.find((step: DialogStep) => step instanceof ProjectSummaryStep);
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
                });
            });
        }).catch(DefaultErrorHandler.handle).finally(() => this.unlock());
    }

    private produceCreateItemRequest(): ProjectCreateRequest {
        const idData: ProjectIdDialogStepData = this.getProjectIdData();
        const access: ProjectAccessDialogStepData = this.getReadAccess();

        return new ProjectCreateRequest()
            .setParents(this.getParentProjects())
            .setReadAccess(new ProjectReadAccess(access.getAccess(), access.getPrincipals().map((p: Principal) => p.getKey())))
            .setDescription(idData.getDescription())
            .setName(idData.getName())
            .setDisplayName(idData.getDisplayName())
            .setApplicationConfigs(this.getApplicationsConfigs()) as ProjectCreateRequest;
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
            return Q();
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
        const idData: ProjectIdDialogStepData = this.getProjectIdData();

        return {
            description: idData.getDescription(),
            name: idData.getName(),
            displayName: idData.getDisplayName(),
            locale: this.getSelectedLocale(),
            parents: this.getParentProjects(),
            access: this.getReadAccess(),
            permissions: this.getPermissions(),
            applications: this.getProjectApplications()
        };
    }

    private getReadAccess(): ProjectAccessDialogStepData {
        return this.getProjectReadAccessStep()?.getData();
    }

    private getProjectReadAccessStep(): ProjectAccessDialogStep {
        return this.steps.find((step: DialogStep) => step instanceof ProjectAccessDialogStep);
    }

    private getProjectIdData(): ProjectIdDialogStepData {
        return this.getProjectIdStep()?.getData();
    }

    private getProjectIdStep(): ProjectIdDialogStep {
        return this.steps.find((step: DialogStep) => step instanceof ProjectIdDialogStep);
    }

    private getPermissions(): ProjectPermissionsDialogStepData {
        return this.getProjectPermissionsStep()?.getData();
    }

    private getProjectPermissionsStep(): ProjectPermissionsDialogStep {
        return this.steps.find((step: DialogStep) => step instanceof ProjectPermissionsDialogStep);
    }

    private getProjectApplications(): ProjectApplication[] {
        return this.getProjectApplicationsStep()?.getData().getProjectApplications();
    }

    private getApplicationsConfigs(): ApplicationConfig[] {
        return this.getProjectApplications()?.map((app: ProjectApplication) => app.getConfig());
    }

    private getProjectApplicationsStep(): ProjectApplicationsDialogStep {
        return this.steps.find((step: DialogStep) => step instanceof ProjectApplicationsDialogStep);
    }

    private isParentProjectStep(step: DialogStep): boolean {
        return step instanceof ParentProjectDialogStep;
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
