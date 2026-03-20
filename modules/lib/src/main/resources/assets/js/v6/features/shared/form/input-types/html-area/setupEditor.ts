/*global CKEDITOR*/

import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ContentPath} from '../../../../../../app/content/ContentPath';
import type {ContentSummary} from '../../../../../../app/content/ContentSummary';
import {ContentsExistByPathRequest} from '../../../../../../app/resource/ContentsExistByPathRequest';
import type {ContentsExistByPathResult} from '../../../../../../app/resource/ContentsExistByPathResult';
import {CreateHtmlAreaDialogEventGenerator} from '../../../../../../app/inputtype/ui/text/CreateHtmlAreaDialogEventGenerator';
import {bindEditableBodyRuntimeState} from '../../../../../../app/inputtype/ui/text/EditableBodyRuntimeState';
import {HTMLAreaHelper} from '../../../../../../app/inputtype/ui/text/HTMLAreaHelper';
import {HtmlEditorParams} from '../../../../../../app/inputtype/ui/text/HtmlEditorParams';
import {StyleHelper} from '../../../../../../app/inputtype/ui/text/styles/StyleHelper';
import {ImageUrlResolver} from '../../../../../../app/util/ImageUrlResolver';
import {type CreateHtmlAreaDialogEvent, type HtmlAreaDialogType} from '../../../../../../app/inputtype/ui/text/CreateHtmlAreaDialogEvent';
import {HTMLAreaProxy} from '../../../../../../app/inputtype/ui/text/dialog/HTMLAreaProxy';
import type {Project} from '../../../../../../app/settings/data/project/Project';
import type {CodeDialogParams, FullScreenDialogParams, HtmlEditorCursorPosition} from '../../../../../../app/inputtype/ui/text/HtmlEditorTypes';

type EventInfo = CKEDITOR.eventInfo;

type AllowedContentRule = {
    classes?: string[];
    styles?: string[];
};

type ImageWidgetData = {
    name: 'image';
    allowedContent?: {
        figure?: AllowedContentRule;
        img?: AllowedContentRule;
    };
    upcast: (el: CKEDITOR.htmlParser.element, data: Record<string, unknown>) => CKEDITOR.htmlParser.element;
    downcast: (el: CKEDITOR.htmlParser.element) => CKEDITOR.htmlParser.element;
};

function isImageWidgetData(data: Record<string, unknown>): data is ImageWidgetData {
    return data.name === 'image';
}

export type DialogOverrides = Partial<Record<HtmlAreaDialogType, (event: CreateHtmlAreaDialogEvent) => void>>;

export type SetupEditorParams = {
    contentSummary: ContentSummary | undefined;
    project: Readonly<Project> | undefined;
    applicationKeys: ApplicationKey[];
    assetsUri: string;
    dialogOverrides?: DialogOverrides;
};

function createDialogHandler(overrides?: DialogOverrides): (event: CreateHtmlAreaDialogEvent) => void {
    return (event: CreateHtmlAreaDialogEvent) => {
        const handler = overrides?.[event.getType()];
        if (handler) {
            handler(event);
            return;
        }
        HTMLAreaProxy.openDialog(event);
    };
}

function buildEditorParams(editor: CKEDITOR.editor, params: SetupEditorParams): HtmlEditorParams {
    return HtmlEditorParams.create()
        .setEditorContainerId(editor.name)
        .setAssetsUri(params.assetsUri)
        .setInline(false)
        .setCreateDialogHandler(createDialogHandler(params.dialogOverrides))
        .setContent(params.contentSummary)
        .setApplicationKeys(params.applicationKeys)
        .setProject(params.project)
        .build();
}

/**
 * Modifies the image2 widget definition to support custom alignment classes and styles.
 * Must be called via the `widgetDefinition` event (before content loads) so that upcast/downcast
 * modifications are in place when initial content is processed.
 */
