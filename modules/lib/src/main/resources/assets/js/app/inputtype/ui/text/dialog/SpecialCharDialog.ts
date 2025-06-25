import Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {HtmlAreaModalDialogConfig, ModalDialog} from './ModalDialog';
import eventInfo = CKEDITOR.eventInfo;
import {HtmlEditor} from '../HtmlEditor';
import {ActionButton} from '@enonic/lib-admin-ui/ui2/ActionButton';

export class SpecialCharDialog
    extends ModalDialog {

    constructor(config: eventInfo) {
        super({
            editor: config.editor,
            title: i18n('dialog.charmap.title'),
            class: 'special-char-modal-dialog'
        } as HtmlAreaModalDialogConfig);
    }

    protected initListeners() {
        super.initListeners();

        this.onClicked((event: MouseEvent) => {
            const isSpecialCharClicked: boolean = (event.target as HTMLElement).classList.contains('chars-block__char');

            if (isSpecialCharClicked) {
                const char: string = (event.target as Node).textContent;
                if (char === HtmlEditor.SPECIAL_CHAR_NBSP) {
                    this.getEditor().insertHtml('&nbsp;', 'text');
                } else if (char === HtmlEditor.SPECIAL_CHAR_SHY) {
                    this.getEditor().insertHtml(`<span class="shy" title="${i18n('text.htmlEditor.specialchars.shy')}">&shy;</span>`, 'text');
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

        const lang = this.getEditor().lang.specialchar;
        let charDesc: string;

        for (let specialChar of specialChars) {
            charDesc = '';

            if (typeof(specialChar) === 'string') {
                const _tmpName = specialChar.replace('&', '').replace(';', '').replace('#', '');

                // Use character in case description unavailable.
                charDesc = lang[_tmpName] || specialChar;
            } else {
                charDesc = specialChar[1];
                specialChar = specialChar[0];
            }

            const span: SpanEl = new SpanEl('chars-block__char');
            span.setHtml(specialChar, false).setTitle(charDesc);

            charsBlock.appendChild(span);
        }

        return charsBlock;
    }

    addCancelButtonToBottom(buttonLabel: string = i18n('action.cancel')): ActionButton {
        const cancelButton = super.addCancelButtonToBottom(buttonLabel);
        this.setElementToFocusOnShow(cancelButton);

        return cancelButton;
    }

}
