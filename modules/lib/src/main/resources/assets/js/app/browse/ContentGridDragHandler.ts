import {OrderChildMovements} from '../resource/order/OrderChildMovements';
import {OrderChildMovement} from '../resource/order/OrderChildMovement';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {DragHandler} from './DragHandler';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';

export class ContentGridDragHandler extends DragHandler {

    private movements: OrderChildMovements;

    private listBox: ListBox<ContentSummaryAndCompareStatus>;

    constructor(listBox: ListBox<ContentSummaryAndCompareStatus>) {
        super(listBox);

        this.listBox = listBox;
        this.movements = new OrderChildMovements();
    }

    getContentMovements(): OrderChildMovements {
        return this.movements;
    }

    clearContentMovements() {
        this.movements = new OrderChildMovements();
    }

    handleMovements(from: number, to: number) {
        const movedItem = this.listBox.getItems()[from];
        const moveBeforeItem = this.listBox.getItems()[to > from ? to + 1 : to];

        this.movements.addChildMovement(new OrderChildMovement(movedItem.getContentId(), moveBeforeItem?.getContentId()));
    }
}