function modifyImageWidgetDefinition(e: CKEDITOR.eventInfo): void {
    const data: Record<string, unknown> = e.data;

    if (!isImageWidgetData(data)) {
        return;
    }

    // Allow figure to have any classes and styles.
    if (data.allowedContent?.figure) {
        data.allowedContent.figure.classes = ['*'];
        data.allowedContent.figure.styles = ['*'];
    }
    if (data.allowedContent?.img) {
        data.allowedContent.img.styles = ['*'];
    }

    // Modify upcast function
    const originalUpcast = data.upcast;
    data.upcast = function (el: CKEDITOR.htmlParser.element, upcastData: Record<string, unknown>) {
        const result = originalUpcast.call(this, el, upcastData);

        if (el.name === 'figure') {
            if (el.hasClass(StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS)) {
                upcastData.align = 'center';
            } else if (el.hasClass(StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS)) {
                upcastData.align = 'left';
            } else if (el.hasClass(StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS)) {
                upcastData.align = 'right';
            }
        }

        if (result && result.name === 'img') {
            return null;
        }

        if (result && result.name === 'a' && result['parent'].name !== 'figure') {
            return null;
        }

        if (!result && el.name === 'figure') {
            const img = el.getFirst('img') ??
                (el.getFirst('a') as CKEDITOR.htmlParser.element | null)?.getFirst('img') ?? null;
            if (img) {
                return el;
            }
        }

        return result;
    };

    // Modify downcast function
    const originalDowncast = data.downcast;
    data.downcast = function (el: CKEDITOR.htmlParser.element) {
        if (el.name === 'figure' && (
            el.hasClass(StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS) ||
            el.hasClass(StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS) ||
            el.hasClass(StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS))) {
            return el;
        }

        return originalDowncast.call(this, el);
    };
}

/**
 * Returns CKEditor config `on` handlers that must run before content is loaded.
 * Attach these to the config object so they fire during plugin initialization.
 */
export function getEarlyEditorEventHandlers(): Record<string, (e: CKEDITOR.eventInfo) => void> {
    return {
        widgetDefinition: modifyImageWidgetDefinition,
    };
}

function setupDialogsToOpen(editor: CKEDITOR.editor, editorParams: HtmlEditorParams): void {
    const dialogEventGenerator = new CreateHtmlAreaDialogEventGenerator(editorParams);

    editor.addCommand('anchor', {
        exec: (ed: CKEDITOR.editor) => {
            const selection = ed.getSelection();
            const bookmarks = selection ? selection.createBookmarks2(true) : undefined;

            dialogEventGenerator.generateAnchorEventAndFire({editor: ed, bookmarks});

            return true;
        },
    });

    editor.on('doubleclick', (event: EventInfo) => {
        if (event.data.dialog !== 'anchor') {
            return;
        }

        event.data.dialog = null;
        editor.execCommand('anchor');
    }, null, null, 30);

    editor.addCommand('openMacroDialog', {
        exec: (ed, data) => {
            dialogEventGenerator.generateMacroEventAndFire({editor: ed, macro: data});
            return true;
        },
    });

    editor.addCommand('openFullscreenDialog', {
        exec: (ed: CKEDITOR.editor) => {
            const config: FullScreenDialogParams = {
                editor: ed,
                editorParams,
                cursorPosition: getCursorPosition(ed),
            };

            dialogEventGenerator.generateFullScreenEventAndFire(config);
            return true;
        },
    });

    editor.addCommand('sourcedialog', {
        exec: (ed: CKEDITOR.editor) => {
            const config: CodeDialogParams = {
                editor: ed,
                initialValue: ed.getData(),
            };

            dialogEventGenerator.generateCodeEventAndFire(config);
            return true;
        },
    });

    editor.addCommand('specialchar', {
        exec: (ed: CKEDITOR.editor) => {
            dialogEventGenerator.generateSpecialCharEventAndFire({editor: ed});
            return true;
        },
    });

    editor.ui.addButton('Fullscreen', {
        label: 'Fullscreen',
        command: 'openFullscreenDialog',
        toolbar: 'tools,10',
        icon: 'maximize',
    });

    editor.on('dialogShow', (dialogShowEvent: EventInfo) => {
        dialogEventGenerator.generateFromEventInfoAndFire(dialogShowEvent);
    });
}

