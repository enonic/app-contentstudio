import HTMLAreaEditor = CKEDITOR.editor;
import eventInfo = CKEDITOR.eventInfo;
import NotificationMessage = api.notify.NotificationMessage;
import NotifyManager = api.notify.NotifyManager;
import i18n = api.util.i18n;
import ApplicationKey = api.application.ApplicationKey;
import BrowserHelper = api.BrowserHelper;
import {CreateHtmlAreaDialogEvent, HtmlAreaDialogType} from './CreateHtmlAreaDialogEvent';
import {HTMLAreaHelper} from './HTMLAreaHelper';
import {StylesRequest} from './styles/StylesRequest';
import {Styles} from './styles/Styles';
import {GetContentByPathRequest} from '../../../resource/GetContentByPathRequest';

/**
 * NB: Modifications were made in ckeditor.js (VERY SORRY FOR THAT):
 * LINE 126: getFrameDocument() function updated to fix issue #542 in MS EDGE
 * LINE 1253: cke_widget_drag_handler_container initial styling updated to have display:none;
 *
 * Update those in case ckeditor lib is updated
 */
export class HTMLAreaBuilder {

    private content: api.content.ContentSummary; // used for image dialog
    private contentPath: api.content.ContentPath; // used for macro dialog
    private applicationKeys: ApplicationKey[]; // used for macro dialog

    private assetsUri: string;
    private editorContainerId: string;
    private focusHandler: (e: FocusEvent) => void;
    private blurHandler: (e: FocusEvent) => void;
    private mouseLeaveHandler: (e: MouseEvent, mousePressed?: boolean) => void;
    private keydownHandler: (e: eventInfo) => void;
    private nodeChangeHandler: (e: any) => void;
    private createDialogListeners: { (event: CreateHtmlAreaDialogEvent): void }[] = [];
    private inline: boolean = false;
    private isFullscreenMode: boolean = false;
    private fixedToolbarContainer: string;
    private hasActiveDialog: boolean = false;
    private customToolConfig: any;
    private editableSourceCode: boolean;
    private toolsToExlcude: string = '';
    private toolsToInclude: string[] = [];

    private tools: any[] = [
        ['Format', 'Bold', 'Italic', 'Underline'],
        ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'],
        ['BulletedList', 'NumberedList', 'Outdent', 'Indent'],
        ['SpecialChar', 'Anchor', 'Image', 'Macro', 'Link', 'Unlink'],
        ['Table']
    ];

    setEditableSourceCode(value: boolean): HTMLAreaBuilder {
        this.editableSourceCode = value;
        return this;
    }

    setAssetsUri(assetsUri: string): HTMLAreaBuilder {
        this.assetsUri = assetsUri;
        return this;
    }

    setEditorContainerId(id: string): HTMLAreaBuilder {
        this.editorContainerId = id;
        return this;
    }

    setFullscreenMode(value: boolean): HTMLAreaBuilder {
        this.isFullscreenMode = value;
        return this;
    }

    onCreateDialog(listener: (event: CreateHtmlAreaDialogEvent) => void) {
        this.createDialogListeners.push(listener);
        return this;
    }

    unCreateDialog(listener: (event: CreateHtmlAreaDialogEvent) => void) {
        this.createDialogListeners = this.createDialogListeners.filter((curr) => {
            return curr !== listener;
        });
        return this;
    }

    private notifyCreateDialog(event: CreateHtmlAreaDialogEvent) {
        this.createDialogListeners.forEach((listener) => {
            listener(event);
        });
    }

    setFocusHandler(focusHandler: (e: FocusEvent) => void): HTMLAreaBuilder {
        this.focusHandler = focusHandler;
        return this;
    }

    setBlurHandler(blurHandler: (e: FocusEvent) => void): HTMLAreaBuilder {
        this.blurHandler = blurHandler;
        return this;
    }

