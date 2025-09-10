/*global CKEDITOR*/

import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {NotificationMessage} from '@enonic/lib-admin-ui/notify/NotificationMessage';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import Q from 'q';
import {ContentPath} from '../../../content/ContentPath';
import {ContentSummary} from '../../../content/ContentSummary';
import {ContentResourceRequest} from '../../../resource/ContentResourceRequest';
import {ContentsExistByPathRequest} from '../../../resource/ContentsExistByPathRequest';
import {ContentsExistByPathResult} from '../../../resource/ContentsExistByPathResult';
import {ImageUrlResolver} from '../../../util/ImageUrlResolver';
import {UrlHelper} from '../../../util/UrlHelper';
import {CreateHtmlAreaDialogEventGenerator} from './CreateHtmlAreaDialogEventGenerator';
import {HTMLAreaHelper} from './HTMLAreaHelper';
import {HtmlEditorParams} from './HtmlEditorParams';
import {StyleHelper} from './styles/StyleHelper';
import {Styles} from './styles/Styles';
import {StylesRequest} from './styles/StylesRequest';
import editor = CKEDITOR.editor;
import eventInfo = CKEDITOR.eventInfo;
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export interface HtmlEditorCursorPosition {
    selectionIndexes: number[];
    indexOfSelectedElement: number;
    startOffset: number;
}

export interface FullScreenDialogParams {
    editor: editor,
    editorParams: HtmlEditorParams,
    cursorPosition: HtmlEditorCursorPosition
}

export interface MacroDialogParams {
    editor: editor,
    macro: Macro
}

export interface Macro {
    name: string;
    attributes: string[];
    macroStart: CKEDITOR.dom.element;
    index: number,
    body?: string | HTMLElement[];
    macroEnd?: CKEDITOR.dom.element;
}

/**
 * NB: Using inline styles for editor's inline mode; Inline styles apply same alignment styles as alignment classes
 * in xp/styles.css, thus don't forget to update inline styles when styles.css modified
 * NB: CKE rearranges order of entries in classes and style attributes, might trim whitespaces or semicolon
 */
export class HtmlEditor {

    private readonly editorParams: HtmlEditorParams;

    private editor: CKEDITOR.editor;

    static SPECIAL_CHAR_NBSP= '(_)';
    static SPECIAL_CHAR_SHY= '(-)';

    private isSaveSnapshotAllowed: boolean;

    private constructor(config: CKEDITOR.config, htmlEditorParams: HtmlEditorParams) {
        this.editorParams = htmlEditorParams;

        this.createEditor(config);
        this.modifyImagePlugin();
        this.listenEditorEvents();
        this.handleFileUpload();
        this.handleNativeNotifications();
        this.handleTooltipForClickableElements();
        this.setupDialogsToOpen();
        this.setupKeyboardShortcuts();
        this.addCustomLangEntries();
        this.removeUnwantedMenuItems();
    }

    private createEditor(config: CKEDITOR.config) {
        this.editor = this.editorParams.isInline() ?
                      CKEDITOR.inline(this.editorParams.getEditorContainerId(), config) :
                      CKEDITOR.replace(this.editorParams.getEditorContainerId(), config);
    }

    private modifyImagePlugin() {
        this.editor.on('widgetDefinition', (e: eventInfo) => {
            if (e.data.name === 'image') {
                this.allowFigureHaveAnyClasses2(e);
                this.modifyImagePluginUpcastDowncastFunctions(e);
            }
        });
    }

    private allowFigureHaveAnyClasses2(e: eventInfo) {
        e.data.allowedContent.figure.classes = ['*'];
        e.data.allowedContent.figure.styles = ['*'];
        e.data.allowedContent.img.styles = ['*'];
    }

    private modifyImagePluginUpcastDowncastFunctions(e: eventInfo) {
        const originalUpcastFunction: (el: CKEDITOR.htmlParser.element, data) => CKEDITOR.htmlParser.element = e.data.upcast;
        const newUpcastFunction = function (el: CKEDITOR.htmlParser.element, data) {
            const result: CKEDITOR.htmlParser.element = originalUpcastFunction(el, data);

            if (el.name === 'figure' && el.hasClass(StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS)) {
                data.align = 'center';
            }

            if (result && result.name === 'img') { // standalone image
                return null;
            }

            if (result && result.name === 'a' && result['parent'].name !== 'figure') { // standalone image wrapped with link
                return null;
            }

            if (!result && el.name === 'figure') {
                if (el.getFirst('img') ?
                    el.getFirst('img') : el.getFirst('a') ?
                                         (el.getFirst('a') as CKEDITOR.htmlParser.element).getFirst('img') : null) {
                    return el;
                }
            }

            return result;
        };

        const originalDowncastFunction: (el: CKEDITOR.htmlParser.element) => CKEDITOR.htmlParser.element = e.data.downcast;
        const newDowncastFunction = function (el: CKEDITOR.htmlParser.element) {
            if (el.name === 'figure' && el.hasClass(StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS)) {
                return el;
            }

            return originalDowncastFunction.call(e.data, el);
        };

        e.data.upcast = newUpcastFunction;
        e.data.downcast = newDowncastFunction;
    }

