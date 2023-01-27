import * as Q from 'q';
import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {SelectedOptionEvent} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionEvent';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {HtmlAreaModalDialogConfig, ModalDialog, ModalDialogFormItemBuilder} from './ModalDialog';
import {MacroDockedPanel} from './MacroDockedPanel';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ContentSummary} from '../../../../content/ContentSummary';
import {MacroDescriptor} from '@enonic/lib-admin-ui/macro/MacroDescriptor';
import {MacrosLoader} from '../../../../macro/resource/MacrosLoader';
import {GetMacrosRequest} from '../../../../macro/resource/GetMacrosRequest';
import {MacroComboBox} from '../../../../macro/MacroComboBox';
import * as DOMPurify from 'dompurify';

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
            selectedMacro: config.macro.name ? config.macro : null,
            applicationKeys: applicationKeys,
            class: 'macro-modal-dialog macro-selector',
            content: content,
            allowOverflow: true,
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
        this.setSubmitAction(new Action(i18n('action.insert')));
    }

    protected initListeners() {
        super.initListeners();

        this.initMacroSelectorListeners();
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
            <MacroComboBox>MacroComboBox.create().setLoader(this.createMacrosLoader()).setMaximumOccurrences(1).build();
        const formItemBuilder = new ModalDialogFormItemBuilder('macroId', i18n('dialog.macro.formitem.macro')).setValidator(
            Validators.required).setInputEl(macroSelector);

        return this.createFormItem(formItemBuilder);
    }

    private initMacroSelectorListeners() {
        (<MacroComboBox>this.macroFormItem.getInput()).getComboBox().onOptionSelected((event: SelectedOptionEvent<MacroDescriptor>) => {
            this.macroFormItem.addClass('selected-item-preview');
            this.addClass('shows-preview');

            this.macroDockedPanel.setMacroDescriptor(event.getSelectedOption().getOption().getDisplayValue());
        });

        (<MacroComboBox>this.macroFormItem.getInput()).getComboBox().onOptionDeselected(() => {
            this.macroFormItem.removeClass('selected-item-preview');
            this.removeClass('shows-preview');
            this.displayValidationErrors(false);
            ResponsiveManager.fireResizeEvent();
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

    private getSelectedMacroDescriptor(): Q.Promise<MacroDescriptor> {
        return this.fetchMacros().then((macros: MacroDescriptor[]) => {
            return macros.filter((macro: MacroDescriptor) => macro.getKey().getName() === this.selectedMacro.name).pop();
        }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
            return null;
        });
    }

    private fetchMacros(): Q.Promise<MacroDescriptor[]> {
        const request: GetMacrosRequest = new GetMacrosRequest();
        request.setApplicationKeys(this.applicationKeys);

        return request.sendAndParse();
    }

    private sanitize(value: string): string {
        const macroName = (<MacroComboBox>this.macroFormItem.getInput()).getValue().toUpperCase();

        if (macroName === 'SYSTEM:DISABLE') {
            return value;
        }

        if (macroName === 'SYSTEM:EMBED') {
            return DOMPurify.sanitize(value, {ADD_TAGS: ['iframe'], ALLOWED_URI_REGEXP: this.getAllowedUriRegexp()});
        }

        return DOMPurify.sanitize(value, {ALLOWED_URI_REGEXP: this.getAllowedUriRegexp()});
    }

    private makeData(): PropertySet {
        const data: PropertySet = new PropertySet();

        this.selectedMacro.attributes.forEach(item => {
            data.addString(item[0], DOMPurify.sanitize(item[1]));
        });

        if (this.selectedMacro.body) {
            data.addString('body', this.sanitize(this.selectedMacro.body));
        }

        return data;
    }

    private insertMacroIntoTextArea(): void {
        this.macroDockedPanel.getMacroPreviewString().then((macroString: string) => {
            if (this.selectedMacro) {
                this.insertUpdatedMacroIntoTextArea(macroString);
            } else {
                this.getEditor().insertText(this.sanitize(macroString));
            }

            this.close();
        }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
            showError(i18n('dialog.macro.error'));
        });
    }

    private insertUpdatedMacroIntoTextArea(macroString: string) {
        const sanitizedMacro: string = this.sanitize(macroString);
        const currentElemText: string = this.selectedMacro.element.$.innerText;
        const newElemText: string = currentElemText.substring(0, this.selectedMacro.index) +
                                    sanitizedMacro +
                                    currentElemText.substring(this.selectedMacro.index + this.selectedMacro.macroText.length);
        this.selectedMacro.element.$.innerText = newElemText;

        this.getEditor().fire('saveSnapshot'); // to trigger change event
    }

    // it is a DOMPurify default regex for protocols handlers in URL attributes plus ours content://
    private getAllowedUriRegexp(): RegExp {
        return /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|content|media):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
    }

    protected validate(): boolean {
        const mainFormValid = super.validate();
        const configPanelValid = this.macroDockedPanel.validateMacroForm();

        return mainFormValid && configPanelValid;
    }

    isDirty(): boolean {
        return (<MacroComboBox>this.macroFormItem.getInput()).isDirty();
    }

    open(): void {
        super.open();

        this.getEditor().focusManager.lock();
    }

    close() {
        super.close();

        this.getEditor().focusManager.unlock();
    }
}

export interface SelectedMacro {
    macroText: string;
    name: string;
    attributes: any[];
    element: CKEDITOR.dom.element;
    index: number,
    body?: string;
}
