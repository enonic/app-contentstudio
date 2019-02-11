import FormItem = api.ui.form.FormItem;
import Validators = api.ui.form.Validators;
import ApplicationKey = api.application.ApplicationKey;
import SelectedOptionEvent = api.ui.selector.combobox.SelectedOptionEvent;
import ResponsiveManager = api.ui.responsive.ResponsiveManager;
import MacroDescriptor = api.macro.MacroDescriptor;
import GetMacrosRequest = api.macro.resource.GetMacrosRequest;
import PropertySet = api.data.PropertySet;
import MacrosLoader = api.macro.resource.MacrosLoader;
import MacroComboBox = api.macro.MacroComboBox;
import ContentSummary = api.content.ContentSummary;
import i18n = api.util.i18n;
import {HtmlAreaModalDialogConfig, ModalDialog, ModalDialogFormItemBuilder} from './ModalDialog';
import {MacroDockedPanel} from './MacroDockedPanel';

export interface MacroModalDialogConfig
    extends HtmlAreaModalDialogConfig {
    applicationKeys: ApplicationKey[];
    selectedMacro: SelectedMacro;
    content: ContentSummary;
}

export class MacroModalDialog
    extends ModalDialog {

    private macroDockedPanel: MacroDockedPanel;

    private applicationKeys: ApplicationKey[];

    private selectedMacro: SelectedMacro;

    private macroFormItem: FormItem;

    private content: ContentSummary;

    protected config: MacroModalDialogConfig;

    constructor(config: any, content: ContentSummary, applicationKeys: ApplicationKey[]) {
        super(<MacroModalDialogConfig>{
            editor: config.editor,
            title: i18n('dialog.macro.title'),
            selectedMacro: !!config.macro.name ? config.macro : null,
            applicationKeys: applicationKeys,
            class: 'macro-modal-dialog macro-selector',
            content: content,
            confirmation: {
                yesCallback: () => this.getSubmitAction().execute(),
                noCallback: () => this.close(),
            }
        });

        this.getEditor().focusManager.add(new CKEDITOR.dom.element(this.getHTMLElement()), true);
    }

    protected initElements() {
        super.initElements();

        this.selectedMacro = this.config.selectedMacro;
        this.applicationKeys = this.config.applicationKeys;
        this.content = this.config.content;
        this.macroDockedPanel = this.createMacroDockedPanel();
        this.initFieldsValues();
        this.setSubmitAction(new api.ui.Action(i18n('action.insert')));
    }

    protected initListeners() {
        super.initListeners();

        this.initMacroSelectorListeners();
        this.setupResizeListener();
        this.submitAction.onExecuted(() => {
            this.displayValidationErrors(true);
            if (this.validate()) {
                this.insertMacroIntoTextArea();
            }
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChildToContentPanel(this.macroDockedPanel);
            this.addAction(this.submitAction);
            this.addCancelButtonToBottom();

            return rendered;
        });
    }

    private setupResizeListener() {
        const onResize = api.util.AppHelper.debounce(() => {
            const formView = this.macroDockedPanel.getConfigForm();

            if (!formView) {
                return;
            }

            const dialogHeight = this.getEl().getHeight();
            if (dialogHeight >= (wemjq('body').height() - 100)) {
                formView.getEl().setHeightPx(0.5 * dialogHeight);
            }
        }, 500, true);

        ResponsiveManager.onAvailableSizeChanged(this, onResize);
    }

    private createMacroDockedPanel(): MacroDockedPanel {
        const macroDockedPanel: MacroDockedPanel = new MacroDockedPanel();
        macroDockedPanel.setContent(this.content);

        return macroDockedPanel;
    }

    protected getMainFormItems(): FormItem[] {
        this.macroFormItem = this.createMacroFormItem();

        this.setElementToFocusOnShow(this.macroFormItem.getInput());

        return [
            this.macroFormItem
        ];
    }

    private createMacroFormItem(): FormItem {
        const macroSelector: MacroComboBox =
            MacroComboBox.create().setLoader(this.createMacrosLoader()).setMaximumOccurrences(1).build();
        const formItemBuilder = new ModalDialogFormItemBuilder('macroId', i18n('dialog.macro.formitem.macro')).setValidator(
            Validators.required).setInputEl(macroSelector);

        return this.createFormItem(formItemBuilder);
    }

    private initMacroSelectorListeners() {
        (<MacroComboBox>this.macroFormItem.getInput()).getComboBox().onOptionSelected((event: SelectedOptionEvent<MacroDescriptor>) => {
            this.macroFormItem.addClass('selected-item-preview');
            this.addClass('shows-preview');

            this.macroDockedPanel.setMacroDescriptor(event.getSelectedOption().getOption().displayValue);
        });

        (<MacroComboBox>this.macroFormItem.getInput()).getComboBox().onOptionDeselected(() => {
            this.macroFormItem.removeClass('selected-item-preview');
            this.removeClass('shows-preview');
            this.displayValidationErrors(false);
            api.ui.responsive.ResponsiveManager.fireResizeEvent();
        });
    }

    private initFieldsValues() {
        if (!this.selectedMacro) {
            return;
        }

        this.getSelectedMacroDescriptor().then((macro: MacroDescriptor) => {
            if (!macro) {
                return;
            }

            (<MacroComboBox>this.macroFormItem.getInput()).setValue(macro.getKey().getRefString());
            this.macroFormItem.addClass('selected-item-preview');
            this.addClass('shows-preview');

            this.macroDockedPanel.setMacroDescriptor(macro, this.makeData());
        });
    }

    private createMacrosLoader(): MacrosLoader {
        const loader = new MacrosLoader();
        loader.setApplicationKeys(this.applicationKeys);

        return loader;
    }

    private getSelectedMacroDescriptor(): wemQ.Promise<MacroDescriptor> {
        return this.fetchMacros().then((macros: MacroDescriptor[]) => {
            return macros.filter((macro: MacroDescriptor) => macro.getKey().getName() === this.selectedMacro.name).pop();
        }).catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
            return null;
        });
    }

    private fetchMacros(): wemQ.Promise<MacroDescriptor[]> {
        const request: GetMacrosRequest = new GetMacrosRequest();
        request.setApplicationKeys(this.applicationKeys);

        return request.sendAndParse();
    }

    private makeData(): PropertySet {
        const data: PropertySet = new PropertySet();

        this.selectedMacro.attributes.forEach(item => {
            data.addString(item[0], item[1]);
        });
        if (this.selectedMacro.body) {
            data.addString('body', this.selectedMacro.body);
        }

        return data;
    }

    private insertMacroIntoTextArea(): void {
        this.macroDockedPanel.getMacroPreviewString().then((macroString: string) => {
            if (this.selectedMacro) {
                this.insertUpdatedMacroIntoTextArea(macroString);
            } else {
                this.getEditor().insertText(macroString);
            }

            this.close();
        }).catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
            api.notify.showError(i18n('dialog.macro.error'));
        });
    }

    private insertUpdatedMacroIntoTextArea(macroString: string) {
        this.selectedMacro.element.setText(
            this.selectedMacro.element.getText().replace(this.selectedMacro.macroText, macroString));
        this.getEditor().fire('saveSnapshot'); // to trigger change event
    }

    protected validate(): boolean {
        const mainFormValid = super.validate();
        const configPanelValid = this.macroDockedPanel.validateMacroForm();

        return mainFormValid && configPanelValid;
    }

    isDirty(): boolean {
        return (<MacroComboBox>this.macroFormItem.getInput()).isDirty();
    }
}

export interface SelectedMacro {
    macroText: string;
    name: string;
    attributes: any[];
    element: CKEDITOR.dom.element;
    body?: string;
}
