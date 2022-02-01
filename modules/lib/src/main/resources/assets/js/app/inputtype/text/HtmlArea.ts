import $ = require('jquery');
import 'jquery-simulate/jquery.simulate.js';
import Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {InputTypeManager} from 'lib-admin-ui/form/inputtype/InputTypeManager';
import {ValueTypeConverter} from 'lib-admin-ui/data/ValueTypeConverter';
import {Class} from 'lib-admin-ui/Class';
import {Property} from 'lib-admin-ui/data/Property';
import {Value} from 'lib-admin-ui/data/Value';
import {ValueType} from 'lib-admin-ui/data/ValueType';
import {ValueTypes} from 'lib-admin-ui/data/ValueTypes';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {HtmlAreaResizeEvent} from './HtmlAreaResizeEvent';
import {HTMLAreaHelper} from '../ui/text/HTMLAreaHelper';
import {HTMLAreaDialogHandler} from '../ui/text/dialog/HTMLAreaDialogHandler';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';
import {HtmlEditor} from '../ui/text/HtmlEditor';
import {HtmlEditorParams} from '../ui/text/HtmlEditorParams';
import {StylesRequest} from '../ui/text/styles/StylesRequest';
import {BaseInputTypeNotManagingAdd} from 'lib-admin-ui/form/inputtype/support/BaseInputTypeNotManagingAdd';
import {TextArea} from 'lib-admin-ui/ui/text/TextArea';
import {FormInputEl} from 'lib-admin-ui/dom/FormInputEl';
import {SelectorOnBlurEvent} from 'lib-admin-ui/ui/selector/SelectorOnBlurEvent';
import {BrowserHelper} from 'lib-admin-ui/BrowserHelper';
import {FormEl} from 'lib-admin-ui/dom/FormEl';
import {ArrayHelper} from 'lib-admin-ui/util/ArrayHelper';
import {ValueChangedEvent} from 'lib-admin-ui/ValueChangedEvent';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentPath} from '../../content/ContentPath';

