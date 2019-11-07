import {AEl} from 'lib-admin-ui/dom/AEl';
import {LiEl} from 'lib-admin-ui/dom/LiEl';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';

export class TagBuilder {

    value: string;

    removable: boolean;

    setValue(value: string): TagBuilder {
        this.value = value;
        return this;
    }

    setRemovable(value: boolean): TagBuilder {
        this.removable = value;
        return this;
    }

    public build(): Tag {
        return new Tag(this);
    }
}

export class Tag
    extends LiEl {

    private removeButtonEl: AEl;

    private valueHolderEl: SpanEl;

    private value: string;

    private removable: boolean;

    private removeClickListeners: { (): void }[] = [];

    constructor(builder: TagBuilder) {
        super('tag');
        this.value = builder.value;

        this.valueHolderEl = new SpanEl();
        this.valueHolderEl.setHtml(this.value);
        this.appendChild(this.valueHolderEl);

        this.removable = builder.removable;
        if (this.removable) {
            this.removeButtonEl = new AEl('remove-button');
            this.appendChild(this.removeButtonEl);
            this.removeButtonEl.onClicked((event: MouseEvent) => {
                this.notifyRemoveClicked();
                event.stopPropagation();
                event.preventDefault();
                return false;
            });
        }

        // TODO: Display value and remove icon if removable
        //  listen to clicks on remove icon and call notifyTagRemoved
    }

    getValue(): string {
        return this.value;
    }

    onRemoveClicked(listener: () => void) {
        this.removeClickListeners.push(listener);
    }

    unRemoveClicked(listener: () => void) {
        this.removeClickListeners.push(listener);
    }

    private notifyRemoveClicked() {
        this.removeClickListeners.forEach((listener: () => void) => {
            listener();
        });
    }
}
