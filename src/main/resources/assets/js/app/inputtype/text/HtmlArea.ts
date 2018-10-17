import eventInfo = CKEDITOR.eventInfo;
import Property = api.data.Property;
import Value = api.data.Value;
import ValueType = api.data.ValueType;
import ValueTypes = api.data.ValueTypes;
import Element = api.dom.Element;
import ApplicationKey = api.application.ApplicationKey;
import Promise = Q.Promise;
import AppHelper = api.util.AppHelper;
import ObjectHelper = api.ObjectHelper;
import {HtmlAreaResizeEvent} from './HtmlAreaResizeEvent';
import {HTMLAreaHelper} from '../ui/text/HTMLAreaHelper';
import {HTMLAreaDialogHandler} from '../ui/text/dialog/HTMLAreaDialogHandler';
import {HTMLAreaBuilder} from '../ui/text/HTMLAreaBuilder';
import {ContentInputTypeViewContext} from '../ContentInputTypeViewContext';

declare var CONFIG;

export class HtmlArea
    extends api.form.inputtype.support.BaseInputTypeNotManagingAdd {

    private editors: HtmlAreaOccurrenceInfo[];
    private content: api.content.ContentSummary;
    private contentPath: api.content.ContentPath;
    private applicationKeys: ApplicationKey[];

    private focusListeners: { (event: FocusEvent): void }[] = [];

    private blurListeners: { (event: FocusEvent): void }[] = [];

    private authRequest: Promise<void>;
    private editableSourceCode: boolean;
    private inputConfig: any;

    constructor(config: ContentInputTypeViewContext) {
        super(config);

        this.addClass('html-area');
        this.editors = [];
        this.contentPath = config.contentPath;
        this.content = config.content;
        this.applicationKeys = config.site ? config.site.getApplicationKeys() : [];

        this.inputConfig = config.inputConfig;

        this.authRequest =
            new api.security.auth.IsAuthenticatedRequest().sendAndParse().then((loginResult: api.security.auth.LoginResult) => {
                this.editableSourceCode = loginResult.isContentExpert();
            });

        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.onRemoved(() => {
            api.ui.responsive.ResponsiveManager.unAvailableSizeChanged(this);
        });

        this.onRendered(() => {
            this.onOccurrenceRendered(() => this.resetInputHeight());

            this.onOccurrenceRemoved(() => this.resetInputHeight());
        });
    }

    getValueType(): ValueType {
        return ValueTypes.STRING;
    }

    newInitialValue(): Value {
        return super.newInitialValue() || ValueTypes.STRING.newValue('');
    }

    createInputOccurrenceElement(index: number, property: Property): api.dom.Element {
        if (!ValueTypes.STRING.equals(property.getType())) {
            property.convertValueType(ValueTypes.STRING);
        }

        const value = HTMLAreaHelper.prepareImgSrcsInValueForEdit(property.getString());
        const textAreaEl = new api.ui.text.TextArea(this.getInput().getName() + '-' + index, value);

        const editorId = textAreaEl.getId();

        const clazz = editorId.replace(/\./g, '_');
        textAreaEl.addClass(clazz);

        const textAreaWrapper = new api.dom.DivEl();

        this.editors.push({id: editorId, textAreaWrapper, textAreaEl, property, hasStickyToolbar: false});

        textAreaEl.onRendered(() => {
            if (this.authRequest.isFulfilled()) {
                this.initEditor(editorId, property, textAreaWrapper);
            } else {
                this.authRequest.then(() => {
                    this.initEditor(editorId, property, textAreaWrapper);
                });
            }
        });

        textAreaWrapper.appendChild(textAreaEl);

        this.setFocusOnEditorAfterCreate(textAreaWrapper, editorId);

        return textAreaWrapper;
    }

    updateInputOccurrenceElement(occurrence: api.dom.Element, property: api.data.Property, unchangedOnly: boolean) {
        const textArea = <api.ui.text.TextArea> occurrence.getFirstChild();
        const id = textArea.getId();

        if (!unchangedOnly || !textArea.isDirty()) {
            this.setEditorContent(id, property);
        }
    }

    resetInputOccurrenceElement(occurrence: api.dom.Element) {
        occurrence.getChildren().forEach((child) => {
            if (ObjectHelper.iFrameSafeInstanceOf(child, api.ui.text.TextArea)) {
                (<api.ui.text.TextArea>child).resetBaseValues();
            }
        });
    }

    private initEditor(id: string, property: Property, textAreaWrapper: Element): void {
        const focusedEditorCls = 'html-area-focused';
        const assetsUri = CONFIG.assetsUri;

        const focusHandler = (e) => {
            this.resetInputHeight();
            textAreaWrapper.addClass(focusedEditorCls);

            this.notifyFocused(e);

            AppHelper.dispatchCustomEvent('focusin', this);
            new api.ui.selector.SelectorOnBlurEvent(this).fire();
        };

        const notifyValueChanged = () => {
            if (!this.getEditor(id)) {
                return;
            }
            this.notifyValueChanged(id, textAreaWrapper);
            new HtmlAreaResizeEvent(<any>this).fire();
        };

        let isMouseOverRemoveOccurenceButton = false;

        const blurHandler = (e) => {
            //checking if remove occurence button clicked or not
            AppHelper.dispatchCustomEvent('focusout', this);

            if (!isMouseOverRemoveOccurenceButton) {
                this.setStaticInputHeight();
                textAreaWrapper.removeClass(focusedEditorCls);
            }
            this.notifyBlurred(e);
        };

        const keydownHandler = (ckEvent: eventInfo) => {
            const e: KeyboardEvent = ckEvent.data.domEvent.$;

            if ((e.metaKey || e.ctrlKey) && e.keyCode === 83) {  // Cmd-S or Ctrl-S
                e.preventDefault();

                // as editor resides in a frame - propagate event via wrapping element
                wemjq(this.getEl().getHTMLElement()).simulate(e.type, {
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
                const htmlAreaIframe = wemjq(textAreaWrapper.getHTMLElement()).find('iframe').get(0);
                // check if focused element is html area that triggered event
                const activeElement = this.isNotActiveElement(htmlAreaIframe) ? htmlAreaIframe : <HTMLElement>document.activeElement;
                const focusedEl = api.dom.Element.fromHtmlElement(activeElement);
                const isShift = e.shiftKey;
                let nextFocusable;
                if (!isShift) {
                    nextFocusable = api.dom.FormEl.getNextFocusable(focusedEl, 'iframe, input, select');
                } else {
                    nextFocusable = api.dom.FormEl.getPrevFocusable(focusedEl, 'iframe, input, select');
                }

                if (nextFocusable) {
                    // if iframe is next focusable then it is a html area and using it's own focus method
                    if (this.isIframe(nextFocusable)) {
                        const nextId = nextFocusable.getId().replace('_ifr', '');
                        this.getEditor(nextId).focus();
                    } else {
                        nextFocusable.giveFocus();
                    }
                }
            }
        };

        const createDialogHandler = event => {
            HTMLAreaDialogHandler.createAndOpenDialog(event);
            textAreaWrapper.addClass(focusedEditorCls);
        };

        new HTMLAreaBuilder()
            .setEditorContainerId(id)
            .setAssetsUri(assetsUri)
            .setInline(false)
            .onCreateDialog(createDialogHandler)
            .setFocusHandler(focusHandler)
            .setBlurHandler(blurHandler)
            .setKeydownHandler(keydownHandler)
            .setNodeChangeHandler(notifyValueChanged)
            .setContentPath(this.contentPath)
            .setContent(this.content)
            .setApplicationKeys(this.applicationKeys)
            .setTools({
                include: this.inputConfig['include'],
                exclude: this.inputConfig['exclude']
            })
            .setEditableSourceCode(this.editableSourceCode)
            .createEditor(this.content.getId()).then(editor => {

                editor.on('loaded', () => {
                    this.setEditorContent(id, property);

                    if (this.notInLiveEdit()) {
                        if (api.BrowserHelper.isIE()) {
                            this.setupStickyEditorToolbarForInputOccurence(textAreaWrapper, id);
                        }

                        this.onRemoved(() => {
                            this.destroyEditor(id);
                        });
                    }

                    this.moveButtonToBottomBar(textAreaWrapper, '.cke_button__fullscreen');
                    this.moveButtonToBottomBar(textAreaWrapper, '.cke_button__sourcedialog');

                    const removeButtonEL = wemjq(textAreaWrapper.getParentElement().getParentElement().getHTMLElement()).find(
                        '.remove-button')[0];
                    removeButtonEL.addEventListener('mouseover', () => {
                        isMouseOverRemoveOccurenceButton = true;
                    });
                    removeButtonEL.addEventListener('mouseleave', () => {
                        isMouseOverRemoveOccurenceButton = false;
                    });

                });
            });
    }

    private moveButtonToBottomBar(inputOccurence: Element, buttonClass: string): void {
        wemjq(inputOccurence.getHTMLElement()).find(buttonClass).appendTo(
            wemjq(inputOccurence.getHTMLElement()).find('.cke_bottom'));
    }

    private setFocusOnEditorAfterCreate(inputOccurence: Element, id: string): void {
        inputOccurence.giveFocus = () => {
            const editor = this.getEditor(id);
            if (editor) {
                editor.focus();
                return true;
            } else {
                return false;
            }
        };
    }

    private setupStickyEditorToolbarForInputOccurence(inputOccurence: Element, editorId: string) {
        const scrollHandler = AppHelper.debounce(() =>
            this.updateStickyEditorToolbar(inputOccurence, this.getEditorInfo(editorId)), 20, false);

        wemjq(this.getHTMLElement()).closest('.form-panel').on('scroll', () => scrollHandler());

        api.ui.responsive.ResponsiveManager.onAvailableSizeChanged(this, () => {
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
        wemjq(inputOccurence.getHTMLElement()).find(this.getToolbarClass()).css({top: this.getToolbarOffsetTop(1)});
    }

    private updateEditorToolbarWidth(inputOccurence: Element, editorInfo: HtmlAreaOccurrenceInfo) {
        if (editorInfo.hasStickyToolbar) {
            // Toolbar in sticky mode has position: fixed which makes it not
            // inherit width of its parent, so we have to explicitly set width
            wemjq(inputOccurence.getHTMLElement()).find(this.getToolbarClass()).width(inputOccurence.getEl().getWidth() - 3);
        } else {
            wemjq(inputOccurence.getHTMLElement()).find(this.getToolbarClass()).width('auto');
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
        const editorToolbarHeight = wemjq(inputOccurence.getHTMLElement()).find(this.getToolbarClass()).outerHeight(true);
        const statusToolbarHeight = wemjq(inputOccurence.getHTMLElement()).find(this.getBottomBarClass()).outerHeight(true);
        return (inputOccurence.getEl().getHeightWithoutPadding() - editorToolbarHeight - statusToolbarHeight +
                distToTopOfScrlblArea) > 0;
    }

    private calcDistToTopOfScrlbleArea(inputOccurence: Element): number {
        return inputOccurence.getEl().getOffsetTop() - this.getToolbarOffsetTop();
    }

    private getToolbarOffsetTop(delta: number = 0): number {
        const toolbar = wemjq(this.getHTMLElement()).closest('.form-panel').find('.wizard-step-navigator-and-toolbar');
        const stickyToolbarHeight = toolbar.outerHeight(true);
        const offset = toolbar.offset();
        const stickyToolbarOffset = offset ? offset.top : 0;

        return stickyToolbarOffset + stickyToolbarHeight + delta;
    }

    private resetInputHeight() {
        wemjq(this.getHTMLElement()).height('auto');
    }

    private setStaticInputHeight() {
        const height = wemjq(this.getHTMLElement()).height();
        if (height !== 0) {
            wemjq(this.getHTMLElement()).height(wemjq(this.getHTMLElement()).height());
        }
    }

    private getEditor(editorId: string): CKEDITOR.editor {
        return CKEDITOR.instances[editorId];
    }

    isDirty(): boolean {
        return this.editors.some((editor: HtmlAreaOccurrenceInfo) => {
            return this.getEditorContent(editor) !== editor.textAreaEl.getValue();
        });
    }

    private getEditorContent(editor: HtmlAreaOccurrenceInfo) {
        return this.getEditor(editor.id).getData();
    }

    private setEditorContent(editorId: string, property: Property): void {
        const editor = this.getEditor(editorId);
        const content: string = property.hasNonNullValue() ? HTMLAreaHelper.prepareImgSrcsInValueForEdit(property.getString()) : '';

        if (editor) {
            editor.setData(content);
        } else {
            console.log(`Editor with id '${editorId}' not found`);
        }
    }

    private notInLiveEdit(): boolean {
        return !(wemjq(this.getHTMLElement()).parents('.inspection-panel').length > 0);
    }

    private notifyValueChanged(id: string, occurrence: api.dom.Element) {
        const value: string = HTMLAreaHelper.prepareEditorImageSrcsBeforeSave(this.getEditor(id).getData());
        const valueObj: api.data.Value = ValueTypes.STRING.newValue(value);
        this.notifyOccurrenceValueChanged(occurrence, valueObj);
    }

    private isNotActiveElement(htmlAreaIframe: HTMLElement): boolean {
        const activeElement = wemjq(document.activeElement).get(0);

        return htmlAreaIframe !== activeElement;
    }

    private isIframe(element: Element): boolean {
        return element.getEl().getTagName().toLowerCase() === 'iframe';
    }

    valueBreaksRequiredContract(value: Value): boolean {
        return value.isNull() || !value.getType().equals(ValueTypes.STRING) || api.util.StringHelper.isBlank(value.getString());
    }

    hasInputElementValidUserInput(_inputElement: api.dom.Element) {

        // TODO
        return true;
    }

    handleDnDStart(ui: JQueryUI.SortableUIParams): void {
        super.handleDnDStart(ui);

        const editorId = wemjq('textarea', ui.item)[0].id;
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
        const editorId = wemjq('textarea', ui.item)[0].id;

        this.reInitEditor(editorId);

        this.getEditor(editorId).focus();
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
        const editor = this.getEditor(id);
        if (editor) {
            editor.destroy(false);
        }
    }

    private reInitEditor(id: string) {
        const savedEditor: HtmlAreaOccurrenceInfo = this.getEditorInfo(id);

        if (!!savedEditor) {
            this.initEditor(id, savedEditor.property, savedEditor.textAreaWrapper);
        }
    }

    private getEditorInfo(id: string): HtmlAreaOccurrenceInfo {
        return api.util.ArrayHelper.findElementByFieldValue(this.editors, 'id', id);
    }

}

export interface HtmlAreaOccurrenceInfo {
    id: string;
    textAreaWrapper: Element;
    textAreaEl: api.ui.text.TextArea;
    property: Property;
    hasStickyToolbar: boolean;
}

api.form.inputtype.InputTypeManager.register(new api.Class('HtmlArea', HtmlArea));
