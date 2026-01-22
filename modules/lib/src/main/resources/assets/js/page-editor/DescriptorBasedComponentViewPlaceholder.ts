import {ItemViewPlaceholder} from './ItemViewPlaceholder';
import {ComponentType} from '../app/page/region/ComponentType';

export abstract class DescriptorBasedComponentViewPlaceholder
    extends ItemViewPlaceholder {

    getType(): ComponentType {
        throw new Error('Must be implemented by inheritors');
    }
}
