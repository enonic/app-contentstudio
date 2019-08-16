import TextInput = api.ui.text.TextInput;
import FormItemBuilder = api.ui.form.FormItemBuilder;
import Validators = api.ui.form.Validators;
import i18n = api.util.i18n;
import FormItem = api.ui.form.FormItem;
import ValidityChangedEvent = api.ValidityChangedEvent;
import LocaleComboBox = api.ui.locale.LocaleComboBox;
import Locale = api.locale.Locale;
import Option = api.ui.selector.Option;
import HelpTextContainer = api.form.HelpTextContainer;
import {LayerComboBox} from './LayerComboBox';

export class LayerDialogForm
    extends api.ui.form.Form {

    private parentLayer: LayerComboBox;

    private defaultLanguage: LocaleComboBox;

    private identifier: TextInput;

    private description: TextInput;

    private identifierFormItem: FormItem;

    private parentLayerFormItem: FormItem;

    private helpTextContainer: HelpTextContainer;

    constructor() {
        super('layer-dialog-form');

        this.initElements();
        this.setInitialValues();
        this.initFormView();
        this.initListeners();
    }

    private initElements() {
        this.parentLayer = new LayerComboBox(1);
        this.defaultLanguage = new LocaleComboBox(1);
        this.identifier = new TextInput('identifier').setForbiddenCharsRe(/[^a-z0-9\-_]/);
        this.description = new TextInput('description');
        this.helpTextContainer = new HelpTextContainer(i18n('dialog.layers.field.identifier.helptext'));
    }

    public setInitialValues() {
        this.parentLayer.clearCombobox();
        this.parentLayer.resetBaseValues();
        this.defaultLanguage.clearCombobox();
        this.defaultLanguage.resetBaseValues();
        this.identifier.reset();
        this.identifier.resetBaseValues();
        this.description.reset();
        this.description.resetBaseValues();
        this.helpTextContainer.toggleHelpText(false);
    }

    private parentLayerValidator(input: api.dom.FormInputEl): string {
        const value = input.getValue();
        const isValueRequired = this.isVisible() && api.util.StringHelper.isBlank(value);
        return isValueRequired ? i18n('field.value.required') : undefined;
    }

    private initFormView() {
        const fieldSet: api.ui.form.Fieldset = new api.ui.form.Fieldset();

        this.identifierFormItem = this.addValidationViewer(
            new FormItemBuilder(this.identifier)
                .setLabel(i18n('dialog.layers.field.identifier'))
                .setValidator(Validators.required)
                .build());
        fieldSet.add(this.identifierFormItem);

        this.parentLayerFormItem = this.addValidationViewer(
            new FormItemBuilder(this.parentLayer)
                .setLabel(i18n('dialog.layers.field.parentLayer'))
                .setValidator(Validators.required)
                .build());
        fieldSet.add(this.parentLayerFormItem);
        this.parentLayerFormItem.setValidator(this.parentLayerValidator);

        const defaultLanguageFormItem = this.addValidationViewer(
            new FormItemBuilder(this.defaultLanguage)
                .setLabel(i18n('dialog.layers.field.defaultLanguage'))
                .setValidator(Validators.required)
                .build());
        fieldSet.add(defaultLanguageFormItem);

        const descriptionFormItem = new FormItemBuilder(this.description)
            .setLabel(i18n('dialog.layers.field.description'))
            .build();
        fieldSet.add(descriptionFormItem);

        this.add(fieldSet);
    }

    private addValidationViewer(formItem: FormItem): FormItem {
        let validationRecordingViewer = new api.form.ValidationRecordingViewer();

        formItem.appendChild(validationRecordingViewer);

        formItem.onValidityChanged((event: ValidityChangedEvent) => {
            validationRecordingViewer.setError(formItem.getError());
        });

        return formItem;
    }

    private initListeners() {
        this.parentLayer.onValueChanged((event: api.ValueChangedEvent) => {
            this.validate(true);
        });

        this.defaultLanguage.onValueChanged((event: api.ValueChangedEvent) => {
            this.validate(true);
        });

        this.identifier.onValueChanged(() => {
            this.validate(true);
        });
    }

    public displayValidationErrors(value: boolean) {
        if (value) {
            this.addClass(api.form.FormView.VALIDATION_CLASS);
        } else {
            this.removeClass(api.form.FormView.VALIDATION_CLASS);
        }
    }

    public getParentLayer(): string {
        return this.parentLayer.getValue();
    }

    public setParentLayer(value: string) {
        this.parentLayer.setValue(value, true);
        this.parentLayerFormItem.show();
    }

    public hideParentLayer() {
        this.parentLayerFormItem.hide();
    }

    public setParentLayerReadOnly(value: boolean) {
        this.parentLayer.setReadOnly(value);
    }

    public getDefaultLanguage(): string {
        return this.defaultLanguage.getValue().trim();
    }

    public getDefaultLanguageOptionByValue(value: string): Option<Locale> {
        return this.defaultLanguage.getOptionByValue(value);
    }

    public onDefaultLanguageValueChanged(handler: (event: api.ValueChangedEvent) => void) {
        this.defaultLanguage.onValueChanged(handler);
    }

    public setDefaultLanguage(value: string) {
        this.defaultLanguage.setValue(value, true);
    }

    public getIdentifier(): string {
        return this.identifier.getValue().trim();
    }

    public setIdentifier(value: string) {
        this.identifier.setValue(value);
    }

    public setIdentifierReadOnly(value: boolean) {
        this.identifier.setReadOnly(value);
        this.identifierFormItem.setLabel(value ? i18n('dialog.layers.field.identifier.readonly') : i18n('dialog.layers.field.identifier'));
    }

    public getDescription(): string {
        return this.description.getValue().trim();
    }

    public setDescription(value: string) {
        this.description.setValue(value);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.parentLayer.addClass('parent-layer');
            this.defaultLanguage.addClass('default-language');

            this.helpTextContainer.getToggler().insertBeforeEl(this.identifier);
            this.helpTextContainer.getHelpText().insertAfterEl(this.identifier);

            return rendered;
        });
    }

}