function getCursorPosition(editor: CKEDITOR.editor): HtmlEditorCursorPosition {
    const selection = editor.getSelection();
    const range = selection.getRanges()[0];

    if (!range) return null;

    const isCursorSetOnText = range.startContainer?.$.nodeName === '#text';

    return {
        selectionIndexes: editor.elementPath().elements.map((e) => e.getIndex()).reverse().slice(1),
        indexOfSelectedElement: isCursorSetOnText ? range.startContainer.getIndex() : -1,
        startOffset: isCursorSetOnText ? range.startOffset : null,
    };
}

function setupKeyboardShortcuts(editor: CKEDITOR.editor): void {
    const commandDef: CKEDITOR.commandDefinition = {
        exec: function () {
            const style = new CKEDITOR.style({element: this['name']}, null);

            if (style.checkActive(editor.elementPath(), editor)) {
                editor.removeStyle(style);
            } else {
                editor.applyStyle(style);
            }

            return true;
        },
    };

    const allowedTags = editor.config.format_tags?.split(';') ?? [];
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div']
        .filter((tag) => allowedTags.includes(tag))
        .forEach((tag) => editor.addCommand(tag, commandDef));

    editor.addCommand('address', commandDef);

    editor.setKeystroke(CKEDITOR.CTRL + 70, 'toggleFind');
    editor.setKeystroke(CKEDITOR.CTRL + 82, 'toggleFindAndReplace');
    editor.setKeystroke(CKEDITOR.CTRL + 75, 'link');
    editor.setKeystroke(CKEDITOR.CTRL + 76, 'image');
    editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 49, 'h1');
    editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 50, 'h2');
    editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 51, 'h3');
    editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 52, 'h4');
    editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 53, 'h5');
    editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.ALT + 54, 'h6');
    editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 55, 'p');
    editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 56, 'div');
    editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 57, 'address');
    editor.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 32, 'insertNbsp');

    editor.on('key', (evt: EventInfo) => {
        if (evt.data.keyCode === CKEDITOR.CTRL + 65) {
            if (evt.data.domEvent?.stopPropagation) {
                evt.data.domEvent.stopPropagation();
            }
        } else if (evt.data.keyCode === 32) {
            handleSpacePressed(editor);
        }
    });
}

function handleSpacePressed(editor: CKEDITOR.editor): void {
    const range = editor.getSelection().getRanges()[0];
    const startNode = range.startContainer;
    const endNode = range.endContainer;
    const isAfterOrBeforeLink = startNode.getParent()?.is('a') || range.getNextNode()?.is?.('a');

    if (isAfterOrBeforeLink && startNode.$ === endNode.$ && range.startOffset === range.endOffset &&
        (range.startOffset === startNode.getText().length ||
         range.startOffset === 1 || range.startOffset === 2)) {
        const prevChar = startNode.getText()[range.startOffset - 1];
        const nextChar = range.getNextNode()?.getText()[0];

        if (ObjectHelper.bothDefined(prevChar, nextChar) && !StringHelper.isBlank(prevChar) && !StringHelper.isBlank(nextChar)) {
            setTimeout(() => {
                const selection = editor.getSelection();
                const newRange = selection.getRanges()[0];

                if (!newRange) {
                    return;
                }

                const elem = newRange.startContainer?.$;
                const isSpaceReplacedWithNbsp = elem?.textContent.search(/\xA0/) > -1;

                if (isSpaceReplacedWithNbsp) {
                    elem.textContent = elem.textContent.replace(/\xA0/g, ' ');
                    newRange.select();
                }
            }, 1);
        }
    }
}

