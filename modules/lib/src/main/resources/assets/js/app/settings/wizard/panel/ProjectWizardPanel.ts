import {SettingsDataItemWizardPanel} from './SettingsDataItemWizardPanel';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ProjectCreateRequest} from '../../resource/ProjectCreateRequest';
import {ProjectUpdateRequest} from '../../resource/ProjectUpdateRequest';
import {ProjectDeleteRequest} from '../../resource/ProjectDeleteRequest';
import {WizardHeaderWithDisplayNameAndName} from '@enonic/lib-admin-ui/app/wizard/WizardHeaderWithDisplayNameAndName';
import {ProjectItemNameWizardStepForm} from './form/ProjectItemNameWizardStepForm';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {Project, ProjectBuilder} from '../../data/project/Project';
import {ProjectViewItem} from '../../view/ProjectViewItem';
import {ProjectWizardActions} from '../action/ProjectWizardActions';
import {ProjectReadAccessWizardStepForm} from './form/ProjectReadAccessWizardStepForm';
import {SettingDataItemWizardStepForm} from './form/SettingDataItemWizardStepForm';
import {ProjectPermissions} from '../../data/project/ProjectPermissions';
import {UpdateProjectLanguageRequest} from '../../resource/UpdateProjectLanguageRequest';
import {ProjectReadAccess} from '../../data/project/ProjectReadAccess';
import {UpdateProjectPermissionsRequest} from '../../resource/UpdateProjectPermissionsRequest';
import {ProjectRolesWizardStepForm} from './form/ProjectRolesWizardStepForm';
import {ProjectUpdateIconRequest} from '../../resource/ProjectUpdateIconRequest';
import {EditProjectAccessDialog} from '../../../wizard/EditProjectAccessDialog';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {UpdateProjectReadAccessRequest} from '../../resource/UpdateProjectReadAccessRequest';
import {ProjectDataItemFormIcon} from './form/element/ProjectDataItemFormIcon';
import {ConfirmValueDialog} from '../../../remove/ConfirmValueDialog';
import {TextInputSize} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {ProjectApplicationsWizardStepForm} from './form/ProjectApplicationsWizardStepForm';

