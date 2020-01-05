import * as Q from 'q';
import {SettingsItemWizardActions} from './action/SettingsItemWizardActions';
import {WizardPanel, WizardPanelParams} from 'lib-admin-ui/app/wizard/WizardPanel';
import {SettingsItem} from '../data/SettingsItem';
import {Action} from 'lib-admin-ui/ui/Action';
import {Toolbar} from 'lib-admin-ui/ui/toolbar/Toolbar';
import {WizardStep} from 'lib-admin-ui/app/wizard/WizardStep';
import {i18n} from 'lib-admin-ui/util/Messages';
import {
    WizardHeaderWithDisplayNameAndName,
    WizardHeaderWithDisplayNameAndNameBuilder
} from 'lib-admin-ui/app/wizard/WizardHeaderWithDisplayNameAndName';
import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {FormIcon} from 'lib-admin-ui/app/wizard/FormIcon';
import {ImgEl} from 'lib-admin-ui/dom/ImgEl';
import {SettingItemWizardStepForm} from './SettingItemWizardStepForm';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ConfirmationDialog} from 'lib-admin-ui/ui/dialog/ConfirmationDialog';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {showFeedback} from 'lib-admin-ui/notify/MessageBus';
import {SettingsItemJson} from '../resource/json/SettingsItemJson';

