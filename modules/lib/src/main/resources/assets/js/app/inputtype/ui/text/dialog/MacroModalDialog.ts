import Q from 'q';
import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {FormItem} from '@enonic/lib-admin-ui/ui/form/FormItem';
import {Validators} from '@enonic/lib-admin-ui/ui/form/Validators';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {HtmlAreaModalDialogConfig, ModalDialog, ModalDialogFormItemBuilder} from './ModalDialog';
import {MacroDockedPanel} from './MacroDockedPanel';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ContentSummary} from '../../../../content/ContentSummary';
import {MacroDescriptor} from '@enonic/lib-admin-ui/macro/MacroDescriptor';
import {GetMacrosRequest} from '../../../../macro/resource/GetMacrosRequest';
import {MacroComboBox, MacroFormInputElWrapper} from '../../../../macro/MacroComboBox';
import DOMPurify from 'dompurify';
import {Macro, MacroDialogParams} from '../HtmlEditor';
import {HTMLAreaHelper} from '../HTMLAreaHelper';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export interface MacroModalDialogConfig
    extends HtmlAreaModalDialogConfig {
    applicationKeys: ApplicationKey[];
    selectedMacro: Macro;
    content: ContentSummary;
}

export class MacroModalDialog
    extends ModalDialog {

    private macroDockedPanel: MacroDockedPanel;

    private applicationKeys: ApplicationKey[];

    private selectedMacro: Macro;

    private macroFormItem: FormItem;

    private content: ContentSummary;

    declare protected config: MacroModalDialogConfig;

    constructor(config: MacroDialogParams, content: ContentSummary, applicationKeys: ApplicationKey[]) {
        super({
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
        } as MacroModalDialogConfig);

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
        const macroSelector: MacroComboBox = new MacroComboBox();
        macroSelector.getLoader().setApplicationKeys(this.applicationKeys);
        const formItemBuilder = new ModalDialogFormItemBuilder('macroId', i18n('dialog.macro.formitem.macro')).setValidator(
            Validators.required).setInputEl(new MacroFormInputElWrapper(macroSelector));

        return this.createFormItem(formItemBuilder);
    }

    private initMacroSelectorListeners() {
        let firstTimeSelected = true;

        this.getMacroCombobox().onSelectionChanged((selectionChange: SelectionChange<MacroDescriptor>) => {
            if (selectionChange.selected?.length > 0) {
                this.macroFormItem.addClass('selected-item-preview');
                this.addClass('shows-preview');
                this.macroDockedPanel.setMacroDescriptor(selectionChange.selected[0], firstTimeSelected ? this.makeData() : null);
                firstTimeSelected = false;
            } else if (selectionChange.deselected?.length > 0) {
                this.macroFormItem.removeClass('selected-item-preview');
                this.removeClass('shows-preview');
                this.displayValidationErrors(false);
                ResponsiveManager.fireResizeEvent();
            }
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

            this.getMacroCombobox().setSelectedMacro(macro);
            this.macroFormItem.addClass('selected-item-preview');
            this.addClass('shows-preview');
        });
    }

    private getMacroCombobox(): MacroComboBox {
        return (this.macroFormItem.getInput() as MacroFormInputElWrapper).getComboBox();
    }

    private getSelectedMacroDescriptor(): Q.Promise<MacroDescriptor> {
        return this.fetchMacros().then((macros: MacroDescriptor[]) => {
            return macros.filter((macro: MacroDescriptor) => macro.getKey().getName() === this.selectedMacro.name).pop();
        }).catch((reason) => {
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
        const macroName = this.getMacroName();

        if (macroName === 'SYSTEM:DISABLE') {
            return value;
        }

        const isEmbed = macroName === 'SYSTEM:EMBED';

        return DOMPurify.sanitize(value, {
            ALLOWED_URI_REGEXP: HTMLAreaHelper.getAllowedUriRegexp(),
            ADD_TAGS: isEmbed ? ['iframe'] : undefined,
            ADD_ATTR: isEmbed ? ['allow', 'allowfullscreen'] : undefined,
            RETURN_DOM: false,
            RETURN_DOM_FRAGMENT: false,
        });
    }

    private getMacroName(): string {
        return this.getMacroCombobox().getValue().toUpperCase();
    }

    private isSystemMacro(): boolean {
        return this.getMacroName().startsWith('SYSTEM:');
    }

    private makeData(): PropertySet {
        const data: PropertySet = new PropertySet();

        this.selectedMacro?.attributes.forEach(item => {
            data.addString(item[0], DOMPurify.sanitize(item[1]));
        });


        if (!this.isNoBodyMacro()) {
            if (this.isSingleTagBodyMacro()) {
                data.addString('body', this.sanitize(this.selectedMacro.body as string));
            } else if (this.isMultipleTagsBodyMacro()) {
                const body = this.selectedMacro.body as HTMLElement[];
                const bodyArrayText = body.map((elem)  => elem.outerHTML).reduce((prev, curr) => {
                    return prev + curr;
                }, '');
                data.addString('body', this.sanitize(bodyArrayText));
            }
        }

        return data;
    }

    private isNoBodyMacro(): boolean {
        return !ObjectHelper.isDefined(this.selectedMacro?.body);
    }

    private isSingleTagBodyMacro(): boolean {
        return typeof this.selectedMacro?.body === 'string';
    }

    private isMultipleTagsBodyMacro(): boolean {
        return Array.isArray(this.selectedMacro?.body);
    }

    private insertMacroIntoTextArea(): void {
        this.macroDockedPanel.getMacroPreviewString().then((macroString: string) => {
            if (this.selectedMacro) {
                this.insertUpdatedMacroIntoTextArea(macroString);
            } else {
                this.insertNewMacroIntoTextArea(macroString);
            }

            this.close();
        }).catch((reason) => {
            DefaultErrorHandler.handle(reason);
            showError(i18n('dialog.macro.error'));
        });
    }

    private insertUpdatedMacroIntoTextArea(macroString: string): void {
        const sanitizedMacro: string = this.sanitize(macroString);

        if (this.isNoBodyMacro()) {
            this.updateSingleTagContainedMacro(sanitizedMacro, '/]');
        } else if (this.isSingleTagBodyMacro()) {
            this.updateSingleTagContainedMacro(sanitizedMacro, `[/${this.selectedMacro.name}]`);
        } else if (this.isMultipleTagsBodyMacro()) {
            const bodyElements = this.selectedMacro.body as HTMLElement[];

            bodyElements.forEach((elem) => {
               elem.remove();
            });

            this.selectedMacro.macroEnd?.remove();

            this.updateSingleTagContainedMacro(sanitizedMacro, ']');
        }

        this.getEditor().fire('saveSnapshot'); // to trigger change event
    }

    private updateSingleTagContainedMacro(sanitizedMacro: string, closingSequence: string): void {
        const currentElemText: string = this.selectedMacro.macroStart.$.innerText;
        const closingTagIndex: number = currentElemText.indexOf(closingSequence, this.selectedMacro.index);
        const newElemText: string = currentElemText.substring(0, this.selectedMacro.index) +
                                    sanitizedMacro +
                                    currentElemText.substring(closingTagIndex + closingSequence.length);

        if (this.isSystemMacro()) {
            this.selectedMacro.macroStart.$.innerText = newElemText;
        } else {
            this.selectedMacro.macroStart.$.innerHTML = newElemText;
        }
    }

    private insertNewMacroIntoTextArea(macroString: string) {
        const sanitizedData = this.sanitize(macroString);

        if (this.isSystemMacro()) {
            this.getEditor().insertText(sanitizedData);
        } else {
            this.getEditor().insertHtml(sanitizedData);
        }
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
        return (this.macroFormItem.getInput() as MacroFormInputElWrapper).isDirty();
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