    private listenEditorEvents() {
        if (this.editorParams.hasNodeChangeHandler()) {
            this.editor.on('change', this.editorParams.getNodeChangeHandler().bind(this));
        }

        if (this.editorParams.hasFocusHandler()) {
            this.editor.on('focus', this.editorParams.getFocusHandler().bind(this));
        }

        if (this.editorParams.hasKeydownHandler()) {
            this.editor.on('key', (e: eventInfo) => {
                this.editorParams.getKeydownHandler()(e.data.domEvent.$);
            });
        }

        if (this.editorParams.hasEditorLoadedHandler()) {
            this.editor.on('loaded', this.editorParams.getEditorLoadedHandler().bind(this));
        }

        if (this.editorParams.hasEditorReadyHandler()) {
            this.editor.on('instanceReady', this.editorParams.getEditorReadyHandler().bind(this));
        }

        if (this.editorParams.hasBlurHandler()) {
            this.editor.on('blur', this.editorParams.getBlurHandler().bind(this));
        }

        this.editor.on('dataReady', (e: eventInfo) => {
            const rootElement: CKEDITOR.dom.element = this.editorParams.isInline() ? e.editor.container : e.editor.document.getBody();

            setTimeout(() => {
                rootElement.find('figure').toArray().forEach((figure: CKEDITOR.dom.element) => {
                    HtmlEditor.updateFigureInlineStyle(figure);
                    HtmlEditor.sortFigureClasses(figure);
                });
            }, 1);

        });

        this.editor.on('saveSnapshot', (evt: CKEDITOR.eventInfo) => {
            if (!this.isSaveSnapshotAllowed) {
                evt.cancel();
            }
        });

        this.handlePaste();
        this.handleFullScreenModeToggled();
        this.handleMouseEvents();
        this.handleElementSelection();
        this.handleImageAlignButtonPressed();
    }

    private handlePaste(): void {
        let isCleanupNbspRequired = false;
        let indexOfNbsp: number;
        let selectedTextElement;

        this.editor.on('paste', (e: eventInfo) => {
            isCleanupNbspRequired = false;
            // handlePasteFromGoogleDoc, https://github.com/enonic/app-contentstudio/issues/485
            if (GoogleDocPasteHandler.isPastedFromGoogleDoc(e.data.dataTransfer.getData('text/html'))) {
                e.data.dataValue = new GoogleDocPasteHandler(e.data.dataValue).process();
            } else { // handle trailing non-breaking spaces , https://github.com/enonic/app-contentstudio/issues/7570
                e.data.dataValue = e.data.dataValue?.replace(/^(&nbsp;)+|(&nbsp;)+$/g, ' ');
            }

            selectedTextElement = this.editor.getSelection().getRanges()[0]?.startContainer.$;

            // checking if last character in the current cursor position is non-breaking space
            if (HTMLAreaHelper.isNbsp(selectedTextElement.textContent.slice(-1))) {
                isCleanupNbspRequired = true;
                indexOfNbsp = selectedTextElement.textContent.length;
            }
        });

        this.editor.on('afterPaste', (e: eventInfo) => {
            if (isCleanupNbspRequired) {
                selectedTextElement.textContent = selectedTextElement.textContent.slice(0, indexOfNbsp - 1) + ' ' + selectedTextElement.textContent.slice(indexOfNbsp);
            }
        });
    }

    private toggleToolbarButtonState(name: string, isActive: boolean) {
        this.editor.getCommand(name).setState(isActive ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF);
    }

    private handleTooltipForClickableElements() {
        let tooltipElem: CKEDITOR.dom.element = null;
        const tooltipText: string = i18n('editor.dblclicktoedit');

        const mouseOverHandler = AppHelper.debounce((ev: eventInfo) => {
            const targetEl: CKEDITOR.dom.element = ev.data.getTarget();
            const isClickableElement: boolean = targetEl.is('a') || targetEl.is('img'); // imgs, links, anchors

            if (isClickableElement) {
                tooltipElem.setAttribute('title', tooltipText);
            } else {
                tooltipElem.removeAttribute('title');
            }

        }, 200);

        this.editor.on('instanceReady', () => {
            setTimeout(() => {
                this.isSaveSnapshotAllowed = true;
            }, 500);

            try {
                tooltipElem = this.getTooltipContainer();
            } catch (e) {
                console.log('Failed to init tooltip handler');
            }

            if (!!tooltipElem) {
                this.editor.editable().on('mouseover', mouseOverHandler);
            }

        });

        this.editor.once('autoGrow', (event: CKEDITOR.eventInfo) => {
            event.cancel();
        });
    }

    private getTooltipContainer(): CKEDITOR.dom.element {
        if (this.editorParams.isInline()) {
            return this.editor.container;
        }

        const body: CKEDITOR.dom.element = this.editor.document.getBody();

        return !!body ? body.getParent() : null;
    }

    private handleFileUpload() {
        this.handleImageDropped();
        this.handleUploadRequest();
        this.handleUploadResponse();
    }

    // Wrapping dropped image into figure element
    private handleImageDropped() {
        const editor = this.editor;

        this.editor.on('instanceReady', function () {
            editor.widgets.registered.uploadimage['onUploaded'] = function (upload) {
                const imageId: string = StringHelper.substringBetween(upload.url, 'image/', '?');
                const dataSrc: string = ImageUrlResolver.URL_PREFIX_RENDER + imageId;

                this['replaceWith'](`<figure class="captioned ${StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS}">` +
                                    `<img src="${upload.url}" data-src="${dataSrc}" style="width:100%">` +
                                    '<figcaption> </figcaption>' +
                                    '</figure>');

                editor.fire('change');
            };
        });
    }

    private handleUploadRequest() {
        this.editor.on('fileUploadRequest', (evt: eventInfo) => {
            const fileLoader = evt.data.fileLoader;

            this.fileExists(fileLoader.fileName).then((exists: boolean) => {

                if (exists) {
                    NotifyManager.get().showWarning(i18n('notify.fileExists', fileLoader.fileName));
                    evt.editor.document.findOne('.cke_widget_uploadimage').remove(); // removing upload preview image
                } else {
                    this.uploadFile(fileLoader);
                }
            }).catch(DefaultErrorHandler.handle).done();

            // Prevented the default behavior.
            evt.stop();
        });
    }

