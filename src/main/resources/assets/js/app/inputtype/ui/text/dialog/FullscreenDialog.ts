import {TextArea} from 'lib-admin-ui/ui/text/TextArea';
import {i18n} from 'lib-admin-ui/util/Messages';
import {HtmlAreaModalDialogConfig, ModalDialog} from './ModalDialog';
import {HtmlEditorParams} from '../HtmlEditorParams';
import {HtmlEditor, HtmlEditorCursorPosition} from '../HtmlEditor';

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

    protected config: FullscreenDialogConfig;

    constructor(config: any) {
        super(<FullscreenDialogConfig>{
            editor: config.editor,
            editorParams: config.editorParams,
            cursorPosition: config.cursorPosition,
            title: i18n('dialog.fullscreen.title'),
            class: 'fullscreen-modal-dialog',
            defaultFullscreen: true
        });

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
        const editorParams: HtmlEditorParams = HtmlEditorParams.create()
            .setEditorContainerId(this.textArea.getId())
            .setAssetsUri(CONFIG.assetsUri)
            .setInline(false)
            .setCreateDialogHandler(this.editorParams.getCreateDialogListener())
            .setKeydownHandler(this.editorParams.getKeydownHandler())
            .setEditorReadyHandler(this.editorReadyHandler.bind(this))
            .setContentPath(this.editorParams.getContentPath())
            .setContent(this.editorParams.getContent())
            .setApplicationKeys(this.editorParams.getApplicationKeys())
            .setTools(this.editorParams.getTools())
            .setEditableSourceCode(this.editorParams.getEditableSourceCode())
            .setAllowedHeadings(this.editorParams.getAllowedHeadings())
            .setCustomStylesToBeUsed(true)
            .setFullscreenMode(true)
            .build();

        HtmlEditor.create(editorParams).then((htmlEditor: HtmlEditor) => {
            this.fseditor = htmlEditor;
            htmlEditor.onReady(() => {
                setTimeout(() => {
                    htmlEditor.setSelectionByCursorPosition(this.config.cursorPosition);
                }, 100);

                this.fseditor.on('closeFullscreenDialog', () => {
                    this.close();
                });
            });
        });
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
