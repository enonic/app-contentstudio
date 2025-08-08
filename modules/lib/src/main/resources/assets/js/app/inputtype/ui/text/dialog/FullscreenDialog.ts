/*global Q*/

import {TextArea} from '@enonic/lib-admin-ui/ui/text/TextArea';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {HtmlAreaModalDialogConfig, ModalDialog} from './ModalDialog';
import {HtmlEditorParams} from '../HtmlEditorParams';
import {FullScreenDialogParams, HtmlEditor, HtmlEditorCursorPosition} from '../HtmlEditor';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

export interface FullscreenDialogConfig
    extends HtmlAreaModalDialogConfig {
    editorParams: HtmlEditorParams;
    cursorPosition: HtmlEditorCursorPosition;
}

export class FullscreenDialog
    extends ModalDialog {

    private textArea: TextArea;

    private editorParams: HtmlEditorParams;

    private fseditor: HtmlEditor;

    declare protected config: FullscreenDialogConfig;

    constructor(config: FullScreenDialogParams) {
        super({
            editor: config.editor,
            editorParams: config.editorParams,
            cursorPosition: config.cursorPosition,
            title: i18n('dialog.fullscreen.title'),
            class: 'fullscreen-modal-dialog',
            alwaysFullscreen: true
        } as FullscreenDialogConfig);

        this.getEditor().focusManager.lock();
    }

    protected initElements() {
        super.initElements();

        this.editorParams = this.config.editorParams;
        this.textArea = new TextArea('fullscreen-textarea');
    }

    protected initListeners() {
        super.initListeners();

        this.onRendered(this.initEditor.bind(this));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChildToContentPanel(this.textArea);

            return rendered;
        });
    }

    hide() {
        this.getEditor().focusManager.unlock();
        this.getEditor().setData(this.fseditor.getData());
        this.fseditor.destroy();
        setTimeout(() => {
            this.getEditor().focus();
        }, 50);
        super.hide();
    }

    private initEditor() {
        this.updateBoldItalicUnderline();

        const editorParams: HtmlEditorParams = HtmlEditorParams.create()
            .setEditorContainerId(this.textArea.getId())
            .setAssetsUri(CONFIG.getString('assetsUri'))
            .setInline(false)
            .setCreateDialogHandler(this.editorParams.getCreateDialogListener())
            .setKeydownHandler(this.editorParams.getKeydownHandler())
            .setEditorReadyHandler(this.editorReadyHandler.bind(this))
            .setContent(this.editorParams.getContent())
            .setApplicationKeys(this.editorParams.getApplicationKeys())
            .setEnabledTools(this.editorParams.getEnabledTools())
            .setDisabledTools(this.editorParams.getDisabledTools())
            .setEditableSourceCode(this.editorParams.getEditableSourceCode())
            .setAllowedHeadings(this.editorParams.getAllowedHeadings())
            .setCustomStylesToBeUsed(true)
            .setFullscreenMode(true)
            .build();

        HtmlEditor.create(editorParams).then((htmlEditor: HtmlEditor) => {
            this.fseditor = htmlEditor;
            htmlEditor.onReady(() => {
                setTimeout(() => {
                    if (this.config.cursorPosition) {
                        htmlEditor.setSelectionByCursorPosition(this.config.cursorPosition);
                    }
                }, 100);

                this.fseditor.on('closeFullscreenDialog', () => {
                    this.close();
                });
            });
        });
    }

    private updateBoldItalicUnderline() {
        const disabledTools: string[] = this.editorParams.getDisabledTools();
        const enabledTools: string[] = this.editorParams.getEnabledTools();

        if (!this.isAllTools(disabledTools)) {
            return;
        }

        this.doUpdateBoldItalicUnderline(enabledTools);
    }

    private doUpdateBoldItalicUnderline(enabledTools: string[]) {
        if (!enabledTools.some((tool: string) => tool === 'Bold')) {
            this.addClass('hide-bold');
        }

        if (!enabledTools.some((tool: string) => tool === 'Italic')) {
            this.addClass('hide-italic');
        }

        if (!enabledTools.some((tool: string) => tool === 'Underline')) {
            this.addClass('hide-underline');
        }
    }

    private isAllTools(tools: string[]): boolean {
        return tools && tools.length === 1 && tools[0] === '*';
    }

    private editorReadyHandler() {
        this.removeTooltip();
        this.fseditor.focus();
        this.fseditor.setKeystroke(27, 'esc', this.close.bind(this));
        this.fseditor.setData(this.getEditor().getData());
    }

    private removeTooltip() {
        this.getHTMLElement().getElementsByTagName('iframe')[0].removeAttribute('title');
    }

}