    setMouseLeaveHandler(mouseLeaveHandler: (e: MouseEvent, mousePressed?: boolean) => void): HTMLAreaBuilder {
        this.mouseLeaveHandler = mouseLeaveHandler;
        return this;
    }

    setKeydownHandler(keydownHandler: (e: eventInfo) => void): HTMLAreaBuilder {
        this.keydownHandler = keydownHandler;
        return this;
    }

    setNodeChangeHandler(nodeChangeHandler: (e: any) => void): HTMLAreaBuilder {
        this.nodeChangeHandler = api.util.AppHelper.debounce((e) => {
            nodeChangeHandler(e);
        }, 200);

        return this;
    }

    setInline(inline: boolean): HTMLAreaBuilder {
        this.inline = inline;
        return this;
    }

    setFixedToolbarContainer(fixedToolbarContainer: string): HTMLAreaBuilder {
        this.fixedToolbarContainer = fixedToolbarContainer;
        return this;
    }

    setContent(content: api.content.ContentSummary): HTMLAreaBuilder {
        this.content = content;
        return this;
    }

    setContentPath(contentPath: api.content.ContentPath): HTMLAreaBuilder {
        this.contentPath = contentPath;
        return this;
    }

    setApplicationKeys(applicationKeys: ApplicationKey[]): HTMLAreaBuilder {
        this.applicationKeys = applicationKeys;
        return this;
    }

    private includeTools(tools: any[]) {
        tools.forEach((tool: any) => {
            this.includeTool(tool);
        });
    }

    private includeTool(tool: string) {
        this.toolsToInclude.push(tool);
    }

    setTools(tools: any): HTMLAreaBuilder {
        this.customToolConfig = tools;

        if (tools['exclude'] && tools['exclude'] instanceof Array) {
            this.toolsToExlcude = tools['exclude'].map(tool => tool.value).join().replace(/\s+/g, ',');
            if (this.toolsToExlcude === '*') {
                this.tools = [];
            }
        }

        if (tools['include'] && tools['include'] instanceof Array) {
            this.includeTools(tools['include'].map(tool => tool.value).join().replace(/\|/g, '-').split(/\s+/));
        }

        return this;
    }

    private checkRequiredFieldsAreSet() {
        if (!this.assetsUri || !this.editorContainerId || !this.content) {
            throw new Error('some required fields are missing for CKEditor');
        }
    }

    public createEditor(contentId?: string): wemQ.Promise<HTMLAreaEditor> {
        this.checkRequiredFieldsAreSet();
        this.adjustToolsList();

        return this.createConfig(contentId).then((config: CKEDITOR.config) => {

            const ckeditor: HTMLAreaEditor = this.inline ?
                         CKEDITOR.inline(this.editorContainerId, config) :
                         CKEDITOR.replace(this.editorContainerId, config);

            this.listenCKEditorEvents(ckeditor);
            this.handleFileUpload(ckeditor);
            this.handleNativeNotifications(ckeditor);
            this.handleTooltipForClickableElements(ckeditor);
            this.setupDialogsToOpen(ckeditor);
            this.setupKeyboardShortcuts(ckeditor);
            this.addCustomLangEntries(ckeditor);
            this.removeUnwantedMenuItems(ckeditor);

            return ckeditor;
        });
    }

    private adjustToolsList() {
        if (this.editableSourceCode) {
            this.includeTool('Sourcedialog');
        }

        if (!this.inline && !this.isFullscreenMode) {
            this.includeTool('Fullscreen');
        }

        this.tools.push(this.toolsToInclude);
    }

