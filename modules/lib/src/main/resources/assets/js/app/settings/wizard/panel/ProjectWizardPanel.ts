import {SettingsDataItemWizardPanel} from './SettingsDataItemWizardPanel';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
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
import {UpdateProjectReadAccessRequest} from '../../resource/UpdateProjectReadAccessRequest';
import {ProjectDataItemFormIcon} from './form/element/ProjectDataItemFormIcon';
import {ConfirmValueDialog} from '../../../remove/ConfirmValueDialog';
import {TextInputSize} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {ProjectApplicationsWizardStepForm} from './form/ProjectApplicationsWizardStepForm';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {LangDirection} from '@enonic/lib-admin-ui/dom/Element';

export class ProjectWizardPanel
    extends SettingsDataItemWizardPanel<ProjectViewItem> {

    private projectWizardStepForm: ProjectItemNameWizardStepForm;

    private readAccessWizardStepForm: ProjectReadAccessWizardStepForm;

    private rolesWizardStepForm?: ProjectRolesWizardStepForm;

    private applicationsWizardStepForm?: ProjectApplicationsWizardStepForm;

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
        return this.wizardActions as ProjectWizardActions;
    }

    isEditAllowed(): boolean {
        const persistedItem = this.getPersistedItem();
        if (!persistedItem) {
            return true; // New project - edit is allowed
        }
        return persistedItem.isEditAllowed();
    }

    isDeleteAllowed(): boolean {
        return this.getPersistedItem().isDeleteAllowed() && !this.hasChildrenLayers;
    }

    setHasChildrenLayers(value: boolean) {
        if (value !== this.hasChildrenLayers) {
            this.hasChildrenLayers = value;
            this.updateToolbarActions();
        }
    }

    protected checkIfEditIsAllowed(): Q.Promise<boolean> {
        return Q.resolve(this.isEditAllowed());
    }

    protected createStepsForms(): SettingDataItemWizardStepForm<ProjectViewItem>[] {
        const stepForms: SettingDataItemWizardStepForm<ProjectViewItem>[] = [];

        stepForms.push(
            this.projectWizardStepForm = new ProjectItemNameWizardStepForm(),
            this.readAccessWizardStepForm = new ProjectReadAccessWizardStepForm(),
            this.rolesWizardStepForm = new ProjectRolesWizardStepForm(),
            this.applicationsWizardStepForm = new ProjectApplicationsWizardStepForm()
        );

        return stepForms;
    }

    protected isNewItemChanged(): boolean {
        throw new Error('Project creation is done via Project Wizard Dialog');
    }

    protected isPersistedItemChanged(): boolean {
        return this.isProjectMetaChanged() || this.isLanguageChanged() || this.isPermissionsChanged() || this.isReadAccessChanged() ||
               this.isApplicationsChanged();
    }

    postPersistNewItem(item: ProjectViewItem): Q.Promise<ProjectViewItem> {
        throw new Error('Project creation is done via Project Wizard Dialog');
    }

    persistNewItem(): Q.Promise<ProjectViewItem> {
        throw new Error('Project creation is done via Project Wizard Dialog');
    }

    updatePersistedItem(): Q.Promise<ProjectViewItem> {
        return this.doUpdatePersistedItem().then((project: Project) => {
            const item: ProjectViewItem = ProjectViewItem.create().setData(project).build();
            this.wizardHeader.setDisplayName(project.getDisplayName());
            this.projectWizardStepForm.setDescription(project.getDescription(), true);
            this.readAccessWizardStepForm.clean();

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

    protected updateIcon(): Q.Promise<void> {
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
        if (!ObjectHelper.equals(item.getPermissions(), this.rolesWizardStepForm.getPermissions())) {
            return true;
        }

        return !ObjectHelper.arrayEquals(
            item.getReadAccess().getPrincipalsKeys(),
            this.readAccessWizardStepForm.getReadAccess().getPrincipalsKeys()
        );
    }

    private isReadAccessChanged(): boolean {
        if (!this.isItemPersisted()) {
            return true;
        }

        return this.getPersistedItem().getReadAccess().getType() !== this.readAccessWizardStepForm.getReadAccess().getType();
    }

    protected handleDataChanged() {
        this.updateToolbarActions();
        (this.formIcon as ProjectDataItemFormIcon).updateLanguage(this.readAccessWizardStepForm.getLanguage());
    }

    private getNewProjectInstance(projectPrototype: Project, language: string): Project {
        const permissions: ProjectPermissions = this.rolesWizardStepForm?.getPermissions();
        const readAccess: ProjectReadAccess = this.readAccessWizardStepForm.getReadAccess();
        const configs: ApplicationConfig[] = this.applicationsWizardStepForm?.getApplicationConfigs();

        return new ProjectBuilder(projectPrototype)
            .setLanguage(language)
            .setPermissions(permissions)
            .setReadAccess(readAccess)
            .setSiteConfigs(configs)
            .build();
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

    private updateLanguageAndPermissionsIfNeeded(project: Project): Q.Promise<Project> {
        const languagePromise: Q.Promise<string> =
            this.isLanguageChanged() ?
            this.updateProjectLanguage(project.getName(), this.readAccessWizardStepForm.getLanguage()) : Q(project.getLanguage());

        return languagePromise.then((language: string) => {
            return this.updateAccessAndPermissionsForExistingProject(project, language);
        });
    }

    private doUpdatePersistedItem(): Q.Promise<Project> {
        const projectPromise: Q.Promise<Project> = (this.isProjectMetaChanged() || this.isApplicationsChanged()) ?
                                                   this.produceUpdateItemRequest().sendAndParse() : Q(this.getPersistedItem().getData());

        return projectPromise.then((project: Project) => {
            return this.updateLanguageAndPermissionsIfNeeded(project).then();
        });
    }

    private getDisplayName(): string {
        return this.wizardHeader.getDisplayName().trim();
    }

    private produceUpdateItemRequest(): ProjectUpdateRequest {
        return new ProjectUpdateRequest()
            .setDescription(this.projectWizardStepForm.getDescription().trim())
            .setName(this.projectWizardStepForm.getProjectName())
            .setDisplayName(this.getDisplayName())
            .setApplicationConfigs(this.applicationsWizardStepForm?.getApplicationConfigs());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('project-wizard-panel');

            return rendered;
        });
    }

    getParentProjectsNames(): string[] | undefined {
        return this.projectWizardStepForm ? this.projectWizardStepForm.getParentProjectsNames() : undefined;
    }

    getParentProjects(): Project[] | undefined {
        return this.projectWizardStepForm ? this.projectWizardStepForm.getParentProjects() : undefined;
    }

    updateParentProjects(projects: Project[] | undefined) {
        this.whenRendered(() => {
            this.projectWizardStepForm.setParentProjects(projects);

            const isExistingLayer = projects?.length > 0 && this.getPersistedItem();
            if (isExistingLayer) {
                this.projectWizardStepForm.disableParentProjectElements();
            }

            this.readAccessWizardStepForm.setParentProjects(projects);
            this.rolesWizardStepForm.setParentProjects(projects);
            this.applicationsWizardStepForm.setParentProjects(projects);

            this.projectWizardStepForm.onParentProjectChanged((p: Project) => {
                this.readAccessWizardStepForm.setParentProjects([p]);
                this.rolesWizardStepForm.setParentProjects([p]);
            });
        });
    }

    private isApplicationsChanged(): boolean {
        if (!this.isItemPersisted()) {
            return true;
        }

        const selectedAppsConfigs: ApplicationConfig[] = this.applicationsWizardStepForm?.getNonInheritedApplicationConfigs() || [];
        const persistedSiteConfigs: ApplicationConfig[] = this.getPersistedItem().getSiteConfigs() || [];

        return !ObjectHelper.arrayEquals(persistedSiteConfigs, selectedAppsConfigs);
    }

    protected initElements() {
        super.initElements();

        this.updateHeaderDir();
    }

    isValid(): boolean {
        return super.isValid() && !StringHelper.isBlank(this.getDisplayName());
    }

    protected setPersistedItem(newPersistedItem: ProjectViewItem) {
        super.setPersistedItem(newPersistedItem);

        this.updateHeaderDir();
    }

    private updateHeaderDir(): void {
        this.wizardHeader?.setDir(Locale.supportsRtl(this.getPersistedItem()?.getLanguage()) ? LangDirection.RTL : LangDirection.AUTO);
    }
}