function handleFileUpload(editor: CKEDITOR.editor, contentSummary: ContentSummary | undefined, project: Readonly<Project> | undefined): void {
    // Wrapping dropped image into figure element — called after editor is ready,
    // so modify uploadimage widget directly (no instanceReady wrapper needed).
    if (editor.widgets?.registered?.uploadimage) {
        editor.widgets.registered.uploadimage['onUploaded'] = function (upload) {
            const imageId = StringHelper.substringBetween(upload.url, 'image/', '?');
            const dataSrc = ImageUrlResolver.URL_PREFIX_RENDER + imageId;

            this['replaceWith'](`<figure class="captioned ${StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS}">` +
                `<img src="${upload.url}" data-src="${dataSrc}" style="width:100%">` +
                '<figcaption> </figcaption>' +
                '</figure>');

            editor.fire('change');
        };
    }

    // Validate file doesn't already exist before upload
    editor.on('fileUploadRequest', (evt: EventInfo) => {
        const fileLoader = evt.data.fileLoader;

        if (!contentSummary) return;

        const contentPathAsString =
            ContentPath.create().setElements([contentSummary.getPath().toString(), fileLoader.fileName]).build().toString();

        new ContentsExistByPathRequest([contentPathAsString]).sendAndParse().then((result: ContentsExistByPathResult) => {
            const exists = result.getContentsExistMap()[contentPathAsString];

            if (exists) {
                NotifyManager.get().showWarning(i18n('notify.fileExists', fileLoader.fileName));
                evt.editor.document.findOne('.cke_widget_uploadimage')?.remove();
            } else {
                const formData = new FormData();
                const xhr = fileLoader.xhr;

                xhr.open('POST', fileLoader.uploadUrl, true);
                formData.append('file', fileLoader.file, fileLoader.fileName);
                formData.append('parent', contentSummary.getPath().toString());
                formData.append('name', fileLoader.fileName);

                fileLoader.xhr.send(formData);
            }
        }).catch(DefaultErrorHandler.handle);

        evt.stop();
    });

    // Parse image upload response
    editor.on('fileUploadResponse', (evt: EventInfo) => {
        evt.stop();

        const data = evt.data;
        const xhr = data.fileLoader.xhr;
        const response = xhr.responseText.split('|');

        if (response[1]) {
            data.message = response[1];
            evt.cancel();
        } else {
            const mediaContent = JSON.parse(response[0]);

            const imgUrl = new ImageUrlResolver(null, project)
                .setContentId(mediaContent.id)
                .setScaleWidth(true)
                .resolveForPreview();

            data.url = imgUrl;
        }
    });
}

function handlePaste(editor: CKEDITOR.editor): void {
    let isCleanupNbspRequired = false;
    let indexOfNbsp: number;
    let selectedTextElement: Node;

    editor.on('paste', (e: EventInfo) => {
        isCleanupNbspRequired = false;

        if (isPastedFromGoogleDoc(e.data.dataTransfer.getData('text/html'))) {
            e.data.dataValue = processGoogleDocPaste(e.data.dataValue);
        } else {
            e.data.dataValue = e.data.dataValue?.replace(/^(&nbsp;)+|(&nbsp;)+$/g, ' ');
        }

        selectedTextElement = editor.getSelection().getRanges()[0]?.startContainer.$;

        if (selectedTextElement && HTMLAreaHelper.isNbsp(selectedTextElement.textContent.slice(-1))) {
            isCleanupNbspRequired = true;
            indexOfNbsp = selectedTextElement.textContent.length;
        }
    });

    editor.on('afterPaste', () => {
        if (isCleanupNbspRequired) {
            selectedTextElement.textContent =
                selectedTextElement.textContent.slice(0, indexOfNbsp - 1) + ' ' + selectedTextElement.textContent.slice(indexOfNbsp);
        }
    });
}

