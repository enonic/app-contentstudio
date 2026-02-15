import {type SetOrderUpdateJson} from './SetOrderUpdateJson';
import {type ChildOrderJson} from './ChildOrderJson';

export interface SetChildOrderJson
    extends SetOrderUpdateJson {

    childOrder: ChildOrderJson;

}
