import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {CompositeFormInputEl} from '@enonic/lib-admin-ui/dom/CompositeFormInputEl';
import {H2El} from '@enonic/lib-admin-ui/dom/H2El';
import {TextInput, type TextInputSize} from '@enonic/lib-admin-ui/ui/text/TextInput';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';

export class InPlaceTextInput
    extends CompositeFormInputEl {

    private readonly input: TextInput;
    private readonly h2: H2El;
    private persistedValue: string;

    private modeListeners: { (editMode: boolean, newValue: string, oldValue: string) }[] = [];
    private outsideClickListener: (event: MouseEvent) => void;

    constructor(originalValue?: string, size?: TextInputSize) {
        super();
        this.addClass('inplace-text-input');

        this.h2 = this.createHeader(originalValue);
        this.input = this.createInput(originalValue, size);

        this.setWrappedInput(this.input);
        this.addAdditionalElement(this.h2);
    }

    private createHeader(originalValue: string): H2El {
        const h2 = new H2El('inplace-text');
        h2.removeChildren();
        h2.appendChild(this.formatTextToDisplay(originalValue));
        h2.setTitle(i18n('action.clickToEdit'));
        h2.onClicked(() => {
            if (this.isEnabled()) {
                this.setEditMode(true);
            }
        });
        return h2;
    }

    private createInput(originalValue: string, size: TextInputSize) {
        const input = new TextInput('inplace-input', size, originalValue);

        input.onValueChanged(() => {
            const isValid = this.isInputValid();
            input.toggleClass('invalid', !isValid);
            this.toggleClass('invalid', !isValid);
        });

        input.onKeyDown((event: KeyboardEvent) => {
            event.stopImmediatePropagation();
            switch (event.code) {
            case 'Escape':
                this.setEditMode(false, true);
                break;
            case 'Enter':
                if (this.isInputValid()) {
                    this.setEditMode(false);
                }
                break;
            }
        });

        input.onBlur(() => {
            this.setEditMode(false, !this.isInputValid());
        });

        return input;
    }

    private isInputValid(): boolean {
        return !StringHelper.isBlank(this.input.getValue());
    }

    public setEditMode(enableEdit: boolean, cancel?: boolean) {
        if (cancel) {
            this.input.setValue(this.persistedValue, true);
            this.input.removeClass('invalid');
            this.removeClass('invalid');
        }
        this.toggleClass('edit-mode', enableEdit);
        const newValue = this.input.getValue().trim();
        if (enableEdit) {
            this.persistedValue = newValue;
            this.input.giveFocus();
        } else {
            this.h2.removeChildren();
            this.h2.appendChild(this.formatTextToDisplay(newValue));
        }
        this.bindOutsideClickListener(enableEdit);
        this.notifyEditModeChanged(enableEdit, newValue, this.persistedValue);
    }

    private bindOutsideClickListener(enableEdit: boolean) {
        const body = Body.get();
        if (!this.outsideClickListener) {
            this.outsideClickListener = (event: MouseEvent) => {
                if (this.isEditMode() && !this.getEl().contains(event.target as HTMLElement)) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    this.setEditMode(false, !this.isInputValid());
                }
            };
        }
        if (enableEdit) {
            body.onClicked(this.outsideClickListener);
        } else {
            body.unClicked(this.outsideClickListener);
        }
    }

    setValue(value: string, silent?: boolean, userInput?: boolean): InPlaceTextInput {
        super.setValue(value, silent, userInput);
        this.h2.removeChildren();
        this.h2.appendChild(this.formatTextToDisplay(value));
        return this;
    }

    protected formatTextToDisplay(inputValue: string): SpanEl {
        return SpanEl.fromText(inputValue);
    }

    public isEditMode(): boolean {
        return this.hasClass('edit-mode');
    }

    public onEditModeChanged(listener: (editMode: boolean, newValue: string, oldValue: string) => void) {
        this.modeListeners.push(listener);
    }

    public unEditModeChanged(listener: (editMode: boolean, newValue: string, oldValue: string) => void) {
        this.modeListeners = this.modeListeners.filter(curr => curr !== listener);
    }

    private notifyEditModeChanged(editMode: boolean, newValue: string, oldValue: string) {
        this.modeListeners.forEach(listener => {
            listener(editMode, newValue, oldValue);
        });
    }
}
