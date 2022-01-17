import * as $ from 'jquery';
import 'jquery-simulate/jquery.simulate.js';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ComponentView, ComponentViewBuilder} from '../ComponentView';
import {TextItemType} from './TextItemType';
import {TextPlaceholder} from './TextPlaceholder';
import {TextComponentViewer} from './TextComponentViewer';
import {LiveEditPageDialogCreatedEvent} from '../LiveEditPageDialogCreatedEvent';
import {Highlighter} from '../Highlighter';
import {ItemView} from '../ItemView';
import {PageViewController} from '../PageViewController';
import {DragAndDrop} from '../DragAndDrop';
import {HTMLAreaHelper} from '../../app/inputtype/ui/text/HTMLAreaHelper';
import {ModalDialog} from '../../app/inputtype/ui/text/dialog/ModalDialog';
import {TextComponent} from '../../app/page/region/TextComponent';
import {HtmlEditorParams} from '../../app/inputtype/ui/text/HtmlEditorParams';
import {HtmlEditor} from '../../app/inputtype/ui/text/HtmlEditor';
import {StylesRequest} from '../../app/inputtype/ui/text/styles/StylesRequest';
import {WindowDOM} from 'lib-admin-ui/dom/WindowDOM';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {SectionEl} from 'lib-admin-ui/dom/SectionEl';
import {FormEl} from 'lib-admin-ui/dom/FormEl';
import {Action} from 'lib-admin-ui/ui/Action';
import * as Q from 'q';
import {ContentSummary} from '../../app/content/ContentSummary';
import {ContentPath} from '../../app/content/ContentPath';
import {ItemViewSelectedEvent} from '../ItemViewSelectedEvent';
import {SelectedHighlighter} from '../SelectedHighlighter';
import {CONFIG} from 'lib-admin-ui/util/Config';

export class TextComponentViewBuilder
    extends ComponentViewBuilder<TextComponent> {
    constructor() {
        super();
        this.setType(TextItemType.get());
    }
}

