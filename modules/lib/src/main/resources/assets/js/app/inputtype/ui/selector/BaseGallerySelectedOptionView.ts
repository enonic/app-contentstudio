import Q from 'q';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Checkbox} from '@enonic/lib-admin-ui/ui/Checkbox';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {BaseSelectedOptionView as LibBaseSelectedOptionView, BaseSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionView';

export abstract class BaseGallerySelectedOptionView<T> extends LibBaseSelectedOptionView<T> {
    protected label: DivEl;
    protected check: Checkbox;

    private selectionChangeListeners: ((option: BaseGallerySelectedOptionView<T>, checked: boolean) => void)[] = [];

    constructor(option: Option<T>, readonly: boolean) {
        const builder = new BaseSelectedOptionViewBuilder<T>().setOption(option);
        if (readonly) {
            builder.setRemovable(false).setEditable(false);
        }

        super(builder);
    }

    protected createWrapper(): DivEl {
        const wrapper = new DivEl('squared-content');

        if (this.editable || this.removable) {
            wrapper.onClicked((event: MouseEvent) => {
                this.check.toggleChecked();
                event.preventDefault();
                event.stopPropagation();
            });
        }

        return wrapper;
    }

    protected initElements(): void {
        this.label = new DivEl('label');
        if (this.editable || this.removable) {
            this.createCheckbox();
        }
    }

    private createCheckbox(): void {
        this.check = Checkbox.create().build();

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
