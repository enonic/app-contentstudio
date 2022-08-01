import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {MultiStepDialog} from './MultiStepDialog';
import {DialogStep} from './DialogStep';
import {ProjectParentDialogStep} from './ProjectParentDialogStep';
import {ProjectLocaleDialogStep} from './ProjectLocaleDialogStep';
import {ProjectIdDialogStep, ProjectIdStepData} from './ProjectIdDialogStep';
import {NamesAndIconView, NamesAndIconViewBuilder} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {ProjectIconUrlResolver} from '../../project/ProjectIconUrlResolver';
import {Project} from '../data/project/Project';
import {ProjectDialogStep} from './ProjectDialogStep';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {ProjectCreateRequest} from '../resource/ProjectCreateRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ProjectReadAccess} from '../data/project/ProjectReadAccess';
import {ProjectAccessDialogStep} from './ProjectAccessDialogStep';
import {ProjectSummaryStep} from './ProjectSummaryStep';
import {ProjectData} from './ProjectData';
import {ProjectAccessData} from './ProjectAccessData';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ProjectPermissionsDialogStep} from './ProjectPermissionsDialogStep';
import {ProjectPermissionsData} from './ProjectPermissionsData';

export class ProjectWizardDialog
    extends MultiStepDialog {

    private preSelectedProject?: Project;

    private isNameToBeGeneratedFromParent: boolean;

    private headerContent: NamesAndIconView;

    constructor(steps: DialogStep[], preselectedProject?: Project) {
        super({
            class: 'project-wizard-dialog grey-header',
            steps: steps
        });

        this.preSelectedProject = preselectedProject;
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
        } else if (this.preSelectedProject && this.isProjectParentStep()) {
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
        (<ProjectParentDialogStep>this.currentStep).setSelectedProject(this.preSelectedProject);

        this.preSelectedProject = null;
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
            console.log(project);
            return Q.resolve();
        })
            .catch(DefaultErrorHandler.handle)
            .finally(() => this.unlock());
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
