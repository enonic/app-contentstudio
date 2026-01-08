import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {FormItem, FormItemBuilder} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {PrincipalComboBox, PrincipalComboBoxWrapper} from '@enonic/lib-admin-ui/ui/security/PrincipalComboBox';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Fieldset} from '@enonic/lib-admin-ui/ui/form/Fieldset';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {LocaleComboBox, LocaleFormInputElWrapper} from '../../../../locale/LocaleComboBox';
import {ContentSummary} from '../../../../content/ContentSummary';
import {PropertiesWizardStepForm} from './PropertiesWizardStepForm';
import {UpdateContentMetadataRequest} from '../../../../resource/UpdateContentMetadataRequest';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {CSPrincipalCombobox} from '../../../../security/CSPrincipalCombobox';

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

        this.ownerCombo.onSelectionChanged(listener);
        this.localeCombo.onSelectionChanged(listener);
    }

    layout(content: ContentSummary): void {
        super.layout(content);


        this.localeCombo.openForTyping();
        this.localeCombo.setEnabled(true);
        this.localeCombo.setSelectedLocale(this.content.getLanguage() || '');
        this.ownerCombo.setSelectedItems(this.content.getOwner() ? [this.content.getOwner()] : []);
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
        this.ownerCombo = new CSPrincipalCombobox({
           maxSelected: 1,
           allowedTypes: [PrincipalType.USER],
        });

        return new FormItemBuilder(new PrincipalComboBoxWrapper(this.ownerCombo)).setLabel(i18n('field.owner')).build();
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

    isMetadataChanged(): boolean {
        return this.isChanged();
    }

    applyMetadataChange(request: UpdateContentMetadataRequest): UpdateContentMetadataRequest {
        request.setLanguage(this.localeCombo.getSelectedLocate()?.getId());
        request.setOwner(this.getSelectedOwner());

        return request;
    }

    private getSelectedOwner(): PrincipalKey {
        return this.ownerCombo.getSelectedOptions()[0]?.getOption()?.getDisplayValue().getKey();
    }
}
