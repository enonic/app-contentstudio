import {HtmlEditorParams} from './HtmlEditorParams';
import {Styles} from './styles/Styles';
import {StyleHelper} from './styles/StyleHelper';
import {StylesRequest} from './styles/StylesRequest';
import {CreateHtmlAreaDialogEvent, HtmlAreaDialogType} from './CreateHtmlAreaDialogEvent';
import {ImageUrlBuilder, ImageUrlParameters} from '../../../util/ImageUrlResolver';
import {ContentsExistByPathRequest} from '../../../resource/ContentsExistByPathRequest';
import {ContentsExistByPathResult} from '../../../resource/ContentsExistByPathResult';
import eventInfo = CKEDITOR.eventInfo;
import widget = CKEDITOR.plugins.widget;
import NotificationMessage = api.notify.NotificationMessage;
import NotifyManager = api.notify.NotifyManager;
import StringHelper = api.util.StringHelper;
import i18n = api.util.i18n;
import BrowserHelper = api.BrowserHelper;
import ContentPath = api.content.ContentPath;

/**
 * NB: Using inline styles for editor's inline mode; Inline styles apply same alignment styles as alignment classes
 * in xp/styles.css, thus don't forget to update inline styles when styles.css modified
 */
export class HtmlEditor {

    private editorParams: HtmlEditorParams;

    private editor: CKEDITOR.editor;

    private hasActiveDialog: boolean = false;

