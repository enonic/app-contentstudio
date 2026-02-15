import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import Sortable, {type SortableEvent} from 'sortablejs';

export class DragHandler {

    protected rootElement: Element;

    protected sortable: Sortable;

    private positionChangedListeners: (() => void)[] = [];

    constructor(root: Element) {
        this.rootElement = root;

        this.initSortable();
    }

    protected initSortable(): void {
        this.sortable = new Sortable(this.rootElement.getHTMLElement(), {
            group: this.getGroup(),
            sort: true,
            animation: 150,
            onUpdate: (event: SortableEvent) => this.handleUpdate(event),
        });
    }

    protected getGroup(): string {
        return null;
    }

    protected handleMovements(from: number, to: number): void {
        return;
    }

    protected handleUpdate(event: SortableEvent): void {
        this.handleMovements(event.oldIndex, event.newIndex);

        this.notifyPositionChanged();
    }

    onPositionChanged(listener: () => void) {
        this.positionChangedListeners.push(listener);
    }

    unPositionChanged(listener: () => void) {
        this.positionChangedListeners = this.positionChangedListeners.filter((currentListener: () => void) => {
            return currentListener !== listener;
        });
    }

    private notifyPositionChanged() {
        this.positionChangedListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }
}
