import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {type ModalDialogHeader} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {InPlaceTextInput} from './InPlaceTextInput';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';

class IssueDetailsInPlaceTextInput
    extends InPlaceTextInput {

    private titleId: number;

    constructor(title?: string) {
        super(title);
    }

    public formatTextToDisplay(inputValue: string): SpanEl {
        const container = new SpanEl();
        container.appendChildren(SpanEl.fromText(inputValue).addClass('title'), SpanEl.fromText(`#${this.titleId}`).addClass('title-id'));
        return container;
    }

    setTitleId(id: number): IssueDetailsInPlaceTextInput {
        this.titleId = id;
        return this;
    }
}

export class IssueDetailsDialogHeader
    extends DivEl
    implements ModalDialogHeader {

    private readonly input: IssueDetailsInPlaceTextInput;
    private titleChangedListeners: ((newTitle: string, oldTitle: string) => void)[] = [];

    constructor(title: string) {
        super('modal-dialog-header');
        this.input = new IssueDetailsInPlaceTextInput(title);
        this.input.onEditModeChanged((editMode, newValue, oldValue) => {
            if (!editMode && newValue !== oldValue) {
                this.notifyTitleChanged(newValue, oldValue);
            }
        });
        this.appendChild(this.input);
    }

    setHeading(value: string, escapeHtml: boolean = true): IssueDetailsDialogHeader {
        this.input.setValue(value);
        this.input.resetBaseValues();   // reset original value and dirty as if it was newly created
        return this;
    }

    getHeading(): string {
        return this.input.getValue();
    }

    setTitleId(value: number): IssueDetailsDialogHeader {
        this.input.setTitleId(value);
        return this;
    }

    setReadOnly(readOnly: boolean) {
        this.input.setEnabled(!readOnly);
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
