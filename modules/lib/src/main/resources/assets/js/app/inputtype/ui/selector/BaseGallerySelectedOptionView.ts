import * as Q from 'q';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Checkbox} from '@enonic/lib-admin-ui/ui/Checkbox';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {BaseSelectedOptionView as LibBaseSelectedOptionView, BaseSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionView';

export abstract class BaseGallerySelectedOptionView<T> extends LibBaseSelectedOptionView<T> {
    protected label: DivEl;
    protected check: Checkbox;

    private selectionChangeListeners: ((option: BaseGallerySelectedOptionView<T>, checked: boolean) => void)[] = [];

    constructor(option: Option<T>) {
        super(new BaseSelectedOptionViewBuilder<T>().setOption(option));
    }

    protected createWrapper(): DivEl {
        return new DivEl('squared-content');
    }

    protected initElements(): void {
        this.label = new DivEl('label');
        this.check = Checkbox.create().build();

        this.check.onClicked((event: MouseEvent) => {
            this.check.toggleChecked();
            event.preventDefault();
            event.stopPropagation();
        });

        this.check.onMouseDown((event: MouseEvent) => {
            event.stopPropagation();
            event.preventDefault();
        });

        this.check.onValueChanged((event: ValueChangedEvent) => {
            this.notifyChecked(event.getNewValue() === 'true');
        });
    }

    doRender(): Q.Promise<boolean> {
        this.initElements();

        this.appendChild(this.createWrapper(), true);

        this.whenRendered(() => {
            if (this.option) {
                this.setOption(this.option);
            }
        });

        return Q(true);
    }

    getCheckbox(): Checkbox {
        return this.check;
    }

    private notifyChecked(checked: boolean) {
        this.selectionChangeListeners.forEach((listener) => {
            listener(this, checked);
        });
    }

    onChecked(listener: (option: BaseGallerySelectedOptionView<T>, checked: boolean) => void) {
        this.selectionChangeListeners.push(listener);
    }

    unChecked(listener: (option: BaseGallerySelectedOptionView<T>, checked: boolean) => void) {
        this.selectionChangeListeners = this.selectionChangeListeners.filter(curr => curr !== listener);
    }
}
