import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import * as Q from 'q';
import {ProjectViewItem} from '../../../view/ProjectViewItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {PrincipalComboBox} from '@enonic/lib-admin-ui/ui/security/PrincipalComboBox';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {ValidationResult} from '@enonic/lib-admin-ui/ui/form/ValidationResult';
import {ProjectReadAccess} from '../../../data/project/ProjectReadAccess';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {GetPrincipalsByKeysRequest} from '../../../../security/GetPrincipalsByKeysRequest';
import {ProjectPermissions} from '../../../data/project/ProjectPermissions';
import {ValidationRecording} from '@enonic/lib-admin-ui/form/ValidationRecording';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {ConfirmationDialog} from '@enonic/lib-admin-ui/ui/dialog/ConfirmationDialog';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {ProjectWizardStepForm} from './ProjectWizardStepForm';
import {Project} from '../../../data/project/Project';
import {ProjectHelper} from '../../../data/project/ProjectHelper';
import {LocaleLoader} from '../../../../locale/LocaleLoader';
import {PrincipalLoader} from '../../../../security/PrincipalLoader';
import {PrincipalLoader as BasePrincipalLoader} from '@enonic/lib-admin-ui/security/PrincipalLoader';
import {ProjectReadAccessType} from '../../../data/project/ProjectReadAccessType';
import {LocaleFormItem} from './element/LocaleFormItem';
import {ReadAccessFormItem} from './element/ReadAccessFormItem';

