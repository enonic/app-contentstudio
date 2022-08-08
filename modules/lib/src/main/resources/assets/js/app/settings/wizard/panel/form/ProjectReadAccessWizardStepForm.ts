import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import * as Q from 'q';
import {ProjectViewItem} from '../../../view/ProjectViewItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {ValidationResult} from '@enonic/lib-admin-ui/ui/form/ValidationResult';
import {ProjectReadAccess} from '../../../data/project/ProjectReadAccess';
import {ValidationRecording} from '@enonic/lib-admin-ui/form/ValidationRecording';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {ConfirmationDialog} from '@enonic/lib-admin-ui/ui/dialog/ConfirmationDialog';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {ProjectWizardStepForm} from './ProjectWizardStepForm';
import {Project} from '../../../data/project/Project';
import {LocaleLoader} from '../../../../locale/LocaleLoader';
import {ProjectReadAccessType} from '../../../data/project/ProjectReadAccessType';
import {LocaleFormItem} from './element/LocaleFormItem';
import {ProjectReadAccessFormItem} from './element/ProjectReadAccessFormItem';

export class ProjectReadAccessWizardStepForm
    extends ProjectWizardStepForm {

    private readAccessFormItem?: ProjectReadAccessFormItem;

    private localeFormItem: LocaleFormItem;

    private copyParentAccessClicked: boolean = false;

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item) {
            return Q(null);
        }

        const layoutPromises: Q.Promise<any>[] = [];

        layoutPromises.push(this.layoutLanguage(item.getLanguage()));

        if (!item.isDefaultProject()) {
            layoutPromises.push(this.readAccessFormItem.layoutReadAccess(item.getReadAccess(), item.getPermissions()));
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

        this.readAccessFormItem?.setPrincipalComboboxEnabled(enable);
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

    setup(item?: ProjectViewItem) {
        super.setup(item);

        this.readAccessFormItem?.setPrincipalComboboxEnabled(false);
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
        return this.readAccessFormItem?.getReadAccess();
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
        this.readAccessFormItem = new ProjectReadAccessFormItem();
        return this.readAccessFormItem;
    }

    setParentProject(project: Project) {
        super.setParentProject(project);
        this.localeFormItem.setParentProject(project);
        this.readAccessFormItem.setParentProject(project);
    }

    private createLanguageFormItem(): FormItem {
        this.localeFormItem = new LocaleFormItem();
        return this.localeFormItem;
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
