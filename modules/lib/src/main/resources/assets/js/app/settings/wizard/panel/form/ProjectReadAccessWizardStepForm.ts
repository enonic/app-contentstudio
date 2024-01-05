import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import * as Q from 'q';
import {ProjectViewItem} from '../../../view/ProjectViewItem';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {ValidationResult} from '@enonic/lib-admin-ui/ui/form/ValidationResult';
import {ProjectReadAccess} from '../../../data/project/ProjectReadAccess';
import {ValidationRecording} from '@enonic/lib-admin-ui/form/ValidationRecording';
import {ConfirmationDialog} from '@enonic/lib-admin-ui/ui/dialog/ConfirmationDialog';
import {ProjectWizardStepForm} from './ProjectWizardStepForm';
import {Project} from '../../../data/project/Project';
import {ProjectReadAccessType} from '../../../data/project/ProjectReadAccessType';
import {LocaleFormItem} from './element/LocaleFormItem';
import {ProjectReadAccessFormItem} from './element/ProjectReadAccessFormItem';

export class ProjectReadAccessWizardStepForm
    extends ProjectWizardStepForm {

    private readAccessFormItem?: ProjectReadAccessFormItem;

    private localeFormItem: LocaleFormItem;

    layout(item: ProjectViewItem): Q.Promise<void> {
        if (!item) {
            return Q(null);
        }

        const layoutPromises: Q.Promise<void>[] = [];

        layoutPromises.push(
            this.layoutLanguage(item.getLanguage()),
            this.readAccessFormItem.layoutReadAccess(item.getReadAccess(), item.getPermissions())
        );

        return Q.all(layoutPromises).spread(() => Q());
    }

    private layoutLanguage(language: string): Q.Promise<void> {
        if (!language) {
            return Q(null);
        }

        this.localeFormItem.getLocaleCombobox().setSelectedLocale(language);
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);

        this.readAccessFormItem?.setPrincipalComboboxEnabled(enable);
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
        return [this.createLanguageFormItem(), this.createReadAccessRadioGroupFormItem()];
    }

    private createReadAccessRadioGroupFormItem(): FormItem {
        this.readAccessFormItem = new ProjectReadAccessFormItem();
        return this.readAccessFormItem;
    }

    setParentProjects(projects: Project[]) {
        super.setParentProjects(projects);
        this.localeFormItem.setParentProjects(projects);
        this.readAccessFormItem.setParentProjects(projects);
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
            });

        confirmationDialog.onClosed(() => {
            setTimeout(() => {
                if (!confirmed) {
                    this.readAccessFormItem.getRadioGroup().setValue(resetValue, true);
                    this.readAccessFormItem.setPrincipalComboboxEnabled(
                        this.readAccessFormItem.getReadAccessType() === ProjectReadAccessType.CUSTOM);
                }
            }, 200);
        });
        confirmationDialog.open();
    }

    protected initListeners(item?: ProjectViewItem) {
        this.localeFormItem.getLocaleCombobox().onSelectionChanged(() => {
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

        return ((oldValue === ProjectReadAccessType.PUBLIC.toString() && newValue !== ProjectReadAccessType.PUBLIC.toString()) ||
                (oldValue !== ProjectReadAccessType.PUBLIC.toString() && newValue === ProjectReadAccessType.PUBLIC.toString()));
    }

    private handleAccessValueChanged(newValue: string) {
        this.readAccessFormItem.setPrincipalComboboxEnabled(newValue === ProjectReadAccessType.CUSTOM.toString());
        this.readAccessFormItem.validate(new ValidationResult(), true);
        this.notifyDataChanged();
    }

    isEmpty(): boolean {
        return !this.getLanguage() && (!this.readAccessFormItem || !this.readAccessFormItem.getRadioGroup().getValue());
    }

    clean(): void {
        this.readAccessFormItem?.clean();
    }
}
