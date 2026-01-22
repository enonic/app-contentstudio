import {ItemViewPlaceholder} from './ItemViewPlaceholder';
import {ComponentType} from '../app/page/region/ComponentType';

export abstract class DescriptorBasedComponentViewPlaceholder
    extends ItemViewPlaceholder {

    abstract getType(): ComponentType;
}
