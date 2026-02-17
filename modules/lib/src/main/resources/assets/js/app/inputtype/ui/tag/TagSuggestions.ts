import {UlEl} from '@enonic/lib-admin-ui/dom/UlEl';
import {LiEl} from '@enonic/lib-admin-ui/dom/LiEl';

export class TagSuggestions
    extends UlEl {

    private selectedIndex: number = null;

    private selectedListeners: ((value: string) => void)[] = [];

    constructor() {
        super('tag-suggestions');

        this.onMouseMove((event: MouseEvent) => {
            // don't wrap element in ElementHelper because mousemove event is generated very frequently
            // unnecessary new objects would clog browser memory
            const htmlEl = event.target as HTMLElement;
            if (htmlEl.tagName === 'LI') {
                this.notifySelected(htmlEl.innerText || htmlEl.textContent);
            }
        });
    }

    setTags(values: string[]) {
        this.removeChildren();
        values.forEach((value: string) => {
            this.appendChild(new LiEl().setHtml(value));
        });
        this.selectedIndex = null;
    }

    moveDown() {
        let nextIndex: number;
        if (this.selectedIndex == null) {
            nextIndex = 0;
        } else if (this.selectedIndex === this.getChildren().length - 1) {
            nextIndex = null;
        } else {
            nextIndex = this.selectedIndex + 1;
        }

        this.select(nextIndex);
    }

    moveUp() {
        let nextIndex: number;
        if (this.selectedIndex == null) {
            nextIndex = this.getChildren().length - 1;
        } else if (this.selectedIndex === 0) {
            nextIndex = null;
        } else {
            nextIndex = this.selectedIndex - 1;
        }

        this.select(nextIndex);
    }

    private select(index: number) {
        const tags = this.getChildren();
        let tag = tags[this.selectedIndex];
        if (tag) {
            tag.removeClass('selected');
        }

        this.selectedIndex = index;
        tag = tags[this.selectedIndex];
        if (tag) {
            tag.addClass('selected');
            this.notifySelected(tag.getEl().getText());
        } else {
            this.notifySelected(null);
        }
    }

    onSelected(listener: (value: string) => void) {
        this.selectedListeners.push(listener);
    }

    unSelected(listener: (value: string) => void) {
        this.selectedListeners.push(listener);
    }

    private notifySelected(value: string) {
        this.selectedListeners.forEach((listener: (value: string) => void) => listener(value));
    }

}
