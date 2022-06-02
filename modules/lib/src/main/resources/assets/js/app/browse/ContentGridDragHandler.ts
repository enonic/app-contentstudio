import {OrderChildMovements} from '../resource/order/OrderChildMovements';
import {OrderChildMovement} from '../resource/order/OrderChildMovement';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {GridDragHandler} from '@enonic/lib-admin-ui/ui/grid/GridDragHandler';
import {TreeGrid} from '@enonic/lib-admin-ui/ui/treegrid/TreeGrid';
import {ContentId} from '../content/ContentId';

export class ContentGridDragHandler extends GridDragHandler<ContentSummaryAndCompareStatus> {

    private movements: OrderChildMovements;

    constructor(treeGrid: TreeGrid<ContentSummaryAndCompareStatus>) {
        super(treeGrid);
        this.movements = new OrderChildMovements();
    }

    getContentMovements(): OrderChildMovements {
        return this.movements;
    }

    clearContentMovements() {
        this.movements = new OrderChildMovements();
    }

    handleMovements(rowDataId: ContentId, moveBeforeRowDataId: ContentId) {
        this.movements.addChildMovement(new OrderChildMovement(rowDataId, moveBeforeRowDataId));
    }

    getModelId(model: ContentSummaryAndCompareStatus) {
        return model ? model.getContentId() : null;
    }
}
