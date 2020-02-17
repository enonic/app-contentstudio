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

export class ProjectWizardPanel
    extends SettingsDataItemWizardPanel<ProjectViewItem> {

    protected wizardStepForm: ProjectItemNameWizardStepForm;

    protected createWizardStepForm(): ProjectItemNameWizardStepForm {
        return new ProjectItemNameWizardStepForm();
    }

    protected getIconClass(): string {
        return 'icon-tree-2';
    }

    protected createWizardHeader(): WizardHeaderWithDisplayNameAndName {
        const header: WizardHeaderWithDisplayNameAndName = super.createWizardHeader();
        header.onPropertyChanged(() => {
            if (this.getPersistedItem()) {
                return;
            }

            this.wizardStepForm.setProjectName(header.getDisplayName()
                .trim()
                .replace(/\s+/g, '-')
                .toLowerCase()
                .replace(Name.FORBIDDEN_CHARS, ''));
        });

        return header;
    }

    protected isNewItemChanged(): boolean {
        return !StringHelper.isBlank(this.wizardStepForm.getProjectName())
               || super.isNewItemChanged();
    }

    postPersistNewItem(item: ProjectViewItem): Q.Promise<ProjectViewItem> {
        return super.postPersistNewItem(item).then(() => {
            this.wizardStepForm.disableProjectNameInput();
            this.wizardStepForm.disableHelpText();

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

    protected isPersistedItemChanged(): boolean {
        const item: ProjectViewItem = this.getPersistedItem();

        if (!ObjectHelper.stringEquals(item.getName(), this.wizardStepForm.getProjectName())) {
            return true;
        }

        return super.isPersistedItemChanged();
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
            .setDescription(this.wizardStepForm.getDescription())
            .setName(this.wizardStepForm.getProjectName())
            .setDisplayName(displayName)
            .setThumbnail(thumbnail);
    }

    private produceUpdateItemRequest(): ProjectUpdateRequest {
        const displayName: string = this.wizardHeader.getDisplayName();
        const thumbnail: File = this.getFormIcon().getThumbnailFile();

        return new ProjectUpdateRequest()
            .setDescription(this.wizardStepForm.getDescription())
            .setName(this.wizardStepForm.getProjectName())
            .setDisplayName(displayName)
            .setThumbnail(thumbnail);
    }
}
