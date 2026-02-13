// Page Editor types
import type {ItemType} from './page-editor/ItemType';

export interface ItemView {
    getType(): ItemType;
}

export interface ComponentView
    extends ItemView {

}
