import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ProjectParentDialogStep} from './step/ProjectParentDialogStep';
import {ProjectLocaleDialogStep} from './step/ProjectLocaleDialogStep';
import {ProjectIdDialogStep, ProjectIdStepData} from './step/ProjectIdDialogStep';
import {NamesAndIconView, NamesAndIconViewBuilder} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {ProjectIconUrlResolver} from '../../../../project/ProjectIconUrlResolver';
import {Project} from '../../../data/project/Project';
import {ProjectDialogStep} from './step/ProjectDialogStep';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {ProjectCreateRequest} from '../../../resource/ProjectCreateRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ProjectReadAccess} from '../../../data/project/ProjectReadAccess';
import {ProjectAccessDialogStep} from './step/ProjectAccessDialogStep';
import {ProjectSummaryStep} from './step/ProjectSummaryStep';
import {ProjectData} from './data/ProjectData';
import {ProjectAccessData} from './data/ProjectAccessData';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ProjectPermissionsDialogStep} from './step/ProjectPermissionsDialogStep';
import {ProjectPermissionsData} from './data/ProjectPermissionsData';
import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {MultiStepDialog, MultiStepDialogConfig} from '@enonic/lib-admin-ui/ui/dialog/multistep/MultiStepDialog';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';

export interface ProjectWizardDialogConfig extends MultiStepDialogConfig {
    preSelectedProject?: Project;
    redirectAfterCreate?: boolean;
}

export class ProjectWizardDialog
    extends MultiStepDialog {

    protected config: ProjectWizardDialogConfig;

    private isNameToBeGeneratedFromParent: boolean;

    private headerContent: NamesAndIconView;

    constructor(config: ProjectWizardDialogConfig) {
        super(config);
    }

    protected initElements() {
        super.initElements();

        this.headerContent = this.getHeaderContent();
    }

    protected getSubmitActionLabel(): string {
        return i18n('dialog.project.wizard.action.submit');
    }

    protected initListeners() {
        super.initListeners();

        this.getProjectParentStep()?.onDataChanged(() => this.isNameToBeGeneratedFromParent = true);
    }

    protected displayStep(step: ProjectDialogStep) {
        super.displayStep(step);

        this.updateSubTitle();

        if (this.isNameToBeGeneratedFromParent && this.isProjectIdStep()) {
            this.setProjectNameFromParent();
        } else if (this.config.preSelectedProject && this.isProjectParentStep()) {
            this.setPreSelectedProject();
        } else if (this.isSummaryStep()) {
            this.setSummaryStepData();
        }
    }

    private updateSubTitle(): void {
        this.headerContent.setSubName(this.currentStep.getDescription() || '');
    }

    private isProjectIdStep(): boolean {
        return this.currentStep instanceof ProjectIdDialogStep;
    }

    private setProjectNameFromParent(): void {
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

        this.isNameToBeGeneratedFromParent = false;
    }

    private getParentProject(): Project {
        return this.getProjectParentStep()?.getSelectedProject();
    }

    private getProjectParentStep(): ProjectParentDialogStep {
        return <ProjectParentDialogStep>this.steps.find((step: DialogStep) => step instanceof ProjectParentDialogStep);
    }

    private getSelectedLocale(): Locale {
        return this.getSelectedLocaleStep()?.getSelectedLocale();
    }

    private getSelectedLocaleStep(): ProjectLocaleDialogStep {
        return <ProjectLocaleDialogStep>this.steps.find((step: DialogStep) => step instanceof ProjectLocaleDialogStep);
    }

    private isProjectParentStep(): boolean {
        return this.currentStep instanceof ProjectParentDialogStep;
    }

    private setPreSelectedProject(): void {
        (<ProjectParentDialogStep>this.currentStep).setSelectedProject(this.config.preSelectedProject);

        this.config.preSelectedProject = null;
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
            this.close();

            if (this.config.redirectAfterCreate) {
                this.redirectAfterCreate();
            } else {
                showFeedback(i18n('notify.settings.project.created', project.getName()));
            }
            return Q.resolve();
        })
            .catch(DefaultErrorHandler.handle)
            .finally(() => this.unlock());
    }

    private redirectAfterCreate(): void {
    //
    }

    private produceCreateItemRequest(): ProjectCreateRequest {
        const idData: ProjectIdStepData = this.getProjectIdData();
        const access: ProjectAccessData = this.getReadAccess();

        return <ProjectCreateRequest>new ProjectCreateRequest()
            .setParent(this.getParentProject()?.getName())
            .setReadAccess(new ProjectReadAccess(access.getType(), access.getPrincipals().map((p: Principal) => p.getKey())))
            .setDescription(idData.description)
            .setName(idData.name)
            .setDisplayName(idData.displayName);
    }

    private collectData(): ProjectData {
        const data: ProjectData = new ProjectData();
        const idData: ProjectIdStepData = this.getProjectIdData();

        data.description = idData.description;
        data.name = idData.name;
        data.displayName = idData.displayName;
        data.locale = this.getSelectedLocale();
        data.parent = this.getParentProject();
        data.access = this.getReadAccess();
        data.permissions = this.getPermissions();

        return data;
    }

    private getReadAccess(): ProjectAccessData {
        return this.getProjectReadAccessStep()?.getReadAccess();
    }

    private getProjectReadAccessStep(): ProjectAccessDialogStep {
        return <ProjectAccessDialogStep>this.steps.find((step: DialogStep) => step instanceof ProjectAccessDialogStep);
    }

    private getProjectIdData(): ProjectIdStepData {
        return this.getProjectIdStep()?.getData();
    }

    private getProjectIdStep(): ProjectIdDialogStep {
        return <ProjectIdDialogStep>this.steps.find((step: DialogStep) => step instanceof ProjectIdDialogStep);
    }

    private getPermissions(): ProjectPermissionsData {
        return this.getProjectPermissionsStep()?.getPermissions();
    }

    private getProjectPermissionsStep(): ProjectPermissionsDialogStep {
        return <ProjectPermissionsDialogStep>this.steps.find((step: DialogStep) => step instanceof ProjectPermissionsDialogStep);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildToHeader(this.headerContent);
            this.addClass('project-wizard-dialog grey-header');

            return rendered;
        });
    }

    private getHeaderContent(): NamesAndIconView {
        const namesAndIconView: NamesAndIconView = new NamesAndIconView(new NamesAndIconViewBuilder()
            .setSize(NamesAndIconViewSize.medium))
            .setMainName(i18n('dialog.project.wizard.title'))
            .setIconClass(ProjectIconUrlResolver.getDefaultProjectIcon());

        return namesAndIconView;
    }
}
