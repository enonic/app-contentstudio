import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {Class} from '@enonic/lib-admin-ui/Class';
import {Property} from '@enonic/lib-admin-ui/data/Property';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueType} from '@enonic/lib-admin-ui/data/ValueType';
import {ValueTypeConverter} from '@enonic/lib-admin-ui/data/ValueTypeConverter';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element, LangDirection} from '@enonic/lib-admin-ui/dom/Element';
import {FormEl} from '@enonic/lib-admin-ui/dom/FormEl';
import {FormInputEl} from '@enonic/lib-admin-ui/dom/FormInputEl';
import {InputTypeManager} from '@enonic/lib-admin-ui/form/inputtype/InputTypeManager';
import {BaseInputTypeNotManagingAdd} from '@enonic/lib-admin-ui/form/inputtype/support/BaseInputTypeNotManagingAdd';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {KeyHelper} from '@enonic/lib-admin-ui/ui/KeyHelper';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {TextArea} from '@enonic/lib-admin-ui/ui/text/TextArea';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ArrayHelper} from '@enonic/lib-admin-ui/util/ArrayHelper';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import * as $ from 'jquery';
import 'jquery-simulate/jquery.simulate.js';
import * as Q from 'q';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentRequiresSaveEvent} from '../../event/ContentRequiresSaveEvent';
import {ProjectContext} from '../../project/ProjectContext';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {HTMLAreaProxy} from '../ui/text/dialog/HTMLAreaProxy';
import {HTMLAreaHelper} from '../ui/text/HTMLAreaHelper';
import {HtmlEditor} from '../ui/text/HtmlEditor';
import {HtmlEditorParams} from '../ui/text/HtmlEditorParams';
import {StylesRequest} from '../ui/text/styles/StylesRequest';
import {HtmlAreaResizeEvent} from './HtmlAreaResizeEvent';
import {AiConfig} from '@enonic/lib-admin-ui/form/inputtype/InputAiConfig';

