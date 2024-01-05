import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {FormItem, FormItemBuilder} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {PrincipalComboBox} from '@enonic/lib-admin-ui/ui/security/PrincipalComboBox';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Fieldset} from '@enonic/lib-admin-ui/ui/form/Fieldset';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {LocaleComboBox, LocaleFormInputElWrapper} from '../../../../locale/LocaleComboBox';
import {PrincipalLoader} from '../../../../security/PrincipalLoader';
import {ContentSummary} from '../../../../content/ContentSummary';
import {PropertiesWizardStepForm} from './PropertiesWizardStepForm';
import {UpdateContentRequest} from '../../../../resource/UpdateContentRequest';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';

export class SettingsWizardStepForm
    extends PropertiesWizardStepForm {

    private localeCombo: LocaleComboBox;
    private ownerCombo: PrincipalComboBox;

    constructor() {
        super('settings-wizard-step-form');
    }

    protected initElements(): void {
        super.initElements();

        this.addSettingsForm();
    }

    protected initListener(): void {
        super.initListener();

        const listener: () => void = () => this.changeListener?.();

        this.ownerCombo.onOptionSelected(listener);
        this.ownerCombo.onOptionDeselected(listener);
        this.localeCombo.onSelectionChanged(listener);
    }

    layout(content: ContentSummary): void {
        super.layout(content);


        this.localeCombo.openForTyping();
        this.localeCombo.setEnabled(true);
        this.localeCombo.setSelectedLocale(this.content.getLanguage() || '');

        this.ownerCombo.setValue(this.content.getOwner()?.toString() || '', true);
    }

    protected getHeaderText(): string {
        return null; // i18n('field.settings');
    }

    private addSettingsForm(): void {
        const fieldSet: Fieldset = new Fieldset();
        fieldSet.add(this.addLocaleFormItem());
        fieldSet.add(this.addOwnerFormItem());

        const form: Form = new Form().add(fieldSet);

        this.appendChild(form);

        form.onFocus((event: FocusEvent) => {
            this.notifyFocused(event);
        });

        form.onBlur((event: FocusEvent) => {
            this.notifyBlurred(event);
        });
    }

    private addLocaleFormItem(): FormItem {
        this.localeCombo = new LocaleComboBox();
        return new FormItemBuilder(new LocaleFormInputElWrapper(this.localeCombo)).setLabel(i18n('field.lang')).build();
    }

    private addOwnerFormItem(): FormItem {
        const loader = new PrincipalLoader().setAllowedTypes([PrincipalType.USER]);

        this.ownerCombo = PrincipalComboBox.create()
            .setLoader(loader)
            .setMaximumOccurrences(1)
            .setDisplayMissingSelectedOptions(true)
            .build() as PrincipalComboBox;

        return new FormItemBuilder(this.ownerCombo).setLabel(i18n('field.owner')).build();
    }

    giveFocus(): boolean {
        return this.ownerCombo.giveFocus();
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);

        this.localeCombo.setEnabled(enable);
        this.ownerCombo.setEnabled(enable);
    }

    isChanged(): boolean {
        return !ObjectHelper.stringEquals(this.localeCombo.getValue(), this.content.getLanguage()) ||
            !ObjectHelper.equals(this.getSelectedOwner(), this.content.getOwner());
    }

    applyChange(request: UpdateContentRequest): UpdateContentRequest {
        request.setLanguage(this.localeCombo.getSelectedLocate()?.getId());
        request.setOwner(this.getSelectedOwner());

        return request;
    }

    private getSelectedOwner(): PrincipalKey {
        return this.ownerCombo.getSelectedDisplayValues()[0]?.getKey();
    }
}
