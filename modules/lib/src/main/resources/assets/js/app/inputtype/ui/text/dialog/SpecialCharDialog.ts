import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {DialogButton} from '@enonic/lib-admin-ui/ui/dialog/DialogButton';
import {HtmlAreaModalDialogConfig, ModalDialog} from './ModalDialog';
import eventInfo = CKEDITOR.eventInfo;
import {HtmlEditor} from '../HtmlEditor';

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
                if (char === HtmlEditor.SPECIAL_CHAR_NBSP) {
                    this.getEditor().insertHtml('&nbsp;', 'text');
                } else {
                    this.getEditor().insertText(char);
                }
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

        const lang: any = this.getEditor().lang.specialchar;
        let character: string | [string, string];
        let charDesc: string;

        for (let i = 0; i < specialChars.length; i++) {
            character = specialChars[i];
            charDesc = '';

            if (typeof(character) === 'string') {
                const _tmpName = character.replace('&', '').replace(';', '').replace('#', '');

                // Use character in case description unavailable.
                charDesc = lang[_tmpName] || character;
            } else {
                charDesc = character[1];
                character = character[0];
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
