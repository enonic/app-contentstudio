import {FormItem} from 'lib-admin-ui/ui/form/FormItem';
import * as Q from 'q';
import {ProjectViewItem} from '../../../view/ProjectViewItem';
import {RadioGroup} from 'lib-admin-ui/ui/RadioGroup';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Validators} from 'lib-admin-ui/ui/form/Validators';
import {PrincipalLoader} from 'lib-admin-ui/security/PrincipalLoader';
import {PrincipalType} from 'lib-admin-ui/security/PrincipalType';
import {PrincipalComboBox} from 'lib-admin-ui/ui/security/PrincipalComboBox';
import {ValueChangedEvent} from 'lib-admin-ui/ValueChangedEvent';
import {ValidationResult} from 'lib-admin-ui/ui/form/ValidationResult';
import {ProjectReadAccess, ProjectReadAccessType} from '../../../data/project/ProjectReadAccess';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {Principal} from 'lib-admin-ui/security/Principal';
import {GetPrincipalsByKeysRequest} from 'lib-admin-ui/security/GetPrincipalsByKeysRequest';
import {ProjectPermissions} from '../../../data/project/ProjectPermissions';
import {ValidationRecording} from 'lib-admin-ui/form/ValidationRecording';
import {Locale} from 'lib-admin-ui/locale/Locale';
import {ConfirmationDialog} from 'lib-admin-ui/ui/dialog/ConfirmationDialog';
import {ProjectFormItemBuilder} from './element/ProjectFormItem';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {ProjectWizardStepForm} from './ProjectWizardStepForm';
import {Project} from '../../../data/project/Project';
import {ProjectHelper} from '../../../data/project/ProjectHelper';
import {LocaleComboBox} from '../../../../locale/LocaleComboBox';
import {LocaleLoader} from '../../../../locale/LocaleLoader';

