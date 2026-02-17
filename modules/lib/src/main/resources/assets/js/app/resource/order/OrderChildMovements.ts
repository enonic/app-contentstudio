import {type OrderChildMovement} from './OrderChildMovement';
import {type ReorderChildContentJson} from '../json/ReorderChildContentJson';

export class OrderChildMovements {

    private reorderChildren: OrderChildMovement[] = [];

    getReorderChildren(): OrderChildMovement[] {
        return this.reorderChildren;
    }

    addChildMovement(movement: OrderChildMovement) {
        this.reorderChildren.push(movement);
    }

    toArrayJson(): ReorderChildContentJson[] {
        const result: ReorderChildContentJson[] = [];
        this.reorderChildren.forEach((movement: OrderChildMovement) => {
            result.push(movement.toJson());
        });
        return result;
    }

}