function isPastedFromGoogleDoc(value: string): boolean {
    return !!value && value.indexOf('id="docs-internal-guid') > 0;
}

function processGoogleDocPaste(value: string): string {
    // Chrome: remove underline from links
    let result = value.replace(
        /(<a[^>]*?)(\sstyle="text-decoration:none;?")(.*?)(<u.*?>)(.*?)(<\/u>)(.*?<\/a>)/g,
        '$1$3$5$7',
    );

    // Firefox: handle bold/italic/underline styles
    result = result.replace(
        /(<a[^>]*?)(\sstyle="text-decoration:none;?")(.*?)(<span.*?text-decoration:underline.*?>)(.*?)(<\/span>)(.*?<\/a>)/g,
        (_match, p1, _p2, p3, p4, p5, _p6, p7) => {
            const isItalic = p4.indexOf('font-style:italic') > 0;
            const fontWeight = /font-weight:(\d+);/.exec(p4);
            const isBold = !!fontWeight && +fontWeight[1] > 400;

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
        },
    );

    // Remove <p> from <li> entries
    result = result.replace(
        /(<li.*?)(<p.*?>)(.*?)(<\/p>)(.*?<\/li>)/g,
        '$1$3$5',
    );

    return result;
}

function handleTooltipForClickableElements(editor: CKEDITOR.editor): void {
    let tooltipElem: CKEDITOR.dom.element | null = null;
    const tooltipText = i18n('editor.dblclicktoedit');

    const mouseOverHandler = AppHelper.debounce((ev: EventInfo) => {
        const targetEl = ev.data.getTarget();
        const isClickableElement = targetEl.is('a') || targetEl.is('img');

        if (isClickableElement) {
            tooltipElem.setAttribute('title', tooltipText);
        } else {
            tooltipElem.removeAttribute('title');
        }
    }, 200);

    // Called after editor is ready, so init directly.
    try {
        const body = editor.document.getBody();
        tooltipElem = body ? body.getParent() : null;
    } catch {
        console.warn('Failed to init tooltip handler');
    }

    if (tooltipElem) {
        editor.editable().on('mouseover', mouseOverHandler);
    }

    editor.once('autoGrow', (event: EventInfo) => {
        event.cancel();
    });
}