    private constructor(config: CKEDITOR.config, htmlEditorParams: HtmlEditorParams) {
        this.editorParams = htmlEditorParams;

        this.createEditor(config);
        this.allowFigureHaveAnyClasses();
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

    private allowFigureHaveAnyClasses() {
        this.editor.on('widgetDefinition', (e: eventInfo) => {
            if (e.data.name === 'image') {
                e.data.allowedContent.figure.classes = ['*'];
                e.data.allowedContent.figure.styles = ['*'];
            }
        });
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

        this.editor.on('dataReady', (e: eventInfo) => {
            const rootElement: CKEDITOR.dom.element = this.editorParams.isInline() ? e.editor.container : e.editor.document.getBody();

            setTimeout(() => {
                rootElement.find('figure').toArray().forEach((figure: CKEDITOR.dom.element) => {
                    HtmlEditor.updateFigureInlineStyle(figure);
                    HtmlEditor.sortFigureClasses(figure);
                });
            }, 1);

        });

        this.handleFullScreenModeToggled();
        this.handleMouseEvents();
        this.handleEditorBlurEvent();
        this.handleElementSelection();
        this.handleImageAlignButtonPressed();
    }

    private toggleToolbarButtonState(name: string, isActive: boolean) {
        this.editor.getCommand(name).setState(isActive ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF);
    }

    private handleTooltipForClickableElements() {
        let tooltipElem: CKEDITOR.dom.element = null;
        const tooltipText = i18n('editor.dblclicktoedit');

        const mouseOverHandler = api.util.AppHelper.debounce((ev: eventInfo) => {
            const targetEl: CKEDITOR.dom.element = ev.data.getTarget();
            const isClickableElement: boolean = targetEl.is('a') || targetEl.is('img'); // imgs, links, anchors

            if (isClickableElement) {
                tooltipElem.setAttribute('title', tooltipText);
            } else {
                tooltipElem.removeAttribute('title');
            }

        }, 200);

        this.editor.on('instanceReady', () => {
            tooltipElem = this.editorParams.isInline() ? this.editor.container : this.editor.document.getBody().getParent();
            this.editor.editable().on('mouseover', mouseOverHandler);
        });
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
            (<any>editor.widgets.registered.uploadimage).onUploaded = function (upload: any) {
                const imageId: string = StringHelper.substringBetween(upload.url, 'image/', '?');
                const dataSrc: string = ImageUrlBuilder.RENDER.imagePrefix + imageId;

                this.replaceWith(`<figure class="captioned ${StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS}">` +
                                 `<img src="${upload.url}" data-src="${dataSrc}"` +
                                 `width="${this.parts.img.$.naturalWidth}" ` +
                                 `height="${this.parts.img.$.naturalHeight}">` +
                                 '<figcaption> </figcaption>' +
                                 '</figure>');
            };
        });
    }

    private handleUploadRequest() {
        this.editor.on('fileUploadRequest', (evt: eventInfo) => {
            const fileLoader = evt.data.fileLoader;

            this.fileExists(fileLoader.fileName).then((exists: boolean) => {
                if (exists) {
                    NotifyManager.get().showWarning(i18n('notify.fileExists', fileLoader.fileName));
                    (<any>evt.editor.document.findOne('.cke_widget_uploadimage')).remove(); // removing upload preview image
                } else {
                    this.uploadFile(fileLoader);
                }
            }).catch(api.DefaultErrorHandler.handle).done();

            // Prevented the default behavior.
            evt.stop();
        });
    }

    private fileExists(fileName: string): wemQ.Promise<boolean> {
        const contentPathAsString: string = new ContentPath([this.editorParams.getContent().getPath().toString(), fileName]).toString();

        return new ContentsExistByPathRequest([contentPathAsString]).sendAndParse().then((result: ContentsExistByPathResult) => {
            return result.getContentsExistMap()[contentPathAsString];
        });
    }

    private uploadFile(fileLoader: any) {
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

                const urlParams: ImageUrlParameters = {
                    id: mediaContent.id,
                    useOriginal: true
                };

                data.url = new ImageUrlBuilder(urlParams).buildForPreview();
            }
        });
    }

    private handleFullScreenModeToggled() {
        this.editor.on('maximize', (e: eventInfo) => {
            if (e.data === 2) { // fullscreen off
                api.ui.responsive.ResponsiveManager.fireResizeEvent();
            }
        });
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

        api.dom.Body.get().onMouseUp(() => {
            if (mousePressed) {
                mousePressed = false;
            }
        });
    }

    private handleEditorBlurEvent() {
        this.editor.on('blur', (e: eventInfo) => {

            if (this.hasActiveDialog) {
                e.stop();
                this.hasActiveDialog = false;
            }

            if (this.editorParams.hasBlurHandler()) {
                this.editorParams.getBlurHandler()(<any>e);
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
        const isImageWithLinkSelected = isImageSelected &&
                                        (<CKEDITOR.dom.element>selectedElement.findOne('figure').getFirst()).is('a');

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
        const selectionRange: any = this.editor.getSelection().getRanges()[0];

        return selectionRange.startContainer.equals(selectionRange.endContainer);
    }

    private doUpdateAlignmentButtonStates(figure: CKEDITOR.dom.element) {
        if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS)) {
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
                const imageWidget: widget = (<any>this.editor.widgets).getByElement(selectedElement);
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

        figure.removeAttribute('style');

        if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS)) { // Left Aligned
            figure.setStyles({
                'float': 'left',
                'margin-bottom': '0',
                'margin-top': '0',
                'width': hasCustomWidth ? customWidth : `${StyleHelper.STYLE.ALIGNMENT.LEFT.WIDTH}%`
            });
        } else if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS)) { // Right Aligned
            figure.setStyles({
                'float': 'right',
                'margin-bottom': '0',
                'margin-top': '0',
                'width': hasCustomWidth ? customWidth : `${StyleHelper.STYLE.ALIGNMENT.RIGHT.WIDTH}%`
            });
        } else if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS)) { // Center Aligned
            figure.setStyles({
                'margin': 'auto',
                'width': hasCustomWidth ? customWidth : `${StyleHelper.STYLE.ALIGNMENT.CENTER.WIDTH}%`
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
        const progressNotifications: Object = {};

        this.editor.on('notificationShow', function (evt: eventInfo) {
            const notification: any = evt.data.notification;

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
            // Do not show the default notification.
            evt.cancel();
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
                    progressNotifications[messageId] = api.notify.NotifyManager.get().showFeedback(message, false);
                }
                break;
            }

            // Do not show the default notification.
            evt.cancel();
        });
    }

    private setupDialogsToOpen() {
        this.editor.addCommand('openMacroDialog', {
            exec: (editor, data: any) => {
                this.notifyMacroDialog({editor: editor, macro: data});
                return true;
            }
        });

        CKEDITOR.plugins.addExternal('macro', this.editorParams.getAssetsUri() + '/lib/ckeditor/plugins/macro/', 'macro.js');

        this.editor.addCommand('openFullscreenDialog', {
            exec: (editor) => {
                const config: any = {
                    editor: editor,
                    editorParams: this.editorParams
                };

                this.notifyFullscreenDialog(config);
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
            switch (dialogShowEvent.data.getName()) {
            case 'anchor':
                this.notifyAnchorDialog(dialogShowEvent);
                break;
            case 'sourcedialog':
                this.notifyCodeDialog(dialogShowEvent);
                break;
            case 'specialchar':
                dialogShowEvent.data.hide();
                this.notifySpecialCharDialog(dialogShowEvent);
                break;
            case 'find':
                this.notifySearchReplaceDialog(dialogShowEvent);
                break;
            case 'link':
                this.notifyLinkDialog(dialogShowEvent);
                break;
            case 'image2':
                this.notifyImageDialog(dialogShowEvent);
                break;
            }
        });
    }

    private setupKeyboardShortcuts() {
        const commandDef: CKEDITOR.commandDefinition = {
            exec: function (/* editor: HTMLAreaEditor */) {
                // editor.applyStyle(new CKEDITOR.style(<any>{ element: this.name })); // name is command name
                return true;
            }
        };

        this.editor.addCommand('h1', commandDef);
        this.editor.addCommand('h2', commandDef);
        this.editor.addCommand('h3', commandDef);
        this.editor.addCommand('h4', commandDef);
        this.editor.addCommand('h5', commandDef);
        this.editor.addCommand('h6', commandDef);
        this.editor.addCommand('p', commandDef);
        this.editor.addCommand('div', commandDef);
        this.editor.addCommand('address', commandDef);

        this.editor.on('instanceReady', () => {
            this.editor.setKeystroke(9, 'indent'); // Indent on TAB
            this.editor.setKeystroke(CKEDITOR.SHIFT + 9, 'outdent'); // Outdent on SHIFT + TAB
            this.editor.setKeystroke(CKEDITOR.CTRL + 70, 'find'); // open find dialog on CTRL + F
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
        });

        this.editor.on('key', function (evt: eventInfo) { // stopping select all from propagating
            if (evt.data.keyCode === CKEDITOR.CTRL + 65) {
                if (evt.data.domEvent && evt.data.domEvent.stopPropagation) {
                    evt.data.domEvent.stopPropagation();
                }
            }
        });
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
            this.editor.removeMenuItem('table');
            this.editor.removeMenuItem('tablecell_properties');
            this.editor.removeMenuItem('paste');
        });
    }

    private notifyLinkDialog(config: any) {
        const event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
            HtmlAreaDialogType.LINK).setContent(this.editorParams.getContent()).build();
        this.publishCreateDialogEvent(event);
    }

    private notifyImageDialog(config: any) {
        const event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
            HtmlAreaDialogType.IMAGE).setContent(this.editorParams.getContent()).build();
        this.publishCreateDialogEvent(event);
    }

    private notifyAnchorDialog(config: any) {
        const event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
            HtmlAreaDialogType.ANCHOR).build();
        this.publishCreateDialogEvent(event);
    }

    private notifyMacroDialog(config: any) {
        const event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
            HtmlAreaDialogType.MACRO).setContentPath(this.editorParams.getContentPath()).setApplicationKeys(
            this.editorParams.getApplicationKeys()).setContent(
            this.editorParams.getContent()).setApplicationKeys(this.editorParams.getApplicationKeys()).build();
        this.publishCreateDialogEvent(event);
    }

    private notifySearchReplaceDialog(config: any) {
        const event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
            HtmlAreaDialogType.SEARCHREPLACE).build();
        this.publishCreateDialogEvent(event);
    }

    private notifyCodeDialog(config: any) {
        const event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
            HtmlAreaDialogType.CODE).build();
        this.publishCreateDialogEvent(event);
    }

    private notifySpecialCharDialog(config: any) {
        const event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
            HtmlAreaDialogType.SPECIALCHAR).build();
        this.publishCreateDialogEvent(event);
    }

    private notifyFullscreenDialog(config: any) {
        const event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
            HtmlAreaDialogType.FULLSCREEN).build();
        this.publishCreateDialogEvent(event);
    }

    private publishCreateDialogEvent(event: CreateHtmlAreaDialogEvent) {
        this.hasActiveDialog = true;

        if (this.editorParams.hasCreateDialogListener()) {
            this.editorParams.getCreateDialogListener()(event);
        }

        event.fire();
    }

    public static create(htmlEditorParams: HtmlEditorParams): wemQ.Promise<HtmlEditor> {
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
        return CKEDITOR.instances[id].getData();
    }

    public static setData(id: string, data: string) {
        CKEDITOR.instances[id].setData(data);
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

    public fire(eventName: string) {
        this.editor.fire(eventName);
    }

    public destroy(noUpdate?: boolean) {
        this.editor.destroy(noUpdate);
    }

    public getRawData(): string {
        return this.editor.getSnapshot();
    }

    public getData(): string {
        return this.editor.getData();
    }

    public resetSelection() {
        this.editor.getSelection().reset();
    }

    public extractText(): string {
        return this.editor.element.getText().trim();
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
}

class HtmlEditorConfigBuilder {

    private editorParams: HtmlEditorParams;

    private toolsToExlcude: string = '';
    private toolsToInclude: string[] = [];

    private tools: any[] = [
        ['Format', 'Bold', 'Italic', 'Underline'],
        ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'],
        ['BulletedList', 'NumberedList', 'Outdent', 'Indent'],
        ['SpecialChar', 'Anchor', 'Image', 'Macro', 'Link', 'Unlink'],
        ['Table']
    ];

    private constructor(htmlEditorParams: HtmlEditorParams) {
        this.editorParams = htmlEditorParams;

        this.processCustomToolConfig();
        this.adjustToolsList();
    }

    private processCustomToolConfig() {
        const tools = this.editorParams.getTools();

        if (!tools) {
            return;
        }

        if (tools['exclude'] && tools['exclude'] instanceof Array) {
            this.toolsToExlcude = tools['exclude'].map(tool => tool.value).join().replace(/\s+/g, ',');
            if (this.toolsToExlcude === '*') {
                this.tools = [];
            }
        }

        if (tools['include'] && tools['include'] instanceof Array) {
            this.includeTools(tools['include'].map(tool => tool.value).join().replace(/\|/g, '-').split(/\s+/));
        }
    }

    private adjustToolsList() {
        if (this.editorParams.getEditableSourceCode()) {
            this.includeTool('Sourcedialog');
        }

        if (!this.editorParams.isInline() && !this.editorParams.isFullScreenMode()) {
            this.includeTool('Fullscreen');
        }

        if (this.editorParams.isInline()) {
            this.tools[0].push('Strike', 'Superscript', 'Subscript');
        }

        this.tools.push(this.toolsToInclude);
    }

    public static createEditorConfig(htmlEditorParams: HtmlEditorParams): wemQ.Promise<CKEDITOR.config> {
        const configBuilder: HtmlEditorConfigBuilder = new HtmlEditorConfigBuilder(htmlEditorParams);

        return configBuilder.createConfig();
    }

    private createConfig(): wemQ.Promise<CKEDITOR.config> {

        const contentsCss = [this.editorParams.getAssetsUri() + '/styles/html-editor.css'];
        const injectCssIntoConfig = () => {
            if (Styles.getInstance()) {
                config.contentsCss = contentsCss.concat(Styles.getCssPaths());
            }
        };

        const config: CKEDITOR.config = {
            contentsCss: contentsCss,
            toolbar: this.tools,
            entities: false,
            title: '',
            keystrokes: [
                [CKEDITOR.CTRL + 76, null], // disabling default Link keystroke to remove it's wrong tooltip
            ],
            removePlugins: this.getPluginsToRemove(),
            removeButtons: this.toolsToExlcude,
            extraPlugins: 'macro,image2',
            extraAllowedContent: 'iframe code address dl dt dd script;img[data-src]',
            format_tags: 'p;h1;h2;h3;h4;h5;h6;pre;div',
            image2_disableResizer: true,
            image2_captionedClass: 'captioned',
            image2_alignClasses: [StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS, StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS,
                StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS,
                StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS],
            disallowedContent: 'img[width,height]',
            uploadUrl: api.util.UriHelper.getRestUri('content/createMedia'),
            sharedSpaces: this.editorParams.isInline() ? {top: this.editorParams.getFixedToolbarContainer()} : null
        };

        if (!this.isToolExcluded('Code')) {
            config.format_tags = config.format_tags + ';code';
            config['format_code'] = {element: 'code'};
        }

        config['qtRows'] = 10; // Count of rows
        config['qtColumns'] = 10; // Count of columns
        config['qtWidth'] = '100%'; // table width

        if (!this.editorParams.isCustomStylesToBeUsed()) { // inline mode
            return wemQ(config);
        }

        if (Styles.getInstance()) {
            injectCssIntoConfig();
            return wemQ(config);
        }

        const deferred = wemQ.defer<CKEDITOR.config>();

        new StylesRequest(this.editorParams.getContent().getId()).sendAndParse().then((response) => {
            injectCssIntoConfig();
            deferred.resolve(config);
        });

        return deferred.promise;
    }

    private getPluginsToRemove(): string {
        if (this.editorParams.isFullScreenMode()) {
            return 'resize,autogrow';
        }

        return 'resize';
    }

    private includeTools(tools: any[]) {
        tools.forEach((tool: any) => {
            this.includeTool(tool);
        });
    }

    private includeTool(tool: string) {
        this.toolsToInclude.push(tool);
    }

    private isToolExcluded(tool: string): boolean {
        if (!this.editorParams.getTools() || !this.editorParams.getTools()['exclude']) {
            return false;
        }
        return this.editorParams.getTools()['exclude'].indexOf(tool) > -1;
    }
}
