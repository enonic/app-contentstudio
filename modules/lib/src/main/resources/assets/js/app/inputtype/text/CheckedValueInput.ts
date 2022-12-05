import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {InputEl} from '@enonic/lib-admin-ui/dom/InputEl';
import {LabelEl} from '@enonic/lib-admin-ui/dom/LabelEl';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';

export enum ValidityStatus {
    VALID = 'valid',
    INVALID = 'invalid'
}

export class ValueValidationState {

    private readonly status: ValidityStatus;

    private readonly message: string;

    constructor(status: ValidityStatus, message?: string) {
        this.status = status;
        this.message = message || '';
    }

    getStatus(): ValidityStatus {
        return this.status;
    }

    getMessage(): string {
        return this.message;
    }

}

export abstract class CheckedValueInput
    extends DivEl {

    private label: LabelEl;

    private inputAndStatusWrapper: DivEl;

    private input: InputEl;

    private statusEl: DivEl;

    private isValueCheckOn: boolean;

    private debouncedValueHandler: (...args: any[]) => void;

    private stateListeners: { (state: ValueValidationState): void }[] = [];

    private valueCheckStartedListeners: { (): void }[] = [];

    private valueCheckErrorListeners: { (): void }[] = [];

    protected constructor(className?: string) {
        super(className);

        this.initElements();
        this.initListeners();
    }

    protected initElements(): void {
        this.input = new InputEl('input');
        this.label = new LabelEl(this.getLabelText(), this.input, 'label');
        this.statusEl = new DivEl('status');
        this.inputAndStatusWrapper = new DivEl('wrapper');
        this.debouncedValueHandler = AppHelper.debounce(() => this.checkValue(), this.getValueCheckDelay());
    }

    protected abstract getLabelText(): string;

    protected getValueCheckDelay(): number {
        return 300;
    }

    protected trimValue(): boolean {
        return true;
    }

    private checkValue(): void {
        const value: string = this.getValue();

        this.validate(value)
            .then((state: ValueValidationState) => {
                if (value === this.getValue()) { // value might change during check then no need in update as check is still to be done
                    this.updateByState(state);
                    this.setCheckIsOn(false);
                }
            })
            .catch((e: any) => {
                this.handlerError();
                DefaultErrorHandler.handle(e);
            });
    }

    protected handlerError(): void {
        this.setCheckIsOn(false);
        this.statusEl.addClass('error').setHtml(i18n('error.oncheck'));
        this.notifyValueCheckError();
    }

    protected isRequired(): boolean {
        return true;
    }

    protected initListeners(): void {
        this.input.onValueChanged(() => this.handleValueChanged());
    }

    protected handleValueChanged(): void {
        if (!this.isValueCheckOn) {
            this.setCheckIsOn(true);
            this.notifyValueCheckStarted();
            this.statusEl.setHtml('');
        }

        this.debouncedValueHandler();
    }

    private setCheckIsOn(value: boolean): void {
        this.isValueCheckOn = value;
        this.statusEl.toggleClass('icon-spinner', value);
    }

    protected abstract validate(value: string): Q.Promise<ValueValidationState>;

    protected updateByState(state: ValueValidationState): void {
        this.updateStatusElement(state);
        this.notifyState(state);
    }

    private updateStatusElement(state: ValueValidationState): void {
        this.statusEl.removeClass('error');
        this.statusEl.toggleClass(ValidityStatus.VALID, state.getStatus() === ValidityStatus.VALID);
        this.statusEl.toggleClass(ValidityStatus.INVALID, state.getStatus() === ValidityStatus.INVALID);
        this.statusEl.setHtml(state.getMessage());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('checked-value-element');
            this.label.toggleClass('required', this.isRequired());

            this.appendChild(this.label);
            this.inputAndStatusWrapper.appendChildren(this.input, this.statusEl);
            this.appendChild(this.inputAndStatusWrapper);

            return rendered;
        });
    }

    getValue(): string {
        return this.trimValue() ? this.input.getValue().trim() : this.input.getValue();
    }

    setValue(value: string, silent?: boolean): void {
        this.input.setValue(value, silent);
    }

    reset(): void {
        this.setValue('', true);
        this.statusEl.setClass('status').setHtml('');
    }

    onState(listener: (state: ValueValidationState) => void): void {
        this.stateListeners.push(listener);
    }

    unState(listener: (state: ValueValidationState) => void): void {
        this.stateListeners = this.stateListeners.filter((curr: { (state: ValueValidationState): void }) => {
            return listener !== curr;
        });
    }

    private notifyState(state: ValueValidationState): void {
        this.stateListeners.forEach((listener: { (state: ValueValidationState): void }) => {
            listener(state);
        });
    }

    onValueCheckStarted(listener: () => void): void {
        this.valueCheckStartedListeners.push(listener);
    }

    unValueCheckStarted(listener: () => void): void {
        this.valueCheckStartedListeners = this.valueCheckStartedListeners.filter((curr: { (): void }) => {
            return listener !== curr;
        });
    }

    private notifyValueCheckStarted(): void {
        this.valueCheckStartedListeners.forEach((listener: { (): void }) => {
            listener();
        });
    }

    onValueCheckError(listener: () => void): void {
        this.valueCheckErrorListeners.push(listener);
    }

    unValueCheckError(listener: () => void): void {
        this.valueCheckErrorListeners = this.valueCheckErrorListeners.filter((curr: { (): void }) => {
            return listener !== curr;
        });
    }

    private notifyValueCheckError(): void {
        this.valueCheckErrorListeners.forEach((listener: { (): void }) => {
            listener();
        });
    }

}
