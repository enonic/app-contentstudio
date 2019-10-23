import {ItemViewId} from './ItemViewId';

export class ItemViewIdProducer {

    private itemViewCounter: number = 0;

    next(): ItemViewId {

        return new ItemViewId(++this.itemViewCounter);
    }
}
