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
import {Project} from '../data/project/Project';
import {ProjectViewItem} from '../view/ProjectViewItem';
import {ProjectWizardActions} from './action/ProjectWizardActions';
import {ProjectReadAccessWizardStepForm} from './ProjectReadAccessWizardStepForm';
import {ProjectHelper} from '../data/project/ProjectHelper';
import {SettingDataItemWizardStepForm} from './SettingDataItemWizardStepForm';

export class ProjectWizardPanel
    extends SettingsDataItemWizardPanel<ProjectViewItem> {

    private projectWizardStepForm: ProjectItemNameWizardStepForm;

    private readAccessWizardStepForm?: ProjectReadAccessWizardStepForm;

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

        if (this.isItemPersisted() && ProjectHelper.isDefault(this.getPersistedItem().getData())) {
            return [this.projectWizardStepForm];
        }

        this.readAccessWizardStepForm = new ProjectReadAccessWizardStepForm();

        return [this.projectWizardStepForm, this.readAccessWizardStepForm];
    }

    protected isNewItemChanged(): boolean {
        return !StringHelper.isBlank(this.projectWizardStepForm.getProjectName()) ||
            !StringHelper.isBlank(this.projectWizardStepForm.getDescription()) ||
            !this.projectWizardStepForm.getPermissions().isEmpty() ||
               super.isNewItemChanged();
    }

    protected isPersistedItemChanged(): boolean {
        const item: ProjectViewItem = this.getPersistedItem();

        if (!ObjectHelper.stringEquals(item.getName(), this.projectWizardStepForm.getProjectName())) {
            return true;
        }

        if (!ObjectHelper.stringEquals(item.getDescription(), this.projectWizardStepForm.getDescription())) {
            return true;
        }

        const isDefaultProject: boolean = ProjectHelper.isDefault(item.getData());

        if (!isDefaultProject && !ObjectHelper.equals(item.getPermissions(), this.projectWizardStepForm.getPermissions())) {
            return true;
        }

        if (!isDefaultProject && !ObjectHelper.equals(item.getReadAccess(), this.readAccessWizardStepForm.getReadAccess())) {
            return true;
        }

        return super.isPersistedItemChanged();
    }

    postPersistNewItem(item: ProjectViewItem): Q.Promise<ProjectViewItem> {
        return super.postPersistNewItem(item).then(() => {
            this.projectWizardStepForm.disableProjectNameInput();
            this.projectWizardStepForm.disableHelpText();

            return Q(item);
        });
    }

    persistNewItem(): Q.Promise<ProjectViewItem> {
        return this.produceCreateItemRequest().sendAndParse().then((project: Project) => {
            const item: ProjectViewItem = ProjectViewItem.create().setData(project).build();

            showFeedback(this.getSuccessfulCreateMessage(item));
            return item;
        });
    }

    protected createDeleteRequest(): ProjectDeleteRequest {
        return new ProjectDeleteRequest(this.getPersistedItem().getName());
    }

    protected getSuccessfulDeleteMessage(): string {
        return i18n('notify.settings.project.deleted', this.getPersistedItem().getName());
    }

    updatePersistedItem(): Q.Promise<ProjectViewItem> {
        return this.produceUpdateItemRequest().sendAndParse().then((project: Project) => {
            const item: ProjectViewItem = ProjectViewItem.create().setData(project).build();

            showFeedback(this.getSuccessfulUpdateMessage(item));
            return item;
        });
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
            .setPermissions(this.projectWizardStepForm.getPermissions())
            .setReadAccess(this.readAccessWizardStepForm.getReadAccess())
            .setThumbnail(thumbnail);
    }

    private produceUpdateItemRequest(): ProjectUpdateRequest {
        const displayName: string = this.wizardHeader.getDisplayName();
        const thumbnail: File = this.getFormIcon().getThumbnailFile();

        return new ProjectUpdateRequest()
            .setDescription(this.projectWizardStepForm.getDescription())
            .setName(this.projectWizardStepForm.getProjectName())
            .setDisplayName(displayName)
            .setPermissions(this.projectWizardStepForm.getPermissions())
            .setReadAccess(!!this.readAccessWizardStepForm ? this.readAccessWizardStepForm.getReadAccess() : null)
            .setThumbnail(thumbnail);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('project-wizard-panel');

            return rendered;
        });
    }
}
