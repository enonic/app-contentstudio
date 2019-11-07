import {ReorderChildContentJson} from './ReorderChildContentJson';
import {ChildOrderJson} from 'lib-admin-ui/content/json/ChildOrderJson';
import {SetOrderUpdateJson} from 'lib-admin-ui/content/json/SetOrderUpdateJson';

export interface ReorderChildContentsJson
    extends SetOrderUpdateJson {

    manualOrder: boolean;

    childOrder: ChildOrderJson;

    reorderChildren: ReorderChildContentJson[];
}