    private fileExists(fileName: string): Q.Promise<boolean> {
        const contentPathAsString: string =
            ContentPath.create().setElements([this.editorParams.getContent().getPath().toString(), fileName]).build().toString();

        return new ContentsExistByPathRequest([contentPathAsString]).sendAndParse().then((result: ContentsExistByPathResult) => {
            return result.getContentsExistMap()[contentPathAsString];
        });
    }

    private uploadFile(fileLoader) {
        const formData = new FormData();
        const xhr = fileLoader.xhr;

        xhr.open('POST', fileLoader.uploadUrl, true);
        formData.append('file', fileLoader.file, fileLoader.fileName);
        formData.append('parent', this.editorParams.getContent().getPath().toString());
        formData.append('name', fileLoader.fileName);

        fileLoader.xhr.send(formData);
    }

    // parse image upload response so cke understands it
    private handleUploadResponse() {
        this.editor.on('fileUploadResponse', (evt: eventInfo) => {
            // Prevent the default response handler.
            evt.stop();

            // Get XHR and response.
            const data = evt.data;
            const xhr = data.fileLoader.xhr;
            const response = xhr.responseText.split('|');

            if (response[1]) {
                // An error occurred during upload.
                data.message = response[1];
                evt.cancel();
            } else {
                const mediaContent = JSON.parse(response[0]);

                const imgUrl = new ImageUrlResolver(null, this.editorParams.getProject())
                    .setContentId(mediaContent.id)
                    .setScaleWidth(true)
                    .resolveForPreview();

                data.url = imgUrl;
            }
        });
    }

    private handleFullScreenModeToggled() {
        this.editor.on('maximize', (e: eventInfo) => {
            if (e.data === 2) { // fullscreen off
                ResponsiveManager.fireResizeEvent();
            }
        });

        if (this.editorParams.isFullScreenMode()) {
            this.editor.on('instanceReady', () => {
                this.editor.document.getBody().addClass('fullscreen');
                this.editor.getCommand('openFullscreenDialog').setState(CKEDITOR.TRISTATE_ON);
            });
        }
    }

    private handleMouseEvents() {
        const editorEl = document.getElementById(this.editorParams.getEditorContainerId());
        let mousePressed: boolean = false;

        editorEl.addEventListener('mousedown', () => mousePressed = true);
        editorEl.addEventListener('mouseup', () => mousePressed = false);
        editorEl.addEventListener('mouseleave', (e: MouseEvent) => {
            if (this.editorParams.hasMouseLeaveHandler()) {
                this.editorParams.getMouseLeaveHandler()(e, mousePressed);
            }
        });

        Body.get().onMouseUp(() => {
            if (mousePressed) {
                mousePressed = false;
            }
        });
    }

    private handleElementSelection() {
        this.editor.on('selectionChange', (e: eventInfo) => {
            this.updateDialogButtonStates(e);
            this.handleImageSelectionIssue(e);
            this.updateAlignmentButtonStates(e);
        });
    }

    private updateDialogButtonStates(e: eventInfo) {
        const selectedElement: CKEDITOR.dom.element = e.data.path.lastElement;

        const isAnchorSelected: boolean = selectedElement.hasClass('cke_anchor');
        const isImageSelected: boolean = selectedElement.hasClass('cke_widget_image');
        const isLinkSelected: boolean = (selectedElement.is('a') && selectedElement.hasAttribute('href'));
        const figureEl = isImageSelected ? selectedElement.findOne('figure') : null;
        const isImageWithLinkSelected = isImageSelected && !!figureEl && (figureEl.getFirst() as CKEDITOR.dom.element).is('a');

        this.toggleToolbarButtonState('link', isLinkSelected || isImageWithLinkSelected);
        this.toggleToolbarButtonState('anchor', isAnchorSelected);
        this.toggleToolbarButtonState('image', isImageSelected);
    }

    // fixing locally https://github.com/ckeditor/ckeditor-dev/issues/2517
    private handleImageSelectionIssue(e: eventInfo) {
        const selectedElement: CKEDITOR.dom.element = e.data.path.lastElement;

        // checking if selected element is image or not
        if (!selectedElement.hasClass('cke_widget_image')) {
            return;
        }

        // if image is selected properly it is supposed to have 'selected' class
        if (selectedElement.hasClass('cke_widget_selected')) {
            return;
        }

        // if improperly selected image is not first element in the editor then new image would be inserted without errors
        if (!!selectedElement.getPrevious()) {
            return;
        }

        // forcing image to be properly selected in editor
        e.editor.getSelection().selectElement(selectedElement);
    }

    private updateAlignmentButtonStates(e: eventInfo) {
        const selectedElement: CKEDITOR.dom.element = e.data.path.lastElement;
        const isImageSelected: boolean = selectedElement.hasClass('cke_widget_image');

        if (!isImageSelected) {
            return;
        }

        if (!this.isSingleElementSelected()) { // multiple elements selected
            return;
        }

        const figure: CKEDITOR.dom.element = selectedElement.findOne('figure');

        this.doUpdateAlignmentButtonStates(figure);
    }

    private isSingleElementSelected(): boolean {
        const selectionRange = this.editor.getSelection().getRanges()[0];

        return selectionRange.startContainer.equals(selectionRange.endContainer);
    }

