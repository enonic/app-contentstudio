import TextInput = api.ui.text.TextInput;
import FormItemBuilder = api.ui.form.FormItemBuilder;
import Validators = api.ui.form.Validators;
import i18n = api.util.i18n;
import FormItem = api.ui.form.FormItem;
import ValidityChangedEvent = api.ValidityChangedEvent;
import LocaleComboBox = api.ui.locale.LocaleComboBox;
import StringHelper = api.util.StringHelper;
import {LayerComboBox} from './LayerComboBox';
import {ContentLayer} from '../content/ContentLayer';

export class LayerDialogForm
    extends api.ui.form.Form {

    private parentLayer: LayerComboBox;

    private defaultLanguage: LocaleComboBox;

    private identifier: TextInput;

    private icon: TextInput;

    private description: TextInput;

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
        this.identifier = new TextInput('identifier').setForbiddenCharsRe(/[^A-Za-z0-9\-_]/);
        this.icon = new TextInput('icon');
        this.description = new TextInput('description');
    }

    public setInitialValues() {
        this.parentLayer.setValue(ContentLayer.DEFAULT_LAYER_NAME);
        this.defaultLanguage.clearSelection();
        this.identifier.reset();
        this.description.reset();
    }

    private initFormView() {
        const fieldSet: api.ui.form.Fieldset = new api.ui.form.Fieldset();

        const parentLayerFormItem = this.addValidationViewer(
            new FormItemBuilder(this.parentLayer).setLabel(i18n('dialog.layers.field.parentLayer')).setValidator(
                Validators.required).build());
        fieldSet.add(parentLayerFormItem);

        const defaultLanguageFormItem = this.addValidationViewer(
            new FormItemBuilder(this.defaultLanguage)
                .setLabel(i18n('dialog.layers.field.defaultLanguage'))
                .setValidator(Validators.required)
                .build());
        fieldSet.add(defaultLanguageFormItem);

        const identifierFormItem = this.addValidationViewer(
            new FormItemBuilder(this.identifier)
                .setLabel(i18n('dialog.layers.field.identifier'))
                .setValidator(Validators.required)
                .build());
        fieldSet.add(identifierFormItem);

        const iconFormItem = this.addValidationViewer(
            new FormItemBuilder(this.icon).setLabel(i18n('dialog.layers.field.icon')).build());
        fieldSet.add(iconFormItem);

        const descriptionFormItem = this.addValidationViewer(
            new FormItemBuilder(this.description).setLabel(i18n('dialog.layers.field.description')).build());
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
            if (!StringHelper.isEmpty(event.getNewValue())) {
                const selectedParentLayer: ContentLayer = this.parentLayer.getSelectedOptions()[0].getOption().displayValue;
                if (selectedParentLayer.getLanguage()) {
                    this.defaultLanguage.setValue(selectedParentLayer.getLanguage());
                }
            }
            this.validate(true);
        });

        this.defaultLanguage.onValueChanged((event: api.ValueChangedEvent) => {
            if (!StringHelper.isEmpty(event.getNewValue()) && !this.identifier.isReadOnly()) {
                this.identifier.setValue(event.getNewValue());
            }
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
    }

    public setParentLayerReadOnly(value: boolean) {
        this.parentLayer.setReadOnly(value);
    }

    public getDefaultLanguage(): string {
        return this.defaultLanguage.getValue().trim();
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
    }

    public getDescription(): string {
        return this.description.getValue().trim();
    }

    public setDescription(value: string) {
        this.description.setValue(value);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.parentLayer.addClass('parentLayer');
            this.defaultLanguage.addClass('defaultLanguage');

            return rendered;
        });
    }

}
