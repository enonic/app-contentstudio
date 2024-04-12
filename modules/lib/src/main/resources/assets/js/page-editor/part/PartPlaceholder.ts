import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {DescriptorBasedComponentViewPlaceholder} from '../DescriptorBasedComponentViewPlaceholder';
import {ComponentType} from '../../app/page/region/ComponentType';
import {PartComponentType} from '../../app/page/region/PartComponentType';

export class PartPlaceholder
    extends DescriptorBasedComponentViewPlaceholder {

    constructor() {
        super();
        this.addClassEx('part-placeholder').addClass(StyleHelper.getCommonIconCls('part'));
    }


    getType(): ComponentType {
        return PartComponentType.get();
    }
}
