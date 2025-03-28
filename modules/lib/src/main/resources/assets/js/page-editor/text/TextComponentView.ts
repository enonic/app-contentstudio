import * as $ from 'jquery';
import 'jquery-simulate/jquery.simulate.js';
import {Element, LangDirection} from '@enonic/lib-admin-ui/dom/Element';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ComponentView, ComponentViewBuilder} from '../ComponentView';
import {TextItemType} from './TextItemType';
import {TextPlaceholder} from './TextPlaceholder';
import {LiveEditPageDialogCreatedEvent, LiveEditPageDialogCreatedEventHandler} from '../LiveEditPageDialogCreatedEvent';
import {Highlighter} from '../Highlighter';
import {ItemView} from '../ItemView';
import {PageViewController} from '../PageViewController';
import {HTMLAreaHelper} from '../../app/inputtype/ui/text/HTMLAreaHelper';
import {ModalDialog} from '../../app/inputtype/ui/text/dialog/ModalDialog';
import {HtmlEditorParams} from '../../app/inputtype/ui/text/HtmlEditorParams';
import {HtmlEditor, HtmlEditorCursorPosition} from '../../app/inputtype/ui/text/HtmlEditor';
import {StylesRequest} from '../../app/inputtype/ui/text/styles/StylesRequest';
import {WindowDOM} from '@enonic/lib-admin-ui/dom/WindowDOM';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {FormEl} from '@enonic/lib-admin-ui/dom/FormEl';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {SelectComponentEvent} from '../event/outgoing/navigation/SelectComponentEvent';
import {SelectedHighlighter} from '../SelectedHighlighter';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {KeyHelper} from '@enonic/lib-admin-ui/ui/KeyHelper';
import {Locale} from '@enonic/lib-admin-ui/locale/Locale';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {CreateHtmlAreaDialogEvent, HtmlAreaDialogConfig} from '../../app/inputtype/ui/text/CreateHtmlAreaDialogEvent';
import {UpdateTextComponentEvent} from '../event/outgoing/manipulation/UpdateTextComponentEvent';
import {ContentContext} from '../../app/wizard/ContentContext';
import {CreateTextComponentViewConfig} from '../CreateTextComponentViewConfig';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {PageUnlockedEvent} from '../event/outgoing/manipulation/PageUnlockedEvent';
import {PageState} from '../../app/wizard/page/PageState';
import {ComponentPath} from '../../app/page/region/ComponentPath';
import {SessionStorageHelper} from '../../app/util/SessionStorageHelper';

export class TextComponentViewBuilder
    extends ComponentViewBuilder {

    text: string;

    constructor() {
        super();
        this.setType(TextItemType.get());
    }

    setText(value: string): this {
        this.text = value;
        return this;
    }

}

