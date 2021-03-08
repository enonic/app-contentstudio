import * as Q from 'q';
import {Element as UIElement} from 'lib-admin-ui/dom/Element';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {Form} from 'lib-admin-ui/ui/form/Form';
import {Fieldset} from 'lib-admin-ui/ui/form/Fieldset';
import {FormItem, FormItemBuilder} from 'lib-admin-ui/ui/form/FormItem';
import {ModalDialog as OriginalModalDialog, ModalDialogConfig} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {FormInputEl} from 'lib-admin-ui/dom/FormInputEl';
import {FormItemEl} from 'lib-admin-ui/dom/FormItemEl';
import {Action} from 'lib-admin-ui/ui/Action';
import {FormView} from 'lib-admin-ui/form/FormView';
import {Panel} from 'lib-admin-ui/ui/panel/Panel';
import {ValidationResult} from 'lib-admin-ui/ui/form/ValidationResult';
import {TextInput} from 'lib-admin-ui/ui/text/TextInput';
import {InputEl} from 'lib-admin-ui/dom/InputEl';
import {RichComboBox} from 'lib-admin-ui/ui/selector/combobox/RichComboBox';

export class ModalDialogFormItemBuilder {

    id: string;

    label: string;

    validator: (input: FormInputEl) => string;

    value: string;

    placeholder: string;

    inputEl: FormItemEl;

    constructor(id: string, label?: string) {
        this.id = id;
        this.label = label;

        return this;
    }

    setValue(value: string): ModalDialogFormItemBuilder {
        this.value = value;
        return this;
    }

    setPlaceholder(placeholder: string): ModalDialogFormItemBuilder {
        this.placeholder = placeholder;
        return this;
    }

    setValidator(validator: (input: FormInputEl) => string): ModalDialogFormItemBuilder {
        this.validator = validator;
        return this;
    }

    setInputEl(inputEl: UIElement): ModalDialogFormItemBuilder {
        this.inputEl = <FormItemEl>inputEl;
        return this;
    }
}

export interface HtmlAreaModalDialogConfig
    extends ModalDialogConfig {
    editor: CKEDITOR.editor;

    dialog?: any; // for cke backed dialogs
}

export abstract class ModalDialog
    extends OriginalModalDialog {
    private fields: { [id: string]: FormItemEl };
    private validated: boolean = false;
    private editor: CKEDITOR.editor;
    private mainForm: Form;
    protected submitAction: Action;
    protected config: HtmlAreaModalDialogConfig;

    public static CLASS_NAME: string = 'html-area-modal-dialog';

    protected constructor(config: HtmlAreaModalDialogConfig) {
        super(config);
    }

    protected initElements() {
        super.initElements();

        this.fields = {};
        this.editor = this.config.editor;
    }

    protected postInitElements() {
        super.postInitElements();

        this.mainForm = this.createForm(this.getMainFormItems());
    }

    protected initListeners() {
        super.initListeners();

        if (this.submitAction) {
            this.listenEnterKey();
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChildToContentPanel(this.mainForm);
            this.getEl().addClass(ModalDialog.CLASS_NAME);

            return rendered;
        });
    }

    setSubmitAction(action: Action) {
        this.submitAction = action;
    }

    getSubmitAction(): Action {
        return this.submitAction;
    }

    protected getEditor(): CKEDITOR.editor {
        return this.editor;
    }

    protected setValidated() {
        this.validated = true;
    }

    protected getMainFormItems(): FormItem[] {
        return [];
    }

    protected validate(): boolean {
        this.setValidated();

        return this.mainForm.validate(true).isValid();
    }

    protected hasSubDialog(): boolean {
        // html area dialogs can't have sub dialogs
        return false;
    }

    protected createForm(formItems: FormItem[]): Form {
        const form = new Form();
        let validationCls = FormView.VALIDATION_CLASS;

        formItems.forEach((formItem: FormItem) => {
            form.add(this.createFieldSet(formItem));
            if (formItem.getValidator() && validationCls) {
                form.addClass(validationCls);
                validationCls = '';
            }
        });

        return form;
    }

    protected displayValidationErrors(value: boolean) {
        if (value) {
            this.mainForm.addClass(FormView.VALIDATION_CLASS);
        } else {
            this.mainForm.removeClass(FormView.VALIDATION_CLASS);
        }
    }

    protected createFormPanel(formItems: FormItem[]): Panel {
        let panel = new Panel();
        let form = this.createForm(formItems);

        panel.appendChild(form);

        return panel;
    }

    public createFieldSet(formItem: FormItem): Fieldset {
        const fieldSet = new Fieldset();

        fieldSet.addClass('modal-dialog-fieldset');
        fieldSet.add(formItem);

        return fieldSet;
    }

    onValidatedFieldValueChanged(formItem: FormItem) {
        if (this.validated) {
            formItem.validate(new ValidationResult(), true);
        }
    }

    private createTextInput(placeholder?: string): TextInput {
        const textInput = new TextInput();

        if (placeholder) {
            textInput.setPlaceholder(placeholder);
        }

        return textInput;
    }

    protected createFormItem(modalDialogFormItemBuilder: ModalDialogFormItemBuilder): FormItem {
        let label = modalDialogFormItemBuilder.label;
        let id = modalDialogFormItemBuilder.id;
        let value = modalDialogFormItemBuilder.value;
        let validator = modalDialogFormItemBuilder.validator;
        let formItemEl = modalDialogFormItemBuilder.inputEl || this.createTextInput(modalDialogFormItemBuilder.placeholder);
        let formItemBuilder = new FormItemBuilder(formItemEl).setLabel(label);
        let inputWrapper = new DivEl('input-wrapper');
        let formItem;

        if (this.fields[id]) {
            throw 'Element with id ' + id + ' already exists';
        }

        if (value) {
            (<InputEl>formItemEl).setValue(value);
        }

        this.fields[id] = formItemEl;

        if (validator) {
            formItemBuilder.setValidator(validator);
        }

        formItem = formItemBuilder.build();

        formItem.getInput().wrapWithElement(inputWrapper);

        if (validator) {
            if (ObjectHelper.iFrameSafeInstanceOf(formItemEl, TextInput)) {
                (<TextInput>formItemEl).onValueChanged(this.onValidatedFieldValueChanged.bind(this, formItem));
            }
            if (ObjectHelper.iFrameSafeInstanceOf(formItemEl, RichComboBox)) {
                (<RichComboBox<any>>formItemEl).onOptionSelected(this.onValidatedFieldValueChanged.bind(this,
                    formItem));
                (<RichComboBox<any>>formItemEl).onOptionDeselected(this.onValidatedFieldValueChanged.bind(this,
                    formItem));
            }
        }

        return formItem;
    }

    protected getFieldById(id: string): FormItemEl {
        return this.fields[id];
    }

    close() {
        super.close();
        if (!this.editor['destroyed']) {
            this.editor.focus();
        }
        this.remove();
    }

    private listenEnterKey() {
        this.onKeyDown((event: KeyboardEvent) => {
            if (event.which === 13) { // enter
                if (this.isTextInput(<Element>event.target)) {
                    this.submitAction.execute();
                }
            }
        });
    }

    private isTextInput(element: Element): boolean {
        return element.tagName.toUpperCase() === 'INPUT' && element.id.indexOf('TextInput') > 0;
    }
}
