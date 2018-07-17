import {ReorderChildContentJson} from './ReorderChildContentJson';
import ChildOrderJson = api.content.json.ChildOrderJson;
import SetOrderUpdateJson = api.content.json.SetOrderUpdateJson;

export interface ReorderChildContentsJson
    extends SetOrderUpdateJson {

    manualOrder: boolean;

    childOrder: ChildOrderJson;

    reorderChildren: ReorderChildContentJson[];
}
