import TextArea = api.ui.text.TextArea;
import i18n = api.util.i18n;
import {HtmlAreaModalDialogConfig, ModalDialog} from './ModalDialog';
import {HtmlEditorParams} from '../HtmlEditorParams';
import {HtmlEditor} from '../HtmlEditor';

declare var CONFIG;

export class FullscreenDialog
    extends ModalDialog {

    private textArea: TextArea;

    private editorParams: HtmlEditorParams;

    private fseditor: HtmlEditor;

    constructor(config: any) {
        super(<HtmlAreaModalDialogConfig>{
            editor: config.editor,
            title: i18n('dialog.fullscreen.title'),
            cls: 'fullscreen-modal-dialog'
        });

        this.editorParams = config.editorParams;

        this.getEditor().focusManager.lock();
    }

    show() {
        super.show();
        this.initEditor();
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
            .setCustomStylesToBeUsed(true)
            .setFullscreenMode(true)
            .build();

        HtmlEditor.create(editorParams).then((htmlEditor: HtmlEditor) => {
            this.fseditor = htmlEditor;
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

    protected layout() {
        super.layout();

        this.textArea = new TextArea('fullscreen-textarea');
        this.appendChildToContentPanel(this.textArea);
    }

}