    private doUpdateAlignmentButtonStates(figure: CKEDITOR.dom.element) {
        // class 'undefined' means newly inserted justified image
        if (!figure || figure.hasClass(StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS) || figure.hasClass('undefined')) {
            this.setJustifyButtonActive();
        } else {
            this.toggleToolbarButtonState('justifyblock', false);

            // if image was dragged then align buttons are disabled; enabling them in that case
            if (this.editor.getCommand('justifyleft').state === CKEDITOR.TRISTATE_DISABLED) {
                this.toggleToolbarButtonState('justifyleft', false);
                this.toggleToolbarButtonState('justifyright', false);
                this.toggleToolbarButtonState('justifycenter', false);

                if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS)) {
                    this.toggleToolbarButtonState('justifyleft', true);
                } else if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS)) {
                    this.toggleToolbarButtonState('justifyright', true);
                } else if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS)) {
                    this.toggleToolbarButtonState('justifycenter', true);
                }
            }
        }
    }

    private setJustifyButtonActive() {
        this.toggleToolbarButtonState('justifyblock', true);
        this.toggleToolbarButtonState('justifyleft', false);
        this.toggleToolbarButtonState('justifyright', false);
        this.toggleToolbarButtonState('justifycenter', false);
    }

    private handleImageAlignButtonPressed() {
        this.editor.on('afterCommandExec', (e: eventInfo) => {
            if (e.data.name.indexOf('justify') !== 0) { // not an align command
                return;
            }

            const selectedElement: CKEDITOR.dom.element = this.editor.getSelection().getSelectedElement();

            if (!selectedElement || !selectedElement.hasClass('cke_widget_image')) { // not an image
                return;
            }

            this.toggleToolbarButtonState('justifyblock', false); // enable justify button

            const figure: CKEDITOR.dom.element = selectedElement.findOne('figure');

            if (e.data.name === 'justifyblock') {
                const imageWidgets: CKEDITOR.plugins.widget.repository = this.editor.widgets;
                const imageWidget: CKEDITOR.plugins.widget = imageWidgets.getByElement(selectedElement, false);
                imageWidget.setData('align', 'none');

                figure.addClass(StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS);
                this.setJustifyButtonActive();
            } else {
                figure.removeClass(StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS);
            }

            HtmlEditor.updateFigureInlineStyle(figure);
            HtmlEditor.sortFigureClasses(figure);
        });
    }

    public static updateFigureInlineStyle(figure: CKEDITOR.dom.element) {
        const hasCustomWidth: boolean = figure.hasClass(StyleHelper.STYLE.WIDTH.CUSTOM);
        const customWidth: string = figure.getStyle('width');
        const firstFigureChild: CKEDITOR.dom.element = (figure.getFirst() as CKEDITOR.dom.element);

        figure.removeAttribute('style');

        if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS)) { // Left Aligned
            figure.setStyles({
                float: 'left',
                width: hasCustomWidth ? customWidth : `${StyleHelper.STYLE.ALIGNMENT.LEFT.WIDTH}%`
            });
        } else if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS)) { // Right Aligned
            figure.setStyles({
                float: 'right',
                width: hasCustomWidth ? customWidth : `${StyleHelper.STYLE.ALIGNMENT.RIGHT.WIDTH}%`
            });
        } else if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS)) { // Center Aligned
            figure.setStyles({
                margin: 'auto',
                width: hasCustomWidth ? customWidth : `${StyleHelper.STYLE.ALIGNMENT.CENTER.WIDTH}%`
            });
        } else if (hasCustomWidth) { // Justify Aligned
            figure.setStyle('width', customWidth);
        }
    }

    public static sortFigureClasses(figure: CKEDITOR.dom.element) {
        const classes: string[] = figure.$.className.split(' ').sort();
        figure.$.className = classes.join(' ');
    }

    private handleNativeNotifications() {
        const progressNotifications: object = {};

        this.editor.on('notificationShow', function (evt: eventInfo) {
            // Do not show the default notification
            evt.cancel();

            if (evt.editor['disableNotification']) {
                return;
            }

            const notification = evt.data.notification;

            switch (notification.type) {
            case 'success':
                NotifyManager.get().showSuccess(notification.message);
                break;
            case 'info':
            case 'progress':
                NotifyManager.get().showFeedback(notification.message);
                break;
            case 'warning':
                NotifyManager.get().showError(notification.message);
                break;
            }
        });

        this.editor.on('notificationUpdate', function (evt: eventInfo) {
            const message: string = evt.data.options ? evt.data.options.message : evt.data.notification.message;
            const messageId: string = evt.data.notification.id;
            const type: string = (evt.data.options && evt.data.options.type) ? evt.data.options.type : evt.data.notification.type;

            switch (type) {
            case 'success':
                NotifyManager.get().showSuccess(message);
                NotifyManager.get().hide(progressNotifications[messageId]);
                delete progressNotifications[messageId];
                break;
            case 'progress':
                if (progressNotifications[messageId]) {
                    const notificationMessage: NotificationMessage = NotifyManager.get().getNotification(
                        progressNotifications[messageId]);
                    if (notificationMessage) {
                        notificationMessage.setText(message);
                    }
                } else {
                    progressNotifications[messageId] = NotifyManager.get().showFeedback(message, false);
                }
                break;
            }

            // Do not show the default notification.
            evt.cancel();
        });
    }

    private setupDialogsToOpen() {
        this.editor.addCommand('openMacroDialog', {
            exec: (editor, data) => {
                new CreateHtmlAreaDialogEventGenerator(this.editorParams).generateMacroEventAndFire({editor: editor, macro: data});
                return true;
            }
        });

        this.editor.addCommand('openFullscreenDialog', {
            exec: (editor: editor) => {
                if (this.editorParams.isFullScreenMode()) {
                    editor.fire('closeFullscreenDialog');
                    return;
                }

                const config: FullScreenDialogParams = {
                    editor: editor,
                    editorParams: this.editorParams,
                    cursorPosition: this.getCursorPosition()
                };

                new CreateHtmlAreaDialogEventGenerator(this.editorParams).generateFullScreenEventAndFire(config);
                return true;
            }
        });

        this.editor.ui.addButton('Fullscreen', {
            label: 'Fullscreen',
            command: 'openFullscreenDialog',
            toolbar: 'tools,10',
            icon: 'maximize'
        });

        this.editor.on('dialogShow', (dialogShowEvent: eventInfo) => {
            new CreateHtmlAreaDialogEventGenerator(this.editorParams).generateFromEventInfoAndFire(dialogShowEvent);
        });
    }

    getName(): string {
        return this.editor.name;
    }

    getHTMLElement(): HTMLElement {
        return this.editor.element.$;
    }

    getContent(): ContentSummary {
        return this.editorParams.getContent();
    }

    getCursorPosition(): HtmlEditorCursorPosition {
        const selection: CKEDITOR.dom.selection = this.editor.getSelection();
        const range: CKEDITOR.dom.range = selection.getRanges()[0];

        if (!range) {
            return null;
        }

        const isCursorSetOnText: boolean = range.startContainer?.$.nodeName === '#text';

        return {
            selectionIndexes: this.editor.elementPath().elements.map(e => e.getIndex()).reverse().slice(1),
            indexOfSelectedElement: isCursorSetOnText ? range.startContainer.getIndex() : -1,
            startOffset: isCursorSetOnText ? range.startOffset : null
        };
    }

    private setupKeyboardShortcuts() {
        const editor: CKEDITOR.editor = this.editor;

        const commandDef: CKEDITOR.commandDefinition = {
            exec: function () {
                const style: CKEDITOR.style = new CKEDITOR.style({element: this['name']}, null);

                if (style.checkActive(editor.elementPath(), editor)) {
                    editor.removeStyle(style);
                } else {
                    editor.applyStyle(style); // name is command name
                }

                return true;
            }
        };

        const allowedTags = editor.config.format_tags.split(';');
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div']
            .filter(tag => allowedTags.indexOf(tag) > -1)
            .forEach(tag => this.editor.addCommand(tag, commandDef));

        this.editor.addCommand('address', commandDef);

        this.editor.on('instanceReady', () => {
            this.editor.setKeystroke(CKEDITOR.CTRL + 70, 'toggleFind'); // open find dialog on CTRL + F
            this.editor.setKeystroke(CKEDITOR.CTRL + 82, 'toggleFindAndReplace'); // open find dialog on CTRL + R
            this.editor.setKeystroke(CKEDITOR.CTRL + 75, 'link'); // open link dialog on CTRL + K
            this.editor.setKeystroke(CKEDITOR.CTRL + 76, 'image'); // open link dialog on CTRL + L
            this.editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 49, 'h1'); // apply Heading 1 format
            this.editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 50, 'h2'); // apply Heading 2 format
            this.editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 51, 'h3'); // apply Heading 3 format
            this.editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 52, 'h4'); // apply Heading 4 format
            this.editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 53, 'h5'); // apply Heading 5 format
            this.editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 54, 'h6'); // apply Heading 6 format
            this.editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 55, 'p'); // apply the 'Normal' format
            this.editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 56, 'div'); // apply the 'Normal (DIV)' format
            this.editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 57, 'address'); // apply the 'Address' format
            this.editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 32, 'insertNbsp');
            this.editor.setKeystroke(CKEDITOR.CTRL + 83, 'saveHandler');
        });

        if (this.editorParams.getSaveHandler()) {
            this.editor.addCommand('saveHandler', {
                exec: () => {
                    this.editorParams.getSaveHandler()();
                    return true;
                }
            });
        }

        this.editor.on('key',  (evt: eventInfo) => { // stopping select all from propagating
            if (evt.data.keyCode === CKEDITOR.CTRL + 65) {
                if (evt.data.domEvent && evt.data.domEvent.stopPropagation) {
                    evt.data.domEvent.stopPropagation();
                }
            } else if (evt.data.keyCode === 32) {
                this.handleSpacePressed();
            }
        });
    }

    private handleSpacePressed(): void {
        // https://github.com/enonic/app-contentstudio/issues/7570, pressing space after or before link should not insert nbsp
        const range = this.editor.getSelection().getRanges()[0];
        const startNode = range.startContainer;
        const endNode = range.endContainer;
        const isAfterOrBeforeLink = startNode.getParent()?.is('a') || range.getNextNode()?.is?.('a');

        // checking that cursor is at the end of the same text node, like at place where link ends and other text starts right after it
        if (isAfterOrBeforeLink && startNode.$ === endNode.$ && range.startOffset === range.endOffset && (range.startOffset === startNode.getText().length ||
            range.startOffset === 1 || range.startOffset === 2)) {
            const prevChar = startNode.getText()[range.startOffset - 1];
            const nextChar = range.getNextNode()?.getText()[0];

            // checking that cursor position is surrounded by non-whitespace characters
            if (ObjectHelper.bothDefined(prevChar, nextChar) && !StringHelper.isBlank(prevChar) && !StringHelper.isBlank(nextChar)){
                setTimeout(() => { // setting timeout to allow space to be replaced with nbsp by browser/editor
                    const selection: CKEDITOR.dom.selection = this.editor.getSelection();
                    const range: CKEDITOR.dom.range = selection.getRanges()[0];

                    if (!range) {
                        return null;
                    }

                    //checking if text node at cursor position contains nbsp
                    const elem = range.startContainer?.$;
                    const isSpaceReplacedWithNbsp = elem?.textContent.search(/\xA0/) > -1;

                    if (isSpaceReplacedWithNbsp) {
                        elem.textContent = elem.textContent.replace(/\xA0/g, ' ');
                        // cursor jumps after we replace nbsp with space, so we need to move it back
                        range.select();
                    }
                }, 1);
            }
        }
    }

    private addCustomLangEntries() {
        this.editor.on('langLoaded', (evt: eventInfo) => {
            if (evt.editor.lang.format) {
                evt.editor.lang.format.tag_code = 'Сode';
            }

            const tooltipPrefix = BrowserHelper.isOSX() ? '\u2318' : 'Ctrl';
            const linkTooltipPostfix: string = `(${tooltipPrefix}+K)`;
            const imageTooltipPostfix: string = `(${tooltipPrefix}+L)`;

            if (evt.editor.lang.link && evt.editor.lang.link.toolbar.indexOf(linkTooltipPostfix) < 0) {
                evt.editor.lang.link.toolbar = evt.editor.lang.link.toolbar + ' ' + linkTooltipPostfix;
            }

            if (evt.editor.lang.common && evt.editor.lang.common.image.indexOf(imageTooltipPostfix) < 0) {
                evt.editor.lang.common.image = evt.editor.lang.common.image + ' ' + imageTooltipPostfix;
            }

            // anchor tooltip
            if (evt.editor.lang.fakeobjects) {
                evt.editor.lang.fakeobjects.anchor = i18n('editor.dblclicktoedit');
            }
        });
    }

    private removeUnwantedMenuItems() {
        this.editor.on('instanceReady', () => {
            this.editor.removeMenuItem('tablecell_properties');
            this.editor.removeMenuItem('paste');
        });
    }

    public static create(htmlEditorParams: HtmlEditorParams): Q.Promise<HtmlEditor> {
        return HtmlEditorConfigBuilder.createEditorConfig(htmlEditorParams).then((config: CKEDITOR.config) => {
            return new HtmlEditor(config, htmlEditorParams);
        });
    }

    public static exists(id: string): boolean {
        return !!CKEDITOR.instances[id];
    }

    public static destroy(id: string, noUpdate?: boolean) {
        CKEDITOR.instances[id].destroy(noUpdate);
    }

    public static getData(id: string): string {
        return HTMLAreaHelper.sanitize(CKEDITOR.instances[id].getData());
    }

    public static setData(id: string, data: string, callback?: () => void) {
        CKEDITOR.instances[id]?.setData(data, !!callback ? {callback: callback} : null);
    }

    public static setReadOnly(id: string, value: boolean): void {
        CKEDITOR.instances[id]?.setReadOnly(value);
    }

    public static focus(id: string) {
        CKEDITOR.instances[id].focus();
    }

    public focus() {
        this.editor.focus();
    }

    public setData(data: string) {
        this.editor.setData(data);
    }

    public insertData(data: string) {
        this.editor.insertHtml(data);
    }

    public fire(eventName: string) {
        this.editor.fire(eventName);
    }

    public destroy(noUpdate?: boolean) {
        this.editor.destroy(noUpdate);
    }

    public getRawData(): string {
        return HTMLAreaHelper.sanitize(this.editor.getSnapshot());
    }

    public getData(): string {
        return HTMLAreaHelper.sanitize(this.editor.getData());
    }

    public resetSelection() {
        this.editor.getSelection().reset();
    }

    public extractText(): string {
        return this.editor.element.getText().trim();
    }

    public getEditorId(): string {
        return this.editor.id;
    }

    public isReady(): boolean {
        return this.editor.status === 'ready';
    }

    public setKeystroke(keystroke: number, name: string, handler: () => void) {
        this.editor.addCommand(name, {
            exec: () => {
                handler();
                return true;
            }
        });

        this.editor.setKeystroke(keystroke, name);
    }

    public onReady(handler: () => void) {
        this.editor.on('instanceReady', handler);
    }

    public on(eventName: string, handler: () => void) {
        this.editor.on(eventName, handler);
    }

    public setSelectionByCursorPosition(cursorPosition: HtmlEditorCursorPosition) {
        let elementContainer: CKEDITOR.dom.element = this.editorParams.isInline() ?
                                                     this.editor.container :
                                                     this.editor.document.getBody();

        cursorPosition.selectionIndexes.forEach((index: number) => {
            elementContainer = elementContainer.getChild(index) as CKEDITOR.dom.element;
        });

        elementContainer.scrollIntoView();

        const selectedElement: CKEDITOR.dom.node = cursorPosition.indexOfSelectedElement > -1 ?
                                                   elementContainer.getChild(cursorPosition.indexOfSelectedElement) :
                                                   elementContainer;

        const range: CKEDITOR.dom.range = this.editor.createRange();
        range.setStart(selectedElement, cursorPosition.startOffset || 0);
        range.select();
    }
}