export class HtmlArea
    extends BaseInputTypeNotManagingAdd {

    private editors: HtmlAreaOccurrenceInfo[];
    private content: ContentSummary;
    private contentPath: ContentPath;
    private applicationKeys: ApplicationKey[];

    private focusListeners: { (event: FocusEvent): void }[] = [];

    private blurListeners: { (event: FocusEvent): void }[] = [];

    private authRequest: Q.Promise<void>;
    private editableSourceCode: boolean;

    private enabledTools: string[];
    private disabledTools: string[];
    private allowHeadingsConfig: string;

    constructor(config: ContentInputTypeViewContext) {
        super(config);

        this.addClass('html-area');
        this.editors = [];
        this.contentPath = config.contentPath;
        this.content = config.content;
        this.applicationKeys = config.site ? config.site.getApplicationKeys() : [];
        this.processInputConfig();

        this.authRequest = HTMLAreaHelper.isSourceCodeEditable().then((value: boolean) => {
            this.editableSourceCode = value;
            return Q(null);
        });

        this.onAdded(() => {
            this.refresh();
        });

        this.setupEventListeners();
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
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    createInputOccurrenceElement(index: number, property: Property): Element {
        if (!ValueTypes.STRING.equals(property.getType())) {
            property.convertValueType(ValueTypes.STRING, ValueTypeConverter.convertTo);
        }

        const textAreaEl: TextArea = new TextArea(this.getInput().getName() + '-' + index);
        StylesRequest.fetchStyles(this.content.getId());

        const editorId = textAreaEl.getId();

        const clazz = editorId.replace(/\./g, '_');
        textAreaEl.addClass(clazz);

        const textAreaWrapper = new TextAreaWrapper('text-area-wrapper');

        textAreaEl.onRendered(() => {
            this.authRequest.then(() => {
                this.initEditor(editorId, property, textAreaWrapper).then(() => {
                    this.editors.push({id: editorId, textAreaWrapper, textAreaEl, property, hasStickyToolbar: false});
                });
            });
        });

        textAreaEl.onValueChanged((event: ValueChangedEvent) => {
            this.handleOccurrenceInputValueChanged(textAreaWrapper, event);
        });

        textAreaWrapper.appendChild(textAreaEl);

        this.setFocusOnEditorAfterCreate(textAreaWrapper, editorId);

        return textAreaWrapper;
    }

    protected getValue(textAreaWrapper: DivEl, event: ValueChangedEvent): Value {
        const processedValue: string = HTMLAreaHelper.convertPreviewSrcToRenderSrc(event.getNewValue());
        return this.getValueType().newValue(processedValue);
    }

    protected updateFormInputElValue(occurrence: FormInputEl, property: Property) {
        const editor: HtmlAreaOccurrenceInfo = this.getEditorInfo(occurrence.getId());
        if (editor) {
            editor.property = property;
        }

        this.setEditorContent(<TextArea>occurrence, property);
    }

    resetInputOccurrenceElement(occurrence: Element) {
        occurrence.getChildren().forEach((child) => {
            if (ObjectHelper.iFrameSafeInstanceOf(child, TextArea)) {
                (<TextArea>child).resetBaseValues();
            }
        });
    }

    setEnabledInputOccurrenceElement(occurrence: Element, enable: boolean) {
        occurrence.getChildren().forEach((child) => {
            if (ObjectHelper.iFrameSafeInstanceOf(child, TextArea)) {
                (<TextArea>child).setEnabled(enable);
            }
        });
    }

    private initEditor(id: string, property: Property, textAreaWrapper: Element): Q.Promise<HtmlEditor> {
        const assetsUri = CONFIG.assetsUri;

        const focusHandler = (e) => {
            this.resetInputHeight();
            this.notifyFocused(e);
            this.scrollToSelected(textAreaWrapper, e);

            AppHelper.dispatchCustomEvent('focusin', this);
            new SelectorOnBlurEvent(this).fire();
        };

        const editorValueChangedHandler = () => {
            if (!HtmlEditor.exists(id)) {
                return;
            }

            this.handleEditorValueChanged(id, textAreaWrapper);
            new HtmlAreaResizeEvent(<any>this).fire();
        };

        const blurHandler = (e) => {
            //checking if remove occurence button clicked or not
            AppHelper.dispatchCustomEvent('focusout', this);

            this.notifyBlurred(e);
        };

        const keydownHandler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.keyCode === 83) {  // Cmd-S or Ctrl-S
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
            } else if ((e.altKey) && e.keyCode === 9) { // alt+tab for OSX
                e.preventDefault();
                // the one that event is triggered from
                const htmlAreaIframe = $(textAreaWrapper.getHTMLElement()).find('iframe').get(0);
                // check if focused element is html area that triggered event
                const activeElement = this.isNotActiveElement(htmlAreaIframe) ? htmlAreaIframe : <HTMLElement>document.activeElement;
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

        const createDialogHandler = event => {
            HTMLAreaDialogHandler.createAndOpenDialog(event);
        };

        const editorLoadedHandler = () => {
            if (this.notInLiveEdit()) {
                if (BrowserHelper.isIE()) {
                    this.setupStickyEditorToolbarForInputOccurence(textAreaWrapper, id);
                }
            }

            this.moveButtonToBottomBar(textAreaWrapper, '.cke_button__sourcedialog');
        };

        const editorReadyHandler = () => {
            this.setEditorContent(<TextArea>textAreaWrapper.getFirstChild(), property);
        };

        const htmlEditorParams: HtmlEditorParams = HtmlEditorParams.create()
            .setEditorContainerId(id)
            .setAssetsUri(assetsUri)
            .setInline(false)
            .setCreateDialogHandler(createDialogHandler)
            .setFocusHandler(focusHandler)
            .setBlurHandler(blurHandler)
            .setKeydownHandler(keydownHandler)
            .setNodeChangeHandler(editorValueChangedHandler)
            .setEditorLoadedHandler(editorLoadedHandler)
            .setEditorReadyHandler(editorReadyHandler)
            .setContentPath(this.contentPath)
            .setContent(this.content)
            .setApplicationKeys(this.applicationKeys)
            .setEnabledTools(this.enabledTools)
            .setDisabledTools(this.disabledTools)
            .setAllowedHeadings(this.allowHeadingsConfig)
            .setEditableSourceCode(this.editableSourceCode)
            .setCustomStylesToBeUsed(true)
            .build();

        return HtmlEditor.create(htmlEditorParams);
    }

    private getTools(enabled: boolean): string[] {
        const toolsObj: any = this.getContext().inputConfig[enabled ? 'include' : 'exclude'];
        const result: string[] = [];

        if (toolsObj && toolsObj instanceof Array) {
            toolsObj.forEach((tool: any) => {
                result.push(...tool.value.trim().split(/\s+/).filter((v: string) => v));
            });
        }

        return result;
    }

    private getAllowedHeadingsConfig(): string {
        const allowHeadingsConfig = this.getContext().inputConfig['allowHeadings'];
        if (!allowHeadingsConfig || !(allowHeadingsConfig  instanceof Array)) {
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

    private setEditorContent(textArea: TextArea, property: Property): void {
        const editorId: string = textArea.getId();
        const content: string = property.hasNonNullValue() ?
                                    HTMLAreaHelper.convertRenderSrcToPreviewSrc(property.getString(), this.content.getId()) : '';

        if (HtmlEditor.exists(editorId)) {
            const currentData: string = HtmlEditor.getData(editorId);
            // invoke setData only if data changed
            if (content !== currentData) {
                const afterDataSetCallback = () => {
                    textArea.setValue(HtmlEditor.getData(editorId), true, false);
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
        const textArea: TextArea = <TextArea>occurrence.getFirstChild();

        if (value !== textArea.getValue()) {
            textArea.setValue(value, false, true);
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

            this.destroyEditor(editorId);
            this.reInitEditor(editorId);
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

        return this.initEditor(id, savedEditor.property, savedEditor.textAreaWrapper);
    }

    private getEditorInfo(id: string): HtmlAreaOccurrenceInfo {
        return ArrayHelper.findElementByFieldValue(this.editors, 'id', id);
    }

}

export interface HtmlAreaOccurrenceInfo {
    id: string;
    textAreaWrapper: Element;
    textAreaEl: TextArea;
    property: Property;
    hasStickyToolbar: boolean;
}

class TextAreaWrapper extends DivEl {


}

InputTypeManager.register(new Class('HtmlArea', HtmlArea));
