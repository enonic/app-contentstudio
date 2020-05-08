import {SettingsDataItemWizardPanel} from './SettingsDataItemWizardPanel';
import {i18n} from 'lib-admin-ui/util/Messages';
import * as Q from 'q';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ProjectCreateRequest} from '../resource/ProjectCreateRequest';
import {ProjectUpdateRequest} from '../resource/ProjectUpdateRequest';
import {ProjectDeleteRequest} from '../resource/ProjectDeleteRequest';
import {WizardHeaderWithDisplayNameAndName} from 'lib-admin-ui/app/wizard/WizardHeaderWithDisplayNameAndName';
import {ProjectItemNameWizardStepForm} from './ProjectItemNameWizardStepForm';
import {showFeedback} from 'lib-admin-ui/notify/MessageBus';
import {Project, ProjectBuilder} from '../data/project/Project';
import {ProjectViewItem} from '../view/ProjectViewItem';
import {ProjectWizardActions} from './action/ProjectWizardActions';
import {ProjectReadAccessWizardStepForm} from './ProjectReadAccessWizardStepForm';
import {SettingDataItemWizardStepForm} from './SettingDataItemWizardStepForm';
import {ProjectPermissions} from '../data/project/ProjectPermissions';
import {UpdateProjectLanguageRequest} from '../resource/UpdateProjectLanguageRequest';
import {ProjectReadAccess} from '../data/project/ProjectReadAccess';
import {UpdateProjectPermissionsRequest} from '../resource/UpdateProjectPermissionsRequest';
import {ProjectRolesWizardStepForm} from './ProjectRolesWizardStepForm';
import {NamePrettyfier} from 'lib-admin-ui/NamePrettyfier';
import {ProjectUpdateIconRequest} from '../resource/ProjectUpdateIconRequest';
import {ProjectIconUrlResolver} from '../../project/ProjectIconUrlResolver';
import {EditProjectAccessDialog} from '../../wizard/EditProjectAccessDialog';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {TaskState} from 'lib-admin-ui/task/TaskState';
import {UpdateProjectReadAccessRequest} from '../resource/UpdateProjectReadAccessRequest';

export class ProjectWizardPanel
    extends SettingsDataItemWizardPanel<ProjectViewItem> {

    private projectWizardStepForm: ProjectItemNameWizardStepForm;

    private readAccessWizardStepForm: ProjectReadAccessWizardStepForm;

    private rolesWizardStepForm?: ProjectRolesWizardStepForm;

    private editProjectAccessDialog: EditProjectAccessDialog = new EditProjectAccessDialog();

    protected getIconClass(): string {
        return ProjectIconUrlResolver.DEFAULT_ICON_CLASS;
    }

    protected createWizardHeader(): WizardHeaderWithDisplayNameAndName {
        const header: WizardHeaderWithDisplayNameAndName = super.createWizardHeader();

        header.onPropertyChanged(() => {
            if (this.getPersistedItem()) {
                return;
            }

            this.projectWizardStepForm.setProjectName(this.prettifyHeader(header.getDisplayName()));
        });

        return header;
    }

    private prettifyHeader(value: string): string {
        const prettified: string = NamePrettyfier.prettify(value)
            .replace(/^[^a-z0-9]+/ig, '')
            .replace(/[^a-z0-9]+$/ig, '')
            .replace(/\./g, '');

        return prettified;
    }

    protected createWizardActions(): ProjectWizardActions {
        return new ProjectWizardActions(this);
    }

    protected createStepsForms(persistedItem: ProjectViewItem): SettingDataItemWizardStepForm<ProjectViewItem>[] {
        this.projectWizardStepForm = new ProjectItemNameWizardStepForm();
        this.readAccessWizardStepForm = new ProjectReadAccessWizardStepForm();

        const isDefaultProject: boolean = !!persistedItem && persistedItem.isDefaultProject();

        if (isDefaultProject) {
            return [this.projectWizardStepForm, this.readAccessWizardStepForm];
        }

        this.rolesWizardStepForm = new ProjectRolesWizardStepForm();

        return [this.projectWizardStepForm, this.readAccessWizardStepForm, this.rolesWizardStepForm];
    }

    protected isNewItemChanged(): boolean {
        return !StringHelper.isBlank(this.projectWizardStepForm.getProjectName()) ||
               !StringHelper.isBlank(this.projectWizardStepForm.getDescription()) ||
               (this.rolesWizardStepForm && !this.rolesWizardStepForm.getPermissions().isEmpty()) ||
               super.isNewItemChanged();
    }

    protected isPersistedItemChanged(): boolean {
        return this.isProjectMetaChanged() || this.isLanguageChanged() || this.isPermissionsChanged() || this.isReadAccessChanged();
    }

    postPersistNewItem(item: ProjectViewItem): Q.Promise<ProjectViewItem> {
        return super.postPersistNewItem(item).then(() => {
            this.projectWizardStepForm.disableProjectNameInput();
            this.projectWizardStepForm.disableHelpText();

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
            return this.updateLanguageAndPermissionsIfNeeded(project);
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
            .setViewers(readAccess.getPrincipals())
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

            return (!ObjectHelper.arrayEquals(item.getReadAccess().getPrincipals(),
                this.readAccessWizardStepForm.getReadAccess().getPrincipals()));
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
    }

    private updateLanguageAndPermissionsIfNeeded(project: Project): Q.Promise<Project> {
        const projectBuilder: ProjectBuilder = new ProjectBuilder(project);

        const languagePromise: Q.Promise<string> = this.isLanguageChanged() ?
                                                   this.updateProjectLanguage(project.getName(),
                                                       this.readAccessWizardStepForm.getLanguage()) : Q(project.getLanguage());

        return languagePromise.then((language: string) => {
            projectBuilder.setLanguage(language);

            const permissions: ProjectPermissions = this.rolesWizardStepForm ? this.rolesWizardStepForm.getPermissions() : null;
            const readAccess: ProjectReadAccess = this.readAccessWizardStepForm.getReadAccess();

            if (this.isPermissionsChanged()) {
                this.updateProjectPermissions(project.getName(), this.rolesWizardStepForm.getPermissions(), readAccess);
            }

            const readAccessPromise: Q.Promise<TaskId> = this.isReadAccessChanged() ?
                                                         this.updateProjectReadAccess(project.getName(), readAccess) : Q(
                    null);

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
                        result.resolve(projectBuilder.setPermissions(permissions).setReadAccess(readAccess).build());
                        this.editProjectAccessDialog.setSuppressNotifications(false);
                    });
                    this.editProjectAccessDialog.pollTask(taskId);

                    setTimeout(() => {
                        if (TaskState.FINISHED !== taskState && TaskState.FAILED !== taskState) {
                            this.editProjectAccessDialog.open();
                        }
                    }, 1000);

                } else {
                    result.resolve(projectBuilder.setPermissions(permissions).setReadAccess(readAccess).build());
                }


                return result.promise;
            });
        });
    }

    private doUpdatePersistedItem(): Q.Promise<Project> {
        const projectPromise: Q.Promise<Project> = this.isProjectMetaChanged() ?
                                                   this.produceUpdateItemRequest().sendAndParse() : Q(this.getPersistedItem().getData());

        return projectPromise.then((project: Project) => {
            return this.updateLanguageAndPermissionsIfNeeded(project).then();
        });
    }

    private produceCreateItemRequest(): ProjectCreateRequest {
        const displayName: string = this.wizardHeader.getDisplayName();

        return new ProjectCreateRequest()
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
}
