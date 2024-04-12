import {DescriptorBasedComponentViewPlaceholder} from '../DescriptorBasedComponentViewPlaceholder';
import {ComponentType} from '../../app/page/region/ComponentType';
import {LayoutComponentType} from '../../app/page/region/LayoutComponentType';
import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';

export class LayoutPlaceholder
    extends DescriptorBasedComponentViewPlaceholder {

    constructor() {
        super();

        this.addClassEx('layout-placeholder').addClass(StyleHelper.getCommonIconCls('layout'));
    }

    getType(): ComponentType {
        return LayoutComponentType.get();
    }
}