class HtmlEditorConfigBuilder {

    private editorParams: HtmlEditorParams;

    private disabledTools: string[] = [];
    private enabledTools: string[] = [];

    private tools: string[][] = [
        ['Styles', 'Bold', 'Italic', 'Underline'],
        ['JustifyBlock', 'JustifyLeft', 'JustifyCenter', 'JustifyRight'],
        ['BulletedList', 'NumberedList', 'Outdent', 'Indent'],
        ['FindAndReplace', 'SpecialChar', 'Anchor', 'Image', 'Macro', 'Link', 'Unlink'],
        ['Table'], ['PasteModeSwitcher']
    ];

    private constructor(htmlEditorParams: HtmlEditorParams) {
        this.editorParams = htmlEditorParams;

        this.processCustomToolConfig();
        this.adjustToolsList();
    }

    private getAllowedHeadings(): string[] {
        const allowedHeadings: string = this.editorParams.getAllowedHeadings();

        if (allowedHeadings) {
            return allowedHeadings.trim().replace(/  +/g, ' ').replace(/ /g, ';').split(';');
        }

        return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    }

    private processCustomToolConfig() {
        this.processDisabledTools();
        this.processEnabledTools();
    }

    private processDisabledTools() {
        this.disabledTools = this.editorParams.getDisabledTools() || [];

        if (this.disabledTools.length > 0) {
            this.disabledTools = this.disabledTools.map((tool: string) => tool.replace('Format', 'Styles'));

            if (this.isEverythingDisabled()) {
                this.tools = [['Bold', 'Italic', 'Underline']];
            }
        }
    }

