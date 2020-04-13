import {SettingsDataItemWizardPanel} from './SettingsDataItemWizardPanel';
import {i18n} from 'lib-admin-ui/util/Messages';
import * as Q from 'q';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ProjectCreateRequest} from '../resource/ProjectCreateRequest';
import {ProjectUpdateRequest} from '../resource/ProjectUpdateRequest';
import {ProjectDeleteRequest} from '../resource/ProjectDeleteRequest';
import {Name} from 'lib-admin-ui/Name';
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

export class ProjectWizardPanel
    extends SettingsDataItemWizardPanel<ProjectViewItem> {

    private projectWizardStepForm: ProjectItemNameWizardStepForm;

    private readAccessWizardStepForm: ProjectReadAccessWizardStepForm;

    protected getIconClass(): string {
        return 'icon-tree-2';
    }

    protected createWizardHeader(): WizardHeaderWithDisplayNameAndName {
        const header: WizardHeaderWithDisplayNameAndName = super.createWizardHeader();
        header.onPropertyChanged(() => {
            if (this.getPersistedItem()) {
                return;
            }

            this.projectWizardStepForm.setProjectName(header.getDisplayName()
                .trim()
                .replace(/\s+/g, '-')
                .toLowerCase()
                .replace(Name.FORBIDDEN_CHARS, ''));
        });

        return header;
    }

    protected createWizardActions(): ProjectWizardActions {
        return new ProjectWizardActions(this);
    }

    protected createStepsForms(): SettingDataItemWizardStepForm<ProjectViewItem>[] {
        this.projectWizardStepForm = new ProjectItemNameWizardStepForm();
        this.readAccessWizardStepForm = new ProjectReadAccessWizardStepForm();

        return [this.projectWizardStepForm, this.readAccessWizardStepForm];
    }

    doLayout(persistedItem: ProjectViewItem): Q.Promise<void> {
        return super.doLayout(persistedItem).then(() => {
            if (!!persistedItem && persistedItem.isDefaultProject()) {
                return;
            }

            this.projectWizardStepForm.onAccessComboboxValueChanged((permissions: ProjectPermissions) => {
                this.readAccessWizardStepForm.updateFilteredPrincipalsByPermissions(permissions);
            });
        });
    }

    protected isNewItemChanged(): boolean {
        return !StringHelper.isBlank(this.projectWizardStepForm.getProjectName()) ||
            !StringHelper.isBlank(this.projectWizardStepForm.getDescription()) ||
            !this.projectWizardStepForm.getPermissions().isEmpty() ||
               super.isNewItemChanged();
    }

    protected isPersistedItemChanged(): boolean {
        return this.isProjectMetaChanged() || this.isLanguageChanged() || this.isPermissionsOrReadAccessChanged();
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

            showFeedback(this.getSuccessfulCreateMessage(item));
            return item;
        });
    }

    private doPersistNewItem(): Q.Promise<Project> {
        return this.produceCreateItemRequest().sendAndParse().then((project: Project) => {
            return this.updateLanguageAndPermissionsIfNeeded(project);
        });
    }

    private updateLanguageAndPermissionsIfNeeded(project: Project): Q.Promise<Project> {
        const projectBuilder: ProjectBuilder = new ProjectBuilder(project);

        const languagePromise: Q.Promise<string> = this.isLanguageChanged() ?
            this.updateProjectLanguage(project.getName(), this.readAccessWizardStepForm.getLanguage()) : Q(project.getLanguage());

        return languagePromise.then((language: string) => {
            projectBuilder.setLanguage(language);

            const permissions: ProjectPermissions = this.projectWizardStepForm.getPermissions();
            const readAccess: ProjectReadAccess = this.readAccessWizardStepForm.getReadAccess();

            const permissionsPromise: Q.Promise<void> = this.isPermissionsOrReadAccessChanged() ?
                this.updateProjectPermissions(project.getName(), permissions, readAccess) : Q(null);

            return permissionsPromise.then(() => {
                projectBuilder.setPermissions(permissions).setReadAccess(readAccess);

                return projectBuilder.build();
            });
        });
    }

    private updateProjectLanguage(projectName: string, language: string): Q.Promise<string> {
        return new UpdateProjectLanguageRequest()
            .setName(projectName)
            .setLanguage(language)
            .sendAndParse();
    }

    private updateProjectPermissions(projectName: string, permissions: ProjectPermissions, readAccess: ProjectReadAccess): Q.Promise<void> {
        return new UpdateProjectPermissionsRequest()
            .setName(projectName)
            .setPermissions(permissions)
            .setReadAccess(readAccess)
            .sendAndParse();
    }


    protected createDeleteRequest(): ProjectDeleteRequest {
        return new ProjectDeleteRequest(this.getPersistedItem().getName());
    }

    protected getSuccessfulDeleteMessage(): string {
        return i18n('notify.settings.project.deleted', this.getPersistedItem().getName());
    }

    updatePersistedItem(): Q.Promise<ProjectViewItem> {
        return this.doUpdatePersistedItem().then((project: Project) => {
            const item: ProjectViewItem = ProjectViewItem.create().setData(project).build();

            showFeedback(this.getSuccessfulUpdateMessage(item));
            return item;
        });
    }

    private doUpdatePersistedItem(): Q.Promise<Project> {
        const projectPromise: Q.Promise<Project> = this.isProjectMetaChanged() ?
            this.produceUpdateItemRequest().sendAndParse() : Q(this.getPersistedItem().getData());

        return projectPromise.then((project: Project) => {
            return this.updateLanguageAndPermissionsIfNeeded(project);
        });
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

    private isPermissionsOrReadAccessChanged(): boolean {
        if (!this.isItemPersisted()) {
            return true;
        }

        const item: ProjectViewItem = this.getPersistedItem();
        const isDefaultProject: boolean = item.isDefaultProject();

        if (!isDefaultProject && !ObjectHelper.equals(item.getPermissions(), this.projectWizardStepForm.getPermissions())) {
            return true;
        }

        return (!isDefaultProject && !ObjectHelper.equals(item.getReadAccess(), this.readAccessWizardStepForm.getReadAccess()));
    }

    protected handleDataChanged() {
        this.updateToolbarActions();
    }

    protected getSuccessfulCreateMessage(item: ProjectViewItem): string {
        return i18n('notify.settings.project.created', item.getName());
    }

    protected getSuccessfulUpdateMessage(item: ProjectViewItem): string {
        return i18n('notify.settings.project.modified', item.getName());
    }

    private produceCreateItemRequest(): ProjectCreateRequest {
        const displayName: string = this.wizardHeader.getDisplayName();
        const thumbnail: File = this.getFormIcon().getThumbnailFile();

        return new ProjectCreateRequest()
            .setDescription(this.projectWizardStepForm.getDescription())
            .setName(this.projectWizardStepForm.getProjectName())
            .setDisplayName(displayName)
            .setThumbnail(thumbnail);
    }

    private produceUpdateItemRequest(): ProjectUpdateRequest {
        const displayName: string = this.wizardHeader.getDisplayName();
        const thumbnail: File = this.getFormIcon().getThumbnailFile();

        return new ProjectUpdateRequest()
            .setDescription(this.projectWizardStepForm.getDescription())
            .setName(this.projectWizardStepForm.getProjectName())
            .setDisplayName(displayName)
            .setThumbnail(thumbnail);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('project-wizard-panel');

            return rendered;
        });
    }
}