    private createConfig(contentId?: string): wemQ.Promise<CKEDITOR.config> {

        const contentsCss = [this.assetsUri + '/styles/html-editor.css'];
        const injectCss = () => {
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
            removePlugins: 'resize',
            removeButtons: this.toolsToExlcude,
            extraPlugins: this.getExtraPlugins(),
            extraAllowedContent: 'iframe code address dl dt dd script;img[data-src]',
            format_tags: 'p;h1;h2;h3;h4;h5;h6;pre;div',
            image2_disableResizer: true,
            image2_captionedClass: '',
            disallowedContent: 'img[width,height]',
            uploadUrl: api.util.UriHelper.getRestUri('content/createMedia'),
            sharedSpaces: this.inline ? {top: this.fixedToolbarContainer} : null
        };

        if (!this.isToolExcluded('Code')) {
            config.format_tags = config.format_tags + ';code';
            config['format_code'] = {element: 'code'};
        }

        config['qtRows'] = 10; // Count of rows
        config['qtColumns'] = 10; // Count of columns
        config['qtWidth'] = '100%'; // table width

        if (!contentId) { // inline mode
            return wemQ(config);
        }

        if (Styles.getInstance()) {
            injectCss();
            return wemQ(config);
        }

        const deferred = wemQ.defer<CKEDITOR.config>();

        new StylesRequest(contentId).sendAndParse().then(() => {
            injectCss();
            deferred.resolve(config);
        });

        return deferred.promise;
    }

    private getExtraPlugins(): string {
        if (this.inline) {
            return 'macro,autogrow,sourcedialog,image2,sharedspace,quicktable';
        }

        if (this.isFullscreenMode) {
            return 'macro,sourcedialog,image2,quicktable';
        }

        return 'macro,autogrow,sourcedialog,image2,quicktable';
    }

    private listenCKEditorEvents(ckeditor: HTMLAreaEditor) {
        if (this.nodeChangeHandler) {
            ckeditor.on('change', this.nodeChangeHandler.bind(this));
        }

        if (this.focusHandler) {
            ckeditor.on('focus', this.focusHandler.bind(this));
        }

        if (this.keydownHandler) {
            ckeditor.on('key', this.keydownHandler.bind(this));
        }

        ckeditor.on('maximize', (e: eventInfo) => {
            if (e.data === 2) { // fullscreen off
                api.ui.responsive.ResponsiveManager.fireResizeEvent();
            }
        });

        const editorEl = document.getElementById(this.editorContainerId);
        let mousePressed: boolean = false;

        editorEl.addEventListener('mousedown', () => mousePressed = true);
        editorEl.addEventListener('mouseup', () => mousePressed = false);
        editorEl.addEventListener('mouseleave', (e: MouseEvent) => {
            if (this.mouseLeaveHandler) {
                this.mouseLeaveHandler(e, mousePressed);
            }
        });
        api.dom.Body.get().onMouseUp(() => {
            if (mousePressed) {
                mousePressed = false;
            }
        });

        ckeditor.on('blur', (e: eventInfo) => {

            if (this.hasActiveDialog) {
                e.stop();
                this.hasActiveDialog = false;
            }
            if (this.blurHandler) {
                this.blurHandler(<any>e);
            }
        });

        ckeditor.on('selectionChange', (e: eventInfo) => {
            const selectedElement: CKEDITOR.dom.element = e.data.path.lastElement;
            const isAnchorSelected: boolean = selectedElement.hasClass('cke_anchor');
            const isImageSelected: boolean = selectedElement.hasClass('cke_widget_image');
            const isLinkSelected: boolean = (selectedElement.is('a') && selectedElement.hasAttribute('href'));
            const isImageWithLinkSelected = isImageSelected &&
                                            (<CKEDITOR.dom.element>selectedElement.findOne('figure').getFirst()).is('a');

            this.toogleToolbarButtonState(ckeditor, 'link', isLinkSelected || isImageWithLinkSelected);
            this.toogleToolbarButtonState(ckeditor, 'anchor', isAnchorSelected);
            this.toogleToolbarButtonState(ckeditor, 'image', isImageSelected);
        });
    }

    private toogleToolbarButtonState(ckeditor: HTMLAreaEditor, name: string, isActive: boolean) {
        ckeditor.getCommand(name).setState(isActive ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF);
    }