    private isEverythingDisabled(): boolean {
        return this.disabledTools.length === 1 && this.disabledTools[0] === '*';
    }

    private processEnabledTools() {
        this.enabledTools = this.editorParams.getEnabledTools() || [];

        if (this.enabledTools.length > 0) {
            this.enabledTools = this.enabledTools
                .map((tool: string) => tool === 'Format' ? 'Styles' : tool.replace(/\|/g, '-'))
                .filter((tool: string) => !this.isDefaultTool(tool));
        }
    }

    private adjustToolsList() {
        if (this.editorParams.getEditableSourceCode()) {
            this.includeTool('Sourcedialog');
        }

        if (!this.editorParams.isInline()) {
            this.includeTool('Fullscreen');
        }

        const toolsToAdd: string[] = [];

        this.enabledTools.forEach((tool: string) => {
            if (tool === 'Strike' || tool === 'Superscript' || tool === 'Subscript') {
                this.tools[0].push(tool);
            } else {
                toolsToAdd.push(tool);
            }
        });

        this.tools.push(toolsToAdd);
    }

    public static createEditorConfig(htmlEditorParams: HtmlEditorParams): Q.Promise<CKEDITOR.config> {
        const configBuilder: HtmlEditorConfigBuilder = new HtmlEditorConfigBuilder(htmlEditorParams);

        return configBuilder.createConfig();
    }