function handleNativeNotifications(editor: CKEDITOR.editor): void {
    const progressNotifications: Record<string, string> = {};

    editor.on('notificationShow', function (evt: EventInfo) {
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

    editor.on('notificationUpdate', function (evt: EventInfo) {
        const message = evt.data.options ? evt.data.options.message : evt.data.notification.message;
        const messageId = evt.data.notification.id;
        const type = (evt.data.options?.type) ?? evt.data.notification.type;

        switch (type) {
        case 'success':
            NotifyManager.get().showSuccess(message);
            if (progressNotifications[messageId]) {
                NotifyManager.get().hide(progressNotifications[messageId]);
                delete progressNotifications[messageId];
            }
            break;
        case 'progress':
            if (!progressNotifications[messageId]) {
                progressNotifications[messageId] = NotifyManager.get().showFeedback(message, false);
            }
            break;
        }

        evt.cancel();
    });
}

function handleElementSelection(editor: CKEDITOR.editor): void {
    editor.on('selectionChange', (e: EventInfo) => {
        updateDialogButtonStates(editor, e);
        handleImageSelectionIssue(e);
        updateAlignmentButtonStates(editor, e);
    });
}

function toggleToolbarButtonState(editor: CKEDITOR.editor, name: string, isActive: boolean): void {
    editor.getCommand(name)?.setState(isActive ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF);
}

function updateDialogButtonStates(editor: CKEDITOR.editor, e: EventInfo): void {
    const selectedElement = e.data.path.lastElement;

    const isAnchorSelected = selectedElement.hasClass('cke_anchor');
    const isImageSelected = selectedElement.hasClass('cke_widget_image');
    const isLinkSelected = selectedElement.is('a') && selectedElement.hasAttribute('href');
    const figureEl = isImageSelected ? selectedElement.findOne('figure') : null;
    const isImageWithLinkSelected = isImageSelected && !!figureEl && (figureEl.getFirst() as CKEDITOR.dom.element).is('a');

    toggleToolbarButtonState(editor, 'link', isLinkSelected || isImageWithLinkSelected);
    toggleToolbarButtonState(editor, 'anchor', isAnchorSelected);
    toggleToolbarButtonState(editor, 'image', isImageSelected);
}

function handleImageSelectionIssue(e: EventInfo): void {
    const selectedElement = e.data.path.lastElement;

    if (!selectedElement.hasClass('cke_widget_image')) return;
    if (selectedElement.hasClass('cke_widget_selected')) return;
    if (selectedElement.getPrevious()) return;

    e.editor.getSelection().selectElement(selectedElement);
}

function updateAlignmentButtonStates(editor: CKEDITOR.editor, e: EventInfo): void {
    const selectedElement = e.data.path.lastElement;
    const isImageSelected = selectedElement.hasClass('cke_widget_image');

    if (!isImageSelected) return;

    const selectionRange = editor.getSelection().getRanges()[0];
    if (!selectionRange.startContainer.equals(selectionRange.endContainer)) return;

    const figure = selectedElement.findOne('figure');
    doUpdateAlignmentButtonStates(editor, figure);
}

function doUpdateAlignmentButtonStates(editor: CKEDITOR.editor, figure: CKEDITOR.dom.element): void {
    if (!figure || figure.hasClass(StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS) || figure.hasClass('undefined')) {
        setJustifyButtonActive(editor);
    } else {
        toggleToolbarButtonState(editor, 'justifyblock', false);

        if (editor.getCommand('justifyleft')?.state === CKEDITOR.TRISTATE_DISABLED) {
            toggleToolbarButtonState(editor, 'justifyleft', false);
            toggleToolbarButtonState(editor, 'justifyright', false);
            toggleToolbarButtonState(editor, 'justifycenter', false);

            if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS)) {
                toggleToolbarButtonState(editor, 'justifyleft', true);
            } else if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS)) {
                toggleToolbarButtonState(editor, 'justifyright', true);
            } else if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS)) {
                toggleToolbarButtonState(editor, 'justifycenter', true);
            }
        }
    }
}

function setJustifyButtonActive(editor: CKEDITOR.editor): void {
    toggleToolbarButtonState(editor, 'justifyblock', true);
    toggleToolbarButtonState(editor, 'justifyleft', false);
    toggleToolbarButtonState(editor, 'justifyright', false);
    toggleToolbarButtonState(editor, 'justifycenter', false);
}

function handleImageAlignButtonPressed(editor: CKEDITOR.editor): void {
    editor.on('afterCommandExec', (e: EventInfo) => {
        if (e.data.name.indexOf('justify') !== 0) {
            return;
        }

        const selectedElement = editor.getSelection().getSelectedElement();

        if (!selectedElement || !selectedElement.hasClass('cke_widget_image')) {
            return;
        }

        toggleToolbarButtonState(editor, 'justifyblock', false);

        const figure = selectedElement.findOne('figure');

        if (e.data.name === 'justifyblock') {
            const imageWidgets = editor.widgets;
            const imageWidget = imageWidgets.getByElement(selectedElement, false);
            imageWidget.setData('align', 'none');

            figure.addClass(StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS);
            setJustifyButtonActive(editor);
        } else {
            figure.removeClass(StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS);
        }

        updateFigureInlineStyle(figure);
        sortFigureClasses(figure);
    });
}

