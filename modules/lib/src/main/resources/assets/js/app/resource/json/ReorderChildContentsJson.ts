import {ReorderChildContentJson} from './ReorderChildContentJson';
import {ChildOrderJson} from './ChildOrderJson';
import {SetOrderUpdateJson} from './SetOrderUpdateJson';

export interface ReorderChildContentsJson
    extends SetOrderUpdateJson {

    manualOrder: boolean;

    childOrder: ChildOrderJson;

    reorderChildren: ReorderChildContentJson[];
}
