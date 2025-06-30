import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ModalDialog} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {KeyHelper} from '@enonic/lib-admin-ui/ui/KeyHelper';
import {AutosizeTextInput} from '@enonic/lib-admin-ui/ui/text/AutosizeTextInput';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import * as Q from 'q';

export class ContentDialogSubTitleOptions {
    dialog: ModalDialog;
    placeholderText: string;
    hintText: string;
}

export class ContentDialogSubTitle
    extends DivEl {
    private readonly input: AutosizeTextInput;
    private readonly message: AEl;
    private readonly options: ContentDialogSubTitleOptions;

    constructor(options: ContentDialogSubTitleOptions) {
        super('content-dialog-sub-title');

        this.options = options;
        this.input = new AutosizeTextInput();
        this.input.setPlaceholder(options.placeholderText);
        this.input.setVisible(false);

        this.message = new AEl();
        this.message.setHtml(options.hintText);
        this.message.onClicked((event: MouseEvent) => {
            event.stopImmediatePropagation();
            event.preventDefault();

            this.toggleInput(true);
        });

        options.dialog.onClosed(() => {
            this.resetValue();
            this.toggleInput(false);
        });

        this.initListeners();
    }

    getValue(): string {
        return this.input.getValue();
    }

    setValue(text: string) {
        if (!text) {
            return;
        }
        this.input.setValue(text);
        this.toggleInput(true, false);
    }

    resetValue() {
        this.input.reset();
        this.input.resetBaseValues();
    }

    setMessage(text: string) {
        this.message.setHtml(text || this.options.hintText);
        this.toggleClass('custom-message', !!text);
    }

    private toggleInput(visible: boolean, focus: boolean = true) {
        if (visible) {
            this.message.hide();
            this.input.show();
            if (focus) {
                this.input.giveFocus();
            }
        } else {
            this.input.reset();
            this.input.hide();
            this.message.show();
        }
    }

    private initListeners() {
        const keyDownHandler = (event: KeyboardEvent) => {
            const isTextInputFocused = document.activeElement &&
                                       (document.activeElement.tagName.toUpperCase() === 'INPUT' ||
                                        document.activeElement.tagName.toUpperCase() === 'TEXTAREA');

            const isPublishMessageInputFocused = this.input.getHTMLElement() === document.activeElement;

            if (isTextInputFocused && !isPublishMessageInputFocused) {
                // don't hijack focus from other inputs
                return;
            }

            const isLetterOrNumber: boolean = !event.altKey && !event.ctrlKey && KeyHelper.isAlphaNumeric(event);

            if (!isPublishMessageInputFocused && isLetterOrNumber) {
                this.toggleInput(true);
            } else if (isPublishMessageInputFocused) {
                if (KeyHelper.isEscKey(event)) {
                    event.stopImmediatePropagation();
                    this.toggleInput(false);
                } else if (KeyHelper.isEnterKey(event)) {
                    event.stopImmediatePropagation();
                    this.input.giveBlur();
                }
            }
        };

        const clickHandler = (event: MouseEvent) => {
            if (this.input.isVisible()
                && StringHelper.isBlank(this.input.getValue())
                && event.target !== this.input.getHTMLElement()) {

                this.toggleInput(false);
            }
        };

        this.onShown(() => {
            Body.get().onKeyDown(keyDownHandler);
        });
        this.onHidden(() => Body.get().unKeyDown(keyDownHandler));

        this.input.onShown(() => Body.get().onClicked(clickHandler));
        this.input.onHidden(() => Body.get().unClicked(clickHandler));
    }

    getLinkEl(): AEl {
        return this.message;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren<Element>(this.message, this.input);
            return rendered;
        });
    }
}
