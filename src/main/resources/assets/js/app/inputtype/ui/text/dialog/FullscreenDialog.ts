import TextArea = api.ui.text.TextArea;
import i18n = api.util.i18n;
import eventInfo = CKEDITOR.eventInfo;
import {HtmlAreaModalDialogConfig, ModalDialog} from './ModalDialog';
import {HTMLAreaBuilder} from '../HTMLAreaBuilder';

declare var CONFIG;

export class FullscreenDialog
    extends ModalDialog {

    private textArea: TextArea;

    private config: any;

    private fseditor: CKEDITOR.editor;

    constructor(config: eventInfo) {
        super(<HtmlAreaModalDialogConfig>{
            editor: config.editor,
            title: i18n('dialog.fullscreen.title'),
            cls: 'fullscreen-modal-dialog'
        });

        this.config = config;

        (<CKEDITOR.editor>this.getEditor()).focusManager.lock();
    }

    show() {
        super.show();
        this.initEditor();
        this.addCKEListeners();
        this.fseditor.setData(this.getEditor().getData());
    }

    hide() {
        (<CKEDITOR.editor>this.getEditor()).focusManager.unlock();
        this.getEditor().setData(this.fseditor.getData());
        this.fseditor.destroy();
        setTimeout(() => {
            (<CKEDITOR.editor>this.getEditor()).focus();
        }, 50);
        super.hide();
    }

    private initEditor() {
        new HTMLAreaBuilder()
            .setEditorContainerId(this.textArea.getId())
            .setAssetsUri(CONFIG.assetsUri)
            .setInline(false)
            .onCreateDialog(this.config.createDialogListeners[0])
            .setKeydownHandler(this.config.keydownHandler)
            .setContentPath(this.config.contentPath)
            .setContent(this.config.content)
            .setApplicationKeys(this.config.applicationKeys)
            .setTools(this.config.customToolConfig)
            .setEditableSourceCode(this.config.editableSourceCode)
            .setFullscreenMode(true)
            .createEditor().then(editor => {
                this.fseditor = editor;
            });
    }

    private addCKEListeners() {
        this.fseditor.on('instanceReady', () => {
            this.removeTooltip();
            this.fseditor.focus();

            this.addEscButtonHandler();
        });
    }

    private addEscButtonHandler() {
        this.fseditor.addCommand('esc', {
            exec: () => {
                this.close();
                return true;
            }
        });

        this.fseditor.setKeystroke(27, 'esc'); // close dialog when esc pressed inside editor
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