export class ProjectReadAccessWizardStepForm
    extends ProjectWizardStepForm {

    private readAccessRadioGroup?: RadioGroup;

    private readAccessRadioGroupFormItem?: FormItem;

    private principalsCombobox?: PrincipalComboBox;

    private localeCombobox: LocaleComboBox;

    private localeFormItem: FormItem;

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
                this.localeCombobox.select(localeToSelect, false, true);
                this.localeCombobox.resetBaseValues();
            }

            return Q(null);
        });
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);

        if (this.principalsCombobox) {
            this.principalsCombobox.setEnabled(enable);
        }
    }

    private updateCopyParentLanguageButtonState() {
        if (!this.copyParentLanguageButton) {
            return;
        }

        this.copyParentLanguageButton.setEnabled(this.parentProject &&
            !ObjectHelper.stringEquals(this.parentProject.getLanguage(), this.localeCombobox.getValue()));
    }

    private getLocales(): Q.Promise<Locale[]> {
        const localeLoader: LocaleLoader = <LocaleLoader>this.localeCombobox.getLoader();

        if (localeLoader.isLoaded()) {
            return Q(this.localeCombobox.getDisplayValues());
        }

        return this.localeCombobox.getLoader().load();
    }

    private getLocaleByLanguage(language: string, locales: Locale[]): Locale {
        return locales.find((locale: Locale) => locale.getId() === language);
    }

    private layoutReadAccess(readAccess: ProjectReadAccess, permissions: ProjectPermissions, silent: boolean = true): Q.Promise<void> {
        this.readAccessRadioGroup.setValue(readAccess.getType(), silent);

        this.updateFilteredPrincipalsByPermissions(permissions);

        if (!readAccess.isCustom()) {
            this.principalsCombobox.setEnabled(false);
            return Q(null);
        }

        this.principalsCombobox.setEnabled(true);

        return new GetPrincipalsByKeysRequest(readAccess.getPrincipals()).sendAndParse().then((principals: Principal[]) => {
            principals.forEach((principal: Principal) => {
                this.principalsCombobox.select(principal, false, silent);
                this.principalsCombobox.resetBaseValues();
            });

            return Q(null);
        });
    }

    setup(item?: ProjectViewItem) {
        super.setup(item);

        if (!this.principalsCombobox) {
            return;
        }

        this.filterPrincipals(this.getDefaultFilteredPrincipals());
        this.principalsCombobox.setEnabled(false);
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
        if (this.readAccessRadioGroup) {
            return !!this.readAccessRadioGroup.getValue();
        }

        return true;
    }

    getReadAccess(): ProjectReadAccess {
        if (!this.readAccessRadioGroup) {
            return null;
        }

        const readAccessString: string = this.readAccessRadioGroup.getValue();

        if (readAccessString === ProjectReadAccessType.PUBLIC) {
            return new ProjectReadAccess(ProjectReadAccessType.PUBLIC);
        }

        if (readAccessString === ProjectReadAccessType.CUSTOM) {
            const principals: PrincipalKey[] =
                this.principalsCombobox.getSelectedDisplayValues().map((principal: Principal) => principal.getKey());

            if (principals.length === 0) {
                return new ProjectReadAccess(ProjectReadAccessType.PRIVATE);
            }

            return new ProjectReadAccess(ProjectReadAccessType.CUSTOM, principals);
        }

        return new ProjectReadAccess(ProjectReadAccessType.PRIVATE);
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
        this.readAccessRadioGroupFormItem.validate(new ValidationResult(), true);

        return new ValidationRecording();
    }

    protected createFormItems(): FormItem[] {
        if (!!this.item && this.item.isDefaultProject()) {
            return [this.createLanguageFormItem()];
        }

        return [this.createLanguageFormItem(), this.createReadAccessRadioGroupFormItem()];
    }

    private createReadAccessRadioGroupFormItem(): FormItem {
        this.readAccessRadioGroup = new RadioGroup('read-access-radio-group');

        this.readAccessRadioGroup.addOption(ProjectReadAccessType.PUBLIC, i18n('settings.items.wizard.readaccess.public.description'));
        this.readAccessRadioGroup.addOption(ProjectReadAccessType.PRIVATE, i18n('settings.items.wizard.readaccess.private.description'));
        this.readAccessRadioGroup.addOption(ProjectReadAccessType.CUSTOM, i18n('settings.items.wizard.readaccess.custom.description'));

        this.readAccessRadioGroupFormItem = new ProjectFormItemBuilder(this.readAccessRadioGroup)
            .setHelpText(i18n('settings.projects.access.helptext'))
            .setLabel(i18n('settings.items.wizard.readaccess.label'))
            .setValidator(Validators.required)
            .build();

        this.readAccessRadioGroupFormItem.addClass('read-access');

        this.principalsCombobox = this.createPrincipalsCombobox();
        this.principalsCombobox.insertAfterEl(this.readAccessRadioGroup);

        return this.readAccessRadioGroupFormItem;
    }

    private removeCopyButtons() {
        if (this.copyParentAccessModeButton) {
            this.readAccessRadioGroupFormItem.removeChild(this.copyParentAccessModeButton);
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

        this.readAccessRadioGroupFormItem.appendChild(this.copyParentAccessModeButton);
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
        const loader: PrincipalLoader = new PrincipalLoader().setAllowedTypes([PrincipalType.USER, PrincipalType.GROUP]);
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
        const principalsLoader: PrincipalLoader = <PrincipalLoader>this.principalsCombobox.getLoader();
        principalsLoader.skipPrincipals(principals);
    }

    private createLanguageFormItem(): FormItem {
        this.localeCombobox = <LocaleComboBox>LocaleComboBox.create().setMaximumOccurrences(1).build();

        this.localeFormItem = new ProjectFormItemBuilder(this.localeCombobox)
            .setHelpText(i18n('settings.projects.language.helptext'))
            .setLabel(i18n('field.lang'))
            .build();

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

            this.localeCombobox.setValue(!!parentLanguage ? parentLanguage : '');

            NotifyManager.get().showSuccess(
                i18n('settings.wizard.project.copy.success', i18n('field.lang'), this.parentProject.getDisplayName()));
        });

        return button;
    }

    getLanguage(): string {
        return this.localeCombobox.getValue();
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
                    this.readAccessRadioGroup.setValue(resetValue, true);
                    this.copyParentAccessClicked = false;
                }
            }, 200);
        });
        confirmationDialog.open();
    }

    protected initListeners(item?: ProjectViewItem) {
        this.localeCombobox.onValueChanged(() => {
            this.notifyDataChanged();
            this.updateCopyParentLanguageButtonState();
        });

        if (!this.readAccessRadioGroup) {
            return;
        }

        this.readAccessRadioGroup.onValueChanged((event: ValueChangedEvent) => {
            const newValue: string = event.getNewValue();
            const oldValue: string = event.getOldValue();

            if (this.isConfirmationNeeded(event)) {
                this.showConfirmationDialog(newValue, oldValue);
            } else {
                this.handleAccessValueChanged(newValue);
                this.copyParentAccessClicked = false;
            }
        });

        this.principalsCombobox.onValueChanged(() => {
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
        this.principalsCombobox.setEnabled(newValue === ProjectReadAccessType.CUSTOM);
        this.readAccessRadioGroupFormItem.validate(new ValidationResult(), true);

        this.updateCopyParentAccessModeButtonState();
        this.notifyDataChanged();

        if (this.copyParentAccessClicked) {
            NotifyManager.get().showSuccess(
                i18n('settings.wizard.project.copy.success', i18n('settings.items.wizard.readaccess.label'),
                    this.parentProject.getDisplayName()));
        }
    }

    isEmpty(): boolean {
        return !this.getLanguage() && (!this.readAccessRadioGroup || !this.readAccessRadioGroup.getValue());
    }
}