    private handleTooltipForClickableElements(ckeditor: HTMLAreaEditor) {
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

        ckeditor.on('instanceReady', () => {
            tooltipElem = this.inline ? ckeditor.container : ckeditor.document.getBody().getParent();
            ckeditor.editable().on('mouseover', mouseOverHandler);
        });
    }

    private handleFileUpload(ckeditor: HTMLAreaEditor) {
        ckeditor.on('fileUploadRequest', (evt: eventInfo) => {
            const fileLoader = evt.data.fileLoader;

            this.fileExists(fileLoader.fileName).then((exists: boolean) => {
                if (exists) {
                    NotifyManager.get().showWarning(i18n('notify.fileExists', fileLoader.fileName));
                    (<any>evt.editor.document.findOne('.cke_widget_uploadimage')).remove(); // removing upload preview image
                } else {
                    this.uploadFile(fileLoader);
                }
            }).catch((reason: any) => {
                api.DefaultErrorHandler.handle(reason);
            }).done();

            // Prevented the default behavior.
            evt.stop();
        });

        // parse image upload response so cke understands it
        ckeditor.on('fileUploadResponse', (evt: eventInfo) => {
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
                const url: string = HTMLAreaHelper.getImagePreviewUrl(mediaContent.id);
                data.url = url;
            }
        });
    }

    private fileExists(fileName: string): wemQ.Promise<boolean> {
        return new GetContentByPathRequest(
            new api.content.ContentPath([this.content.getPath().toString(), fileName])).sendAndParse().then(() => {
            return true;
        }).catch((reason: any) => {
            if (reason.statusCode === 404) { // good, no file with such name
                return false;
            }

            throw new Error(reason);
        });
    }

    private uploadFile(fileLoader: any) {
        const formData = new FormData();
        const xhr = fileLoader.xhr;
        xhr.open('POST', fileLoader.uploadUrl, true);
        formData.append('file', fileLoader.file, fileLoader.fileName);
        formData.set('parent', this.content.getPath().toString());
        formData.set('name', fileLoader.fileName);
        fileLoader.xhr.send(formData);
    }

    private handleNativeNotifications(ckeditor: HTMLAreaEditor) {
        const progressNotifications: Object = {};

        ckeditor.on('notificationShow', function (evt: eventInfo) {
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

        ckeditor.on('notificationUpdate', function (evt: eventInfo) {
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

    private setupDialogsToOpen(ckeditor: HTMLAreaEditor) {
        ckeditor.addCommand('openMacroDialog', {
            exec: (editor, data: any) => {
                this.notifyMacroDialog({editor: editor, macro: data});
                return true;
            }
        });

        CKEDITOR.plugins.addExternal('macro', this.assetsUri + '/lib/ckeditor/plugins/macro/', 'macro.js');

        ckeditor.addCommand('openFullscreenDialog', {
            exec: (editor) => {
                const config: any = {editor: editor};
                config.assetsUri = this.assetsUri;
                config.content = this.content;
                config.createDialogListeners = this.createDialogListeners;
                config.editableSourceCode = this.editableSourceCode;
                config.keydownHandler = this.keydownHandler;
                config.contentPath = this.contentPath;
                config.applicationKeys = this.applicationKeys;
                config.customToolConfig = this.customToolConfig;

                this.notifyFullscreenDialog(config);
                return true;
            }
        });

        ckeditor.ui.addButton('Fullscreen', {
            label: 'Fullscreen',
            command: 'openFullscreenDialog',
            toolbar: 'tools,10',
            icon: 'maximize'
        });

        ckeditor.on('dialogShow', (dialogShowEvent: eventInfo) => {
            switch (dialogShowEvent.data.getName()) {
            case 'anchor':
                this.notifyAnchorDialog(dialogShowEvent);
                break;
            case 'sourcedialog':
                this.notifyCodeDialog(dialogShowEvent);
                break;
            case 'specialchar':
                dialogShowEvent.data.hide();
                this.notifySpecialCharDialog(dialogShowEvent.editor);
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

    private setupKeyboardShortcuts(ckeditor: HTMLAreaEditor) {
        const commandDef: CKEDITOR.commandDefinition = {
            exec: function (/* editor: HTMLAreaEditor */) {
                // editor.applyStyle(new CKEDITOR.style(<any>{ element: this.name })); // name is command name
                return true;
            }
        };

        ckeditor.addCommand('h1', commandDef);
        ckeditor.addCommand('h2', commandDef);
        ckeditor.addCommand('h3', commandDef);
        ckeditor.addCommand('h4', commandDef);
        ckeditor.addCommand('h5', commandDef);
        ckeditor.addCommand('h6', commandDef);
        ckeditor.addCommand('p', commandDef);
        ckeditor.addCommand('div', commandDef);
        ckeditor.addCommand('address', commandDef);

        ckeditor.on('instanceReady', () => {
            ckeditor.setKeystroke(9, 'indent'); // Indent on TAB
            ckeditor.setKeystroke(CKEDITOR.SHIFT + 9, 'outdent'); // Outdent on SHIFT + TAB
            ckeditor.setKeystroke(CKEDITOR.CTRL + 70, 'find'); // open find dialog on CTRL + F
            ckeditor.setKeystroke(CKEDITOR.CTRL + 75, 'link'); // open link dialog on CTRL + K
            ckeditor.setKeystroke(CKEDITOR.CTRL + 76, 'image'); // open link dialog on CTRL + L
            ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 49, 'h1'); // apply Heading 1 format
            ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 50, 'h2'); // apply Heading 2 format
            ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 51, 'h3'); // apply Heading 3 format
            ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 52, 'h4'); // apply Heading 4 format
            ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 53, 'h5'); // apply Heading 5 format
            ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 54, 'h6'); // apply Heading 6 format
            ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 55, 'p'); // apply the 'Normal' format
            ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 56, 'div'); // apply the 'Normal (DIV)' format
            ckeditor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 57, 'address'); // apply the 'Address' format
        });

        ckeditor.on('key', function (evt: eventInfo) { // stopping select all from propagating
            if (evt.data.keyCode === CKEDITOR.CTRL + 65) {
                if (evt.data.domEvent && evt.data.domEvent.stopPropagation) {
                    evt.data.domEvent.stopPropagation();
                }
            }
        });
    }

    private addCustomLangEntries(ckeditor: HTMLAreaEditor) {
        ckeditor.on('langLoaded', (evt: eventInfo) => {
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

    private removeUnwantedMenuItems(ckeditor: HTMLAreaEditor) {
        ckeditor.on('instanceReady', () => {
            ckeditor.removeMenuItem('table');
            ckeditor.removeMenuItem('tablecell_properties');
            ckeditor.removeMenuItem('paste');
        });
    }

    private notifyLinkDialog(config: any) {
        const event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
            HtmlAreaDialogType.LINK).setContent(this.content).build();
        this.publishCreateDialogEvent(event);
    }

    private notifyImageDialog(config: any) {
        const event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
            HtmlAreaDialogType.IMAGE).setContent(this.content).build();
        this.publishCreateDialogEvent(event);
    }

    private notifyAnchorDialog(config: any) {
        const event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
            HtmlAreaDialogType.ANCHOR).build();
        this.publishCreateDialogEvent(event);
    }

    private notifyMacroDialog(config: any) {
        const event = CreateHtmlAreaDialogEvent.create().setConfig(config).setType(
            HtmlAreaDialogType.MACRO).setContentPath(this.contentPath).setApplicationKeys(
            this.applicationKeys).setContent(
            this.content).setApplicationKeys(this.applicationKeys).build();
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
        this.notifyCreateDialog(event);
        event.fire();
    }

    private isToolExcluded(tool: string): boolean {
        if (!this.customToolConfig || !this.customToolConfig['exclude']) {
            return false;
        }
        return this.customToolConfig['exclude'].indexOf(tool) > -1;
    }
}
