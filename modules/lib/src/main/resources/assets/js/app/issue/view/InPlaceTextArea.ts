import {CompositeFormInputEl} from '@enonic/lib-admin-ui/dom/CompositeFormInputEl';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {PEl} from '@enonic/lib-admin-ui/dom/PEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {TextArea} from '@enonic/lib-admin-ui/ui/text/TextArea';
import {Body} from '@enonic/lib-admin-ui/dom/Body';

export class InPlaceTextArea
    extends CompositeFormInputEl {

    private cancelButton: Button;
    private okButton: Button;
    private area: TextArea;
    private text: PEl;
    private persistedValue: string;

    private modeListeners: { (editMode: boolean, newValue: string, oldValue: string) }[] = [];
    private outsideClickListener: (event: MouseEvent) => void;

    constructor(originalValue?: string) {
        super();
        this.addClass('inplace-text-area');
        this.text = new PEl('inplace-text');
        this.text.setHtml(this.formatTextToDisplay(originalValue));
        this.text.onDblClicked(() => this.setEditMode(true));
        this.area = new TextArea('inplace-area', originalValue);
        this.area.onKeyDown((event: KeyboardEvent) => {
            event.stopImmediatePropagation();
            switch (event.keyCode) {
            case 27:
                this.setEditMode(false, true);
                break;
            case 13:
                // ctrl/cmd + enter
                if (event.ctrlKey || event.metaKey) {
                    this.setEditMode(false);
                }
                break;
            }
        });
        this.area.onValueChanged(() => this.updateButtonState());
        this.setWrappedInput(this.area);
        this.okButton = new Button(i18n('action.save'));
        this.okButton.addClass('blue');
        this.okButton.onClicked(() => this.setEditMode(false));

        this.cancelButton = new Button(i18n('action.cancel'));
        this.cancelButton.addClass('transparent');
        this.cancelButton.onClicked(() => this.setEditMode(false, true));

        this.setAdditionalElements(this.text, this.okButton, this.cancelButton);
    }

    private updateButtonState() {
        const newValue: string = this.area.getValue().trim();
        const textEdited = this.persistedValue !== newValue;
        this.okButton.setEnabled(textEdited && newValue.length > 0);
    }

    public setEditMode(flag: boolean, cancel?: boolean) {
        if (!this.isEnabled()) {
            return;
        }
        if (cancel) {
            this.area.setValue(this.persistedValue, true, true);
        }
        this.toggleClass('edit-mode', flag);
        const newValue = this.area.getValue().trim();
        if (flag) {
            this.persistedValue = newValue;
            this.okButton.setEnabled(false);
            this.area.giveFocus();
        } else {
            this.text.setHtml(this.formatTextToDisplay(newValue));
        }
        this.bindOutsideClickListener(flag);
        this.notifyEditModeChanged(flag, newValue, this.persistedValue);
    }

    private bindOutsideClickListener(flag: boolean) {
        const body = Body.get();
        if (!this.outsideClickListener) {
            this.outsideClickListener = (event: MouseEvent) => {
                if (this.isEditMode() && !this.getEl().contains(<HTMLElement>event.target)) {
                    this.setEditMode(false, true);
                }
            };
        }
        if (flag) {
            body.onClicked(this.outsideClickListener);
        } else {
            body.unClicked(this.outsideClickListener);
        }
    }

    setValue(value: string, silent?: boolean, userInput?: boolean): InPlaceTextArea {
        super.setValue(value, silent, userInput);
        this.text.setHtml(this.formatTextToDisplay(value));
        return this;
    }

    public formatTextToDisplay(inputValue: string): string {
        return inputValue;
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
