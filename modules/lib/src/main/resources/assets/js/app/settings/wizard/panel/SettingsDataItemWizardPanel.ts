import * as Q from 'q';
import {WizardPanel, WizardPanelParams} from '@enonic/lib-admin-ui/app/wizard/WizardPanel';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {Toolbar, ToolbarConfig} from '@enonic/lib-admin-ui/ui/toolbar/Toolbar';
import {WizardStep} from '@enonic/lib-admin-ui/app/wizard/WizardStep';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {WizardHeaderWithDisplayNameAndName} from '@enonic/lib-admin-ui/app/wizard/WizardHeaderWithDisplayNameAndName';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {FormIcon} from '@enonic/lib-admin-ui/app/wizard/FormIcon';
import {SettingDataItemWizardStepForm} from './form/SettingDataItemWizardStepForm';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {ConfirmationDialog} from '@enonic/lib-admin-ui/ui/dialog/ConfirmationDialog';
import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {SettingsDataItemFormIcon} from './form/element/SettingsDataItemFormIcon';
import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {SettingsDataItemWizardActions} from '../action/SettingsDataItemWizardActions';
import {SettingsDataViewItem} from '../../view/SettingsDataViewItem';
import {Exception, ExceptionType} from '@enonic/lib-admin-ui/Exception';
import {SettingsType} from '../../data/type/SettingsType';
import {AppBarTabId} from '@enonic/lib-admin-ui/app/bar/AppBarTabId';
import {ModalDialog} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';

class SettingsWizardPanelParams<ITEM extends SettingsDataViewItem<Equitable>> implements WizardPanelParams<ITEM> {
    tabId: AppBarTabId;
    type: SettingsType;
    persistedItem?: ITEM;
}

export abstract class SettingsDataItemWizardPanel<ITEM extends SettingsDataViewItem<Equitable>>
    extends WizardPanel<ITEM> {

    protected wizardHeader: WizardHeaderWithDisplayNameAndName;

    protected wizardActions: SettingsDataItemWizardActions<ITEM>;

    protected wizardStepForms: SettingDataItemWizardStepForm<ITEM>[] = [];

    protected deleteConfirmationDialog?: ModalDialog;

    private newItemSavedListeners: ((item: ITEM) => void)[] = [];

    private wizardHeaderNameUpdatedListeners: ((name: string) => void)[] = [];

    private isClosePending: boolean = false;

    private readonly type: SettingsType;

    constructor(params: SettingsWizardPanelParams<ITEM>) {
        super(params);

        this.type = params.type;
        this.loadData();
        ResponsiveManager.onAvailableSizeChanged(this);
    }

    public getFormIcon(): SettingsDataItemFormIcon {
        return this.formIcon as SettingsDataItemFormIcon;
    }

    postPersistNewItem(item: ITEM): Q.Promise<ITEM> {
        return super.postPersistNewItem(item).then(() => {
            this.notifyNewItemSaved(item);

            this.wizardStepForms.forEach((stepForm: SettingDataItemWizardStepForm<ITEM>) => {
                stepForm.setItem(item);
            });

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
            steps.push(new WizardStep(stepForm.getName(this.getParams().type), stepForm));
        });

        return steps;
    }

    saveChanges(): Q.Promise<ITEM> {
        this.formMask.show();
        return super.saveChanges().then((item: ITEM) => {
            if (this.isClosePending) {
                this.close(true);
            }

            return item;
        }).finally(() => {
            this.isClosePending = false;
            this.getFormIcon().setDisabled(false);
            this.formMask.hide();
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
        }).catch((reason) => {
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

        this.wizardHeader.setDisplayName(item.getDisplayName());
        this.wizardHeader.setName(item.getId());

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

    protected abstract getIconTooltip(): string;

    protected abstract handleDataChanged();

    protected createMainToolbar(): Toolbar<ToolbarConfig> {
        const toolbar: Toolbar<ToolbarConfig> = new Toolbar<ToolbarConfig>();

        toolbar.addAction(this.wizardActions.getSaveAction());
        toolbar.addAction(this.wizardActions.getDeleteAction());

        return toolbar;
    }

    protected createFormIcon(): FormIcon {
        const icon: SettingsDataItemFormIcon = this.createSettingsDataItemFormIcon();

        icon.addClass(`icon icon-xlarge ${this.getIconClass()}`);

        if (!this.getPersistedItem()) {
            icon.setDisabled(true, this.getIconTooltip());
        }

        icon.onIconChanged(() => {
            if (this.isItemPersisted()) {
                this.updateIcon();
            }
        });

        return icon;
    }

    protected createSettingsDataItemFormIcon(): SettingsDataItemFormIcon {
        return new SettingsDataItemFormIcon(
            this.getPersistedItem() ? this.getPersistedItem().getIconUrl() : null);
    }

    protected updateIcon(): Q.Promise<void> {
        throw Error('Must be implemented by inheritor.');
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
        const wizardHeader: WizardHeaderWithDisplayNameAndName = new WizardHeaderWithDisplayNameAndName();
        wizardHeader.setPlaceholder(this.getParams().type.getDisplayNamePlaceholder());

        const existing: ITEM = this.getPersistedItem();
        const displayName: string = !!existing ? existing.getDisplayName() : '';

        wizardHeader.toggleNameInput(false);
        wizardHeader.setPath('');
        wizardHeader.setDisplayName(displayName);
        wizardHeader.setName('not_used');

        wizardHeader.onPropertyChanged(() => {
            this.handleDataChanged();
            this.notifyWizardHeaderNameUpdated();
        });

        return wizardHeader;
    }

    protected deletePersistedItem() {
        this.createDeleteRequest().sendAndParse().then(() => {
            showFeedback(this.getSuccessfulDeleteMessage());
            this.close();
        }).catch(DefaultErrorHandler.handle);
    }

    protected initEventsListeners() {
        super.initEventsListeners();

        this.wizardActions.getDeleteAction().onExecuted(() => {
            if (!this.getPersistedItem()) {
                return;
            }

            if (!this.deleteConfirmationDialog) {
                this.deleteConfirmationDialog = this.initConfirmationDialog();
            }

            this.deleteConfirmationDialog.open();
        });

        this.wizardActions.getSaveAction().onExecuted(() => {
            this.saveChanges().catch((reason) => {
                this.wizardActions.getSaveAction().setEnabled(true);
                DefaultErrorHandler.handle(reason);
            });
        });
    }

    protected initConfirmationDialog(): ModalDialog {
        return new ConfirmationDialog()
            .setQuestion(i18n('settings.dialog.archive.question'))
            .setNoCallback(null)
            .setYesCallback(this.deletePersistedItem.bind(this));
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

    protected getParams(): SettingsWizardPanelParams<ITEM> {
        return super.getParams() as SettingsWizardPanelParams<ITEM>;
    }
}
