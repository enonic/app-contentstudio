import {SetOrderUpdateJson} from './SetOrderUpdateJson';
import {ChildOrderJson} from './ChildOrderJson';

export interface SetChildOrderJson
    extends SetOrderUpdateJson {

    childOrder: ChildOrderJson;

}
