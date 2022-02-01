import Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {DialogButton} from 'lib-admin-ui/ui/dialog/DialogButton';
import {HtmlAreaModalDialogConfig, ModalDialog} from './ModalDialog';
import eventInfo = CKEDITOR.eventInfo;

export class SpecialCharDialog
    extends ModalDialog {

    constructor(config: eventInfo) {
        super(<HtmlAreaModalDialogConfig>{
            editor: config.editor,
            title: i18n('dialog.charmap.title'),
            class: 'special-char-modal-dialog'
        });
    }

    protected initListeners() {
        super.initListeners();

        this.onClicked((event: any) => {
            const isSpecialCharClicked: boolean = event.target.classList.contains('chars-block__char');

            if (isSpecialCharClicked) {
                const char: string = event.target.textContent;
                this.getEditor().insertText(char);
                this.close();
            }
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChildToContentPanel(this.createCharsBlock());
            this.addCancelButtonToBottom();

            return rendered;
        });
    }

    private createCharsBlock(): Element {
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
            span.setHtml(character, false).setTitle(charDesc);

            charsBlock.appendChild(span);
        }

        return charsBlock;
    }

    addCancelButtonToBottom(buttonLabel: string = i18n('action.cancel')): DialogButton {
        const cancelButton: DialogButton = super.addCancelButtonToBottom(buttonLabel);
        this.setElementToFocusOnShow(cancelButton);

        return cancelButton;
    }

}