export class ProjectReadAccessWizardStepForm
    extends ProjectWizardStepForm {

    private readAccessFormItem?: ReadAccessFormItem;

    private localeFormItem: LocaleFormItem;

    private copyParentLanguageButton?: Button;

    private copyParentAccessModeButton?: Button;

    private copyParentAccessClicked: boolean = false;

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item) {
            return Q(null);
        }

        const layoutPromises: Q.Promise<any>[] = [];

        layoutPromises.push(this.layoutLanguage(item.getLanguage()));

        if (!item.isDefaultProject()) {
            layoutPromises.push(this.layoutReadAccess(item.getReadAccess(), item.getPermissions()));
        }

        return Q.all(layoutPromises).spread<void>(() => Q<void>(null));
    }

    private layoutLanguage(language: string): Q.Promise<void> {
        if (!language) {
            return Q(null);
        }

        return this.getLocales().then((locales: Locale[]) => {
            const localeToSelect: Locale = this.getLocaleByLanguage(language, locales);

            if (localeToSelect) {
                this.localeFormItem.getLocaleCombobox().select(localeToSelect, false, true);
                this.localeFormItem.getLocaleCombobox().resetBaseValues();
            }

            return Q(null);
        });
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);

        if (this.readAccessFormItem) {
            this.readAccessFormItem.setPrincipalComboboxEnabled(enable);
        }
    }

    private updateCopyParentLanguageButtonState() {
        if (!this.copyParentLanguageButton) {
            return;
        }

        this.copyParentLanguageButton.setEnabled(this.parentProject &&
                                                 !ObjectHelper.stringEquals(this.parentProject.getLanguage(),
                                                     this.localeFormItem.getLocaleCombobox().getValue()));
    }

    private getLocales(): Q.Promise<Locale[]> {
        const localeLoader: LocaleLoader = <LocaleLoader>this.localeFormItem.getLocaleCombobox().getLoader();

        if (localeLoader.isLoaded()) {
            return Q(this.localeFormItem.getLocaleCombobox().getDisplayValues());
        }

        return this.localeFormItem.getLocaleCombobox().getLoader().load();
    }

    private getLocaleByLanguage(language: string, locales: Locale[]): Locale {
        return locales.find((locale: Locale) => locale.getId() === language);
    }

    private layoutReadAccess(readAccess: ProjectReadAccess, permissions: ProjectPermissions, silent: boolean = true): Q.Promise<void> {
        this.readAccessFormItem.getRadioGroup().setValue(readAccess.getType(), silent);

        this.updateFilteredPrincipalsByPermissions(permissions);

        return new GetPrincipalsByKeysRequest(readAccess.getPrincipalsKeys()).sendAndParse().then((principals: Principal[]) => {
            principals.forEach((principal: Principal) => {
                this.readAccessFormItem.getPrincipalComboBox().select(principal, false, silent);
                this.readAccessFormItem.getPrincipalComboBox().resetBaseValues();
            });

            return Q(null);
        });
    }

    setup(item?: ProjectViewItem) {
        super.setup(item);

        if (!this.readAccessFormItem) {
            return;
        }

        this.filterPrincipals(this.getDefaultFilteredPrincipals());
        this.readAccessFormItem.setPrincipalComboboxEnabled(false);
    }

    getName(): string {
        return i18n('settings.items.wizard.step.readaccess');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.addClass('project-read-access-wizard-step-form');

            return rendered;
        });
    }

    isValid(): boolean {
        if (this.readAccessFormItem) {
            return !!this.readAccessFormItem.getRadioGroup().getValue();
        }

        return true;
    }

    getReadAccess(): ProjectReadAccess {
        if (!this.readAccessFormItem) {
            return null;
        }

        return this.readAccessFormItem.getReadAccess();
    }

    private updateFilteredPrincipalsByPermissions(permissions: ProjectPermissions) {
        this.filterPrincipals([
            ...permissions.getContributors(),
            ...permissions.getAuthors(),
            ...permissions.getEditors(),
            ...permissions.getOwners(),
            ...this.getDefaultFilteredPrincipals()
        ]);
    }

    public validate(): ValidationRecording {
        this.readAccessFormItem.validate(new ValidationResult(), true);

        return new ValidationRecording();
    }

    protected createFormItems(): FormItem[] {
        if (!!this.item && this.item.isDefaultProject()) {
            return [this.createLanguageFormItem()];
        }

        return [this.createLanguageFormItem(), this.createReadAccessRadioGroupFormItem()];
    }

    private createReadAccessRadioGroupFormItem(): FormItem {
        this.readAccessFormItem = new ReadAccessFormItem();
        return this.readAccessFormItem;
    }

    private removeCopyButtons() {
        if (this.copyParentAccessModeButton) {
            this.readAccessFormItem.removeChild(this.copyParentAccessModeButton);
        }
        if (this.copyParentLanguageButton) {
            this.localeFormItem.removeChild(this.copyParentLanguageButton);
        }
    }

    private appendCopyButtons() {
        if (!this.copyParentAccessModeButton) {
            this.copyParentAccessModeButton = this.createCopyParentAccessModeButton();
        }
        if (!this.copyParentLanguageButton) {
            this.copyParentLanguageButton = this.createCopyParentLanguageButton();
        }

        this.readAccessFormItem.appendChild(this.copyParentAccessModeButton);
        this.localeFormItem.appendChild(this.copyParentLanguageButton);

        this.updateCopyParentLanguageButtonState();
        this.updateCopyParentAccessModeButtonState();
    }

    setParentProject(project: Project) {
        super.setParentProject(project);

        if (project) {
            this.appendCopyButtons();
        } else {
            this.removeCopyButtons();
        }
    }

    private createPrincipalsCombobox(): PrincipalComboBox {
        const loader: BasePrincipalLoader = new PrincipalLoader()
            .setAllowedTypes([PrincipalType.USER, PrincipalType.GROUP]);
        const principalsCombobox = <PrincipalComboBox>PrincipalComboBox.create().setLoader(loader).build();

        return principalsCombobox;
    }

    private createCopyParentAccessModeButton(): Button {
        const button: Button = new Button(i18n('settings.wizard.project.copy')).setEnabled(false);
        button.addClass('copy-parent-button');

        button.onClicked(() => {
            if (!this.parentProject) {
                return;
            }
            this.copyParentAccessClicked = true;
            this.layoutReadAccess(this.parentProject.getReadAccess(), this.parentProject.getPermissions(), false);
        });

        return button;
    }

    private updateCopyParentAccessModeButtonState() {
        if (!this.copyParentAccessModeButton) {
            return;
        }

        this.copyParentAccessModeButton.setEnabled(
            ProjectHelper.isAvailable(this.parentProject) && !this.parentProject.getReadAccess().equals(this.getReadAccess()));
    }

    private getDefaultFilteredPrincipals(): PrincipalKey[] {
        return [PrincipalKey.ofAnonymous()];
    }

    private filterPrincipals(principals: PrincipalKey[]) {
        const principalsLoader: PrincipalLoader = <PrincipalLoader>this.readAccessFormItem.getPrincipalComboBox().getLoader();
        principalsLoader.skipPrincipals(principals);
    }

    private createLanguageFormItem(): FormItem {
        this.localeFormItem = new LocaleFormItem();
        return this.localeFormItem;
    }

    private createCopyParentLanguageButton(): Button {
        const button: Button = new Button(i18n('settings.wizard.project.copy')).setEnabled(false);
        button.addClass('copy-parent-button');

        button.onClicked(() => {
            if (!this.parentProject) {
                return;
            }

            const parentLanguage: string = this.parentProject.getLanguage();

            this.localeFormItem.getLocaleCombobox().setValue(!!parentLanguage ? parentLanguage : '');

            NotifyManager.get().showSuccess(
                i18n('settings.wizard.project.copy.success', i18n('field.lang'), this.parentProject.getDisplayName()));
        });

        return button;
    }

    getLanguage(): string {
        return this.localeFormItem.getLocaleCombobox().getValue();
    }

    private showConfirmationDialog(newValue: string, resetValue: string) {
        let confirmed: boolean = false;

        const confirmationDialog: ConfirmationDialog = new ConfirmationDialog()
            .setQuestion(i18n('dialog.projectAccess.confirm'))
            .setYesCallback(() => {
                confirmed = true;
                this.handleAccessValueChanged(newValue);
                this.copyParentAccessClicked = false;
            });

        confirmationDialog.onClosed(() => {
            setTimeout(() => {
                if (!confirmed) {
                    this.readAccessFormItem.getRadioGroup().setValue(resetValue, true);
                    this.copyParentAccessClicked = false;
                }
            }, 200);
        });
        confirmationDialog.open();
    }

    protected initListeners(item?: ProjectViewItem) {
        this.localeFormItem.getLocaleCombobox().onValueChanged(() => {
            this.notifyDataChanged();
            this.updateCopyParentLanguageButtonState();
        });

        if (!this.readAccessFormItem) {
            return;
        }

        this.readAccessFormItem.getRadioGroup().onValueChanged((event: ValueChangedEvent) => {
            const newValue: string = event.getNewValue();
            const oldValue: string = event.getOldValue();

            if (this.isConfirmationNeeded(event)) {
                this.showConfirmationDialog(newValue, oldValue);
            } else {
                this.handleAccessValueChanged(newValue);
                this.copyParentAccessClicked = false;
            }
        });

        this.readAccessFormItem.getPrincipalComboBox().onValueChanged(() => {
            this.notifyDataChanged();
            this.updateCopyParentAccessModeButtonState();
        });
    }

    private isConfirmationNeeded(event: ValueChangedEvent): boolean {
        if (!this.item) {
            return false;
        }

        const newValue: string = event.getNewValue();
        const oldValue: string = event.getOldValue();

        return ((oldValue === ProjectReadAccessType.PUBLIC && newValue !== ProjectReadAccessType.PUBLIC) ||
                (oldValue !== ProjectReadAccessType.PUBLIC && newValue === ProjectReadAccessType.PUBLIC));
    }

    private handleAccessValueChanged(newValue: string) {
        this.readAccessFormItem.setPrincipalComboboxEnabled(newValue === ProjectReadAccessType.CUSTOM);
        this.readAccessFormItem.validate(new ValidationResult(), true);

        this.updateCopyParentAccessModeButtonState();
        this.notifyDataChanged();

        if (this.copyParentAccessClicked) {
            NotifyManager.get().showSuccess(
                i18n('settings.wizard.project.copy.success', i18n('settings.items.wizard.readaccess.label'),
                    this.parentProject.getDisplayName()));
        }
    }

    isEmpty(): boolean {
        return !this.getLanguage() && (!this.readAccessFormItem || !this.readAccessFormItem.getRadioGroup().getValue());
    }
}