    private createConfig(): Q.Promise<CKEDITOR.config> {
        this.initCustomStyleSet();
        const contentsCss = [this.editorParams.getAssetsUri() + '/styles/html-editor.css'];

        const config: CKEDITOR.config = {
            contentsCss: contentsCss,
            toolbar: this.tools,
            forcePasteAsPlainText: false,
            entities: false,
            title: '',
            keystrokes: [
                [CKEDITOR.CTRL + 76, null], // disabling default Link keystroke to remove it's wrong tooltip
            ],
            removePlugins: this.getPluginsToRemove(),
            removeButtons: this.disabledTools?.join(),
            extraPlugins: 'macro,image2,pasteModeSwitcher,nbsp,colordialog,findAndReplace,language',
            extraAllowedContent: this.getExtraAllowedContent(),
            stylesSet: `custom-${this.editorParams.getEditorContainerId()}`,
            image2_disableResizer: true,
            image2_captionedClass: 'captioned',
            image2_alignClasses: [StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS, StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS,
                StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS,
                StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS],
            disallowedContent: 'img[width,height]; table[*]{*}',
            uploadUrl: this.getUploadUrl(),
            sharedSpaces: this.editorParams.isInline() ? {top: this.editorParams.getFixedToolbarContainer()} : null,
            disableNativeSpellChecker: false,
            contentsLangDirection: this.editorParams.getLangDirection(),
            specialChars: (CKEDITOR.config.specialChars || []).concat(this.getExtraSpecialChars()),
            protectedSource: (CKEDITOR.config.protectedSource || []).concat(new Array(/&shy;/g)),
            language_list: [
                'ar:العربية:rtl',
                'az:Azərbaycan',
                'bg:Български',
                'ca:Català',
                'cs:Čeština',
                'cy:Cymraeg',
                'da:Dansk',
                'de:Deutsch',
                'el:Ελληνικά',
                'en:English',
                'eo:Esperanto',
                'es:Español',
                'et:Eesti',
                'eu:Euskara',
                'fa:فارسی:rtl',
                'fr:Français',
                'fo:Føroyskt',
                'gl:Galego',
                'he:עברית:rtl',
                'hr:Hrvatski',
                'id:Indonesia',
                'it:Italiano',
                'ja:日本語',
                'km:ខ្មែរ',
                'ko:한국어',
                'ku:Kurdî (kurmancî):rtl',
                'lt:Lietuvių',
                'lv:Latviešu',
                'hu:Magyar',
                'nb:Norsk bokmål',
                'nl:Nederlands',
                'no:Norsk',
                'oc:Occitan',
                'pl:Polski',
                'pt:Português',
                'ro:Română',
                'ru:Русский',
                'sk:Slovenčina',
                'sl:Slovenščina',
                'sq:Shqip',
                'sr:Српски',
                'fi:Suomi',
                'sv:Svenska',
                'tr:Türkçe',
                'tt:Татар',
                'ug:ئۇيغۇرچە:rtl',
                'uk:Українська',
                'vi:Tiếng việt',
                'zh:中文',
                'zh-cn:中文'
            ]
        };

        config['qtRows'] = 10; // Count of rows
        config['qtColumns'] = 10; // Count of columns
        config['qtWidth'] = '100%'; // table width

        const deferred = Q.defer<CKEDITOR.config>();

        if (!this.editorParams.isCustomStylesToBeUsed() || !this.editorParams.getContent()) {
            //inline mode
            return Q(config);
        }

        new StylesRequest(this.editorParams.getContent().getId()).sendAndParse().then(() => {
            config.contentsCss = contentsCss.concat(Styles.getCssPaths(this.editorParams.getContent().getId()));
            deferred.resolve(config);
        });

        return deferred.promise;
    }

