import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {TextArea} from '@enonic/lib-admin-ui/ui/text/TextArea';
import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';

export class ChatInputEl extends DivEl {

    private chatInput: TextArea;

    private sendButton: ButtonEl;

    constructor() {
        super('chat-input-container');

        this.initElements();
    }

    protected initElements(): void {
        this.chatInput = this.createChatInput();
        this.sendButton = this.createSendButton();
    }

    private createChatInput(): TextArea {
        const input = new TextArea('chat-input').addClass('chat-input') as TextArea;

        input.onValueChanged((event: ValueChangedEvent) => {
            this.sendButton.setEnabled(!StringHelper.isBlank(event.getNewValue()));
        });

        return input;
    }

    private createSendButton(): ButtonEl {
        const button = new ButtonEl();
        button.addClass('send-button icon-arrow-left2');
        button.setEnabled(false);

        return button;
    }

    updatePlaceholder(text: string): void {
        this.chatInput.getEl().setAttribute('placeholder', text);
    }

    setEnabled(enabled: boolean): void {
        this.chatInput.setEnabled(enabled);
    }

    onSendClicked(listener: () => void): void {
        this.sendButton.onClicked(listener);
    }

    getValue(): string {
        return this.chatInput.getValue();
    }

    setValue(value: string): void {
        this.chatInput.setValue(value);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.chatInput, this.sendButton as Element);

            return rendered;
        });
    }
}
