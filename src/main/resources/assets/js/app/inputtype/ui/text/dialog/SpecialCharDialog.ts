import i18n = api.util.i18n;
import eventInfo = CKEDITOR.eventInfo;
import DivEl = api.dom.DivEl;
import SpanEl = api.dom.SpanEl;
import DialogButton = api.ui.dialog.DialogButton;
import {HtmlAreaModalDialogConfig, ModalDialog} from './ModalDialog';

export class SpecialCharDialog
    extends ModalDialog {

    constructor(config: eventInfo) {
        super(<HtmlAreaModalDialogConfig>{
            editor: config.editor,
            title: i18n('dialog.charmap.title'),
            cls: 'special-char-modal-dialog'
        });

        this.initEventListeners();
    }

    protected layout() {
        super.layout();
        this.appendChildToContentPanel(this.createCharsBlock());
    }

    private createCharsBlock(): api.dom.Element {
        const charsBlock: DivEl = new DivEl('chars-block');
        const specialChars: (string | [string, string])[] = this.getEditor().config.specialChars || [];
        const chars: string[] = <string[]>(specialChars.length > 0 && specialChars[0] instanceof Array
                                           ? specialChars.map(arr => arr[0])
                                           : specialChars);
        const lang: any = this.getEditor().lang.specialchar;
        let character: any;
        let charDesc: string;

        for (let i = 0; i < chars.length; i++) {
            character = chars[i];
            charDesc = '';

            if (character instanceof Array) {
                charDesc = character[1];
                character = character[0];
            } else {
                const _tmpName = character.replace('&', '').replace(';', '').replace('#', '');

                // Use character in case description unavailable.
                charDesc = lang[_tmpName] || character;
            }

            const span: SpanEl = new SpanEl('chars-block__char');
            span.setHtml(character, false);
            span.getEl().setTitle(charDesc);

            charsBlock.appendChild(span);
        }

        return charsBlock;
    }

    private initEventListeners() {
        this.onClicked((event: any) => {
            const isSpecialCharClicked: boolean = event.target.classList.contains('chars-block__char');

            if (isSpecialCharClicked) {
                const char: string = event.target.textContent;
                this.getEditor().insertText(char);
                this.close();
            }
        });
    }

    addCancelButtonToBottom(buttonLabel: string = i18n('action.cancel')): DialogButton {
        const cancelButton: DialogButton = super.addCancelButtonToBottom(buttonLabel);
        this.setFirstFocusField(cancelButton);

        return cancelButton;
    }

}