export class HtmlArea
    extends BaseInputTypeNotManagingAdd {

    declare protected context: ContentInputTypeViewContext;
    private editors: HtmlAreaOccurrenceInfo[];
    private content: ContentSummary;
    private applicationKeys: ApplicationKey[];

    private focusListeners: ((event: FocusEvent) => void)[] = [];

    private blurListeners: ((event: FocusEvent) => void)[] = [];

    private enabledTools: string[];
    private disabledTools: string[];
    private allowHeadingsConfig: string;

    private enabled: boolean = true;

    constructor(config: ContentInputTypeViewContext) {
        super(config);

        this.addClass('html-area');
        this.editors = [];
        this.content = config.content;
        this.applicationKeys = this.resolveApplicationKeys();
        this.processInputConfig();

        this.onAdded(() => {
            this.refresh();
        });

        this.setupEventListeners();
    }

    private resolveApplicationKeys(): ApplicationKey[] {
        // if is site or within site then get application keys from site
        if (this.context.site) {
            return this.context.site.getApplicationKeys() || [];
        }

        // if is root non-site content then get application keys from project, e.g. headless content items
        return ProjectContext.get().getProject()?.getSiteConfigs()?.map((config) => config.getApplicationKey()) || [];
    }

    private processInputConfig() {
        this.allowHeadingsConfig = this.getAllowedHeadingsConfig();
        this.enabledTools = this.getTools(true);
        this.disabledTools = this.getTools(false);

        if (!this.enabledTools.some((tool: string) => tool === 'Bold')) {
            this.addClass('hide-bold');
        }

        if (!this.enabledTools.some((tool: string) => tool === 'Italic')) {
            this.addClass('hide-italic');
        }

        if (!this.enabledTools.some((tool: string) => tool === 'Underline')) {
            this.addClass('hide-underline');
        }
    }

    private setupEventListeners() {
        this.onRemoved(() => {
            ResponsiveManager.unAvailableSizeChanged(this);
        });

        this.onRendered(() => {
            this.onOccurrenceRendered(() => this.resetInputHeight());

            this.onOccurrenceRemoved(() => this.resetInputHeight());
        });

        this.onOccurrenceValueChanged((occurrence: TextAreaWrapper, value: Value) => {
            const editor = this.editors.find((e: HtmlAreaOccurrenceInfo) => e.textAreaWrapper === occurrence);

            if (editor) {
                editor.savedValue = value.getString();
            }
        });
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    createInputOccurrenceElement(index: number, property: Property): TextAreaWrapper {
        if (!ValueTypes.STRING.equals(property.getType())) {
            property.convertValueType(ValueTypes.STRING, ValueTypeConverter.convertTo);
        }

        const textAreaEl = new TextArea(this.getInput().getName() + '-' + index);

        if (this.content) {
            StylesRequest.fetchStyles(this.content.getId());
        }

        const editorId = textAreaEl.getId();

        const clazz = editorId.replace(/\./g, '_');
        textAreaEl.addClass(clazz);

        const textAreaWrapper = new TextAreaWrapper('text-area-wrapper');
        const editor = {
            id: editorId,
            textAreaWrapper,
            textAreaEl,
            savedValue: property.hasNonNullValue() ? property.getString() : '',
            hasStickyToolbar: false
        };
        this.editors.push(editor);

        textAreaEl.onRendered(() => {
            this.initEditor(editorId, editor.savedValue, textAreaWrapper).catch(DefaultErrorHandler.handle);
        });

        textAreaEl.onValueChanged((event: ValueChangedEvent) => {
            this.handleOccurrenceInputValueChanged(textAreaWrapper, event);
        });

        textAreaWrapper.appendChildren(new DivEl('sticky-dock'), textAreaEl);

        this.setFocusOnEditorAfterCreate(textAreaWrapper, editorId);

        return textAreaWrapper;
    }

    protected getValue(textAreaWrapper: DivEl, event: ValueChangedEvent): Value {
        const processedValue: string = HTMLAreaHelper.convertPreviewSrcToRenderSrc(event.getNewValue());
        return this.getValueType().newValue(processedValue);
    }

    protected updateFormInputElValue(occurrence: FormInputEl, property: Property) {
        const editor: HtmlAreaOccurrenceInfo = this.getEditorInfo(occurrence.getId());
        const newValue = property.hasNonNullValue() ? property.getString() : '';

        if (editor) {
            editor.savedValue = newValue;
        }

        this.setEditorContent(occurrence as TextArea, newValue);
    }

    resetInputOccurrenceElement(occurrence: Element) {
        super.resetInputOccurrenceElement(occurrence);

        occurrence.getChildren().forEach((child) => {
            if (ObjectHelper.iFrameSafeInstanceOf(child, TextArea)) {
                (child as TextArea).resetBaseValues();
            }
        });
    }

    clearInputOccurrenceElement(occurrence: Element): void {
        super.clearInputOccurrenceElement(occurrence);

        const editor: HtmlAreaOccurrenceInfo = this.editors.find((e: HtmlAreaOccurrenceInfo) => e.textAreaWrapper === occurrence);

        if (editor) {
            HtmlEditor.setData(editor.id, '');
        }
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        // no api in cke to enable/disable editor, no api to change tab index for a single editor
    }

    setEnabled(enable: boolean) {
        this.enabled = enable;

        super.setEnabled(enable);

        this.editors.forEach((editorInfo: HtmlAreaOccurrenceInfo) => this.setEditorEnabled(editorInfo, enable));
    }

    private setEditorEnabled(editorInfo: HtmlAreaOccurrenceInfo, enable: boolean): void {
        HtmlEditor.setReadOnly(editorInfo.id, !enable);
        const iframe: HTMLIFrameElement = editorInfo.textAreaWrapper.getHTMLElement().querySelector('iframe');
        iframe?.setAttribute('tabindex', enable? '0' : '-1');
    }

    private initEditor(id: string, value: string, textAreaWrapper: Element): Q.Promise<HtmlEditor> {
        const focusHandler = (e) => {
            this.resetInputHeight();
            this.notifyFocused(e);
            this.scrollToSelected(textAreaWrapper, e);

            textAreaWrapper.getHTMLElement().dispatchEvent(new CustomEvent('focusin')); // for AI Assistant
            AppHelper.dispatchCustomEvent('focusin', this);
        };

        const editorValueChangedHandler = () => {
            if (!HtmlEditor.exists(id)) {
                return;
            }

            this.handleEditorValueChanged(id, textAreaWrapper);
            new HtmlAreaResizeEvent(this).fire();
        };

        const blurHandler = (e) => {
            //checking if remove occurence button clicked or not
            AppHelper.dispatchCustomEvent('focusout', this);
            textAreaWrapper.getHTMLElement().dispatchEvent(new CustomEvent('focusout')); // for AI Assistant

            this.notifyBlurred(e);
        };

        const keydownHandler = (e: KeyboardEvent) => {
            if ((KeyHelper.isMetaKey(e) || KeyHelper.isControlKey(e)) && e.key === 's') {  // Cmd-S or Ctrl-S
                e.preventDefault();

                // as editor resides in a frame - propagate event via wrapping element
                $(this.getEl().getHTMLElement()).simulate(e.type, {
                    bubbles: e.bubbles,
                    cancelable: e.cancelable,
                    view: parent,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey,
                    shiftKey: e.shiftKey,
                    metaKey: e.metaKey,
                    keyCode: e.keyCode,
                    charCode: e.charCode
                });
            } else if (KeyHelper.isAltKey(e) && KeyHelper.isTabKey(e)) { // alt+tab for OSX
                e.preventDefault();
                // the one that event is triggered from
                const htmlAreaIframe = $(textAreaWrapper.getHTMLElement()).find('iframe').get(0);
                // check if focused element is html area that triggered event
                const activeElement = this.isNotActiveElement(htmlAreaIframe) ? htmlAreaIframe : document.activeElement as HTMLElement;
                const focusedEl = Element.fromHtmlElement(activeElement);
                const isShift = e.shiftKey;
                let nextFocusable;
                if (!isShift) {
                    nextFocusable = FormEl.getNextFocusable(focusedEl, 'iframe, input, select');
                } else {
                    nextFocusable = FormEl.getPrevFocusable(focusedEl, 'iframe, input, select');
                }

                if (nextFocusable) {
                    // if iframe is next focusable then it is a html area and using it's own focus method
                    if (this.isIframe(nextFocusable)) {
                        const nextId = nextFocusable.getId().replace('_ifr', '');
                        HtmlEditor.focus(nextId);
                    } else {
                        nextFocusable.giveFocus();
                    }
                }
            }
        };


        const editorLoadedHandler = () => {
            if (this.notInLiveEdit()) {
                if (BrowserHelper.isIE()) {
                    this.setupStickyEditorToolbarForInputOccurence(textAreaWrapper, id);
                }
            }

            this.moveButtonToBottomBar(textAreaWrapper, '.cke_button__sourcedialog');
        };

        const editorReadyHandler = (eventInfo: CKEDITOR.eventInfo) => {
            this.setEditorContent(textAreaWrapper.findChildById(id) as TextArea, value, true);
            const editor = this.editors.find((editor: HtmlAreaOccurrenceInfo) => editor.id === id);

            if (editor && !this.enabled) {
                this.setEditorEnabled(editor, false);
            }
        };

        const saveHandler = () => {
            if (this.context.content?.getContentId()) {
                new ContentRequiresSaveEvent(this.context.content.getContentId()).fire();
            }
        };

        return HTMLAreaHelper.isSourceCodeEditable().then((editableSourceCode: boolean) => {
            const htmlEditorParams: HtmlEditorParams = HtmlEditorParams.create()
                .setEditorContainerId(id)
                .setAssetsUri(CONFIG.getString('assetsUri'))
                .setInline(false)
                .setCreateDialogHandler(HTMLAreaProxy.createAndOpenDialog)
                .setFocusHandler(focusHandler)
                .setBlurHandler(blurHandler)
                .setKeydownHandler(keydownHandler)
                .setNodeChangeHandler(editorValueChangedHandler)
                .setEditorLoadedHandler(editorLoadedHandler)
                .setEditorReadyHandler(editorReadyHandler)
                .setSaveHandler(saveHandler)
                .setContent(this.content)
                .setApplicationKeys(this.applicationKeys)
                .setEnabledTools(this.enabledTools)
                .setDisabledTools(this.disabledTools)
                .setAllowedHeadings(this.allowHeadingsConfig)
                .setEditableSourceCode(editableSourceCode)
                .setCustomStylesToBeUsed(true)
                .setLangDirection(this.getLangDirection())
                .setProject(this.context.project)
                .setLabel(this.getInput().getLabel())
                .build();

            return HtmlEditor.create(htmlEditorParams);
        });
    }

    private getTools(enabled: boolean): string[] {
        const toolsObj: Record<string, string>[] = this.getContext().inputConfig[enabled ? 'include' : 'exclude'];
        const result: string[] = [];

        if (toolsObj && toolsObj instanceof Array) {
            toolsObj.forEach((tool: { value: string }) => {
                result.push(...tool.value.trim().split(/\s+/).filter((v: string) => v));
            });
        }

        return result;
    }

    private getAllowedHeadingsConfig(): string {
        const allowHeadingsConfig = this.getContext().inputConfig['allowHeadings'];
        if (!allowHeadingsConfig || !(allowHeadingsConfig instanceof Array)) {
            return null;
        }

        return allowHeadingsConfig[0].value;
    }

    private moveButtonToBottomBar(inputOccurence: Element, buttonClass: string): void {
        $(inputOccurence.getHTMLElement()).find(buttonClass).appendTo(
            $(inputOccurence.getHTMLElement()).find('.cke_bottom'));
    }

    private setFocusOnEditorAfterCreate(inputOccurence: Element, id: string): void {
        inputOccurence.giveFocus = () => {
            if (HtmlEditor.exists(id)) {
                HtmlEditor.focus(id);
                return true;
            } else {
                return false;
            }
        };
    }

    private setupStickyEditorToolbarForInputOccurence(inputOccurence: Element, editorId: string) {
        const scrollHandler = AppHelper.debounce(() =>
            this.updateStickyEditorToolbar(inputOccurence, this.getEditorInfo(editorId)), 20, false);

        $(this.getHTMLElement()).closest('.form-panel').on('scroll', () => scrollHandler());

        ResponsiveManager.onAvailableSizeChanged(this, () => {
            this.updateEditorToolbarPos(inputOccurence);
            this.updateEditorToolbarWidth(inputOccurence, this.getEditorInfo(editorId));
        });
    }

    private updateStickyEditorToolbar(inputOccurence: Element, editorInfo: HtmlAreaOccurrenceInfo) {
        if (!this.editorTopEdgeIsVisible(inputOccurence) && this.editorLowerEdgeIsVisible(inputOccurence)) {
            if (!editorInfo.hasStickyToolbar) {
                editorInfo.hasStickyToolbar = true;
                inputOccurence.addClass('sticky-toolbar');
                this.updateEditorToolbarWidth(inputOccurence, editorInfo);
            }
            this.updateEditorToolbarPos(inputOccurence);
        } else if (editorInfo.hasStickyToolbar) {
            editorInfo.hasStickyToolbar = false;
            inputOccurence.removeClass('sticky-toolbar');
            this.updateEditorToolbarWidth(inputOccurence, editorInfo);
        }
    }

    private updateEditorToolbarPos(inputOccurence: Element) {
        $(inputOccurence.getHTMLElement()).find(this.getToolbarClass()).css({top: this.getToolbarOffsetTop(1)});
    }

    private updateEditorToolbarWidth(inputOccurence: Element, editorInfo: HtmlAreaOccurrenceInfo) {
        if (editorInfo.hasStickyToolbar) {
            // Toolbar in sticky mode has position: fixed which makes it not
            // inherit width of its parent, so we have to explicitly set width
            $(inputOccurence.getHTMLElement()).find(this.getToolbarClass()).width(inputOccurence.getEl().getWidth() - 3);
        } else {
            $(inputOccurence.getHTMLElement()).find(this.getToolbarClass()).width('auto');
        }
    }

    private getToolbarClass(): string {
        return '.cke_top';
    }

    private getBottomBarClass(): string {
        return '.cke_bottom';
    }

    private editorTopEdgeIsVisible(inputOccurence: Element): boolean {
        return this.calcDistToTopOfScrlbleArea(inputOccurence) > 0;
    }

    private editorLowerEdgeIsVisible(inputOccurence: Element): boolean {
        const distToTopOfScrlblArea = this.calcDistToTopOfScrlbleArea(inputOccurence);
        const editorToolbarHeight = $(inputOccurence.getHTMLElement()).find(this.getToolbarClass()).outerHeight(true);
        const statusToolbarHeight = $(inputOccurence.getHTMLElement()).find(this.getBottomBarClass()).outerHeight(true);
        return (inputOccurence.getEl().getHeightWithoutPadding() - editorToolbarHeight - statusToolbarHeight +
                distToTopOfScrlblArea) > 0;
    }

    private calcDistToTopOfScrlbleArea(inputOccurence: Element): number {
        return inputOccurence.getEl().getOffsetTop() - this.getToolbarOffsetTop();
    }

    private getToolbarOffsetTop(delta: number = 0): number {
        const toolbar = $(this.getHTMLElement()).closest('.form-panel').find('.wizard-step-navigator-and-toolbar');
        const stickyToolbarHeight = toolbar.outerHeight(true);
        const offset = toolbar.offset();
        const stickyToolbarOffset = offset ? offset.top : 0;

        return stickyToolbarOffset + stickyToolbarHeight + delta;
    }

    private resetInputHeight() {
        $(this.getHTMLElement()).height('auto');
    }

    private scrollToSelected(inputOccurence: Element, e: CKEDITOR.eventInfo) {
        const editorScrollTop: number = e.editor.document.$.children[0].scrollTop;

        if (this.editorTopEdgeIsVisible(inputOccurence) || editorScrollTop > 0) {
            const toolbarHeight: number = $(inputOccurence.getHTMLElement()).find(this.getToolbarClass()).outerHeight(true);
            const panel = $(this.getHTMLElement()).closest('.form-panel');
            const newScrollTop: number = panel.scrollTop() + editorScrollTop;

            if (editorScrollTop > 0) {
                e.editor.once('resize', () => {
                    panel.scrollTop(newScrollTop);
                });
            } else {
                panel.scrollTop(newScrollTop + toolbarHeight);
            }
        }
    }

    private setEditorContent(textArea: TextArea, value: string, silent?: boolean): void {
        const editorId: string = textArea.getId();

        if (HtmlEditor.exists(editorId)) {
            const content: string = HTMLAreaHelper.convertRenderSrcToPreviewSrc(value, this.content?.getId(), this.context.project);
            const currentData: string = HtmlEditor.getData(editorId);
            // invoke setData only if data changed
            if (content !== currentData) {
                const afterDataSetCallback = () => {
                    textArea.setValue(HtmlEditor.getData(editorId), silent, false);
                };

                HtmlEditor.setData(editorId, content, afterDataSetCallback);
            }
        } else {
            console.log(`Editor with id '${editorId}' not found`);
        }
    }

    private notInLiveEdit(): boolean {
        return !($(this.getHTMLElement()).parents('.inspection-panel').length > 0);
    }

    private handleEditorValueChanged(id: string, occurrence: Element) {
        const value: string = HtmlEditor.getData(id);

        const textAreaEl = occurrence.findChildById(id) as TextArea;
        if (textAreaEl && value !== textAreaEl.getValue()) {
            textAreaEl.setValue(value, false, true);
        }
    }

    private isNotActiveElement(htmlAreaIframe: HTMLElement): boolean {
        const activeElement = $(document.activeElement).get(0);

        return htmlAreaIframe !== activeElement;
    }

    private isIframe(element: Element): boolean {
        return element.getEl().getTagName().toLowerCase() === 'iframe';
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.STRING) || StringHelper.isBlank(value.getString());
    }

    handleDnDStart(ui: JQueryUI.SortableUIParams): void {
        super.handleDnDStart(ui);

        const editorId = $('textarea', ui.item)[0].id;
        this.destroyEditor(editorId);
    }

    refresh() {
        this.editors.forEach((editor) => {
            const editorId = editor.id;

            if (HtmlEditor.exists(editorId)) {
                this.destroyEditor(editorId);
                this.reInitEditor(editorId);
            }
        });
    }

    handleDnDStop(ui: JQueryUI.SortableUIParams): void {
        const editorId = $('textarea', ui.item)[0].id;

        this.reInitEditor(editorId).then((htmlEditor: HtmlEditor) => {
            htmlEditor.onReady(() => {
                htmlEditor.focus();
            });
        });
    }

    onFocus(listener: (event: FocusEvent) => void) {
        this.focusListeners.push(listener);
    }

    unFocus(listener: (event: FocusEvent) => void) {
        this.focusListeners = this.focusListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    onBlur(listener: (event: FocusEvent) => void) {
        this.blurListeners.push(listener);
    }

    unBlur(listener: (event: FocusEvent) => void) {
        this.blurListeners = this.blurListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyFocused(event: FocusEvent) {
        this.focusListeners.forEach((listener) => {
            listener(event);
        });
    }

    private notifyBlurred(event: FocusEvent) {
        this.blurListeners.forEach((listener) => {
            listener(event);
        });
    }

    private destroyEditor(id: string): void {
        if (HtmlEditor.exists(id)) {
            HtmlEditor.destroy(id);
        }
    }

    private reInitEditor(id: string): Q.Promise<HtmlEditor> {
        const savedEditor: HtmlAreaOccurrenceInfo = this.getEditorInfo(id);

        return this.initEditor(id, savedEditor.savedValue, savedEditor.textAreaWrapper);
    }

    private getEditorInfo(id: string): HtmlAreaOccurrenceInfo {
        return ArrayHelper.findElementByFieldValue(this.editors, 'id', id);
    }

    private getLangDirection(): LangDirection {
        const lang: string = this.getContext().formContext?.getLanguage();

        if (Locale.supportsRtl(lang)) {
            return LangDirection.RTL;
        }

        return LangDirection.AUTO;
    }

    updateInputOccurrenceElement(occurrence: TextAreaWrapper, property: Property, unchangedOnly?: boolean) {
        const textAreaEl = occurrence.getChildren().find((child) => child instanceof TextArea);
        super.updateInputOccurrenceElement(textAreaEl, property, unchangedOnly);
    }

    getAiConfig(): AiConfig {
        const formContext = this.getContext().formContext;
        return formContext ? {
            group: formContext.getName(),
            aiTools: formContext.getAiTools(),
        } : super.getAiConfig();
    }

}

export interface HtmlAreaOccurrenceInfo {
    id: string;
    textAreaWrapper: Element;
    textAreaEl: TextArea;
    savedValue: string;
    hasStickyToolbar: boolean;
}

class TextAreaWrapper
    extends DivEl {
}

InputTypeManager.register(new Class('HtmlArea', HtmlArea));
