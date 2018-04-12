import ModalDialogHeader = api.ui.dialog.ModalDialogHeader;
import InPlaceTextInput = api.ui.text.InPlaceTextInput;

class IssueDetailsInPlaceTextInput
    extends InPlaceTextInput {

    private titleId: number;

    constructor(title?: string) {
        super(title);
    }

    public formatTextToDisplay(inputValue: string): string {
        return `${inputValue}<span class="title-id">#${this.titleId}</span>`;
    }

    setTitleId(id: number): IssueDetailsInPlaceTextInput {
        this.titleId = id;
        return this;
    }
}

export class IssueDetailsDialogHeader
    extends api.dom.DivEl
    implements ModalDialogHeader {

    private input: IssueDetailsInPlaceTextInput;
    private titleChangedListeners: { (newTitle: string, oldTitle: string): void }[] = [];

    constructor(title: string) {
        super('modal-dialog-header');
        this.input = new IssueDetailsInPlaceTextInput(title);
        this.input.onEditModeChanged((editMode, newValue, oldValue) => {
            if (!editMode && newValue != oldValue) {
                this.notifyTitleChanged(newValue, oldValue);
            }
        });
        this.appendChild(this.input);
    }

    setTitle(value: string, escapeHtml: boolean = true): IssueDetailsDialogHeader {
        this.input.setValue(value);
        this.input.resetBaseValues();   // reset original value and dirty as if it was newly created
        return this;
    }

    getTitle(): string {
        return this.input.getValue();
    }

    setTitleId(value: number): IssueDetailsDialogHeader {
        this.input.setTitleId(value);
        return this;
    }

    setReadOnly(readOnly: boolean) {
        this.input.setReadOnly(readOnly);
    }

    onTitleChanged(listener: (newTitle: string, oldTitle: string) => void) {
        this.titleChangedListeners.push(listener);
    }

    unTitleChanged(listener: (newTitle: string, oldTitle: string) => void) {
        this.titleChangedListeners = this.titleChangedListeners.filter(curr => curr !== listener);
    }

    private notifyTitleChanged(newTitle: string, oldTitle: string) {
        this.titleChangedListeners.forEach(listener => listener(newTitle, oldTitle));
    }
}