    private initCustomStyleSet() {
        const customStyleSetID: string = `custom-${this.editorParams.getEditorContainerId()}`;

        if (CKEDITOR.stylesSet.get(customStyleSetID)) {
            return;
        }

        const customStyleSet = [];

        customStyleSet.push({name: i18n('text.htmlEditor.styles.p'), element: 'p'});

        this.getAllowedHeadings().forEach((heading: string) => {
            customStyleSet.push({name: i18n('text.htmlEditor.styles.heading', heading.charAt(1)), element: heading});
        });

        customStyleSet.push({name: i18n('text.htmlEditor.styles.div'), element: 'div'});
        customStyleSet.push({name: i18n('text.htmlEditor.styles.pre'), element: 'pre'});

        if (!this.isToolDisabled('Code')) {
            customStyleSet.push({name: i18n('text.htmlEditor.styles.code'), element: 'code'});
        }

        CKEDITOR.stylesSet.add(customStyleSetID, customStyleSet as unknown);
    }

    private getPluginsToRemove(): string {
        if (this.editorParams.isFullScreenMode()) {
            return 'resize,image,autogrow';
        }

        return 'resize,image';
    }

    private getExtraAllowedContent(): string {
        return 'strong em u code address dl dt dd blockquote span(!shy);*(*);td{*};*[data-*]';
    }

    private getExtraSpecialChars(): (string | [string, string])[] {
        return [
            ['&alpha;', 'alpha'],
            ['&beta;', 'beta'],
            ['&gamma;', 'gamma'],
            ['&delta;', 'delta'],
            ['&epsilon;', 'epsilon'],
            ['&zeta;', 'zeta'],
            ['&eta;', 'eta'],
            ['&theta;', 'theta'],
            ['&iota;', 'iota'],
            ['&kappa;', 'kappa'],
            ['&lambda;', 'lambda'],
            ['&mu;', 'mu'],
            ['&nu;', 'nu'],
            ['&xi;', 'xi'],
            ['&omicron;', 'omicron'],
            ['&pi;', 'pi'],
            ['&rho;', 'rho'],
            ['&sigma;', 'sigma'],
            ['&tau;', 'tau'],
            ['&upsilon;', 'upsilon'],
            ['&phi;', 'phi'],
            ['&chi;', 'chi'],
            ['&psi;', 'psi'],
            ['&omega;', 'omega'],
            [HtmlEditor.SPECIAL_CHAR_NBSP, i18n('text.htmlEditor.specialchars.nbsp')],
            [HtmlEditor.SPECIAL_CHAR_SHY, i18n('text.htmlEditor.specialchars.shy')]
        ];
    }

    private getUploadUrl(): string {
        return UrlHelper.getCmsRestUri(
            `${UrlHelper.getCMSPathForContentRoot(this.editorParams.getProject())}/${ContentResourceRequest.CONTENT_PATH}/createMedia`);
    }

    private includeTool(tool: string) {
        if (this.enabledTools.indexOf(tool) < 0) {
            this.enabledTools.push(tool);
        }
    }

    private isToolDisabled(tool: string): boolean {
        return this.isEverythingDisabled() || this.disabledTools.indexOf(tool) > -1;
    }

    private isDefaultTool(tool: string): boolean {
        return this.tools.some((toolgroup: string[]) => toolgroup.some((defaultTool: string) => defaultTool === tool));
    }
}

class GoogleDocPasteHandler {

    private result: string;

    constructor(value: string) {
        this.result = value;
    }

    static isPastedFromGoogleDoc(value: string): boolean {
        return !!value && value.indexOf('id="docs-internal-guid') > 0;
    }

    process(): string {
        return this.doProcess();
    }

    private doProcess(): string {
        this.processDataChrome();
        this.processDataFF();
        this.processLists();

        return this.result;
    }

    private processDataChrome() {
        const regex: RegExp = /(<a[^>]*?)(\sstyle="text-decoration:none;?")(.*?)(<u.*?>)(.*?)(<\/u>)(.*?<\/a>)/g;

        this.result = this.result.replace(regex, '$1$3$5$7');
    }

    private processDataFF() {
        const regex: RegExp =
            /(<a[^>]*?)(\sstyle="text-decoration:none;?")(.*?)(<span.*?text-decoration:underline.*?>)(.*?)(<\/span>)(.*?<\/a>)/g;

        this.result = this.result.replace(regex, this.ffReplaceFunction);
    }

    private ffReplaceFunction(match: string, p1: string, p2: string, p3: string, p4: string, p5: string, p6: string, p7: string) {
        const isItalic: boolean = p4.indexOf('font-style:italic') > 0;
        const fontWeight: RegExpMatchArray = /font-weight:(\d+);/.exec(p4);
        const isBold: boolean = !!fontWeight && +fontWeight[1] > 400;

        if (isItalic && isBold) {
            return `${p1}${p3}<strong><em>${p5}</em></strong>${p7}`;
        }

        if (isItalic) {
            return `${p1}${p3}<em>${p5}</em>${p7}`;
        }

        if (isBold) {
            return `${p1}${p3}<strong>${p5}</strong>${p7}`;
        }

        return `${p1}${p3}${p5}${p7}`;
    }

    private processLists() {
        // removing <p> from <li> entries
        const regex: RegExp = /(<li.*?)(<p.*?>)(.*?)(<\/p>)(.*?<\/li>)/g;
        this.result = this.result.replace(regex, '$1$3$5');
    }
}