function updateFigureInlineStyle(figure: CKEDITOR.dom.element): void {
    const hasCustomWidth = figure.hasClass(StyleHelper.STYLE.WIDTH.CUSTOM);
    const customWidth = figure.getStyle('width');

    figure.removeAttribute('style');

    if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS)) {
        figure.setStyles({
            float: 'left',
            width: hasCustomWidth ? customWidth : `${StyleHelper.STYLE.ALIGNMENT.LEFT.WIDTH}%`,
        });
    } else if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS)) {
        figure.setStyles({
            float: 'right',
            width: hasCustomWidth ? customWidth : `${StyleHelper.STYLE.ALIGNMENT.RIGHT.WIDTH}%`,
        });
    } else if (figure.hasClass(StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS)) {
        figure.setStyles({
            margin: 'auto',
            width: hasCustomWidth ? customWidth : `${StyleHelper.STYLE.ALIGNMENT.CENTER.WIDTH}%`,
        });
    } else if (hasCustomWidth) {
        figure.setStyle('width', customWidth);
    }
}

function sortFigureClasses(figure: CKEDITOR.dom.element): void {
    const classes = figure.$.className.split(' ').sort();
    figure.$.className = classes.join(' ');
}

function handleDataReady(editor: CKEDITOR.editor): void {
    editor.on('dataReady', (e: EventInfo) => {
        const rootElement = e.editor.document.getBody();

        setTimeout(() => {
            rootElement.find('figure').toArray().forEach((figure: CKEDITOR.dom.element) => {
                updateFigureInlineStyle(figure);
                sortFigureClasses(figure);
            });
        }, 1);
    });
}

function addCustomLangEntries(editor: CKEDITOR.editor): void {
    editor.on('langLoaded', (evt: EventInfo) => {
        if (evt.editor.lang.format) {
            evt.editor.lang.format.tag_code = 'Code';
        }

        const tooltipPrefix = BrowserHelper.isOSX() ? '\u2318' : 'Ctrl';
        const linkTooltipPostfix = `(${tooltipPrefix}+K)`;
        const imageTooltipPostfix = `(${tooltipPrefix}+L)`;

        if (evt.editor.lang.link?.toolbar && evt.editor.lang.link.toolbar.indexOf(linkTooltipPostfix) < 0) {
            evt.editor.lang.link.toolbar = evt.editor.lang.link.toolbar + ' ' + linkTooltipPostfix;
        }

        if (evt.editor.lang.common?.image && evt.editor.lang.common.image.indexOf(imageTooltipPostfix) < 0) {
            evt.editor.lang.common.image = evt.editor.lang.common.image + ' ' + imageTooltipPostfix;
        }

        if (evt.editor.lang.fakeobjects) {
            evt.editor.lang.fakeobjects.anchor = i18n('editor.dblclicktoedit');
        }
    });
}

function removeUnwantedMenuItems(editor: CKEDITOR.editor): void {
    // Called after editor is ready, so remove directly.
    editor.removeMenuItem('tablecell_properties');
    editor.removeMenuItem('paste');
}


function moveSourceButtonToBottomBar(editor: CKEDITOR.editor): void {
    const container = editor.container?.$;
    if (!container) return;

    const sourceButton = container.querySelector('.cke_button__sourcedialog');
    const bottomBar = container.querySelector('.cke_bottom');

    if (sourceButton && bottomBar) {
        bottomBar.appendChild(sourceButton);
    }
}

export function setupEditor(editor: CKEDITOR.editor, params: SetupEditorParams): void {
    const editorParams = buildEditorParams(editor, params);

    bindEditableBodyRuntimeState(editor, {fullscreen: editorParams.isFullScreenMode()});
    handleDataReady(editor);
    handlePaste(editor);
    handleElementSelection(editor);
    handleImageAlignButtonPressed(editor);
    handleFileUpload(editor, params.contentSummary, params.project);
    handleNativeNotifications(editor);
    handleTooltipForClickableElements(editor);
    setupDialogsToOpen(editor, editorParams);
    setupKeyboardShortcuts(editor);
    addCustomLangEntries(editor);
    removeUnwantedMenuItems(editor);
    moveSourceButtonToBottomBar(editor);
}