export class TextComponentView
    extends ComponentView<TextComponent> {

    private rootElement: Element;

    private htmlAreaEditor: HtmlEditor;

    private isInitializingEditor: boolean;

    private focusOnInit: boolean;

    private editorContainer: DivEl;

    public static debug: boolean = false;

    private static DEFAULT_TEXT: string = '';

    private static EDITOR_FOCUSED_CLASS: string = 'editor-focused';

    // special handling for click to allow dblclick event without triggering 2 clicks before it
    public static DBL_CLICK_TIMEOUT: number = 250;
    private singleClickTimer: number;
    private lastClicked: number;

    private modalDialog: ModalDialog;
    private currentDialogConfig: any;

    private authRequest: Q.Promise<void>;
    private editableSourceCode: boolean;
    private winBlurred: boolean;

    constructor(builder: TextComponentViewBuilder) {
        super(builder.setPlaceholder(new TextPlaceholder()).setViewer(new TextComponentViewer()).setComponent(builder.component));

        this.addTextContextMenuActions();
        this.lastClicked = 0;
        this.liveEditModel = builder.parentRegionView.getLiveEditModel();
        this.isInitializingEditor = false;

        this.addClassEx('text-view');

        this.initializeRootElement();

        this.rootElement.getHTMLElement().onpaste = this.handlePasteEvent.bind(this);

        this.authRequest = HTMLAreaHelper.isSourceCodeEditable().then((value: boolean) => {
            this.editableSourceCode = value;
            return Q(null);
        });

        this.onAdded(() => { // is triggered on item insert or move
            if (!this.initOnAdd) {
                return;
            }

            this.initialize();
        });

        this.onRemoved(() => {
            this.destroyEditor();
        });

        const handleDialogCreated = (event) => {
            if (this.currentDialogConfig === event.getConfig()) {
                this.modalDialog = event.getModalDialog();
            }
        };

        this.bindWindowFocusEvents();

        LiveEditPageDialogCreatedEvent.on(handleDialogCreated.bind(this));
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

        new ItemViewSelectedEvent({itemView: this, position: null}).fire();
    }

    private bindWindowFocusEvents() {
        const win = WindowDOM.get();

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

    private initialize() {
        this.focusOnInit = true;
        this.addClass(TextComponentView.EDITOR_FOCUSED_CLASS);
        if (!this.isEditorPresentOrInitializing()) {
            this.initEditor();
        } else if (this.htmlAreaEditor) {
            this.reInitEditor(); // on added, inline editor losses its root element of the editable area
        }
        this.unhighlight();
    }

    private reInitEditor() {
        this.destroyEditor();
        this.editorContainer.remove();
        this.editorContainer = null;
    }

    private getContent(): ContentSummary {
        return this.liveEditModel.getContent();
    }

    private getContentPath(): ContentPath {
        return this.liveEditModel.getContent().getPath();
    }

    private getApplicationKeys(): ApplicationKey[] {
        return this.liveEditModel.getSiteModel().getSite().getApplicationKeys();
    }

    private isAllTextSelected(): boolean {
        return this.rootElement.getHTMLElement().innerText.trim() === window['getSelection']().toString();
    }

    private handlePasteEvent() {
        if (this.isAllTextSelected()) {
            this.rootElement.getHTMLElement().innerHTML = '';
        }
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

    protected isDragging(): boolean {
        return DragAndDrop.get().isDragging();
    }

    private initializeRootElement() {
        for (let i = 0; i < this.getChildren().length; i++) {
            let child = this.getChildren()[i];
            if (child.getEl().getTagName().toUpperCase() === 'SECTION') {
                this.rootElement = child;
                // convert image urls in text component for web
                StylesRequest.fetchStyles(this.getContent().getId()).then(() =>
                    child.setHtml(HTMLAreaHelper.convertRenderSrcToPreviewSrc(child.getHtml(), this.getContent().getId()), false)
                );
                break;
            }
        }
        if (!this.rootElement) {
            // create it in case of new component
            this.rootElement = new SectionEl();
            this.prependChild(this.rootElement);
        }
    }

    private doHandleDbClick(event: MouseEvent) {
        if (this.isEditMode() && this.isActive()) {
            return;
        }

        this.focusOnInit = true;
        this.startPageTextEditMode();
        if (this.isEditorReady()) {
            this.htmlAreaEditor.focus();
            this.addClass(TextComponentView.EDITOR_FOCUSED_CLASS);
        }
        Highlighter.get().hide();
    }

    private doHandleClick(event: MouseEvent) {
        if (this.isEditMode()) {
            if (this.isActive()) {
                return;
            }
            if (this.isEditorReady()) {
                this.htmlAreaEditor.focus();
            }
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
        if (event.which === 3) { // right click
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
            this.singleClickTimer = setTimeout(() => {
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

    setEditMode(edit: boolean) {
        if (!this.initOnAdd) {
            return;
        }

        if (!edit) {
            if (this.isEditorReady()) {
                this.processEditorValue();
            }
            this.removeClass(TextComponentView.EDITOR_FOCUSED_CLASS);

            this.deselect();
        }

        this.toggleClass('edit-mode', edit);
        this.setDraggable(!edit);

        if (edit) {
            if (!this.isEditorPresentOrInitializing()) {
                this.initEditor();
            }

            if (this.component.isEmpty()) {
                if (this.isEditorReady()) {
                    this.htmlAreaEditor.setData(TextComponentView.DEFAULT_TEXT);
                }
                this.rootElement.setHtml(TextComponentView.DEFAULT_TEXT, false);
            }
        }
    }

    private onMouseLeftHandler(e: MouseEvent, mousePressed?: boolean) {
        if (mousePressed) {
            // don't consider mouse up as a click if mouse down was performed in editor
            PageViewController.get().setNextClickDisabled(true);
        }
    }

    private onFocusHandler(e: FocusEvent) {
        this.addClass(TextComponentView.EDITOR_FOCUSED_CLASS);
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
        let saveShortcut = (e.keyCode === 83 && (e.ctrlKey || e.metaKey));

        if (saveShortcut) { //Cmd-S
            this.processEditorValue();
        }

        if (e.keyCode === 27 || saveShortcut) { // esc or Cmd-S
            PageViewController.get().setTextEditMode(false);
            this.removeClass(TextComponentView.EDITOR_FOCUSED_CLASS);
        } else if ((e.altKey) && e.keyCode === 9) { // alt+tab for OSX
            let nextFocusable = FormEl.getNextFocusable(this, '.xp-page-editor-text-view', true);
            if (nextFocusable) {
                $(nextFocusable.getHTMLElement()).simulate('click');
                nextFocusable.giveFocus();
            } else {
                this.htmlAreaEditor.fire('blur');
            }
        }
    }

    private initEditor(): void {
        if (this.authRequest.isFulfilled()) {
            this.doInitEditor();
        } else {
            this.authRequest.then(() => {
                if (!this.isEditorPresentOrInitializing()) {
                    this.doInitEditor();
                }
            });
        }
    }

    private doInitEditor() {
        this.isInitializingEditor = true;
        const assetsUri = CONFIG.get('assetsUri');
        const id = this.getId().replace(/\./g, '_');

        this.addClass(id);

        if (!this.editorContainer) {
            this.editorContainer = new DivEl('');
            this.editorContainer.setContentEditable(true).getEl().setAttribute('id', this.getId() + '_editor');
            this.appendChild(this.editorContainer);
        }

        const createDialogHandler = event => {
            this.currentDialogConfig = event.getConfig();
        };

        const htmlEditorParams: HtmlEditorParams = HtmlEditorParams.create()
            .setEditorContainerId(this.getId() + '_editor')
            .setAssetsUri(assetsUri)
            .setInline(true)
            .setCreateDialogHandler(createDialogHandler)
            .setFocusHandler(this.onFocusHandler.bind(this))
            .setBlurHandler(this.onBlurHandler.bind(this))
            .setMouseLeaveHandler(this.onMouseLeftHandler.bind(this))
            .setKeydownHandler(this.onKeydownHandler.bind(this))
            .setNodeChangeHandler(this.processEditorValue.bind(this))
            .setEditorReadyHandler(this.handleEditorCreated.bind(this))
            .setFixedToolbarContainer(PageViewController.get().getEditorToolbarContainerId())
            .setContent(this.getContent())
            .setEditableSourceCode(this.editableSourceCode)
            .setContentPath(this.getContentPath())
            .setApplicationKeys(this.getApplicationKeys())
            .build();

        HtmlEditor.create(htmlEditorParams).then((htmlEditor: HtmlEditor) => {
            this.htmlAreaEditor = htmlEditor;

            this.htmlAreaEditor.on('focus', () => {
                this.selectWhileEditing();
            });
        });
    }

    private handleEditorCreated() {
        if (this.component.getText()) {
            this.htmlAreaEditor.setData(HTMLAreaHelper.convertRenderSrcToPreviewSrc(this.component.getText(), this.getContent().getId()));
        } else {
            this.htmlAreaEditor.setData(TextComponentView.DEFAULT_TEXT);
        }

        if (this.focusOnInit && this.isAdded()) {
            this.forceEditorFocus();
        }
        this.focusOnInit = false;
        this.isInitializingEditor = false;
    }

    private forceEditorFocus() {
        if (this.isEditorReady()) {
            this.htmlAreaEditor.focus();
        }
        this.startPageTextEditMode();
    }

    private isEditorReady() {
        return this.htmlAreaEditor && this.htmlAreaEditor.isReady();
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

        if (this.isEditorEmpty()) {
            this.component.setText(TextComponentView.DEFAULT_TEXT);
            // copy editor content over to the root html element
            this.rootElement.getHTMLElement().innerHTML = TextComponentView.DEFAULT_TEXT;
        } else {
            // copy editor raw content (without any processing!) over to the root html element
            this.rootElement.getHTMLElement().innerHTML = this.htmlAreaEditor.getRawData();
            // but save processed text to the component
            this.component.setText(HTMLAreaHelper.convertPreviewSrcToRenderSrc(this.htmlAreaEditor.getData()));
        }
    }

    private isEditorEmpty(): boolean {
        const editorContent = this.htmlAreaEditor.getData();
        return editorContent.trim() === '' || editorContent === '<h2>&nbsp;</h2>';
    }

    private destroyEditor(): void {
        const editor = this.htmlAreaEditor;
        if (editor) {
            try {
                editor.destroy(false);
            } catch (e) {
                // error might be thrown when invoked after editor's iframe unloaded
            }
        }
        this.htmlAreaEditor = null;
    }

    private startPageTextEditMode() {
        let pageView = this.getPageView();

        if (!pageView.isTextEditMode()) {
            PageViewController.get().setTextEditMode(true);
        }

        this.giveFocus();
    }

    giveFocus() {
        if (!this.isEditMode()) {
            return false;
        }
        return this.rootElement.giveFocus();
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

    extractText(): string {
        if (this.isEditorReady()) { // that makes editor cleanup
            this.htmlAreaEditor.resetSelection();

            return this.htmlAreaEditor.extractText();
        }

        return $(this.getHTMLElement()).text().trim();
    }
}
