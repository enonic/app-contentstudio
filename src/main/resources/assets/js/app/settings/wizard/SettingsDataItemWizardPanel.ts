import * as Q from 'q';
import {WizardPanel, WizardPanelParams} from 'lib-admin-ui/app/wizard/WizardPanel';
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
import {SettingDataItemWizardStepForm} from './SettingDataItemWizardStepForm';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {ConfirmationDialog} from 'lib-admin-ui/ui/dialog/ConfirmationDialog';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {showFeedback} from 'lib-admin-ui/notify/MessageBus';
import {SettingsDataItemFormIcon} from './SettingsDataItemFormIcon';
import {Equitable} from 'lib-admin-ui/Equitable';
import {SettingsDataItemWizardActions} from './action/SettingsDataItemWizardActions';
import {SettingsDataViewItem} from '../view/SettingsDataViewItem';
import {Exception, ExceptionType} from 'lib-admin-ui/Exception';

export abstract class SettingsDataItemWizardPanel<ITEM extends SettingsDataViewItem<Equitable>>
    extends WizardPanel<ITEM> {

    protected wizardHeader: WizardHeaderWithDisplayNameAndName;

    protected wizardActions: SettingsDataItemWizardActions<ITEM>;

    protected wizardStepForms: SettingDataItemWizardStepForm<ITEM>[] = [];

    private deleteConfirmationDialog: ConfirmationDialog;

    private newItemSavedListeners: { (item: ITEM): void }[] = [];

    private wizardHeaderNameUpdatedListeners: { (name: string): void }[] = [];

    private isClosePending: boolean = false;

    constructor(params: WizardPanelParams<ITEM>) {
        super(params);

        this.loadData();
        this.initElements();
        this.listenEvents();
        ResponsiveManager.onAvailableSizeChanged(this);
    }

    public getFormIcon(): SettingsDataItemFormIcon {
        return <SettingsDataItemFormIcon>this.formIcon;
    }

    postPersistNewItem(item: ITEM): Q.Promise<ITEM> {
        return super.postPersistNewItem(item).then(() => {
            this.notifyNewItemSaved(item);

            return item;
        });
    }

    persistNewItem(): Q.Promise<ITEM> {
        throw new Error('Must be overriden by inheritor');
    }

    updatePersistedItem(): Q.Promise<ITEM> {
        throw new Error('Must be overriden by inheritor');
    }

    doLayout(persistedItem: ITEM): Q.Promise<void> {
        this.wizardStepForms = this.createStepsForms(persistedItem);
        this.setSteps(this.createSteps());

        const layoutPromises: Q.Promise<void>[] = [];

        this.wizardStepForms.forEach((stepForm: SettingDataItemWizardStepForm<ITEM>) => {
            stepForm.setup(persistedItem);
            layoutPromises.push(stepForm.layout(persistedItem));

            stepForm.onDataChanged(() => {
                this.handleDataChanged();
            });
        });

        return Q.all(layoutPromises).spread<void>(() => Q<void>(null));
    }

    protected createSteps(): WizardStep[] {
        const steps: WizardStep[] = [];

        this.wizardStepForms.forEach((stepForm: SettingDataItemWizardStepForm<ITEM>) => {
            steps.push(new WizardStep(stepForm.getName(), stepForm));
        });

        return steps;
    }

    saveChanges(): Q.Promise<ITEM> {
        return super.saveChanges().then((item: ITEM) => {
            if (this.isClosePending) {
                this.close(true);
            }

            return item;
        }).finally(() => {
            this.isClosePending = false;
            this.getFormIcon().setDisabled(false);
        });
    }

    hasUnsavedChanges(): boolean {
        if (!this.isRendered()) {
            return false;
        }

        if (this.getPersistedItem()) {
            return this.isPersistedItemChanged();
        }

        return this.isNewItemChanged();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('settings-item-wizard-panel');

            return rendered;
        });
    }

    public validate() {
        this.wizardStepForms.forEach((stepForm: SettingDataItemWizardStepForm<ITEM>) => {
            stepForm.validate();
        });
    }

    close(checkCanClose: boolean = false) {
        if (this.isSaving()) {
            this.isClosePending = true;
        } else {
            if (!checkCanClose || !this.isRendered() || this.canClose()) {
                super.close(checkCanClose);
            }
        }
    }

    canClose(): boolean {
        if (this.hasUnsavedChanges()) {
            this.openSaveBeforeCloseDialog();
            return false;
        } else {
            return true;
        }
    }

    private openSaveBeforeCloseDialog() {
        const isValid: boolean = this.isValid();
        const question: string = i18n('dialog.confirm.unsavedChanges');
        const yesCallback: () => void = isValid ? this.saveAndClose.bind(this) : () => {
            this.validate();
        };
        const noCallback: () => void = this.close.bind(this);

        new ConfirmationDialog()
            .setQuestion(question)
            .setYesCallback(yesCallback)
            .setNoCallback(noCallback)
            .open();
    }

    private saveAndClose() {
        this.saveChanges().then(() => {
            this.close();
        }).catch((reason: any) => {
            if (this.isValid()) {
                this.wizardActions.getSaveAction().setEnabled(true);
            }
            DefaultErrorHandler.handle(reason);
        });
    }

    getCloseAction(): Action {
        return this.wizardActions.getCloseAction();
    }

    hasPersistedItemWithId(id: string): boolean {
        return this.getPersistedItem() && this.getPersistedItem().getId() === id;
    }

    updatePersistedSettingsDataItem(item: ITEM) {
        if (item.equals(this.getPersistedItem())) {
            return;
        }

        this.setPersistedItem(item);

        this.wizardHeader.initNames(item.getDisplayName(), item.getId(), false);

        if (item.getIconUrl()) {
            this.getFormIcon().setSrc(item.getIconUrl());
        }

        this.wizardStepForms.forEach((stepForm: SettingDataItemWizardStepForm<ITEM>) => {
            stepForm.layout(item);
        });
    }

    onNewItemSaved(listener: (item: ITEM) => void) {
        this.newItemSavedListeners.push(listener);
    }

    unNewItemSaved(listener: (item: ITEM) => void) {
        this.newItemSavedListeners =
            this.newItemSavedListeners.filter((curr: (item: ITEM) => void) => {
                return listener !== curr;
            });
    }

    onWizardHeaderNameUpdated(listener: (name: string) => void) {
        this.wizardHeaderNameUpdatedListeners.push(listener);
    }

    unWizardHeaderNameUpdated(listener: (name: string) => void) {
        this.wizardHeaderNameUpdatedListeners =
            this.wizardHeaderNameUpdatedListeners.filter((curr: (name: string) => void) => {
                return listener !== curr;
            });
    }

    protected abstract createWizardActions(): SettingsDataItemWizardActions<ITEM>;

    protected abstract createDeleteRequest(): ResourceRequest<boolean> ;

    protected abstract getSuccessfulDeleteMessage(): string;

    protected abstract getSuccessfulCreateMessage(name: string): string;

    protected abstract getSuccessfulUpdateMessage(name: string): string;

    protected abstract handleDataChanged();

    protected createMainToolbar(): Toolbar {
        const toolbar: Toolbar = new Toolbar();

        toolbar.addAction(this.wizardActions.getSaveAction());
        toolbar.addAction(this.wizardActions.getDeleteAction());

        return toolbar;
    }

    protected createFormIcon(): FormIcon {
        const icon: SettingsDataItemFormIcon = new SettingsDataItemFormIcon(
            this.getPersistedItem() ? this.getPersistedItem().getIconUrl() : null);
        icon.addClass(`icon icon-xlarge ${this.getIconClass()}`);
        if (!this.getPersistedItem()) {
            icon.setDisabled(true, i18n('settings.projects.tooltip.saveProject'));
        }

        icon.onIconChanged(() => {
            if (this.isItemPersisted()) {
                this.updateIcon();
            }
        });

        return icon;
    }

    protected updateIcon(): Q.Promise<any> {
        throw new Exception('Must be implemented by inheritor.', ExceptionType.ERROR);
    }

    protected abstract getIconClass(): string;

    protected doLoadData(): Q.Promise<ITEM> {
        if (!this.getPersistedItem()) {
            return Q(null);
        } else {
            return Q(this.getPersistedItem());
        }
    }

    protected abstract createStepsForms(persistedItem?: ITEM): SettingDataItemWizardStepForm<ITEM>[];

    protected isPersistedItemChanged(): boolean {
        const item: ITEM = this.getPersistedItem();

        if (!ObjectHelper.stringEquals(item.getDisplayName(), this.wizardHeader.getDisplayName())) {
            return true;
        }

        return false;
    }

    protected isNewItemChanged(): boolean {
        return !StringHelper.isBlank(this.wizardHeader.getDisplayName());
    }

    protected createWizardHeader(): WizardHeaderWithDisplayNameAndName {
        const wizardHeader: WizardHeaderWithDisplayNameAndName = new WizardHeaderWithDisplayNameAndNameBuilder().build();

        const existing: ITEM = this.getPersistedItem();
        const displayName: string = !!existing ? existing.getDisplayName() : '';

        wizardHeader.disableNameInput();
        wizardHeader.setAutoGenerationEnabled(false);
        wizardHeader.setPath('');
        wizardHeader.initNames(displayName, 'not_used', false, true, true);

        wizardHeader.onPropertyChanged(() => {
            this.handleDataChanged();
            this.notifyWizardHeaderNameUpdated();
        });

        return wizardHeader;
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

    private listenEvents() {
        this.wizardActions.getDeleteAction().onExecuted(() => {
            if (!this.getPersistedItem()) {
                return;
            }

            this.deleteConfirmationDialog.open();
        });

        this.wizardActions.getSaveAction().onExecuted(() => {
            this.saveChanges().catch((reason: any) => {
                this.wizardActions.getSaveAction().setEnabled(true);
                DefaultErrorHandler.handle(reason);
            });
        });
    }

    private notifyNewItemSaved(item: ITEM) {
        this.newItemSavedListeners.forEach((listener: (item: ITEM) => void) => {
            listener(item);
        });
    }

    private notifyWizardHeaderNameUpdated() {
        this.wizardHeaderNameUpdatedListeners.forEach((listener: (name: string) => void) => {
            listener(this.wizardHeader.getDisplayName());
        });
    }
}
