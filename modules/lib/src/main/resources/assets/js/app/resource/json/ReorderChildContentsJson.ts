import {type ReorderChildContentJson} from './ReorderChildContentJson';
import {type ChildOrderJson} from './ChildOrderJson';
import {type SetOrderUpdateJson} from './SetOrderUpdateJson';

export interface ReorderChildContentsJson
    extends SetOrderUpdateJson {

    manualOrder: boolean;

    childOrder: ChildOrderJson;

    reorderChildren: ReorderChildContentJson[];
}
