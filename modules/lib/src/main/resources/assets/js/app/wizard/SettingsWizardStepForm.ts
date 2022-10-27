import {ContentSettingsModel} from './ContentSettingsModel';
import {Content, ContentBuilder} from '../content/Content';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {FormItem, FormItemBuilder} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {PrincipalComboBox} from '@enonic/lib-admin-ui/ui/security/PrincipalComboBox';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {WizardStepForm} from '@enonic/lib-admin-ui/app/wizard/WizardStepForm';
import {PropertyChangedEvent} from '@enonic/lib-admin-ui/PropertyChangedEvent';
import {Fieldset} from '@enonic/lib-admin-ui/ui/form/Fieldset';
import {Form} from '@enonic/lib-admin-ui/ui/form/Form';
import {assertNotNull} from '@enonic/lib-admin-ui/util/Assert';
import {ProjectContext} from '../project/ProjectContext';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {LocaleComboBox} from '../locale/LocaleComboBox';
import {PrincipalLoader} from '../security/PrincipalLoader';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';

export class SettingsWizardStepForm
    extends WizardStepForm {

    private content: Content;
    private model: ContentSettingsModel;
    private modelChangeListener: (event: PropertyChangedEvent) => void;
    private updateUnchangedOnly: boolean = false;
    private ignorePropertyChange: boolean = false;

    private localeCombo: LocaleComboBox;
    private ownerCombo: PrincipalComboBox;

    constructor() {
        super('settings-wizard-step-form');

        this.initModelChangeListener();
    }

    private initModelChangeListener(): void {
        this.modelChangeListener = (event: PropertyChangedEvent) => {
            if (this.ignorePropertyChange) {
                return;
            }

            const value: any = event.getNewValue();
            const propertyName: string = event.getPropertyName();

            if (propertyName === ContentSettingsModel.PROPERTY_LANG) {
                if (!this.updateUnchangedOnly || !this.localeCombo.isDirty()) {
                    this.localeCombo.setValue(value?.toString());
                }
            } else if (propertyName === ContentSettingsModel.PROPERTY_OWNER) {
                if (!this.updateUnchangedOnly || !this.ownerCombo.isDirty()) {
                    this.ownerCombo.setValue(value?.toString());
                }
            }
        };
    }

    layout(content: Content) {
        this.content = content;

        this.addSettingsForm();
        this.setModel(new ContentSettingsModel(content));
        this.addOwnerChangeListener();
        this.addLocaleChangeListener();
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
        this.localeCombo = <LocaleComboBox>LocaleComboBox.create().setMaximumOccurrences(1).setValue(this.content.getLanguage()).build();
        return new FormItemBuilder(this.localeCombo).setLabel(i18n('field.lang')).build();
    }

    private addOwnerFormItem(): FormItem {
        const loader = new PrincipalLoader().setAllowedTypes([PrincipalType.USER]);

        this.ownerCombo = <PrincipalComboBox>PrincipalComboBox.create()
            .setLoader(loader)
            .setMaximumOccurrences(1).setValue(this.content.getOwner()?.toString())
            .setDisplayMissingSelectedOptions(true)
            .build();

        return new FormItemBuilder(this.ownerCombo).setLabel(i18n('field.owner')).build();
    }

    update(content: Content, unchangedOnly: boolean = true) {
        this.content = content;
        this.updateUnchangedOnly = unchangedOnly;

        if (!this.updateUnchangedOnly || !this.localeCombo.isDirty()) {
            this.model.setLanguage(content.getLanguage());
        }

        if (!this.updateUnchangedOnly || !this.ownerCombo.isDirty()) {
            this.model.setOwner(content.getOwner());
        }
    }

    reset() {
        this.localeCombo.resetBaseValues();
        this.ownerCombo.resetBaseValues();
    }

    onPropertyChanged(listener: { (event: PropertyChangedEvent): void; }) {
        this.model.onPropertyChanged(listener);
    }

    unPropertyChanged(listener: { (event: PropertyChangedEvent): void; }) {
        this.model.unPropertyChanged(listener);
    }

    private setModel(model: ContentSettingsModel) {
        assertNotNull(model, 'Model can\'t be null');

        this.model?.unPropertyChanged(this.modelChangeListener);
        model.onPropertyChanged(this.modelChangeListener);
        this.model = model;
    }

    private addOwnerChangeListener(): void {
        const ownerListener = () => {
            const owner: PrincipalKey = this.ownerCombo.getSelectedDisplayValues()[0]?.getKey();
            this.ignorePropertyChange = true;
            this.model.setOwner(owner);

            if (ObjectHelper.equals(owner, this.content.getOwner())) {
                this.ownerCombo.resetBaseValues();
            }

            this.ignorePropertyChange = false;
        };

        this.ownerCombo.onOptionSelected(ownerListener);
        this.ownerCombo.onOptionDeselected(ownerListener);
    }

    private addLocaleChangeListener(): void {
        const localeListener = () => {
            this.ignorePropertyChange = true;
            this.model.setLanguage(this.localeCombo.getValue());

            if (this.localeCombo.getValue() === this.content.getLanguage()) {
                this.localeCombo.resetBaseValues();
            }

            this.ignorePropertyChange = false;
        };

        this.localeCombo.onOptionSelected(localeListener);
        this.localeCombo.onOptionDeselected(localeListener);
    }

    apply(builder: ContentBuilder) {
        this.model.apply(builder);
    }

    updateInitialLanguage() {
        if (!this.content.isDataInherited()) {
            return;
        }

        const currentProjectLanguage: string = ProjectContext.get().getProject().getLanguage();
        if (currentProjectLanguage && currentProjectLanguage !== this.content.getLanguage()) {
            this.model.setLanguage(currentProjectLanguage);
            NotifyManager.get().showFeedback(i18n('notify.wizard.language.copiedFromParent'));
        }
    }

    giveFocus(): boolean {
        return this.ownerCombo.giveFocus();
    }

    setEnabled(enable: boolean): void {
        super.setEnabled(enable);

        this.localeCombo.setEnabled(enable);
        this.ownerCombo.setEnabled(enable);
    }

}
