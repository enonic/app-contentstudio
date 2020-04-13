import {FormItem} from 'lib-admin-ui/ui/form/FormItem';
import * as Q from 'q';
import {ProjectViewItem} from '../view/ProjectViewItem';
import {RadioGroup} from 'lib-admin-ui/ui/RadioGroup';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Validators} from 'lib-admin-ui/ui/form/Validators';
import {PrincipalLoader} from 'lib-admin-ui/security/PrincipalLoader';
import {PrincipalType} from 'lib-admin-ui/security/PrincipalType';
import {PrincipalComboBox} from 'lib-admin-ui/ui/security/PrincipalComboBox';
import {ValueChangedEvent} from 'lib-admin-ui/ValueChangedEvent';
import {SettingDataItemWizardStepForm} from './SettingDataItemWizardStepForm';
import {ValidationResult} from 'lib-admin-ui/ui/form/ValidationResult';
import {ProjectReadAccess, ProjectReadAccessType} from '../data/project/ProjectReadAccess';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {Principal} from 'lib-admin-ui/security/Principal';
import {GetPrincipalsByKeysRequest} from 'lib-admin-ui/security/GetPrincipalsByKeysRequest';
import {ProjectPermissions} from '../data/project/ProjectPermissions';
import {ValidationRecording} from 'lib-admin-ui/form/ValidationRecording';
import {LocaleComboBox} from 'lib-admin-ui/ui/locale/LocaleComboBox';
import {Locale} from 'lib-admin-ui/locale/Locale';
import {LocaleLoader} from 'lib-admin-ui/locale/LocaleLoader';
import {ProjectFormItemBuilder} from './ProjectFormItem';

export class ProjectReadAccessWizardStepForm
    extends SettingDataItemWizardStepForm<ProjectViewItem> {

    private readAccessRadioGroup?: RadioGroup;

    private readAccessRadioGroupFormItem?: FormItem;

    private principalsCombobox?: PrincipalComboBox;

    private localeCombobox: LocaleComboBox;

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

    private getLocales(): Q.Promise<Locale[]> {
        const localeLoader: LocaleLoader = <LocaleLoader>this.localeCombobox.getLoader();
        if (localeLoader.isLoaded()) {
            return Q(this.localeCombobox.getDisplayValues());
        }

        return this.localeCombobox.getLoader().load();
    }

    private getLocaleByLanguage(language: string, locales: Locale[]): Locale {
        let selectedLocale: Locale = null;

        locales.some((locale: Locale) => {
            if (locale.getId() === language) {
                selectedLocale = locale;
                return true;
            }

            return false;
        });

        return selectedLocale;
    }

    private layoutReadAccess(readAccess: ProjectReadAccess, permissions: ProjectPermissions): Q.Promise<void> {
        this.readAccessRadioGroup.setValue(readAccess.getType(), true);

        this.updateFilteredPrincipalsByPermissions(permissions);

        if (readAccess.getType() !== ProjectReadAccessType.CUSTOM) {
            return Q(null);
        }

        this.enablePrincipalCombobox();

        return new GetPrincipalsByKeysRequest(readAccess.getPrincipals()).sendAndParse().then((principals: Principal[]) => {
            principals.forEach((principal: Principal) => {
                this.principalsCombobox.select(principal, false, true);
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
        this.disablePrincipalCombobox();
    }

    public getName(): string {
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

    protected getFormItems(item?: ProjectViewItem): FormItem[] {
        if (!!item && item.isDefaultProject()) {
            return [this.createLanguageFormItem()];
        }

        return [this.createLanguageFormItem(), this.createReadAccessRadioGroupFormItem()];
    }

    private createReadAccessRadioGroupFormItem(): FormItem {
        this.readAccessRadioGroup = new RadioGroup('read-access-radio-group');

        this.readAccessRadioGroup.addOption('public', i18n('settings.items.wizard.readaccess.public'));
        this.readAccessRadioGroup.addOption('private', i18n('settings.items.wizard.readaccess.private'));
        this.readAccessRadioGroup.addOption('custom', i18n('settings.items.wizard.readaccess.custom'));

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

    private createPrincipalsCombobox(): PrincipalComboBox {
        const loader: PrincipalLoader = new PrincipalLoader().setAllowedTypes([PrincipalType.USER, PrincipalType.GROUP]);
        const principalsCombobox = <PrincipalComboBox>PrincipalComboBox.create().setLoader(loader).build();

        return principalsCombobox;
    }

    private getDefaultFilteredPrincipals(): PrincipalKey[] {
        return [PrincipalKey.ofAnonymous()];
    }

    private filterPrincipals(principals: PrincipalKey[]) {
        const principalsLoader: PrincipalLoader = <PrincipalLoader>this.principalsCombobox.getLoader();
        principalsLoader.skipPrincipals(principals);
    }

    private disablePrincipalCombobox() {
        this.principalsCombobox.getComboBox().setEnabled(false);
        this.principalsCombobox.addClass('disabled');
    }

    private enablePrincipalCombobox() {
        this.principalsCombobox.getComboBox().setEnabled(true);
        this.principalsCombobox.removeClass('disabled');
    }

    private createLanguageFormItem(): FormItem {
        this.localeCombobox = <LocaleComboBox>LocaleComboBox.create().setMaximumOccurrences(1).build();

        return new ProjectFormItemBuilder(this.localeCombobox)
            .setHelpText(i18n('settings.projects.language.helptext'))
            .setLabel(i18n('field.lang'))
            .build();
    }

    getLanguage(): string {
        return this.localeCombobox.getValue();
    }

    protected initListeners() {
        this.localeCombobox.onValueChanged(() => {
            this.notifyDataChanged();
        });

        if (!this.readAccessRadioGroup) {
            return;
        }

        this.readAccessRadioGroup.onValueChanged((event: ValueChangedEvent) => {
            const newValue: string = event.getNewValue();

            if (newValue === 'private' || newValue === 'public') {
                this.disablePrincipalCombobox();
            } else {
                this.enablePrincipalCombobox();
            }

            this.readAccessRadioGroupFormItem.validate(new ValidationResult(), true);

            this.notifyDataChanged();
        });

        this.principalsCombobox.onValueChanged(() => {
            this.notifyDataChanged();
        });
    }

}