export class ProjectWizardPanel
    extends SettingsDataItemWizardPanel<ProjectViewItem> {

    private projectWizardStepForm: ProjectItemNameWizardStepForm;

    private readAccessWizardStepForm: ProjectReadAccessWizardStepForm;

    private rolesWizardStepForm?: ProjectRolesWizardStepForm;

    private applicationsWizardStepForm: ProjectApplicationsWizardStepForm;

    private editProjectAccessDialog: EditProjectAccessDialog = new EditProjectAccessDialog();

    private hasChildrenLayers: boolean = false;

    protected getIconClass(): string {
        return !!this.getPersistedItem() ? this.getPersistedItem().getIconClass() : this.getParams().type.getIconClass();
    }

    protected createWizardHeader(): WizardHeaderWithDisplayNameAndName {
        const header: WizardHeaderWithDisplayNameAndName = super.createWizardHeader();

        header.onPropertyChanged(() => {
            if (this.getPersistedItem()) {
                return;
            }

            this.projectWizardStepForm.setProjectName(header.getDisplayName());
        });

        return header;
    }

    protected initConfirmationDialog(): ConfirmValueDialog {
        return new ConfirmValueDialog({inputSize: TextInputSize.LARGE})
            .setValueToCheck(this.getPersistedItem().getId())
            .setSubheaderText(i18n('dialog.project.delete.confirm.subheader'))
            .setHeaderText(i18n('dialog.confirmDelete'))
            .setYesCallback(this.deletePersistedItem.bind(this));
    }

    protected createWizardActions(): ProjectWizardActions {
        return new ProjectWizardActions(this);
    }

    getWizardActions(): ProjectWizardActions {
        return <ProjectWizardActions>this.wizardActions;
    }

    isEditAllowed(loginResult: LoginResult): boolean {
        const persistedItem = this.getPersistedItem();
        if (!persistedItem || !loginResult) {
            return true; // New project - edit is allowed
        }
        return persistedItem.isEditAllowed(loginResult);
    }

    isDeleteAllowed(loginResult: LoginResult): boolean {
        return this.getPersistedItem().isDeleteAllowed(loginResult) && !this.hasChildrenLayers;
    }

    setHasChildrenLayers(value: boolean) {
        if (value !== this.hasChildrenLayers) {
            this.hasChildrenLayers = value;
            this.updateToolbarActions();
        }
    }

    protected checkIfEditIsAllowed(): Q.Promise<boolean> {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => this.isEditAllowed(loginResult));
    }

    protected createStepsForms(persistedItem: ProjectViewItem): SettingDataItemWizardStepForm<ProjectViewItem>[] {
        this.projectWizardStepForm = new ProjectItemNameWizardStepForm();
        this.readAccessWizardStepForm = new ProjectReadAccessWizardStepForm();

        const isDefaultProject: boolean = !!persistedItem && persistedItem.isDefaultProject();

        if (isDefaultProject) {
            return [this.projectWizardStepForm, this.readAccessWizardStepForm];
        }

        this.rolesWizardStepForm = new ProjectRolesWizardStepForm();
        this.applicationsWizardStepForm = new ProjectApplicationsWizardStepForm();

        return [this.projectWizardStepForm, this.readAccessWizardStepForm, this.rolesWizardStepForm, this.applicationsWizardStepForm];
    }

    protected isNewItemChanged(): boolean {
        return !StringHelper.isBlank(this.projectWizardStepForm.getProjectName()) ||
               !StringHelper.isBlank(this.projectWizardStepForm.getDescription()) ||
               (this.rolesWizardStepForm && !this.rolesWizardStepForm.getPermissions().isEmpty()) ||
               !this.readAccessWizardStepForm.isEmpty() ||
               super.isNewItemChanged();
    }

    protected isPersistedItemChanged(): boolean {
        return this.isProjectMetaChanged() || this.isLanguageChanged() || this.isPermissionsChanged() || this.isReadAccessChanged();
    }

    postPersistNewItem(item: ProjectViewItem): Q.Promise<ProjectViewItem> {
        return super.postPersistNewItem(item).then(() => {
            this.projectWizardStepForm.disableProjectNameHelpText();
            const parentProject = item.getData().getParent();
            if (parentProject) {
                this.projectWizardStepForm.showProjectsChain(parentProject);
                this.projectWizardStepForm.disableParentProjectHelpText();
                this.projectWizardStepForm.disableParentProjectInput();
            }

            this.projectWizardStepForm.disableProjectNameInput();

            return Q(item);
        });
    }

    persistNewItem(): Q.Promise<ProjectViewItem> {
        return this.doPersistNewItem().then((project: Project) => {
            const item: ProjectViewItem = ProjectViewItem.create().setData(project).build();

            showFeedback(this.getSuccessfulCreateMessage(item.getName()));
            return item;
        });
    }

    private doPersistNewItem(): Q.Promise<Project> {
        return this.produceCreateItemRequest().sendAndParse().then((project: Project) => {
            return this.updateLanguageAndPermissionsIfNeeded(project, true);
        });
    }

    updatePersistedItem(): Q.Promise<ProjectViewItem> {
        return this.doUpdatePersistedItem().then((project: Project) => {
            const item: ProjectViewItem = ProjectViewItem.create().setData(project).build();
            showFeedback(this.getSuccessfulUpdateMessage(item.getName()));
            return item;
        });
    }

    private updateProjectLanguage(projectName: string, language: string): Q.Promise<string> {
        return new UpdateProjectLanguageRequest()
            .setName(projectName)
            .setLanguage(language)
            .sendAndParse();
    }

    private updateProjectPermissions(projectName: string, permissions: ProjectPermissions,
                                     readAccess: ProjectReadAccess): Q.Promise<ProjectPermissions> {
        return new UpdateProjectPermissionsRequest()
            .setName(projectName)
            .setPermissions(permissions)
            .setViewers(readAccess.getPrincipalsKeys())
            .sendAndParse();
    }

    private updateProjectReadAccess(projectName: string, readAccess: ProjectReadAccess): Q.Promise<TaskId> {
        return new UpdateProjectReadAccessRequest()
            .setName(projectName)
            .setReadAccess(readAccess)
            .sendAndParse();
    }

    protected updateIcon(): Q.Promise<any> {
        const icon: File = this.getFormIcon().getThumbnailFile();

        return new ProjectUpdateIconRequest()
            .setName(this.projectWizardStepForm.getProjectName())
            .setIcon(icon)
            .sendAndParse().then(() => {
                showFeedback(this.getSuccessfulUpdateMessage(this.projectWizardStepForm.getProjectName()));
            });
    }

    protected createDeleteRequest(): ProjectDeleteRequest {
        return new ProjectDeleteRequest(this.getPersistedItem().getName());
    }

    protected getSuccessfulDeleteMessage(): string {
        return i18n('notify.settings.project.deleted', this.getPersistedItem().getName());
    }

    protected getSuccessfulCreateMessage(name: string): string {
        return i18n('notify.settings.project.created', name);
    }

    protected getSuccessfulUpdateMessage(name: string): string {
        return i18n('notify.settings.project.modified', name);
    }

    protected getIconTooltip(): string {
        return i18n('settings.projects.tooltip.saveProject');
    }

    protected createSettingsDataItemFormIcon(): ProjectDataItemFormIcon {
        return new ProjectDataItemFormIcon(this.getPersistedItem());
    }

    private isProjectMetaChanged(): boolean {
        if (!ObjectHelper.stringEquals(this.getPersistedItem().getDescription(), this.projectWizardStepForm.getDescription())) {
            return true;
        }

        return super.isPersistedItemChanged();
    }

    private isLanguageChanged(): boolean {
        const currentLanguage: string = this.isItemPersisted() ? this.getPersistedItem().getLanguage() : null;
        return !ObjectHelper.stringEquals(currentLanguage, this.readAccessWizardStepForm.getLanguage());
    }

    private isPermissionsChanged(): boolean {
        if (!this.isItemPersisted()) {
            return true;
        }

        const item: ProjectViewItem = this.getPersistedItem();
        const isDefaultProject: boolean = item.isDefaultProject();

        if (!isDefaultProject) {
            if (!ObjectHelper.equals(item.getPermissions(), this.rolesWizardStepForm.getPermissions())) {
                return true;
            }

            return (!ObjectHelper.arrayEquals(item.getReadAccess().getPrincipalsKeys(),
                this.readAccessWizardStepForm.getReadAccess().getPrincipalsKeys()));
        }

        return false;
    }

    private isReadAccessChanged(): boolean {
        if (!this.isItemPersisted()) {
            return true;
        }

        const item: ProjectViewItem = this.getPersistedItem();
        const isDefaultProject: boolean = item.isDefaultProject();

        return !isDefaultProject && item.getReadAccess().getType() !== this.readAccessWizardStepForm.getReadAccess().getType();
    }

    protected handleDataChanged() {
        this.updateToolbarActions();
        (<ProjectDataItemFormIcon>this.formIcon).updateLanguage(this.readAccessWizardStepForm.getLanguage());
    }

    private getNewProjectInstance(projectPrototype: Project, language: string): Project {
        const permissions: ProjectPermissions = this.rolesWizardStepForm?.getPermissions();
        const readAccess: ProjectReadAccess = this.readAccessWizardStepForm.getReadAccess();
        return new ProjectBuilder(projectPrototype)
            .setLanguage(language)
            .setPermissions(permissions)
            .setReadAccess(readAccess)
            .build();
    }

    private updateAccessAndPermissionsForNewProject(project: Project, language: string): Q.Promise<Project> {
        this.updatePermissionsIfNeeded(project);

        const result = Q.defer<Project>();
        result.resolve(this.getNewProjectInstance(project, language));
        return result.promise;
    }

    private updateAccessAndPermissionsForExistingProject(project: Project, language: string): Q.Promise<Project> {
        return this.updatePermissionsIfNeeded(project).then(() => {
            const readAccess: ProjectReadAccess = this.readAccessWizardStepForm.getReadAccess();
            const readAccessPromise: Q.Promise<TaskId> = this.isReadAccessChanged() ?
                this.updateProjectReadAccess(project.getName(), readAccess) : Q(null);

            return readAccessPromise.then((taskId: TaskId) => {
                const result = Q.defer<Project>();
                if (taskId) {
                    let taskState;

                    if (!this.getPersistedItem()) {
                        this.editProjectAccessDialog.setSuppressNotifications(true);
                    }
                    this.editProjectAccessDialog.setPath('/' + project.getName());
                    this.editProjectAccessDialog.onProgressComplete((state) => {
                        taskState = state;
                        result.resolve(this.getNewProjectInstance(project, language));
                        this.editProjectAccessDialog.setSuppressNotifications(false);
                    });
                    this.editProjectAccessDialog.pollTask(taskId);

                    setTimeout(() => {
                        if (TaskState.FINISHED !== taskState && TaskState.FAILED !== taskState) {
                            this.editProjectAccessDialog.open();
                        }
                    }, 1000);
                } else {
                    result.resolve(this.getNewProjectInstance(project, language));
                }
                return result.promise;
            });
        });
    }

    private updatePermissionsIfNeeded(project: Project): Q.Promise<ProjectPermissions> {
        if (!this.isPermissionsChanged()) {
            return Q(project.getPermissions());
        }

        const permissions: ProjectPermissions = this.rolesWizardStepForm?.getPermissions();
        const readAccess: ProjectReadAccess = this.readAccessWizardStepForm.getReadAccess();
        return this.updateProjectPermissions(project.getName(), permissions, readAccess);
    }

    private updateLanguageAndPermissionsIfNeeded(project: Project, isCreation: boolean): Q.Promise<Project> {
        const languagePromise: Q.Promise<string> =
            this.isLanguageChanged() ?
                this.updateProjectLanguage(project.getName(), this.readAccessWizardStepForm.getLanguage()) : Q(project.getLanguage());

        return languagePromise.then((language: string) => {
            if (isCreation) {
                return this.updateAccessAndPermissionsForNewProject(project, language);
            }

            return this.updateAccessAndPermissionsForExistingProject(project, language);
        });
    }

    private doUpdatePersistedItem(): Q.Promise<Project> {
        const projectPromise: Q.Promise<Project> = this.isProjectMetaChanged() ?
                                                   this.produceUpdateItemRequest().sendAndParse() : Q(this.getPersistedItem().getData());

        return projectPromise.then((project: Project) => {
            return this.updateLanguageAndPermissionsIfNeeded(project, false).then();
        });
    }

    private produceCreateItemRequest(): ProjectCreateRequest {
        const displayName: string = this.wizardHeader.getDisplayName();

        return <ProjectCreateRequest>new ProjectCreateRequest()
            .setParent(this.projectWizardStepForm.getParentProject())
            .setReadAccess(this.readAccessWizardStepForm.getReadAccess())
            .setDescription(this.projectWizardStepForm.getDescription())
            .setName(this.projectWizardStepForm.getProjectName())
            .setDisplayName(displayName);
    }

    private produceUpdateItemRequest(): ProjectUpdateRequest {
        const displayName: string = this.wizardHeader.getDisplayName();

        return new ProjectUpdateRequest()
            .setDescription(this.projectWizardStepForm.getDescription())
            .setName(this.projectWizardStepForm.getProjectName())
            .setDisplayName(displayName);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('project-wizard-panel');

            return rendered;
        });
    }

    getParentProject(): string {
        return !!this.projectWizardStepForm ? this.projectWizardStepForm.getParentProject() : null;
    }

    setParentProject(project?: Project) {
        this.whenRendered(() => {
            this.projectWizardStepForm.setParentProject(project);
            if (!!project && this.getPersistedItem()) { // Existing layer
                this.projectWizardStepForm.disableParentProjectElements(project.getName());
            }
            this.readAccessWizardStepForm.setParentProject(project);
            this.rolesWizardStepForm.setParentProject(project);

            this.projectWizardStepForm.onParentProjectChanged((_project: Project) => {
                this.readAccessWizardStepForm.setParentProject(_project);
                this.rolesWizardStepForm.setParentProject(_project);
            });
        });
    }
}
