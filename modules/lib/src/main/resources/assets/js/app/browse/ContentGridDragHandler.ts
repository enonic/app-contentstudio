import {OrderChildMovements} from '../resource/order/OrderChildMovements';
import {OrderChildMovement} from '../resource/order/OrderChildMovement';
import {type ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {DragHandler} from './DragHandler';
import {type ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';

export class ContentGridDragHandler extends DragHandler {

    private movements: OrderChildMovements;

    private listBox: ListBox<ContentSummaryAndCompareStatus>;

    private initiallyOrderedItems: ContentSummaryAndCompareStatus[];

    constructor(listBox: ListBox<ContentSummaryAndCompareStatus>) {
        super(listBox);

        this.listBox = listBox;
        this.initiallyOrderedItems = listBox.getItems();
        this.movements = new OrderChildMovements();

        this.listBox.onItemsAdded(() => {
            this.initiallyOrderedItems = listBox.getItems();
        });
    }

    getContentMovements(): OrderChildMovements {
        return this.movements;
    }

    clearContentMovements() {
        this.movements = new OrderChildMovements();
    }

    handleMovements(from: number, to: number) {
        const movedItem = this.initiallyOrderedItems[from];
        const moveBeforeItem = this.initiallyOrderedItems[to > from ?  to + 1 : to];
        this.initiallyOrderedItems.splice(from, 1);
        this.initiallyOrderedItems.splice(to, 0, movedItem);

        this.movements.addChildMovement(new OrderChildMovement(movedItem.getContentId(), moveBeforeItem?.getContentId()));
    }

    setEnabled(enabled: boolean): void {
        this.sortable.option('disabled', !enabled);
        this.listBox.toggleClass('sorting-disabled', !enabled);
    }
}