export abstract class SettingsItemWizardPanel<T extends SettingsItem>
    extends WizardPanel<T> {

    protected wizardHeader: WizardHeaderWithDisplayNameAndName;

    protected wizardActions: SettingsItemWizardActions;

    protected wizardStepForm: SettingItemWizardStepForm;

    private deleteConfirmationDialog: ConfirmationDialog;

    private newItemSavedListeners: { (item: T): void }[] = [];

    constructor(params: WizardPanelParams<T>) {
        super(params);

        this.loadData();
        this.initElements();
        this.listenEvents();
        ResponsiveManager.onAvailableSizeChanged(this);
    }

    protected createWizardActions(): SettingsItemWizardActions {
        return new SettingsItemWizardActions(this);
    }

    private initElements() {
        this.deleteConfirmationDialog = new ConfirmationDialog()
            .setQuestion(i18n('settings.dialog.delete.question'))
            .setNoCallback(null)
            .setYesCallback(this.deletePersistedItem.bind(this));
    }

    private deletePersistedItem() {
        this.createDeleteRequest().sendAndParse().then(() => {
            showFeedback(this.getSuccessfulDeleteMessage());
            this.close();
        }).catch(DefaultErrorHandler.handle);
    }

    protected createDeleteRequest(): ResourceRequest<boolean, boolean> {
        throw new Error('Must be overriden by inheritor');
    }

    protected getSuccessfulDeleteMessage(): string {
        throw new Error('Must be overriden by inheritor');
    }

    persistNewItem(): Q.Promise<T> {
        return this.produceCreateItemRequest().sendAndParse().then((item: T) => {
            showFeedback(this.getSuccessfulCreateMessage(item));

            return item;
        });
    }

    postPersistNewItem(item: T): Q.Promise<T> {
        return super.postPersistNewItem(item).then(() => {
            this.notifyNewItemSaved(item);

            return item;
        });
    }

    protected produceCreateItemRequest(): ResourceRequest<SettingsItemJson, SettingsItem> {
        throw new Error('Must be overriden by inheritor');
    }

    protected getSuccessfulCreateMessage(item: T): string {
        throw new Error('Must be overriden by inheritor');
    }

    updatePersistedItem(): Q.Promise<T> {
        return this.produceUpdateItemRequest().sendAndParse().then((item: T) => {
            showFeedback(this.getSuccessfulUpdateMessage(item));

            return item;
        });
    }

    protected produceUpdateItemRequest(): ResourceRequest<SettingsItemJson, SettingsItem> {
        throw new Error('Must be overriden by inheritor');
    }

    protected getSuccessfulUpdateMessage(item: T): string {
        throw new Error('Must be overriden by inheritor');
    }

    private listenEvents() {
        this.wizardActions.getDeleteAction().onExecuted(() => {
            if (!this.getPersistedItem()) {
                return;
            }

            this.deleteConfirmationDialog.open();
        });

        this.wizardActions.getSaveAction().onExecuted(() => {
            this.saveChanges().catch((reason: any) => {
                DefaultErrorHandler.handle(reason);
            });
        });
    }

    protected createMainToolbar(): Toolbar {
        const toolbar: Toolbar = new Toolbar();

        toolbar.addAction(this.wizardActions.getSaveAction());
        toolbar.addAction(this.wizardActions.getDeleteAction());

        return toolbar;
    }

    protected createFormIcon(): FormIcon {
        const iconUrl: string = ImgEl.PLACEHOLDER;
        const formIcon: FormIcon = new FormIcon(iconUrl, 'icon');
        formIcon.addClass('icon icon-xlarge');
        formIcon.addClass(this.getIconClass());

        return formIcon;
    }

    protected abstract getIconClass(): string;

    protected doLoadData(): Q.Promise<T> {
        if (!this.getPersistedItem()) {
            return Q(null);
        } else {
            return Q(this.getPersistedItem());
        }
    }

    protected createSteps(): WizardStep[] {
        const steps: WizardStep[] = [];

        this.wizardStepForm = this.createWizardStepForm();

        steps.push(new WizardStep(i18n('settings.items.type.project'), this.wizardStepForm));

        return steps;
    }

    protected abstract createWizardStepForm(): SettingItemWizardStepForm;

    doLayout(persistedItem: T): Q.Promise<void> {

        this.setSteps(this.createSteps());

        if (!!persistedItem) {
            this.wizardStepForm.layout(persistedItem);
        }

        this.wizardStepForm.onDataChanged(() => {
            this.handleDataChanged();
        });

        return Q<void>(null);
    }

    private handleDataChanged() {
        this.wizardActions.getSaveAction().setEnabled(this.hasUnsavedChanges());
    }

    hasUnsavedChanges(): boolean {
        if (this.getPersistedItem()) {
            return this.isPersistedItemChanged();
        }

        return this.isNewItemChanged();
    }

    protected isPersistedItemChanged(): boolean {
        const item: SettingsItem = this.getPersistedItem();

        if (!ObjectHelper.stringEquals(item.getDescription(), this.wizardStepForm.getDescription())) {
            return true;
        }

        if (!ObjectHelper.stringEquals(item.getDisplayName(), this.wizardHeader.getDisplayName())) {
            return true;
        }

        return false;
    }

    protected isNewItemChanged(): boolean {
        return !StringHelper.isBlank(this.wizardHeader.getName()) ||
               !StringHelper.isBlank(this.wizardHeader.getDisplayName()) ||
               !StringHelper.isBlank(this.wizardStepForm.getDescription());
    }

    protected createWizardHeader(): WizardHeaderWithDisplayNameAndName {
        const wizardHeader: WizardHeaderWithDisplayNameAndName = new WizardHeaderWithDisplayNameAndNameBuilder().build();

        const existing: SettingsItem = this.getPersistedItem();
        const name: string = this.getWizardNameValue();

        let displayName: string = '';

        if (existing) {
            displayName = existing.getDisplayName();

            wizardHeader.disableNameInput();
            wizardHeader.setAutoGenerationEnabled(false);
        }

        wizardHeader.setPath('');
        wizardHeader.initNames(displayName, name, false);

        wizardHeader.onPropertyChanged(() => {
            this.handleDataChanged();
        });

        return wizardHeader;
    }

    protected getWizardNameValue(): string {
        return this.getPersistedItem() ? this.getPersistedItem().getId() : '';
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('settings-item-wizard-panel');

            return rendered;
        });
    }

    getCloseAction(): Action {
        return this.wizardActions.getCloseAction();
    }

    hasPersistedItemWithId(id: string): boolean {
        return this.getPersistedItem() && this.getPersistedItem().getId() === id;
    }

    updatePersistedSettingsItem(item: T) {
        if (item.equals(this.getPersistedItem())) {
            return;
        }
        this.setPersistedItem(item);
        this.wizardHeader.initNames(item.getDisplayName(), item.getId(), false);
        this.wizardStepForm.layout(item);
    }

    private notifyNewItemSaved(item: T) {
        this.newItemSavedListeners.forEach((listener: (item: T) => void) => {
            listener(item);
        });
    }

    onNewItemSaved(listener: (item: T) => void) {
        this.newItemSavedListeners.push(listener);
    }

    unNewItemSaved(listener: (item: T) => void) {
        this.newItemSavedListeners =
            this.newItemSavedListeners.filter((curr: (item: T) => void) => {
                return listener !== curr;
            });
    }
}
