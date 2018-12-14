import InputEl = api.dom.InputEl;

export class FileInput
    extends api.dom.CompositeFormInputEl {

    private textInput: InputEl;

    constructor(className?: string) {
        super();

        this.setWrappedInput(this.textInput = new InputEl('text'));

        this.addClass('file-input' + (className ? ' ' + className : ''));
    }

    setText(value: string) {
        this.textInput.setValue(value);
    }

    setPlaceholder(placeholder: string): FileInput {
        this.textInput.setPlaceholder(placeholder);
        return this;
    }

    reset(): FileInput {
        this.textInput.reset();
        return this;
    }

    enable() {
        this.textInput.getEl().setDisabled(false);
    }

    disable() {
        this.textInput.getEl().setDisabled(true);
    }

    focus() {
        this.textInput.giveFocus();
    }
}