export class TextComponentView
    extends ComponentView {

    private htmlAreaEditor?: HtmlEditor;

    private editMode: boolean;

    private isInitializingEditor: boolean = false;

    private focusOnInit: boolean;

    private editorReadyListeners: (() => void)[];

    private initialValue: string;

    public static debug: boolean = false;

    private static DEFAULT_TEXT: string = '';

    private static EDITOR_FOCUSED_CLASS: string = 'editor-focused';

    private static lastFocusedView: TextComponentView;

    // special handling for click to allow dblclick event without triggering 2 clicks before it
    public static DBL_CLICK_TIMEOUT: number = 250;
    private singleClickTimer: number;
    private lastClicked: number = 0;

    private modalDialog: ModalDialog;
    private currentDialogConfig: HtmlAreaDialogConfig;
    private winBlurred: boolean;

    constructor(builder: TextComponentViewBuilder) {
        super(builder.setPlaceholder(new TextPlaceholder()));

        this.setInitialValueAndRenderMode(builder.text);
        this.addTextContextMenuActions();
        this.addClassEx('text-view');
        this.setContentEditable(true); // https://ckeditor.com/docs/ckeditor4/latest/guide/dev_inline.html#enabling-inline-editing
        this.setTextDir();
        this.fetchStylesAndInitEditor();
    }

    protected initListeners() {
        super.initListeners();

        this.editorReadyListeners = [];

        this.onAdded(() => { // is triggered on item insert or move
            if (!this.initOnAdd) {
                return;
            }

            this.initialize();
        });

        this.onRemoved(() => {
            this.destroyEditor();
        });

        const handleDialogCreated: LiveEditPageDialogCreatedEventHandler = (event: LiveEditPageDialogCreatedEvent) => {
            if (this.currentDialogConfig === event.getConfig()) {
                this.modalDialog = event.getModalDialog() as ModalDialog;
            }
        };

        this.onEditorReady(() => {
           this.refreshEmptyState();
            this.restoreSelection();
        });

        this.bindWindowFocusEvents();
        LiveEditPageDialogCreatedEvent.on(handleDialogCreated.bind(this));
    }

    private setInitialValueAndRenderMode(initialText?: string): void {
        if (ObjectHelper.isDefined(initialText)) {
            this.initialValue = initialText;
        } else {
            const isPageTemplateMode = !PageState.getState() || PageState.getState().hasTemplate();

            if (isPageTemplateMode) {
                // using html from live edit load if page is rendered using a template and no page object is present
                this.initialValue = this.getEl().getInnerHtml();
                // listening for customize event and updating editor value with actual data value
                PageUnlockedEvent.on(this.handleUnlockOnCustomize.bind(this));
            } else {
                this.initialValue = this.liveEditParams.getTextComponentData(this.getPath().toString());
            }
        }
    }

    private setTextDir(): void {
        const contentsLangDirection: LangDirection = this.getLangDirection();

        if (contentsLangDirection === LangDirection.RTL) {
            this.setDir(LangDirection.RTL);
        }
    }

    private selectWhileEditing(): void {
        const selectedView = SelectedHighlighter.get().getSelectedView();

        if (selectedView) {
            selectedView.deselect(true);
        }

        this.getEl().setData(ItemView.LIVE_EDIT_SELECTED, 'true');

        this.showCursor();

        if (!PageViewController.get().isLocked()) {
            this.highlightSelected();
        }

        new SelectComponentEvent({itemView: this, position: null}).fire();
    }

    private bindWindowFocusEvents(): void {
        const win: WindowDOM = WindowDOM.get();

        win.onBlur((e: FocusEvent) => {
            if (e.target === win.getHTMLElement()) {
                this.winBlurred = true;
            }
        });

        win.onFocus((e: FocusEvent) => {
            if (e.target === win.getHTMLElement()) {
                this.winBlurred = false;
            }
        });
    }

    private initialize(): void {
        if (!this.isEditorPresentOrInitializing()) {
            this.initEditor();
        } else if (this.htmlAreaEditor) {
            this.destroyEditor(); // on added, inline editor losses its root element of the editable area
        }
        this.unhighlight();
    }

    highlight() {
        if (!this.isEditMode() && !this.isDragging()) {
            super.highlight();
        }
    }

    unhighlight() {
        if (!this.isEditMode()) {
            super.unhighlight();
        }
    }

    private fetchStylesAndInitEditor(): void {
        // convert image urls in text component for web
        StylesRequest.fetchStyles(this.getLiveEditParams().contentId).then(() => {
            this.initEditor();
        }).catch(DefaultErrorHandler.handle);
    }

    private doHandleDbClick(event: MouseEvent): void {
        if (this.isEditMode() && this.isActive()) {
            return;
        }

        this.focusOnInit = true;
        this.startPageTextEditMode();
        this.focusEditor();
        Highlighter.get().hide();
    }

    private doHandleClick(event: MouseEvent): void {
        if (this.isEditMode()) {
            if (this.isActive()) {
                return;
            }

            this.focusEditor();

            return;
        }

        super.handleClick(event);
    }

    handleClick(event: MouseEvent) {
        if (TextComponentView.debug) {
            console.group('Handling click [' + this.getId() + '] at ' + new Date().getTime());
            console.log(event);
        }

        event.stopPropagation();
        if (event.button === 2) { // right click
            event.preventDefault();
        }

        if (this.isEditMode() && this.isActive()) {
            if (TextComponentView.debug) {
                console.log('Is in text edit mode, not handling click');
                console.groupEnd();
            }
            return;
        }

        let timeSinceLastClick = new Date().getTime() - this.lastClicked;

        if (timeSinceLastClick > TextComponentView.DBL_CLICK_TIMEOUT) {
            this.singleClickTimer = window.setTimeout(() => {
                if (TextComponentView.debug) {
                    console.log('no dblclick occured during ' + TextComponentView.DBL_CLICK_TIMEOUT + 'ms, notifying click', this);
                    console.groupEnd();
                }

                this.doHandleClick(event);
            }, TextComponentView.DBL_CLICK_TIMEOUT);

        } else {

            if (TextComponentView.debug) {
                console.log('dblclick occured after ' + timeSinceLastClick + 'ms, notifying dbl click', this);
                // end the group started by the first click first
                console.groupEnd();
            }
            clearTimeout(this.singleClickTimer);
            this.doHandleDbClick(event);
        }
        this.lastClicked = new Date().getTime();
    }

    isEditMode(): boolean {
        return this.hasClass('edit-mode');
    }

    isActive(): boolean {
        return this.hasClass(TextComponentView.EDITOR_FOCUSED_CLASS);
    }

    setEditMode(edit: boolean): void {
        if (edit === this.editMode) {
            return;
        }

        this.editMode = edit;

        if (!this.initOnAdd) {
            return;
        }

        this.toggleClass('edit-mode', edit);
        this.setDraggable(!edit);

        if (this.isEditorReady()) {
            this.setContentEditable(edit);
        }

        if (edit) {
            SelectedHighlighter.get().hide();
            if (!this.isEditorPresentOrInitializing()) {
                this.initEditor();
            }

            this.removePlaceholder();

            if (this.isEmpty()) {
                if (this.isEditorReady()) {
                    this.htmlAreaEditor.setData(TextComponentView.DEFAULT_TEXT);
                }
           //     this.setHtml(TextComponentView.DEFAULT_TEXT, false);
            }
        } else {
            if (this.isEditorReady()) {
                this.processEditorValue();
            }

            this.removeClass(TextComponentView.EDITOR_FOCUSED_CLASS);
            this.deselect();
        }
    }

    getCursorPosition(): HtmlEditorCursorPosition {
        return this.htmlAreaEditor.getCursorPosition();
    }

    setCursorPosition(pos: HtmlEditorCursorPosition): void {
        this.htmlAreaEditor.setSelectionByCursorPosition(pos);
    }

    private onMouseLeftHandler(e: MouseEvent, mousePressed?: boolean) {
        if (mousePressed) {
            // don't consider mouse up as a click if mouse down was performed in editor
            PageViewController.get().setNextClickDisabled(true);
        }
    }

    private onFocusHandler(e: FocusEvent) {
        this.setFocused();
    }

    private onBlurHandler(e: FocusEvent) {
        if (this.winBlurred) {
            // don't turn off edit mode if whole window has lost focus
            return;
        }

        this.removeClass(TextComponentView.EDITOR_FOCUSED_CLASS);

        setTimeout(() => {
            if (!this.anyEditorHasFocus()) {
                if (PageViewController.get().isTextEditMode()) {
                    PageViewController.get().setTextEditMode(false);
                    // preventing mouse click event that triggered blur from further processing in ItemView
                    PageViewController.get().setNextClickDisabled(true);

                    // enable mouse click handling if click's target was not ItemView
                    setTimeout(() => PageViewController.get().setNextClickDisabled(false), 200);
                }
            }
        }, 50);
    }

    private onKeydownHandler(e: KeyboardEvent) {
        if (this.isSaveShortcutPressed(e)) {
            this.processEditorValue();
            return;
        }

        if (KeyHelper.isEscKey(e)) {
            this.handleEscPressed();
            return;
        }

        if (this.isAltTabPressed(e)) { // alt+tab for OSX
            this.handleAltTabPressed();
        }
    }

    private isSaveShortcutPressed(e: KeyboardEvent): boolean {
        return e.code === 'KeyS' && (e.ctrlKey || e.metaKey);
    }

    private handleEscPressed(): void {
        PageViewController.get().setTextEditMode(false);
        this.removeClass(TextComponentView.EDITOR_FOCUSED_CLASS);
    }

    private isAltTabPressed(e: KeyboardEvent): boolean {
        return e.altKey && KeyHelper.isTabKey(e);
    }

    private handleAltTabPressed(): void {
        const nextFocusable: Element = FormEl.getNextFocusable(this, '.xp-page-editor-text-view', true);

        if (nextFocusable) {
            $(nextFocusable.getHTMLElement()).simulate('click');
            nextFocusable.giveFocus();
        } else {
            this.htmlAreaEditor.fire('blur');
        }
    }

    private initEditor(): void {
        if (!this.isEditorPresentOrInitializing()) {
            this.doInitEditor();
        }
    }

    private doInitEditor(): void {
        this.setContentEditable(true);
        this.isInitializingEditor = true;
        const createDialogHandler: (event: CreateHtmlAreaDialogEvent) => void = event => {
            this.currentDialogConfig = event.getConfig();
        };

        HTMLAreaHelper.isSourceCodeEditable().then(editableSourceCode => {
            const htmlEditorParams: HtmlEditorParams = HtmlEditorParams.create()
                .setEditorContainerId(this.getId())
                .setAssetsUri(CONFIG.getString('assetsUri'))
                .setInline(true)
                .setCreateDialogHandler(createDialogHandler)
                .setFocusHandler(this.onFocusHandler.bind(this))
                .setBlurHandler(this.onBlurHandler.bind(this))
                .setMouseLeaveHandler(this.onMouseLeftHandler.bind(this))
                .setKeydownHandler(this.onKeydownHandler.bind(this))
                .setNodeChangeHandler(this.processEditorValue.bind(this))
                .setEditorReadyHandler(this.handleEditorCreated.bind(this))
                .setFixedToolbarContainer(PageViewController.get().getEditorToolbarContainerId())
                .setContent(ContentContext.get().getContent()?.getContentSummary())
                .setEditableSourceCode(editableSourceCode)
                .setApplicationKeys(this.getLiveEditParams().applicationKeys?.map(key => ApplicationKey.fromString(key)))
                .setLangDirection(this.getLangDirection())
                .build();

            return HtmlEditor.create(htmlEditorParams).then((htmlEditor: HtmlEditor) => {
                this.htmlAreaEditor = htmlEditor;

                this.htmlAreaEditor.on('focus', () => {
                    this.selectWhileEditing();
                });
            });
        }).catch(DefaultErrorHandler.handle);
    }

    private handleEditorCreated(): void {
        const data: string = this.initialValue ?
                             HTMLAreaHelper.convertRenderSrcToPreviewSrc(this.initialValue, this.getLiveEditParams().contentId) :
                             TextComponentView.DEFAULT_TEXT;
        this.htmlAreaEditor.setData(data);

        if (this.focusOnInit && this.isAdded()) {
            this.forceEditorFocus();
        }

        this.focusOnInit = false;
        this.isInitializingEditor = false;
        this.setContentEditable(this.editMode);
        this.notifyEditorReady();
    }

    private forceEditorFocus(): void {
        this.focusEditor();
        this.startPageTextEditMode();
    }

    private isEditorReady(): boolean {
        return !!this.htmlAreaEditor?.isReady();
    }

    private focusEditor(): void {
        if (this.isEditorReady()) {
            this.htmlAreaEditor.focus();
        }
    }

    private anyEditorHasFocus(): boolean {
        const textItemViews = (this.getPageView()).getItemViewsByType(TextItemType.get());

        const editorFocused = textItemViews.some((view: ItemView) => {
            return view.getEl().hasClass(TextComponentView.EDITOR_FOCUSED_CLASS);
        });

        const dialogVisible = !!this.modalDialog && this.modalDialog.isVisible();

        return editorFocused || dialogVisible;
    }

    private processEditorValue() {
        if (!this.htmlAreaEditor) {
            return;
        }

        const text: string = this.getText();

        this.refreshEmptyState();

        new UpdateTextComponentEvent(this.getPath(), text, 'live').fire();
    }

    private getText(): string {
        return this.isEditorEmpty() ? TextComponentView.DEFAULT_TEXT :
               HTMLAreaHelper.convertPreviewSrcToRenderSrc(this.htmlAreaEditor.getData());
    }

    setText(text: string): void {
        if (this.isEditorReady()) {
            const processedText = HTMLAreaHelper.convertRenderSrcToPreviewSrc(text, this.getLiveEditParams().contentId);

            if (processedText !== this.getText()) {
                this.htmlAreaEditor.setData(processedText);
            }
        } else {
            this.initialValue = text;
        }
    }

    isEmpty(): boolean {
        return this.isEditorEmpty();
    }

    private isEditorEmpty(): boolean {
        if (this.htmlAreaEditor) {
            const editorContent = this.htmlAreaEditor.getData();
            return editorContent.trim() === '' || editorContent === '<h2>&nbsp;</h2>';
        }

        // careful with this one, potential issues with calculating if element is empty, e.g. image only or empty table
        return this.getHTMLElement().innerHTML.length === 0 || this.getHTMLElement().innerHTML === '<p><br></p>';
    }

    private destroyEditor(): void {
        const editor = this.htmlAreaEditor;
        if (editor) {
            try {
                this.initialValue = this.getText(); // in case of moving saving current value since the editor will be recreated
                editor.destroy(false);
            } catch (e) {
                // error might be thrown when invoked after editor's iframe unloaded
            }
        }
        this.htmlAreaEditor = null;
    }

    startPageTextEditMode() {
        let pageView = this.getPageView();

        if (!pageView.isTextEditMode()) {
            PageViewController.get().setTextEditMode(true);
        }

        this.giveFocus();
    }

    giveFocus(): boolean {
        if (!this.isEditMode()) {
            return false;
        }

        if (!this.isEditorReady()) {
            this.onEditorReady(() => {
               this.focusEditor();
            });

            return false;
        }

        return super.giveFocus();
    }

    private addTextContextMenuActions() {
        this.addContextMenuActions([
            new Action(i18n('action.edit')).onExecuted(() => {
                this.startPageTextEditMode();
                this.focusOnInit = true;
                this.forceEditorFocus();
            })
        ]);
    }

    private isEditorPresentOrInitializing(): boolean {
        return !!this.htmlAreaEditor || this.isInitializingEditor;
    }

    scrollComponentIntoView() {
        if (!this.getPageView().isTextEditMode()) {
            super.scrollComponentIntoView();
        }
    }

    onEditorReady(listener: () => void) {
        if (this.isEditorReady()) {
            listener();
        } else {
            this.editorReadyListeners.push(listener);
        }
    }

    unEditorReady(listener: () => void) {
        this.editorReadyListeners = this.editorReadyListeners.filter((currentListener: () => void) => {
            return listener !== currentListener;
        });
    }

    private notifyEditorReady(): void {
        this.editorReadyListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    private getLangDirection(): LangDirection {
        const lang: string = this.getLiveEditParams().language;

        if (Locale.supportsRtl(lang)) {
            return LangDirection.RTL;
        }

        return LangDirection.AUTO;
    }

    protected isPlaceholderNeeded(): boolean {
        return this.isEditorReady() && !this.isEditMode() && super.isPlaceholderNeeded();
    }

    reset(): void {
        if (this.isEditorReady()) {
            this.htmlAreaEditor.setData(TextComponentView.DEFAULT_TEXT);
        } else {
            this.setHtml(TextComponentView.DEFAULT_TEXT, false);
        }
    }

    makeDuplicateConfig(): CreateTextComponentViewConfig {
        return super.makeDuplicateConfig(new CreateTextComponentViewConfig().setText(this.getText())) as CreateTextComponentViewConfig;
    }

    private handleUnlockOnCustomize(): void {
        const text = this.liveEditParams.getTextComponentData(this.getPath().toString());

        if (this.htmlAreaEditor) {
            const processedText = HTMLAreaHelper.convertRenderSrcToPreviewSrc(text, this.getLiveEditParams().contentId);
            this.htmlAreaEditor.setData(processedText);
        } else {
            this.initialValue = text; // will be used on editor created
        }
    }

    private setFocused(): void {
        if (TextComponentView.lastFocusedView !== this) {
            TextComponentView.lastFocusedView?.removeClass(TextComponentView.EDITOR_FOCUSED_CLASS);
        }

        this.addClass(TextComponentView.EDITOR_FOCUSED_CLASS);

        TextComponentView.lastFocusedView = this;
    }

    private restoreSelection(): void {
        const contentId = this.getLiveEditParams().contentId;
        const selectedItemViewPath: ComponentPath = SessionStorageHelper.getSelectedPathFromStorage(contentId);

        if (!selectedItemViewPath) {
            return;
        }

        if (this.getPath().equals(selectedItemViewPath)) {
            this.selectWithoutMenu();
            this.scrollComponentIntoView();

            const textEditorCursorPos: HtmlEditorCursorPosition = SessionStorageHelper.getSelectedTextCursorPosInStorage(contentId);

            if (textEditorCursorPos) {
                this.setCursorPositionInTextComponent(textEditorCursorPos);
                SessionStorageHelper.updateSelectedTextCursorPosInStorage(contentId, null);
            }
        }
    }

    private setCursorPositionInTextComponent(textEditorCursorPos: HtmlEditorCursorPosition): void {
        this.getPageView().appendContainerForTextToolbar();
        this.startPageTextEditMode();
        $(this.getHTMLElement()).simulate('click');

        this.setCursorPosition(textEditorCursorPos);
    }
}
