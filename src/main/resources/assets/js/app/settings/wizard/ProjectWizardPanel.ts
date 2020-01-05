import {ProjectItem} from '../data/ProjectItem';
import {SettingsItemWizardPanel} from './SettingsItemWizardPanel';
import {i18n} from 'lib-admin-ui/util/Messages';
import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import {Validators} from 'lib-admin-ui/ui/form/Validators';
import * as Q from 'q';
import {SettingItemWizardStepForm} from './SettingItemWizardStepForm';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ProjectCreateRequest} from '../resource/ProjectCreateRequest';
import {ProjectUpdateRequest} from '../resource/ProjectUpdateRequest';
import {ProjectDeleteRequest} from '../resource/ProjectDeleteRequest';

export class ProjectWizardPanel
    extends SettingsItemWizardPanel<ProjectItem> {

    protected wizardStepForm: ProjectItemNameWizardStepForm;

    protected createWizardStepForm(): ProjectItemNameWizardStepForm {
        return new ProjectItemNameWizardStepForm();
    }

    protected getIconClass(): string {
        return 'icon-tree-2';
    }

    protected isNewItemChanged(): boolean {
        return !StringHelper.isBlank(this.wizardStepForm.getProjectName())
               || super.isNewItemChanged();
    }

    protected isPersistedItemChanged(): boolean {
        const item: ProjectItem = this.getPersistedItem();

        if (!ObjectHelper.stringEquals(item.getName(), this.wizardStepForm.getProjectName())) {
            return true;
        }

        return super.isPersistedItemChanged();
    }

    postPersistNewItem(item: ProjectItem): Q.Promise<ProjectItem> {
        return super.postPersistNewItem(item).then(() => {
            this.wizardStepForm.disableProjectNameInput();

            return Q(item);
        });
    }

    protected createDeleteRequest(): ProjectDeleteRequest {
        return new ProjectDeleteRequest(this.getPersistedItem().getName());
    }

    protected getSuccessfulDeleteMessage(): string {
        return i18n('notify.settings.project.deleted', this.getPersistedItem().getName());
    }

    protected produceCreateItemRequest(): ProjectCreateRequest {
        const displayName: string = this.wizardHeader.getDisplayName();

        return new ProjectCreateRequest()
            .setDescription(this.wizardStepForm.getDescription())
            .setName(this.wizardStepForm.getProjectName())
            .setDisplayName(displayName);
    }

    protected getSuccessfulCreateMessage(item: ProjectItem): string {
        return i18n('notify.settings.project.created', item.getName());
    }

    protected produceUpdateItemRequest(): ProjectUpdateRequest {
        const displayName: string = this.wizardHeader.getDisplayName();

        return new ProjectUpdateRequest()
            .setDescription(this.wizardStepForm.getDescription())
            .setName(this.wizardStepForm.getProjectName())
            .setDisplayName(displayName);
    }

    protected getSuccessfulUpdateMessage(item: ProjectItem): string {
        return i18n('notify.settings.project.modified', item.getName());
    }
}

class ProjectItemNameWizardStepForm
    extends SettingItemWizardStepForm {

    private projectNameInput: TextInput;

    getProjectName(): string {
        return this.projectNameInput.getValue();
    }

    disableProjectNameInput() {
        this.projectNameInput.getEl().setDisabled(true);
    }

    protected initListeners() {
        super.initListeners();
        this.projectNameInput.onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('project-item-wizard-step-form');

            return rendered;
        });
    }

    layout(item: ProjectItem) {
        super.layout(item);

        this.projectNameInput.setValue(item.getName());
        this.disableProjectNameInput();
    }

    protected getFormItems(): FormItem[] {
        this.projectNameInput = new TextInput();

        return [new FormItemBuilder(this.projectNameInput).setValidator(Validators.required).setLabel(
            i18n('settings.field.project.name')).build()];
    }
}
